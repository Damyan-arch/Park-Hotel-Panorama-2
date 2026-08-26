import { state } from "../state.js";
import { t, LANGS } from "../i18n.js";
import { escapeHtml } from "../dom-utils.js";

export function renderHeader() {
  return `
    <div class="topbar">
      <div class="container">
        <div class="topbar-links">
          <a href="tel:+359897820065"><span class="material-symbols-outlined">call</span> +359 897 820 065</a>
          <a href="#location"><span class="material-symbols-outlined">location_on</span> Tryavna, Bulgaria</a>
        </div>
        <div class="topbar-right">
          <div class="topbar-links">
            <a href="#restaurant">${t("info.restaurantHours")}: ${escapeHtml(state.settings.restaurantHoursDays)}</a>
          </div>
          <div class="lang-switch" id="langSwitch">
            <button class="lang-current" id="langToggle" type="button" aria-haspopup="listbox">
              <span class="flag">${LANGS.find((l) => l.code === state.lang).flag}</span>
              <span>${state.lang.toUpperCase()}</span>
              <span class="material-symbols-outlined caret">expand_more</span>
            </button>
            <ul class="lang-menu" id="langMenu" role="listbox">
              ${LANGS.map(
                (l) => `<li role="option" data-lang="${l.code}" class="${l.code === state.lang ? "active" : ""}">
                  <span class="flag">${l.flag}</span> ${l.label}
                </li>`
              ).join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>

    <header class="site-header">
      <div class="container nav-row">
        <a href="#home" class="brand">
          <img src="/images/brand/logo-mark-v2.png" alt="Park Hotel Panorama logo" />
          <span>Park Hotel Panorama<small>Tryavna, Bulgaria</small></span>
        </a>
        <nav class="main-nav" id="mainNav">
          <a href="#home">${t("nav.home")}</a>
          <a href="#about">${t("nav.about")}</a>
          <a href="#leisure">${t("nav.leisure")}</a>
          <a href="#rooms">${t("nav.rooms")}</a>
          <a href="#restaurant">${t("nav.restaurant")}</a>
          <a href="#gallery">${t("nav.gallery")}</a>
          <a href="#location">${t("nav.location")}</a>
        </nav>
        <div class="nav-actions">
          <a class="nav-call" href="tel:+359897820065">
            <span class="material-symbols-outlined">call</span>
            <span class="label">${t("nav.callUs")}</span>
          </a>
          <a class="btn btn-line" href="#booking">${t("nav.bookNow")}</a>
          <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
            <span class="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
      <a href="#home" class="brand brand-pinned">
        <img src="/images/brand/logo-mark-v2.png" alt="Park Hotel Panorama logo" />
        <span>Park Hotel Panorama<small>Tryavna, Bulgaria</small></span>
      </a>
      <div class="nav-actions-pinned">
        <a class="nav-call" href="tel:+359897820065">
          <span class="material-symbols-outlined">call</span>
          <span class="label">${t("nav.callUs")}</span>
        </a>
        <a class="btn btn-line" href="#booking">${t("nav.bookNow")}</a>
      </div>
    </header>
  `;
}

export function wireNav() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  const header = document.querySelector(".site-header");
  const menuIcon = toggle.querySelector(".material-symbols-outlined");

  const syncNavOffset = () => {
    nav.style.top = `${header.getBoundingClientRect().bottom}px`;
  };
  syncNavOffset();
  window.addEventListener("resize", syncNavOffset);

  toggle.addEventListener("click", () => {
    syncNavOffset();
    const isOpen = nav.classList.toggle("open");
    menuIcon.textContent = isOpen ? "close" : "menu";
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      menuIcon.textContent = "menu";
    })
  );
}

export function wireLangSwitch(onChange) {
  const wrap = document.getElementById("langSwitch");
  const toggle = document.getElementById("langToggle");

  toggle.addEventListener("click", () => wrap.classList.toggle("open"));

  wrap.querySelectorAll("[data-lang]").forEach((li) => {
    li.addEventListener("click", () => {
      state.lang = li.dataset.lang;
      localStorage.setItem("php_lang", state.lang);
      onChange();
    });
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) wrap.classList.remove("open");
  });
}
