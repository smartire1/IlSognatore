import { supabase } from "./supabase-config.js";

const PAGE_SIZE = 20;
const grid = document.getElementById("gallery-grid");
const message = document.getElementById("gallery-message");
const loadMoreButton = document.getElementById("gallery-load-more");
const modalElement = document.getElementById("gallery-modal");
const modalImage = document.getElementById("gallery-modal-image");
const modalTitle = document.getElementById("gallery-modal-title");

let offset = 0;
let loading = false;

function createGalleryItem(post) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "gallery-item";
  button.setAttribute("aria-label", `Ingrandisci ${post.title || "immagine"}`);

  const image = document.createElement("img");
  image.src = post.image_url;
  image.alt = post.title || "Immagine dalla galleria";
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => button.remove(), { once: true });

  const caption = document.createElement("span");
  caption.className = "gallery-caption";
  caption.textContent = post.title || "Senza titolo";

  button.append(image, caption);
  button.addEventListener("click", () => {
    modalImage.src = post.image_url;
    modalImage.alt = post.title || "Immagine dalla galleria";
    modalTitle.textContent = post.title || "Galleria";
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  });

  return button;
}

async function loadMoreImages() {
  if (loading) return;
  loading = true;
  loadMoreButton.disabled = true;
  message.textContent = offset === 0 ? "Caricamento..." : "";

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, image_url, created_at")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    console.error("Errore caricamento galleria:", error);
    message.textContent = "Errore nel caricamento della galleria.";
    loading = false;
    return;
  }

  const posts = data || [];
  posts.forEach(post => grid.appendChild(createGalleryItem(post)));
  offset += posts.length;

  message.textContent = offset === 0 ? "Nessuna immagine disponibile." : "";
  loadMoreButton.classList.toggle("d-none", posts.length < PAGE_SIZE);
  loadMoreButton.disabled = false;
  loading = false;
}

loadMoreButton.addEventListener("click", loadMoreImages);
loadMoreImages();
