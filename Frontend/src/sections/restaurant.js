import { state } from "../state.js";
import { t } from "../i18n.js";
import { escapeHtml, mediaUrl } from "../dom-utils.js";

export function renderRestaurant() {
  return `
      <section class="restaurant-banner" id="restaurant">
        <div class="container">
          <div class="eyebrow">${t("nav.restaurant")}</div>
          <h2>${t("restaurant.title")}</h2>
          <p>${t("restaurant.subtitle")}</p>
        </div>
      </section>

      <div class="restaurant-info">
        <div class="restaurant-photo">
          <img src="${mediaUrl(state.settings.restaurantImage)}" alt="Restaurant dining hall" loading="lazy" />
        </div>
        <div class="restaurant-hours">
          <div>
            <h3>${t("restaurant.workingHours")}</h3>
            <p>${escapeHtml(state.settings.restaurantHoursDays)}</p>
          </div>
        </div>
      </div>

      <div class="menu-block">
        <h3>${t("restaurant.menuTitle")}</h3>
        <p>${t("restaurant.menuComingSoon")}</p>
        <a class="btn btn-gold" href="#booking"><span class="material-symbols-outlined">restaurant_menu</span> ${t("restaurant.reserveTable")}</a>
      </div>
  `;
}
