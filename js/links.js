import { supabase } from "./supabase-config.js";

// Configurazione sezioni
const sections = [
  { category: "social", containerId: "social-links" },
  { category: "project", containerId: "project-links" },
  { category: "award", containerId: "award-links" }
];

sections.forEach(section => loadLinks(section));

async function loadLinks({ category, containerId }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("category", category)
    .eq("active", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error(`Errore caricamento ${category}:`, error);
    return;
  }

  container.innerHTML = data.map(createLinkCard).join("");
}

function createLinkCard(link) {
  return `
    <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-dark">
      <div class="card mb-2 link-card">
        <div class="card-body d-flex align-items-center gap-3">
          ${createLinkIcon(link)}

          <div class="link-text text-center flex-grow-1">
            <div class="link-title">${link.title}</div>
            ${
              link.subtitle
                ? `<div class="link-subtitle">${link.subtitle}</div>`
                : ""
            }
          </div>
        </div>
      </div>
    </a>
  `;
}

function createLinkIcon(link) {
  if (link.icon_url) {
    return `<img src="${link.icon_url}" class="link-icon-img" alt="">`;
  }

  return `<i class="bi ${link.icon} fs-4"></i>`;
}
