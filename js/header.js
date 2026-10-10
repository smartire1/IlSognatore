import { supabase } from "./supabase-config.js";

function addVersion(url, version) {
  if (!url || !version) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

async function loadHeaderSettings() {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    console.error("Errore caricamento header:", error);
    return;
  }

  if (data.header_bg_url) {
    const backgroundUrl = addVersion(data.header_bg_url, data.updated_at);
    const backgroundImage = new Image();
    backgroundImage.addEventListener("load", () => {
      document.querySelectorAll(".logo-container").forEach(container => {
        container.style.backgroundImage = `url("${backgroundUrl}")`;
      });
    });
    backgroundImage.src = backgroundUrl;
  }

  if (data.header_logo_url) {
    const logoUrl = addVersion(data.header_logo_url, data.updated_at);
    document.querySelectorAll(".brand-logo").forEach(logo => {
      logo.src = logoUrl;
      logo.addEventListener("load", () => logo.classList.add("is-loaded"), { once: true });
      if (logo.complete) logo.classList.add("is-loaded");
    });
  }
}

loadHeaderSettings();
