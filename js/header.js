import { supabase } from "./supabase-config.js";

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
    document.querySelectorAll(".logo-container").forEach(container => {
      container.style.backgroundImage = `url(${data.header_bg_url})`;
    });
  }

  if (data.header_logo_url) {
    document.querySelectorAll(".brand-logo").forEach(logo => {
      logo.src = data.header_logo_url;
    });
  }
}

loadHeaderSettings();
