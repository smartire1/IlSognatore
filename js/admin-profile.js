import { STORAGE_BUCKET, supabase } from "./supabase-config.js";

const imgEl = document.getElementById("admin-profile-image");
const profileImageWrapper = document.getElementById("admin-profile-image-wrapper");
const descEl = document.getElementById("admin-profile-description");
const fileInput = document.getElementById("admin-profile-image-input");
const headerLogoEl = document.getElementById("admin-header-logo-el");
const headerBgContainer = document.getElementById("admin-header-container");
const headerLogoInput = document.getElementById("admin-header-logo-input");
const headerBackgroundInput = document.getElementById("admin-header-background-input");
const saveBtn = document.getElementById("admin-save-profile");
const changeHeaderLogoBtn = document.getElementById("admin-change-header-logo");
const changeHeaderBgBtn = document.getElementById("admin-change-header-bg");
const profileFontSelect = document.getElementById("admin-profile-font");
const profileColorInput = document.getElementById("admin-profile-color");
const profileEditorButtons = document.querySelectorAll("[data-profile-editor-command]");
const profileVideoUrlInput = document.getElementById("admin-profile-video-url");

let currentImageUrl = null;
let currentHeaderLogoUrl = null;
let currentHeaderBackgroundUrl = null;

function getFileExtension(file) {
  return file.name.split(".").pop().toLowerCase();
}

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

async function loadProfile() {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  if (data.image_url) imgEl.src = data.image_url;
  descEl.innerHTML = data.description || "";
  profileVideoUrlInput.value = data.video_url || "";
  currentImageUrl = data.image_url;

  if (headerLogoEl) {
    if (data.header_logo_url) {
      headerLogoEl.src = data.header_logo_url;
      headerLogoEl.addEventListener("load", () => headerLogoEl.classList.add("is-loaded"), { once: true });
      if (headerLogoEl.complete) headerLogoEl.classList.add("is-loaded");
    }
  }
  currentHeaderLogoUrl = data.header_logo_url || null;

  if (headerBgContainer) {
    headerBgContainer.style.backgroundImage = data.header_bg_url
      ? `url(${data.header_bg_url})`
      : "none";
  }
  currentHeaderBackgroundUrl = data.header_bg_url || null;

}

function isValidImage(file) {
  return file && file.type.startsWith("image/");
}

profileImageWrapper?.addEventListener("click", () => {
  fileInput?.click();
});

changeHeaderLogoBtn?.addEventListener("click", () => {
  headerLogoInput?.click();
});

changeHeaderBgBtn?.addEventListener("click", event => {
  event.stopPropagation();
  headerBackgroundInput?.click();
});

fileInput?.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (!isValidImage(file)) {
    alert("Seleziona un file immagine valido");
    fileInput.value = "";
    return;
  }

  imgEl.src = URL.createObjectURL(file);
});

headerLogoInput?.addEventListener("change", () => {
  const file = headerLogoInput.files[0];
  if (!file) return;

  if (!isValidImage(file)) {
    alert("Seleziona un file immagine valido");
    headerLogoInput.value = "";
    return;
  }

  if (headerLogoEl) {
    headerLogoEl.src = URL.createObjectURL(file);
  }
});

headerBackgroundInput?.addEventListener("change", () => {
  const file = headerBackgroundInput.files[0];
  if (!file) return;

  if (!isValidImage(file)) {
    alert("Seleziona un file immagine valido");
    headerBackgroundInput.value = "";
    return;
  }

  if (headerBgContainer) {
    headerBgContainer.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
  }
});

async function uploadImage(file, filePath) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error(error);
    throw error;
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

function focusProfileEditor() {
  descEl.focus();
}

function runProfileEditorCommand(command, value = null) {
  focusProfileEditor();
  document.execCommand(command, false, value);
  updateProfileToolbarState();
}

function applyProfileEditorCommand(command) {
  if (command === "bold") {
    runProfileEditorCommand("bold");
    return;
  }

  if (command === "italic") {
    runProfileEditorCommand("italic");
    return;
  }

  if (command === "list") {
    runProfileEditorCommand("insertUnorderedList");
    return;
  }

  if (command === "color") {
    runProfileEditorCommand("foreColor", profileColorInput.value);
  }
}

function applyProfileFont() {
  if (!profileFontSelect.value) return;

  runProfileEditorCommand("fontName", profileFontSelect.value);
  profileFontSelect.value = "";
}

function updateProfileToolbarState() {
  profileEditorButtons.forEach(button => {
    const command = button.dataset.profileEditorCommand;
    const stateCommand = command === "list" ? "insertUnorderedList" : command;
    const active =
      command === "bold" || command === "italic" || command === "list"
        ? document.queryCommandState(stateCommand)
        : false;

    button.classList.toggle("active", active);
  });
}

saveBtn?.addEventListener("click", async () => {
  const previousImageUrl = currentImageUrl;
  const previousHeaderLogoUrl = currentHeaderLogoUrl;
  const previousHeaderBackgroundUrl = currentHeaderBackgroundUrl;
  let imageUrl = currentImageUrl;
  let headerLogoUrl = currentHeaderLogoUrl;
  let headerBgUrl = currentHeaderBackgroundUrl;

  if (fileInput.files.length > 0) {
    imageUrl = await uploadImage(
      fileInput.files[0],
      `profile/${Date.now()}-profile.${getFileExtension(fileInput.files[0])}`
    );
    imgEl.src = imageUrl + "?t=" + Date.now();
  }

  if (headerLogoInput.files.length > 0) {
    headerLogoUrl = await uploadImage(
      headerLogoInput.files[0],
      `header/${Date.now()}-logo.${getFileExtension(headerLogoInput.files[0])}`
    );

    if (headerLogoEl) {
      headerLogoEl.src = headerLogoUrl + "?t=" + Date.now();
    }
  }

  if (headerBackgroundInput.files.length > 0) {
    headerBgUrl = await uploadImage(
      headerBackgroundInput.files[0],
      `header/${Date.now()}-background.${getFileExtension(headerBackgroundInput.files[0])}`
    );

    if (headerBgContainer) {
      headerBgContainer.style.backgroundImage = `url(${headerBgUrl})`;
    }
  }

  const updateData = {
    description: descEl.innerHTML.trim(),
    image_url: imageUrl,
    video_url: profileVideoUrlInput.value.trim() || null,
    updated_at: new Date()
  };

  if (headerLogoUrl !== null) {
    updateData.header_logo_url = headerLogoUrl;
  }

  if (headerBgUrl !== null) {
    updateData.header_bg_url = headerBgUrl;
  }

  const { error } = await supabase
    .from("profile")
    .update(updateData)
    .eq("id", 1);

  if (error) {
    console.error(error);
    alert("Errore nel salvataggio");
    return;
  }

  if (fileInput.files.length > 0 && previousImageUrl) {
    await deleteOldImage(previousImageUrl);
  }
  if (headerLogoInput.files.length > 0 && previousHeaderLogoUrl) {
    await deleteOldImage(previousHeaderLogoUrl);
  }
  if (headerBackgroundInput.files.length > 0 && previousHeaderBackgroundUrl) {
    await deleteOldImage(previousHeaderBackgroundUrl);
  }

  currentImageUrl = imageUrl;
  currentHeaderLogoUrl = headerLogoUrl;
  currentHeaderBackgroundUrl = headerBgUrl;

  alert("Profilo aggiornato");
});

profileFontSelect?.addEventListener("change", applyProfileFont);
profileEditorButtons.forEach(button => {
  button.addEventListener("click", () => applyProfileEditorCommand(button.dataset.profileEditorCommand));
});
descEl?.addEventListener("keyup", updateProfileToolbarState);
descEl?.addEventListener("mouseup", updateProfileToolbarState);
descEl?.addEventListener("touchend", updateProfileToolbarState);
descEl?.addEventListener("focus", updateProfileToolbarState);

loadProfile();
