import { state } from "../state.js";
import { t, pickLocalized } from "../i18n.js";
import { escapeHtml, mediaUrl } from "../dom-utils.js";
import { renderBookingWidget } from "./booking.js";

export function renderRoomsSection() {
  return `
      <section class="rooms" id="rooms">
        <div class="container">
          <div class="section-head">
            <div class="eyebrow">${t("rooms.eyebrow")}</div>
            <h2>${t("rooms.title")}</h2>
            <p>${t("rooms.subtitle")}</p>
          </div>
          <div id="roomsContainer">
            <div class="rooms-skeleton">
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
            </div>
          </div>
        </div>
      </section>
  `;
}

export function renderRooms() {
  const container = document.getElementById("roomsContainer");
  if (!container) return;
  if (!state.rooms.length) {
    container.innerHTML = `<p style="color:var(--ink-600)">${t("rooms.unavailable")} ${escapeHtml(state.settings.phoneNumber)}.</p>`;
    return;
  }
  container.innerHTML = `
    <div class="room-grid">
      ${state.rooms
        .map(
          (r) => `
        <div class="room-card">
          <div class="room-media">
            <img src="${mediaUrl(r.imageUrl)}" alt="${escapeHtml(pickLocalized(r.name, state.lang))}" loading="lazy" />
            <span class="room-tag">${escapeHtml(r.type)}</span>
          </div>
          <div class="room-body">
            <h3>${escapeHtml(pickLocalized(r.name, state.lang))}</h3>
            <div class="room-meta">
              <span><span class="material-symbols-outlined">group</span> ${r.capacity} ${t("rooms.guests")}</span>
              <span><span class="material-symbols-outlined">straighten</span> ${r.sizeSqm} m²</span>
            </div>
            <p class="room-desc">${escapeHtml(pickLocalized(r.description, state.lang))}</p>
            <div class="room-footer">
              <div class="room-price"><strong>€${r.basePricePerNight}</strong><span> ${t("rooms.perNight")}</span></div>
              <a class="btn btn-line" href="#booking" data-room-id="${r.id}">${t("rooms.inquire")}</a>
            </div>
          </div>
        </div>`
        )
        .join("")}
    </div>
  `;

  container.querySelectorAll("[data-room-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.booking.roomId = btn.dataset.roomId;
      renderBookingWidget();
    });
  });
}
