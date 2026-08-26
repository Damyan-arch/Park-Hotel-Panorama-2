import { state } from "../state.js";
import { t, tOrSetting } from "../i18n.js";
import { mediaUrl } from "../dom-utils.js";

export function renderAbout() {
  return `
      <section class="about" id="about">
        <div class="container">
          <div class="about-media">
            <div class="main-shot"><img src="${mediaUrl(state.settings.aboutImage)}" alt="Hotel courtyard and garden" loading="lazy" /></div>
            <div class="float-shot"><img src="${mediaUrl(state.settings.aboutFloatImage)}" alt="Rose garden" loading="lazy" /></div>
          </div>
          <div class="about-copy">
            <div class="eyebrow">${t("about.eyebrow")}</div>
            <h2>${tOrSetting("about.title", state.settings.aboutTitle)}</h2>
            <p>${tOrSetting("about.text", state.settings.aboutText)}</p>
            <ul class="about-points">
              <li><span class="material-symbols-outlined">check_circle</span> ${t("about.point1")}</li>
              <li><span class="material-symbols-outlined">check_circle</span> ${t("about.point2")}</li>
              <li><span class="material-symbols-outlined">check_circle</span> ${t("about.point3")}</li>
            </ul>
            <a class="btn btn-line" href="#location"><span class="material-symbols-outlined">map</span> ${t("about.seeLocation")}</a>
          </div>
        </div>
      </section>
  `;
}
