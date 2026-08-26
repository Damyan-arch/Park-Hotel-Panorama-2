import { state } from "../state.js";
import { t, tOrSetting } from "../i18n.js";
import { escapeHtml, mediaUrl } from "../dom-utils.js";

export function renderHero() {
  return `
      <section class="hero" id="home">
        <div class="hero-media">
          <img src="${mediaUrl(state.settings.heroImage)}" alt="Hotel lounge with mountain views" />
        </div>
        <div class="container hero-content">
          <div class="eyebrow">${t("hero.eyebrow")}</div>
          <h1>${tOrSetting("hero.title", state.settings.tagline)}</h1>
          <p class="lede">${tOrSetting("hero.lede", state.settings.aboutText)}</p>
          <div class="hero-cta">
            <a class="btn btn-gold" href="#rooms"><span class="material-symbols-outlined">bed</span> ${t("hero.viewRooms")}</a>
            <a class="btn btn-outline" href="tel:+359897820065"><span class="material-symbols-outlined">call</span> ${t("hero.callNow")}</a>
          </div>
          <div class="hero-stats">
            <div><strong>${escapeHtml(state.settings.heroStat1Value)}</strong><span>${tOrSetting("hero.stat1", state.settings.heroStat1Label)}</span></div>
            <div><strong>${escapeHtml(state.settings.heroStat2Value)}</strong><span>${tOrSetting("hero.stat2", state.settings.heroStat2Label)}</span></div>
            <div><strong>${escapeHtml(state.settings.heroStat3Value)}</strong><span>${tOrSetting("hero.stat3", state.settings.heroStat3Label)}</span></div>
            <div><strong>${escapeHtml(state.settings.heroStat4Value)}</strong><span>${tOrSetting("hero.stat4", state.settings.heroStat4Label)}</span></div>
          </div>
        </div>
      </section>

      <section class="info-strip">
        <div class="container">
          <div class="info-item">
            <div class="icon-badge"><span class="material-symbols-outlined">call</span></div>
            <div><strong>${t("info.callAnytime")}</strong><span>${escapeHtml(state.settings.phoneNumber)}</span></div>
          </div>
          <div class="info-item">
            <div class="icon-badge"><span class="material-symbols-outlined">location_on</span></div>
            <div><strong>${t("info.findUs")}</strong><span>${escapeHtml(state.settings.address)}</span></div>
          </div>
          <div class="info-item">
            <div class="icon-badge"><span class="material-symbols-outlined">restaurant</span></div>
            <div><strong>${t("info.restaurantHours")}</strong><span>${escapeHtml(state.settings.restaurantHoursDays)}</span></div>
          </div>
        </div>
      </section>
  `;
}
