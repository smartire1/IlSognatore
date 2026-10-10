async function loadNavbar() {
  const placeholder = document.getElementById("navbar-placeholder");
  if (!placeholder) return;

  try {
    const response = await fetch("navbar.html");
    if (!response.ok) throw new Error("Navbar non disponibile");

    placeholder.innerHTML = await response.text();

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    placeholder.querySelectorAll(".nav-link").forEach(link => {
      const isActive = link.getAttribute("href") === currentPage;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
    });

    const menu = placeholder.querySelector("#navbarNav");
    const toggle = placeholder.querySelector(".site-menu-toggle");
    const label = placeholder.querySelector(".site-menu-label");

    if (menu && toggle && label) {
      menu.addEventListener("show.bs.collapse", () => {
        label.textContent = "Chiudi il menu";
        toggle.setAttribute("aria-label", "Chiudi il menu");
      });
      menu.addEventListener("hide.bs.collapse", () => {
        label.textContent = "Apri il menu";
        toggle.setAttribute("aria-label", "Apri il menu");
      });
    }
  } catch (error) {
    console.error("Errore caricamento navbar:", error);
  }
}

loadNavbar();
