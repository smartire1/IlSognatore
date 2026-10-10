import { supabase } from "./supabase-config.js";

function getYouTubeEmbedUrl(url) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    let videoId = "";

    if (parsedUrl.hostname === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1);
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      videoId = parsedUrl.searchParams.get("v") || parsedUrl.pathname.split("/").pop();
    }

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

async function loadProfile() {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Errore caricamento profilo:", error);
    return;
  }

  const image = document.getElementById("profile-image");
  const description = document.getElementById("profile-description");
  const videoSection = document.getElementById("profile-video-section");
  const video = document.getElementById("profile-video");

  if (data.image_url && image) {
    image.src = data.image_url;
    image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
    if (image.complete) image.classList.add("is-loaded");
  }
  if (description) description.innerHTML = data.description || "";

  const embedUrl = getYouTubeEmbedUrl(data.video_url);
  if (embedUrl && video && videoSection) {
    video.src = embedUrl;
    videoSection.classList.remove("d-none");
  }
}

loadProfile();
