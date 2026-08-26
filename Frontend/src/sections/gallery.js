import { state } from "../state.js";
import { t } from "../i18n.js";
import { escapeHtml, mediaUrl } from "../dom-utils.js";

export function renderGallerySection() {
  return `
      <section class="gallery" id="gallery">
        <div class="container">
          <div class="section-head center">
            <div class="eyebrow">${t("gallery.eyebrow")}</div>
            <h2>${t("gallery.title")}</h2>
            <p>${t("gallery.subtitle")}</p>
          </div>
          <div id="galleryContainer">
            <div class="gallery-skeleton">
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
            </div>
          </div>
        </div>
      </section>

    <div class="lightbox" id="lightbox">
      <button class="lightbox-close" id="lightboxClose"><span class="material-symbols-outlined">close</span></button>
      <button class="lightbox-nav prev" id="lightboxPrev"><span class="material-symbols-outlined">chevron_left</span></button>
      <img id="lightboxImg" src="" alt="" />
      <button class="lightbox-nav next" id="lightboxNext"><span class="material-symbols-outlined">chevron_right</span></button>
    </div>
  `;
}

export function renderGallery() {
  const container = document.getElementById("galleryContainer");
  if (!container) return;
  if (!state.gallery.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <div class="gallery-grid">
      ${state.gallery
        .map(
          (g, i) => `
        <button type="button" data-index="${i}" aria-label="Open ${escapeHtml(g.alt)}">
          <img src="${mediaUrl(g.imageUrl)}" alt="${escapeHtml(g.alt)}" loading="lazy" />
        </button>`
        )
        .join("")}
    </div>
  `;

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  let current = 0;

  const openAt = (i) => {
    current = (i + state.gallery.length) % state.gallery.length;
    lightboxImg.src = mediaUrl(state.gallery[current].imageUrl);
    lightboxImg.alt = state.gallery[current].alt;
    lightbox.classList.add("open");
  };

  container.querySelectorAll("[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => openAt(Number(btn.dataset.index)));
  });

  document.getElementById("lightboxClose").addEventListener("click", () => lightbox.classList.remove("open"));
  document.getElementById("lightboxPrev").addEventListener("click", () => openAt(current - 1));
  document.getElementById("lightboxNext").addEventListener("click", () => openAt(current + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") lightbox.classList.remove("open");
    if (e.key === "ArrowLeft") openAt(current - 1);
    if (e.key === "ArrowRight") openAt(current + 1);
  });
}
