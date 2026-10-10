class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="network-footer mt-5 py-4">
        <div class="container text-center">
          <p class="mb-2 small text-muted">
            © ${year} Il Sognatore
          </p>
          <p class="mb-0 small">
            Sito sviluppato con cura ✨ • Developed by Salvatore Martire
          </p>
        </div>
      </footer>
    `;
  }
}

customElements.define("site-footer", SiteFooter);
