import { supabase } from "./supabase-config.js";

const shopContainer = document.getElementById("shop-items-container");

async function loadShopItems() {
  const { data: items, error } = await supabase
    .from("shop_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Errore caricamento shop:", error);
    shopContainer.innerHTML = "<p>Errore nel caricamento dello shop</p>";
    return;
  }

  renderShopItems(items || []);
}

function renderShopItems(items) {
  if (!items.length) {
    shopContainer.innerHTML = "<p>Nessun libro disponibile</p>";
    return;
  }

  shopContainer.innerHTML = items.map(createShopCard).join("");
}

function createShopCard(item) {
  return `
    <article class="my-4">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-11 col-sm-10 col-md-9 col-lg-7">
            <div class="card shadow shop-display-card">
              <div class="row g-0">
                <div class="col-12 col-md-4">
                  ${createCover(item)}
                </div>

                <div class="col-12 col-md-8">
                  <div class="card-body shop-display-body">
                    <h2 class="card-title fw-bold shop-book-title">${item.title}</h2>
                    <div class="card-text shop-book-description rich-text-content">${item.description || ""}</div>
                    ${createShopButton(item)}
                    ${createPaperNote(item)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function createCover(item) {
  if (item.image_url) {
    return `
      <div class="shop-display-cover-wrap">
        <img src="${item.image_url}" class="shop-display-cover" alt="Copertina ${item.title}">
      </div>
    `;
  }

  return `
    <div class="shop-display-cover-placeholder">
      <span>Copertina</span>
    </div>
  `;
}

function createShopButton(item) {
  if (!item.link) return "";

  return `
    <a href="${item.link}" target="_blank" rel="noopener" class="btn btn-dark btn-sm shop-action-btn">
      <i class="bi bi-box-arrow-up-right me-1"></i>Vai al libro
    </a>
  `;
}

function createPaperNote(item) {
  if (item.title !== "L'Acchiappasogni") return "";

  return `
    <div class="shop-paper-box mt-3">
      <strong>Copia cartacea</strong>
      <p class="mb-0">
        Per la spedizione, scrivimi via email:
        <a href="mailto:pietrosorrentino00@gmail.com">pietrosorrentino00@gmail.com</a>
      </p>
    </div>
  `;
}

loadShopItems();
