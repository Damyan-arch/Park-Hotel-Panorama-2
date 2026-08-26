import { state } from "../state.js";
import { t } from "../i18n.js";
import { escapeHtml } from "../dom-utils.js";

export function renderLocation() {
  return `
      <section class="location" id="location">
        <div class="container">
          <div class="location-panel">
            <div class="eyebrow">${t("location.eyebrow")}</div>
            <h2>${t("location.title")}</h2>
            <p>${t("location.subtitle")}</p>
            <div class="location-fact">
              <span class="material-symbols-outlined">location_on</span>
              <div><strong>${t("location.address")}</strong><span>${escapeHtml(state.settings.address)}</span></div>
            </div>
            <div class="location-fact">
              <span class="material-symbols-outlined">call</span>
              <div><strong>${t("location.phone")}</strong><span>${escapeHtml(state.settings.phoneNumber)}</span></div>
            </div>
            <a class="btn btn-gold" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(state.settings.mapQuery)}">
              <span class="material-symbols-outlined">directions</span> ${t("location.getDirections")}
            </a>
          </div>
          <div class="location-map">
            <iframe
              title="Park Hotel Panorama location map"
              loading="lazy"
              src="https://maps.google.com/maps?q=${encodeURIComponent(state.settings.mapQuery)}&output=embed">
            </iframe>
          </div>
        </div>
      </section>
  `;
}
