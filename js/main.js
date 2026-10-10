import { supabase } from "./supabase-config.js";

const postsContainer = document.getElementById("posts-container");

async function loadPosts() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore caricamento post:", error);
    postsContainer.innerHTML = "<p>Errore nel caricamento dei post</p>";
    return;
  }

  renderPosts(posts || []);
}

function renderPosts(posts) {
  if (!posts.length) {
    postsContainer.innerHTML = "<p>Nessun post disponibile</p>";
    return;
  }

  postsContainer.innerHTML = posts.map(createPostCard).join("");
}

function createPostCard(post) {
  const date = new Date(post.created_at).toLocaleDateString("it-IT");

  return `
    <article class="my-4">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-11 col-sm-10 col-md-7 col-lg-5">
            <div class="card shadow" style="border-radius: 8px;">
              ${post.image_url ? `
                <div class="post-img-container" style="border-radius: 8px 8px 0 0; overflow: hidden;">
                  <img src="${post.image_url}" class="img-fluid post-img" style="border-radius: 8px 8px 0 0;" alt="">
                </div>` : ""}
              <div class="card-body">
                <h2 class="card-title fw-bold" style="font-family: 'Garamond', serif; font-size: 1.3rem;">${post.title}</h2>
                <hr>
                <div class="card-text rich-text-content">${post.description || ""}</div>
                <small class="text-muted">${date}</small>
                ${post.link ? `
                  <div class="mt-3">
                    <a href="${post.link}" target="_blank" rel="noopener" class="btn btn-outline-primary btn-sm">
                      <i class="bi bi-arrow-right-circle me-1"></i>Scopri di piu
                    </a>
                  </div>` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

loadPosts();
