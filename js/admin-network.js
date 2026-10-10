import { STORAGE_BUCKET, supabase } from "./supabase-config.js";

const listEl = document.getElementById("admin-network-list");
const addLinkBtn = document.getElementById("admin-add-link-btn");
const linkForm = document.getElementById("admin-link-form");
const linkFormTitle = document.getElementById("admin-link-form-title");
const cancelLinkBtn = document.getElementById("admin-cancel-link");
const saveLinkBtn = document.getElementById("admin-save-link");
const titleInput = document.getElementById("admin-link-title");
const subtitleInput = document.getElementById("admin-link-subtitle");
const urlInput = document.getElementById("admin-link-url");
const platformWrapper = document.getElementById("admin-link-platform-wrapper");
const platformSelect = document.getElementById("admin-link-platform");
const iconInput = document.getElementById("admin-link-icon");
const iconFileInput = document.getElementById("admin-link-icon-file");
const iconPreviewEl = document.getElementById("admin-link-icon-preview");
const categoryButtons = document.querySelectorAll(
  "#view-network button[data-category]"
);

const MAX_ICON_SIZE_BYTES = 2 * 1024 * 1024;

const platformIconMap = {
  instagram: "bi-instagram",
  tiktok: "bi-tiktok",
  facebook: "bi-facebook",
  youtube: "bi-youtube",
  spotify: "bi-spotify",
  altro: "bi-globe"
};

const categoryIconMap = {
  music: "bi-music-note-beamed",
  project: "bi-book",
  award: "bi-award",
  carlo: "bi-link-45deg"
};

let currentCategory = "social";
let editingLinkId = null;
let currentIconUrl = "";

/* === ICON MAPPING === */
function getIconClass(link) {
  return link.icon && link.icon.startsWith("bi-")
    ? link.icon
    : "bi-globe";
}

function getIconForPlatform(platform) {
  return platformIconMap[platform] || "bi-globe";
}

function getFilePathFromUrl(url) {
  if (!url) return null;

  const match = url.match(new RegExp(`/${STORAGE_BUCKET}/(.+)`));
  return match ? match[1] : null;
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

async function deleteOldIcon(oldUrl) {
  const filePath = getFilePathFromUrl(oldUrl);
  if (!filePath) return;

  try {
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
  } catch (error) {
    console.error("Errore eliminazione icona vecchia:", error);
  }
}

function updateIconPreview() {
  if (!iconPreviewEl) return;

  const file = iconFileInput?.files?.[0];
  if (file) {
    iconPreviewEl.innerHTML = `
      <img src="${URL.createObjectURL(file)}" class="admin-link-icon-preview-img" alt="">
    `;
    return;
  }

  if (currentIconUrl) {
    iconPreviewEl.innerHTML = `
      <img src="${currentIconUrl}" class="admin-link-icon-preview-img" alt="">
    `;
    return;
  }

  iconPreviewEl.innerHTML = `
    <span class="text-muted small">Nessuna icona personalizzata selezionata</span>
  `;
}

async function uploadCustomIcon(file) {
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    throw new Error("Formato icona non valido");
  }

  if (file.size > MAX_ICON_SIZE_BYTES) {
    throw new Error("Icona troppo pesante");
  }

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const filePath = `icons/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (uploadError) {
    console.error(uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

function resetLinkForm() {
  titleInput.value = "";
  subtitleInput.value = "";
  urlInput.value = "";
  platformSelect.value = "";
  iconFileInput.value = "";
  iconInput.value = getIconForCategory(currentCategory);
  currentIconUrl = "";
  editingLinkId = null;
  updateIconPreview();
}

function getIconForCategory(category) {
  return categoryIconMap[category] || "bi-globe";
}

function openLinkForm(link = null) {
  if (!linkForm) return;

  const showPlatformField = currentCategory === "social";
  if (platformWrapper) {
    platformWrapper.style.display = showPlatformField ? "block" : "none";
  }

  if (link) {
    editingLinkId = link.id;
    linkFormTitle.textContent = "Modifica link";
    titleInput.value = link.title || "";
    subtitleInput.value = link.subtitle || "";
    urlInput.value = link.url || "";
    iconFileInput.value = "";
    currentIconUrl = link.icon_url || "";

    if (showPlatformField) {
      const knownPlatform = Object.entries(platformIconMap).find(
        ([, icon]) => icon === (link.icon || "" )
      );
      platformSelect.value = knownPlatform ? knownPlatform[0] : "altro";
      iconInput.value = getIconForPlatform(platformSelect.value);
    } else {
      iconInput.value = getIconForCategory(currentCategory);
    }
    updateIconPreview();
  } else {
    editingLinkId = null;
    linkFormTitle.textContent = "Aggiungi nuovo link";
    resetLinkForm();
  }

  linkForm.classList.remove("d-none");
  titleInput.focus();
}

function closeLinkForm() {
  if (!linkForm) return;
  linkForm.classList.add("d-none");
}

async function getNextOrderIndex(category) {
  const { data, error } = await supabase
    .from("links")
    .select("order_index")
    .eq("category", category)
    .eq("active", true)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return 1;
  }

  return data && typeof data.order_index === "number"
    ? data.order_index + 1
    : 1;
}

async function saveLink() {
  const title = titleInput.value.trim();
  const subtitle = subtitleInput.value.trim();
  const url = urlInput.value.trim();
  const platform = platformSelect.value;
  const icon =
    currentCategory === "social"
      ? getIconForPlatform(platform)
      : getIconForCategory(currentCategory);
  let iconUrl = currentIconUrl;
  let uploadedIconUrl = "";

  if (!title || !url) {
    alert("Titolo e URL sono obbligatori");
    return;
  }

  if (iconFileInput.files.length > 0) {
    try {
      iconUrl = await uploadCustomIcon(iconFileInput.files[0]);
      uploadedIconUrl = iconUrl;
    } catch (error) {
      alert(error.message || "Errore durante l'upload dell'icona");
      return;
    }
  }

  if (editingLinkId) {
    const { error } = await supabase
      .from("links")
      .update({
        title,
        subtitle,
        url,
        icon,
        icon_url: iconUrl || null
      })
      .eq("id", editingLinkId);

    if (error) {
      console.error(error);
      if (uploadedIconUrl) await deleteOldIcon(uploadedIconUrl);
      alert("Errore durante la modifica del link");
      return;
    }

    if (uploadedIconUrl && currentIconUrl) {
      await deleteOldIcon(currentIconUrl);
    }

    alert("Link aggiornato");
  } else {
    const order_index = await getNextOrderIndex(currentCategory);

    const { error } = await supabase.from("links").insert([
      {
        title,
        subtitle,
        url,
        icon,
        icon_url: iconUrl || null,
        category: currentCategory,
        active: true,
        order_index,
        created_at: new Date()
      }
    ]);

    if (error) {
      console.error(error);
      if (uploadedIconUrl) await deleteOldIcon(uploadedIconUrl);
      alert("Errore durante l'aggiunta del link");
      return;
    }

    alert("Link aggiunto");
  }

  closeLinkForm();
  await loadLinks(currentCategory);
}

async function deleteLink(link) {
  const confirmed = confirm("Sei sicuro di voler eliminare questo link?");
  if (!confirmed) return;

  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", link.id);

  if (error) {
    console.error(error);
    alert("Errore durante l'eliminazione del link");
    return;
  }

  if (link.icon_url) await deleteOldIcon(link.icon_url);

  await loadLinks(currentCategory);
}

/* === LOAD LINKS === */

async function loadLinks(category) {
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("category", category)
    .eq("active", true)
    .order("order_index");

  if (error) {
    console.error(error);
    return;
  }

  renderLinks(data);
}


/* === RENDER === */
function renderLinks(links) {
  listEl.innerHTML = "";

  links.forEach(link => {
    const card = document.createElement("div");
    card.className = "card mb-2 admin-network-card";

    card.innerHTML = `
      <div class="card-body admin-network-row">

        <!-- ICONA SINISTRA -->
        <div class="admin-network-icon">
          ${renderLinkIcon(link)}
        </div>

        <!-- TESTO CENTRALE -->
        <div class="admin-network-content">
          <strong>${link.title}</strong>
          ${link.subtitle ? `<div class="text-muted small">${link.subtitle}</div>` : ""}
        </div>

        <!-- AZIONI DESTRA -->
        <div class="admin-network-actions">
          <div class="admin-more-btn">...</div>
          <div class="admin-more-menu">
            <div class="admin-menu-item" data-action="edit">Modifica</div><hr>
            <div class="admin-menu-item" data-action="delete">Elimina</div>
          </div>
        </div>
      </div>
    `;

    const moreBtn = card.querySelector(".admin-more-btn");
    const menu = card.querySelector(".admin-more-menu");
    const editBtn = card.querySelector(".admin-menu-item[data-action='edit']");
    const deleteBtn = card.querySelector(".admin-menu-item[data-action='delete']");

    moreBtn.addEventListener("click", e => {
      e.stopPropagation();

      document
        .querySelectorAll(".admin-more-menu")
        .forEach(m => (m.style.display = "none"));

      menu.style.display = "block";
    });

    editBtn.addEventListener("click", e => {
      e.stopPropagation();
      openLinkForm(link);
      menu.style.display = "none";
    });

    deleteBtn.addEventListener("click", e => {
      e.stopPropagation();
      deleteLink(link);
      menu.style.display = "none";
    });

    listEl.appendChild(card);
  });
}

function renderLinkIcon(link) {
  if (link.icon_url) {
    return `<img src="${link.icon_url}" class="link-icon-img" alt="">`;
  }

  return `<i class="bi ${getIconClass(link)} fs-4"></i>`;
}

/* === CATEGORY SWITCH === */
categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentCategory = btn.dataset.category;
    closeLinkForm();
    loadLinks(currentCategory);
  });
});

if (addLinkBtn) {
  addLinkBtn.addEventListener("click", () => openLinkForm());
}

if (platformSelect) {
  platformSelect.addEventListener("change", () => {
    iconInput.value = getIconForPlatform(platformSelect.value);
  });
}

if (iconFileInput) {
  iconFileInput.addEventListener("change", () => {
    const file = iconFileInput.files[0];
    if (!file) {
      updateIconPreview();
      return;
    }

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("Carica un'icona PNG o JPG");
      iconFileInput.value = "";
      updateIconPreview();
      return;
    }

    if (file.size > MAX_ICON_SIZE_BYTES) {
      alert("Icona troppo pesante: usa un file sotto 2 MB");
      iconFileInput.value = "";
      updateIconPreview();
      return;
    }

    updateIconPreview();
  });
}

if (cancelLinkBtn) {
  cancelLinkBtn.addEventListener("click", closeLinkForm);
}

if (saveLinkBtn) {
  saveLinkBtn.addEventListener("click", saveLink);
}

window.addEventListener("click", () => {
  document
    .querySelectorAll(".admin-more-menu")
    .forEach(m => (m.style.display = "none"));
});

/* === INIT === */
loadLinks(currentCategory);

