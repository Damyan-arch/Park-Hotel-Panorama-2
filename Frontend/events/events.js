import { state, FALLBACK_SETTINGS, parseDateOnly, startOfToday } from "../src/state.js";
import { t, pickLocalized, LANGS, LOCALE_MAP } from "../src/i18n.js";
import { escapeHtml, mediaUrl, fetchJSON } from "../src/dom-utils.js";

function splitByDate(events) {
  const today = startOfToday();
  const upcoming = [];
  const past = [];
  for (const ev of events) {
    // An event stays "upcoming" for the whole of its own day, so a 7pm event
    // is still listed that morning.
    (parseDateOnly(ev.date) < today ? past : upcoming).push(ev);
  }
  upcoming.sort((a, b) => parseDateOnly(a.date) - parseDateOnly(b.date)); // soonest first
  past.sort((a, b) => parseDateOnly(b.date) - parseDateOnly(a.date)); // most recent first
  return { upcoming, past };
}

function escapeHtmlMultiline(str = "") {
  return escapeHtml(str).replace(/\n/g, "<br>");
}

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  return parseDateOnly(dateStr).toLocaleDateString(LOCALE_MAP[state.lang] || "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function renderGallery(ev) {
  const photos = Array.isArray(ev.gallery) ? ev.gallery.filter(Boolean) : [];
  if (!photos.length) return "";

  const title = escapeHtml(pickLocalized(ev.title, state.lang));
  return `
    <div class="event-gallery">
      <div class="event-gallery-head">
        <span class="material-symbols-outlined">photo_library</span>
        <strong>${t("events.photos")}</strong>
      </div>
      <div class="event-gallery-strip">
        ${photos
          .map(
            (url, i) => `
          <button type="button" class="event-gallery-thumb" data-lightbox="${escapeHtml(mediaUrl(url))}">
            <img src="${escapeHtml(mediaUrl(url))}" alt="${title} — ${i + 1}" loading="lazy" />
          </button>`
          )
          .join("")}
      </div>
    </div>`;
}

function renderCard(ev, isPast) {
  return `
    <article class="event-full-card${isPast ? " is-past" : ""}">
      ${
        ev.imageUrl
          ? `<img class="event-cover" src="${escapeHtml(mediaUrl(ev.imageUrl))}" alt="${escapeHtml(pickLocalized(ev.title, state.lang))}" />`
          : ""
      }
      <div class="event-full-body">
        <h2>${escapeHtml(pickLocalized(ev.title, state.lang))}</h2>
        <div class="event-full-meta">
          <span><span class="material-symbols-outlined">event</span>${formatEventDate(ev.date)}</span>
          ${ev.time ? `<span><span class="material-symbols-outlined">schedule</span>${escapeHtml(ev.time)}</span>` : ""}
        </div>
        <p>${escapeHtmlMultiline(pickLocalized(ev.description, state.lang))}</p>
        ${renderGallery(ev)}
        ${
          ev.infoUrl
            ? `<a class="btn btn-line event-full-link" href="${escapeHtml(ev.infoUrl)}" target="_blank" rel="noopener">${t("events.moreInfo")}</a>`
            : ""
        }
      </div>
    </article>`;
}

function renderList(events, isPast, emptyKey) {
  if (!events.length) return `<div class="events-empty">${t(emptyKey)}</div>`;
  return `<div class="events-full-grid">${events.map((ev) => renderCard(ev, isPast)).join("")}</div>`;
}

function render() {
  const { upcoming, past } = splitByDate(state.events);
  const phoneHref = `tel:${(state.settings.phoneNumber || "").replace(/[^+0-9]/g, "")}`;
  const email = state.settings.email;

  document.getElementById("events-app").innerHTML = `
    <header class="events-header">
      <div class="container events-header-row">
        <a href="/" class="brand">
          <img src="/images/brand/logo-mark-v2.png" alt="Park Hotel Panorama logo" />
          <span>Park Hotel Panorama<small>Tryavna, Bulgaria</small></span>
        </a>
        <div class="events-header-actions">
          <div class="lang-switch" id="langSwitch">
            <button class="lang-current" id="langToggle" type="button" aria-haspopup="listbox">
              <span class="flag">${LANGS.find((l) => l.code === state.lang).flag}</span>
              <span>${state.lang.toUpperCase()}</span>
              <span class="material-symbols-outlined caret">expand_more</span>
            </button>
            <ul class="lang-menu" role="listbox">
              ${LANGS.map(
                (l) => `<li role="option" data-lang="${l.code}" class="${l.code === state.lang ? "active" : ""}">
                  <span class="flag">${l.flag}</span> ${l.label}
                </li>`
              ).join("")}
            </ul>
          </div>
          <a class="btn btn-line" href="/">
            <span class="material-symbols-outlined">arrow_back</span> ${t("events.backHome")}
          </a>
        </div>
      </div>
    </header>

    <main class="events-page container">
      <div class="section-head">
        <div class="eyebrow">${t("events.pageEyebrow")}</div>
        <h1>${t("events.pageTitle")}</h1>
        <p>${t("events.pageSubtitle")}</p>
      </div>

      <div class="events-tabs" role="tablist">
        <button type="button" role="tab" data-tab="upcoming" class="${state.tab === "upcoming" ? "active" : ""}" aria-selected="${state.tab === "upcoming"}">
          ${t("events.tabUpcoming")}<span class="events-tab-count">${upcoming.length}</span>
        </button>
        <button type="button" role="tab" data-tab="past" class="${state.tab === "past" ? "active" : ""}" aria-selected="${state.tab === "past"}">
          ${t("events.tabPast")}<span class="events-tab-count">${past.length}</span>
        </button>
      </div>

      ${state.tab === "upcoming" ? renderList(upcoming, false, "events.emptyUpcoming") : renderList(past, true, "events.emptyPast")}
    </main>

    <footer class="events-footer">
      <div class="container events-footer-actions">
        <a class="btn btn-gold" href="${phoneHref}"><span class="material-symbols-outlined">call</span> ${t("hero.callNow")}</a>
        <a class="btn btn-line" href="mailto:${escapeHtml(email)}"><span class="material-symbols-outlined">mail</span> ${escapeHtml(email)}</a>
      </div>
    </footer>

    <div class="events-lightbox" id="eventsLightbox" hidden>
      <button type="button" class="events-lightbox-close" aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
      <img alt="" />
    </div>
  `;

  wire();
}

function wire() {
  document.querySelectorAll("[data-tab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      render();
    })
  );

  const langWrap = document.getElementById("langSwitch");
  document.getElementById("langToggle").addEventListener("click", () => langWrap.classList.toggle("open"));
  langWrap.querySelectorAll("[data-lang]").forEach((li) =>
    li.addEventListener("click", () => {
      state.lang = li.dataset.lang;
      localStorage.setItem("php_lang", state.lang);
      render();
    })
  );

  const lightbox = document.getElementById("eventsLightbox");
  const lightboxImg = lightbox.querySelector("img");
  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImg.src = "";
  };

  document.querySelectorAll("[data-lightbox]").forEach((btn) =>
    btn.addEventListener("click", () => {
      lightboxImg.src = btn.dataset.lightbox;
      lightbox.hidden = false;
    })
  );
  lightbox.addEventListener("click", closeLightbox);
}

// Bound once, not per render — `wire()` runs on every tab switch, and these
// would otherwise stack a new listener each time.
document.addEventListener("click", (e) => {
  const langWrap = document.getElementById("langSwitch");
  if (langWrap && !langWrap.contains(e.target)) langWrap.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  const lightbox = document.getElementById("eventsLightbox");
  if (e.key === "Escape" && lightbox && !lightbox.hidden) {
    lightbox.hidden = true;
    lightbox.querySelector("img").src = "";
  }
});

async function init() {
  state.tab = "upcoming";
  render();

  const [settings, events] = await Promise.all([fetchJSON("/settings", FALLBACK_SETTINGS), fetchJSON("/events", [])]);

  state.settings = { ...FALLBACK_SETTINGS, ...settings };
  state.events = events;
  // Land on Past when there's nothing coming up but there is history to show.
  const { upcoming, past } = splitByDate(events);
  if (!upcoming.length && past.length) state.tab = "past";

  render();
}

init();
