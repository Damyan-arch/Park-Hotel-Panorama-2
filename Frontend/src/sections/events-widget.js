import { state, parseDateOnly, startOfToday } from "../state.js";
import { t, pickLocalized } from "../i18n.js";
import { escapeHtml, mediaUrl } from "../dom-utils.js";
import { formatDateLabel } from "../date-utils.js";

export function renderEventsWidget() {
  // The widget is titled "Upcoming Events", so it must not advertise ones that
  // have already happened — those belong under the events page's Past tab. An
  // event counts as upcoming for the whole of its own day.
  const today = startOfToday();
  const upcoming = state.events.filter((ev) => parseDateOnly(ev.date) >= today);

  if (!upcoming.length) return "";

  return `<div class="events-widget">
            <div class="events-widget-head">
              <span class="material-symbols-outlined">event</span>
              <strong>${t("events.widgetTitle")}</strong>
            </div>
            <div class="events-widget-list">
              ${upcoming
                .slice(0, 2)
                .map(
                  (ev) => `
                <div class="events-widget-item">
                  ${ev.imageUrl ? `<img src="${mediaUrl(ev.imageUrl)}" alt="${escapeHtml(pickLocalized(ev.title, state.lang))}" />` : ""}
                  <div class="events-widget-item-text">
                    <strong>${escapeHtml(pickLocalized(ev.title, state.lang))}</strong>
                    <span>${formatDateLabel(parseDateOnly(ev.date))}</span>
                  </div>
                </div>`
                )
                .join("")}
            </div>
            <a class="btn btn-gold events-widget-btn" href="/events/" target="_blank" rel="noopener">
              ${t("events.seeMore")}
            </a>
          </div>`;
}

export function wireEventsWidgetVisibility() {
  const widget = document.querySelector(".events-widget");
  const hero = document.getElementById("home");
  if (!widget || !hero) return;

  const observer = new IntersectionObserver(([entry]) => widget.classList.toggle("is-hidden", !entry.isIntersecting), {
    threshold: 0.15
  });
  observer.observe(hero);
}
