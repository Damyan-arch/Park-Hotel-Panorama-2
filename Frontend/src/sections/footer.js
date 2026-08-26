import { state } from "../state.js";
import { t } from "../i18n.js";
import { escapeHtml } from "../dom-utils.js";
import { FACEBOOK_ICON_SVG } from "../icons.js";

export function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-top">
          <div>
            <div class="footer-brand">
              <img src="/images/brand/logo-mark-v2.png" alt="Park Hotel Panorama logo" />
              Park Hotel Panorama
            </div>
            <p>${t("footer.tagline")}</p>
            <div class="footer-social">
              <a href="${state.settings.facebookUrl}" target="_blank" rel="noopener" aria-label="Facebook">
                ${FACEBOOK_ICON_SVG}
              </a>
            </div>
          </div>
          <div class="footer-col">
            <h4>${t("footer.explore")}</h4>
            <ul>
              <li><a href="#about">${t("nav.about")}</a></li>
              <li><a href="#leisure">${t("nav.leisure")}</a></li>
              <li><a href="#rooms">${t("nav.rooms")}</a></li>
              <li><a href="#restaurant">${t("nav.restaurant")}</a></li>
              <li><a href="#gallery">${t("nav.gallery")}</a></li>
              <li><a href="#location">${t("nav.location")}</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>${t("footer.contact")}</h4>
            <ul>
              <li>${escapeHtml(state.settings.phoneNumber)}</li>
              <li>${escapeHtml(state.settings.address)}</li>
              <li>${escapeHtml(state.settings.restaurantHoursDays)}</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${state.settings.copyrightYear} Park Hotel Panorama. ${t("footer.rights")}</span>
          <span>${t("footer.designNote")}</span>
        </div>
      </div>
    </footer>

    <a class="fab-call" href="tel:+359897820065">
      <span class="pulse"></span>
      <span class="label">${t("fab.callNow")}</span>
    </a>
  `;
}
