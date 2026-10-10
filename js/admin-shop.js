import { STORAGE_BUCKET, supabase } from "./supabase-config.js";

const shopItemsListEl = document.getElementById("admin-shop-items-list");
const addShopItemBtn = document.getElementById("admin-add-shop-item-btn");
const shopItemForm = document.getElementById("admin-shop-item-form");
const shopItemFormTitle = document.getElementById("admin-shop-item-form-title");
const shopItemTitleInput = document.getElementById("admin-shop-item-title");
const shopItemDescInput = document.getElementById("admin-shop-item-description");
const shopItemImageInput = document.getElementById("admin-shop-item-image");
const shopItemImagePreview = document.getElementById("admin-shop-item-image-preview");
const shopItemLinkInput = document.getElementById("admin-shop-item-link");
const cancelShopItemBtn = document.getElementById("admin-cancel-shop-item");
const saveShopItemBtn = document.getElementById("admin-save-shop-item");

let editingShopItemId = null;
let currentShopItemImageUrl = "";

function getFilePathFromUrl(url) {
  if (!url) return null;

  const match = url.match(new RegExp(`/${STORAGE_BUCKET}/(.+)`));
  return match ? match[1] : null;
}

async function deleteOldImage(oldUrl) {
  const filePath = getFilePathFromUrl(oldUrl);
  if (!filePath) return;

  try {
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
  } catch (error) {
    console.error("Errore eliminazione immagine vecchia:", error);
  }
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function updateShopItemImagePreview() {
  if (!shopItemImagePreview) return;

  const file = shopItemImageInput?.files?.[0];
  if (file) {
    shopItemImagePreview.innerHTML = `
      <img src="${URL.createObjectURL(file)}" class="img-fluid rounded" style="max-height: 180px; width: auto;" alt="">
    `;
    return;
  }

  if (currentShopItemImageUrl) {
    shopItemImagePreview.innerHTML = `
      <img src="${currentShopItemImageUrl}" class="img-fluid rounded" style="max-height: 180px; width: auto;" alt="">
    `;
    return;
  }

  shopItemImagePreview.innerHTML = "";
}

function resetShopItemForm() {
  shopItemTitleInput.value = "";
  shopItemDescInput.value = "";
  shopItemImageInput.value = "";
  shopItemLinkInput.value = "";
  currentShopItemImageUrl = "";
  editingShopItemId = null;
  updateShopItemImagePreview();
}

function openShopItemForm(item = null) {
  if (!shopItemForm) return;

  shopItemForm.classList.remove("d-none");

  if (item) {
    editingShopItemId = item.id;
    shopItemFormTitle.textContent = "Modifica libro";
    shopItemTitleInput.value = item.title || "";
    shopItemDescInput.value = item.description || "";
    shopItemLinkInput.value = item.link || "";
    currentShopItemImageUrl = item.image_url || "";
    shopItemImageInput.value = "";
  } else {
    shopItemFormTitle.textContent = "Aggiungi nuovo libro";
    resetShopItemForm();
  }

  updateShopItemImagePreview();
  shopItemTitleInput.focus();
}

function closeShopItemForm() {
  if (!shopItemForm) return;
  shopItemForm.classList.add("d-none");
}

async function uploadShopItemImage(file) {
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const filePath = `shop/${fileName}`;

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

async function saveShopItem() {
  const title = shopItemTitleInput.value.trim();
  const description = shopItemDescInput.value.trim();
  const link = shopItemLinkInput.value.trim();
  let imageUrl = currentShopItemImageUrl;
  let uploadedImageUrl = "";

  if (!title) {
    alert("Il titolo e obbligatorio");
    return;
  }

  if (shopItemImageInput.files.length > 0) {
    try {
      imageUrl = await uploadShopItemImage(shopItemImageInput.files[0]);
      uploadedImageUrl = imageUrl;
    } catch (error) {
      alert("Errore durante l'upload dell'immagine");
      return;
    }
  }

  const itemData = {
    title,
    description,
    image_url: imageUrl || null,
    link: link || null
  };

  if (editingShopItemId) {
    const { error } = await supabase
      .from("shop_items")
      .update(itemData)
      .eq("id", editingShopItemId);

    if (error) {
      console.error(error);
      if (uploadedImageUrl) await deleteOldImage(uploadedImageUrl);
      alert("Errore durante la modifica del libro");
      return;
    }

    if (uploadedImageUrl && currentShopItemImageUrl) {
      await deleteOldImage(currentShopItemImageUrl);
    }

    alert("Libro aggiornato");
  } else {
    const { error } = await supabase
      .from("shop_items")
      .insert([{ ...itemData, created_at: new Date() }]);

    if (error) {
      console.error(error);
      if (uploadedImageUrl) await deleteOldImage(uploadedImageUrl);
      alert("Errore durante l'aggiunta del libro");
      return;
    }

    alert("Libro aggiunto");
  }

  closeShopItemForm();
  await loadShopItems();
}

async function deleteShopItem(item) {
  const confirmed = confirm("Sei sicuro di voler eliminare questo libro?");
  if (!confirmed) return;

  const { error } = await supabase
    .from("shop_items")
    .delete()
    .eq("id", item.id);

  if (error) {
    console.error(error);
    alert("Errore durante l'eliminazione del libro");
    return;
  }

  if (item.image_url) await deleteOldImage(item.image_url);

  await loadShopItems();
}

async function loadShopItems() {
  if (!shopItemsListEl) return;

  const { data, error } = await supabase
    .from("shop_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    shopItemsListEl.innerHTML = "<p>Errore nel caricamento dello shop</p>";
    return;
  }

  renderShopItems(data || []);
}

function renderShopItems(items) {
  if (!shopItemsListEl) return;

  if (!items.length) {
    shopItemsListEl.innerHTML = `
      <div class="card p-3 text-center text-muted">Nessun libro disponibile</div>
    `;
    return;
  }

  shopItemsListEl.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card mb-2";

    card.innerHTML = `
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-3 gap-2">
          <div>
            <h6 class="mb-1">${item.title}</h6>
            <small class="text-muted">${new Date(item.created_at).toLocaleDateString("it-IT")}</small>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary admin-shop-item-edit">Modifica</button>
            <button class="btn btn-sm btn-outline-danger admin-shop-item-delete">Elimina</button>
          </div>
        </div>
        ${item.image_url ? `<div class="mb-3"><img src="${item.image_url}" class="img-fluid rounded" alt=""></div>` : ""}
        <p class="mb-2 text-break">${item.description || ""}</p>
        ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" class="text-decoration-none">Apri link</a>` : ""}
      </div>
    `;

    card
      .querySelector(".admin-shop-item-edit")
      .addEventListener("click", () => openShopItemForm(item));

    card
      .querySelector(".admin-shop-item-delete")
      .addEventListener("click", () => deleteShopItem(item));

    shopItemsListEl.appendChild(card);
  });
}

addShopItemBtn?.addEventListener("click", () => openShopItemForm());
shopItemImageInput?.addEventListener("change", updateShopItemImagePreview);
cancelShopItemBtn?.addEventListener("click", closeShopItemForm);
saveShopItemBtn?.addEventListener("click", saveShopItem);

loadShopItems();
