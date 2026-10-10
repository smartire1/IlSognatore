import { STORAGE_BUCKET, supabase } from "./supabase-config.js";

const postsListEl = document.getElementById("admin-posts-list");
const addPostBtn = document.getElementById("admin-add-post-btn");
const postForm = document.getElementById("admin-post-form");
const postFormTitle = document.getElementById("admin-post-form-title");
const postTitleInput = document.getElementById("admin-post-title");
const postDescInput = document.getElementById("admin-post-description");
const postImageInput = document.getElementById("admin-post-image");
const postImagePreview = document.getElementById("admin-post-image-preview");
const postLinkInput = document.getElementById("admin-post-link");
const postSectionInput = document.getElementById("admin-post-section");
const cancelPostBtn = document.getElementById("admin-cancel-post");
const savePostBtn = document.getElementById("admin-save-post");
const postFontSelect = document.getElementById("admin-post-font");
const postColorInput = document.getElementById("admin-post-color");
const editorButtons = document.querySelectorAll("[data-editor-command]");
const postFilterButtons = document.querySelectorAll("[data-post-filter]");

let editingPostId = null;
let currentPostImageUrl = "";
let loadedPosts = [];
let currentPostFilter = "all";

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

function updatePostImagePreview() {
  if (!postImagePreview) return;

  const file = postImageInput?.files?.[0];
  if (file) {
    postImagePreview.innerHTML = `
      <img src="${URL.createObjectURL(file)}" class="img-fluid rounded" style="max-height: 180px; width: auto;" alt="">
    `;
    return;
  }

  if (currentPostImageUrl) {
    postImagePreview.innerHTML = `
      <img src="${currentPostImageUrl}" class="img-fluid rounded" style="max-height: 180px; width: auto;" alt="">
    `;
    return;
  }

  postImagePreview.innerHTML = "";
}

function resetPostForm() {
  postTitleInput.value = "";
  postDescInput.innerHTML = "";
  postImageInput.value = "";
  postLinkInput.value = "";
  postSectionInput.value = "home";
  currentPostImageUrl = "";
  editingPostId = null;
  updatePostImagePreview();
}

function openPostForm(post = null) {
  if (!postForm) return;

  postForm.classList.remove("d-none");

  if (post) {
    editingPostId = post.id;
    postFormTitle.textContent = "Modifica post";
    postTitleInput.value = post.title || "";
    postDescInput.innerHTML = post.description || "";
    postLinkInput.value = post.link || "";
    postSectionInput.value = post.section || "home";
    currentPostImageUrl = post.image_url || "";
    postImageInput.value = "";
  } else {
    postFormTitle.textContent = "Aggiungi nuovo post";
    resetPostForm();
  }

  updatePostImagePreview();
  postTitleInput.focus();
}

function closePostForm() {
  if (!postForm) return;
  postForm.classList.add("d-none");
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function focusEditor() {
  postDescInput.focus();
}

function runEditorCommand(command, value = null) {
  focusEditor();
  document.execCommand(command, false, value);
  updateEditorToolbarState();
}

function applyEditorCommand(command) {
  if (command === "bold") {
    runEditorCommand("bold");
    return;
  }

  if (command === "italic") {
    runEditorCommand("italic");
    return;
  }

  if (command === "list") {
    runEditorCommand("insertUnorderedList");
    return;
  }

  if (command === "color") {
    runEditorCommand("foreColor", postColorInput.value);
  }
}

function applyFont() {
  if (!postFontSelect.value) return;

  runEditorCommand("fontName", postFontSelect.value);
  postFontSelect.value = "";
}

function updateEditorToolbarState() {
  editorButtons.forEach(button => {
    const command = button.dataset.editorCommand;
    const stateCommand = command === "list" ? "insertUnorderedList" : command;
    const active =
      command === "bold" || command === "italic" || command === "list"
        ? document.queryCommandState(stateCommand)
        : false;

    button.classList.toggle("active", active);
  });
}

async function uploadPostImage(file) {
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const filePath = `posts/${fileName}`;

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

async function savePost() {
  const title = postTitleInput.value.trim();
  const description = postDescInput.innerHTML.trim();
  const link = postLinkInput.value.trim();
  const section = postSectionInput.value;
  let imageUrl = currentPostImageUrl;
  let uploadedImageUrl = "";

  if (!title) {
    alert("Il titolo e obbligatorio");
    return;
  }

  if (postImageInput.files.length > 0) {
    try {
      imageUrl = await uploadPostImage(postImageInput.files[0]);
      uploadedImageUrl = imageUrl;
    } catch (error) {
      alert("Errore durante l'upload dell'immagine");
      return;
    }
  }

  const postData = {
    title,
    description,
    image_url: imageUrl || null,
    link: link || null,
    section
  };

  if (editingPostId) {
    const { error } = await supabase
      .from("posts")
      .update(postData)
      .eq("id", editingPostId);

    if (error) {
      console.error(error);
      if (uploadedImageUrl) await deleteOldImage(uploadedImageUrl);
      alert("Errore durante la modifica del post");
      return;
    }

    if (uploadedImageUrl && currentPostImageUrl) {
      await deleteOldImage(currentPostImageUrl);
    }

    alert("Post aggiornato");
  } else {
    const { error } = await supabase
      .from("posts")
      .insert([{ ...postData, created_at: new Date() }]);

    if (error) {
      console.error(error);
      if (uploadedImageUrl) await deleteOldImage(uploadedImageUrl);
      alert("Errore durante l'aggiunta del post");
      return;
    }

    alert("Post aggiunto");
  }

  closePostForm();
  await loadPosts();
}

async function deletePost(post) {
  const confirmed = confirm("Sei sicuro di voler eliminare questo post?");
  if (!confirmed) return;

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", post.id);

  if (error) {
    console.error(error);
    alert("Errore durante l'eliminazione del post");
    return;
  }

  if (post.image_url) await deleteOldImage(post.image_url);

  await loadPosts();
}

async function loadPosts() {
  if (!postsListEl) return;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    postsListEl.innerHTML = "<p>Errore nel caricamento dei post</p>";
    return;
  }

  loadedPosts = data || [];
  renderFilteredPosts();
}

function renderFilteredPosts() {
  const visiblePosts = currentPostFilter === "all"
    ? loadedPosts
    : loadedPosts.filter(post => (post.section || "home") === currentPostFilter);

  renderPosts(visiblePosts);
}

function renderPosts(posts) {
  if (!postsListEl) return;

  if (!posts.length) {
    postsListEl.innerHTML = `
      <div class="card p-3 text-center text-muted admin-post-empty">Nessun post disponibile</div>
    `;
    return;
  }

  postsListEl.innerHTML = "";

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card admin-post-card";

    card.innerHTML = `
      <div class="admin-post-media">
        ${post.image_url
          ? `<img src="${post.image_url}" class="admin-post-thumbnail" alt="" loading="lazy">`
          : `<div class="admin-post-thumbnail-placeholder"><i class="bi bi-card-text"></i></div>`}
      </div>
      <div class="card-body">
        <h6 class="admin-post-card-title mb-1">${post.title}</h6>
        <small class="text-muted mb-1">${new Date(post.created_at).toLocaleDateString("it-IT")}</small>
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge text-bg-light">${post.section === "carlo" ? "Carlo" : "Home"}</span>
          ${post.link ? `<i class="bi bi-link-45deg text-muted" title="Contiene un link"></i>` : ""}
        </div>
        <div class="admin-post-card-actions">
          <button class="btn btn-sm btn-outline-secondary admin-post-edit" type="button" title="Modifica" aria-label="Modifica post">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger admin-post-delete" type="button" title="Elimina" aria-label="Elimina post">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;

    const thumbnail = card.querySelector(".admin-post-thumbnail");
    thumbnail?.addEventListener("error", () => {
      thumbnail.parentElement.innerHTML = '<div class="admin-post-thumbnail-placeholder"><i class="bi bi-card-text"></i></div>';
    }, { once: true });

    card
      .querySelector(".admin-post-edit")
      .addEventListener("click", () => openPostForm(post));

    card
      .querySelector(".admin-post-delete")
      .addEventListener("click", () => deletePost(post));

    postsListEl.appendChild(card);
  });
}

addPostBtn?.addEventListener("click", () => openPostForm());
postFilterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentPostFilter = button.dataset.postFilter;
    postFilterButtons.forEach(filterButton => {
      const active = filterButton === button;
      filterButton.classList.toggle("active", active);
      filterButton.classList.toggle("btn-dark", active);
      filterButton.classList.toggle("btn-outline-dark", !active);
    });
    renderFilteredPosts();
  });
});
postImageInput?.addEventListener("change", updatePostImagePreview);
cancelPostBtn?.addEventListener("click", closePostForm);
savePostBtn?.addEventListener("click", savePost);
postFontSelect?.addEventListener("change", applyFont);
editorButtons.forEach(button => {
  button.addEventListener("click", () => applyEditorCommand(button.dataset.editorCommand));
});
postDescInput?.addEventListener("keyup", updateEditorToolbarState);
postDescInput?.addEventListener("mouseup", updateEditorToolbarState);
postDescInput?.addEventListener("touchend", updateEditorToolbarState);
postDescInput?.addEventListener("focus", updateEditorToolbarState);

loadPosts();
