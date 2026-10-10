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
const cancelPostBtn = document.getElementById("admin-cancel-post");
const savePostBtn = document.getElementById("admin-save-post");
const postFontSelect = document.getElementById("admin-post-font");
const postColorInput = document.getElementById("admin-post-color");
const editorButtons = document.querySelectorAll("[data-editor-command]");

let editingPostId = null;
let currentPostImageUrl = "";

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
  let imageUrl = currentPostImageUrl;

  if (!title) {
    alert("Il titolo e obbligatorio");
    return;
  }

  if (postImageInput.files.length > 0) {
    try {
      if (currentPostImageUrl) {
        await deleteOldImage(currentPostImageUrl);
      }

      imageUrl = await uploadPostImage(postImageInput.files[0]);
    } catch (error) {
      alert("Errore durante l'upload dell'immagine");
      return;
    }
  }

  const postData = {
    title,
    description,
    image_url: imageUrl || null,
    link: link || null
  };

  if (editingPostId) {
    const { error } = await supabase
      .from("posts")
      .update(postData)
      .eq("id", editingPostId);

    if (error) {
      console.error(error);
      alert("Errore durante la modifica del post");
      return;
    }

    alert("Post aggiornato");
  } else {
    const { error } = await supabase
      .from("posts")
      .insert([{ ...postData, created_at: new Date() }]);

    if (error) {
      console.error(error);
      alert("Errore durante l'aggiunta del post");
      return;
    }

    alert("Post aggiunto");
  }

  closePostForm();
  await loadPosts();
}

async function deletePost(id) {
  const confirmed = confirm("Sei sicuro di voler eliminare questo post?");
  if (!confirmed) return;

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Errore durante l'eliminazione del post");
    return;
  }

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

  renderPosts(data || []);
}

function renderPosts(posts) {
  if (!postsListEl) return;

  if (!posts.length) {
    postsListEl.innerHTML = `
      <div class="card p-3 text-center text-muted">Nessun post disponibile</div>
    `;
    return;
  }

  postsListEl.innerHTML = "";

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card mb-2";

    card.innerHTML = `
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-3 gap-2">
          <div>
            <h6 class="mb-1">${post.title}</h6>
            <small class="text-muted">${new Date(post.created_at).toLocaleDateString("it-IT")}</small>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary admin-post-edit">Modifica</button>
            <button class="btn btn-sm btn-outline-danger admin-post-delete">Elimina</button>
          </div>
        </div>
        ${post.image_url ? `<div class="mb-3"><img src="${post.image_url}" class="img-fluid rounded" alt=""></div>` : ""}
        <div class="mb-2 text-break rich-text-content">${post.description || ""}</div>
        ${post.link ? `<a href="${post.link}" target="_blank" rel="noopener" class="text-decoration-none">Apri link</a>` : ""}
      </div>
    `;

    card
      .querySelector(".admin-post-edit")
      .addEventListener("click", () => openPostForm(post));

    card
      .querySelector(".admin-post-delete")
      .addEventListener("click", () => deletePost(post.id));

    postsListEl.appendChild(card);
  });
}

addPostBtn?.addEventListener("click", () => openPostForm());
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
