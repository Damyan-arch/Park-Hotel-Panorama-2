import { state } from "../state.js";
import { t, pickLocalized } from "../i18n.js";
import { escapeHtml } from "../dom-utils.js";

export function renderAmenitiesSection() {
  return `
      <section class="amenities" id="amenities">
        <div class="container">
          <div class="section-head center">
            <div class="eyebrow">${t("amenities.eyebrow")}</div>
            <h2>${t("amenities.title")}</h2>
            <p>${t("amenities.subtitle")}</p>
          </div>
          <div class="amenity-grid" id="amenityGrid"></div>
        </div>
      </section>
  `;
}

export function renderAmenities() {
  const grid = document.getElementById("amenityGrid");
  if (!grid) return;
  grid.innerHTML = state.amenities
    .map(
      (a) => `
      <div class="amenity-card${a.underMaintenance ? " is-maintenance" : ""}">
        ${a.underMaintenance ? `<span class="amenity-tag">${t("amenities.underMaintenance")}</span>` : ""}
        <div class="icon-badge"><span class="material-symbols-outlined">${a.icon}</span></div>
        <h3>${escapeHtml(pickLocalized(a.title, state.lang))}</h3>
        <p>${escapeHtml(pickLocalized(a.text, state.lang))}</p>
      </div>`
    )
    .join("");
}
