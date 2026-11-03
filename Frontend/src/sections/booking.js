import { state, startOfMonth } from "../state.js";
import { t, LOCALE_MAP, pickLocalized } from "../i18n.js";
import { API_BASE, escapeHtml } from "../dom-utils.js";
import { formatDate, formatDateLabel, isSameDay, nightsBetween } from "../date-utils.js";
import { FACEBOOK_ICON_SVG } from "../icons.js";
import { getPaymentConfig, loadPayment, mountCardWhenVisible, unmountCard, holdDeposit, renderPayCard, getCardHolder, focusCardHolder, isCardFailed, syncFallbackButton, startCheckout, finishCheckoutReturn } from "../payment.js";

export function renderBookingSection() {
  return `
      <section class="booking" id="booking">
        <div class="container">
          <div class="booking-columns">
            <div class="booking-intro">
              <div class="section-head">
                <div class="eyebrow">${t("booking.eyebrow")}</div>
                <h2>${t("booking.title")}</h2>
                <p>${t("booking.subtitle")}</p>
              </div>
              <div class="booking-contact-list">
                <a class="booking-contact-item" href="${state.settings.phoneHref}" aria-label="${t("contact.phone")}">
                  <span class="icon-badge"><span class="material-symbols-outlined">call</span></span>
                  <span>${escapeHtml(state.settings.phoneNumber)}</span>
                </a>
                <a class="booking-contact-item" href="mailto:${escapeHtml(state.settings.email)}" aria-label="${t("contact.email")}">
                  <span class="icon-badge"><span class="material-symbols-outlined">mail</span></span>
                  <span>${escapeHtml(state.settings.email)}</span>
                </a>
                <a class="booking-contact-item" href="#location" aria-label="${t("contact.address")}">
                  <span class="icon-badge"><span class="material-symbols-outlined">location_on</span></span>
                  <span>${escapeHtml(state.settings.address)}</span>
                </a>
                <a class="booking-contact-item" href="${state.settings.facebookUrl}" target="_blank" rel="noopener" aria-label="${t("contact.followUs")}">
                  <span class="icon-badge">${FACEBOOK_ICON_SVG}</span>
                  <span>${t("contact.followUs")}</span>
                </a>
              </div>
            </div>
            <div id="bookingWidgetRoot"></div>
          </div>
        </div>
      </section>
  `;
}

function buildMonthMatrix(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay), currentMonth: false });
    nextDay++;
  }
  return cells;
}

let roomSelectOutsideClickWired = false;

function wireRoomSelect() {
  const wrap = document.getElementById("roomSelect");
  if (!wrap) return;
  const toggle = document.getElementById("roomSelectToggle");

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setGuestMenuOpen(false);
    wrap.classList.toggle("open");
  });

  wrap.querySelectorAll("[data-room-id]").forEach((li) => {
    li.addEventListener("click", () => {
      state.booking.roomId = li.dataset.roomId;
      renderBookingWidget();
    });
  });

  if (!roomSelectOutsideClickWired) {
    document.addEventListener("click", (e) => {
      const current = document.getElementById("roomSelect");
      if (current && !current.contains(e.target)) current.classList.remove("open");
    });
    roomSelectOutsideClickWired = true;
  }
}

// Babies (0–3) sleep in a cot, so they don't count against the room's
// capacity — but a room takes at most this many. Matches
// BookingController::MAX_BABIES on the server.
const MAX_BABIES = 2;

const GUEST_KINDS = [
  { key: "adults", title: "booking.adultsTitle", age: "booking.adultsAge", one: "booking.adult", many: "booking.adults" },
  { key: "children", title: "booking.childrenTitle", age: "booking.childrenAge", one: "booking.child", many: "booking.children" },
  { key: "babies", title: "booking.babiesTitle", age: "booking.babiesAge", one: "booking.baby", many: "booking.babies" }
];

// "2 adults, 1 child" — children and babies only when there are any.
function guestsText(guests) {
  return GUEST_KINDS.filter(({ key }) => guests[key] > 0)
    .map(({ key, one, many }) => `${guests[key]} ${t(guests[key] === 1 ? one : many)}`)
    .join(", ");
}

// The guests panel. Each −/+ redraws the whole widget, so whether it's open is
// kept here and re-applied on every render.
let guestMenuOpen = false;
let guestSelectOutsideClickWired = false;

function setGuestMenuOpen(open) {
  guestMenuOpen = open;
  document.getElementById("guestSelect")?.classList.toggle("open", open);
  document.getElementById("guestSelectToggle")?.setAttribute("aria-expanded", String(open));
}

function wireGuestSelect() {
  const wrap = document.getElementById("guestSelect");
  if (!wrap) return;

  document.getElementById("guestSelectToggle").addEventListener("click", () => {
    document.getElementById("roomSelect")?.classList.remove("open");
    setGuestMenuOpen(!guestMenuOpen);
  });
  // Clicks inside stay inside: a −/+ click redraws the widget, and the document
  // handler below would otherwise see a click on a detached button and close.
  wrap.addEventListener("click", (e) => e.stopPropagation());
  wrap.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !guestMenuOpen) return;
    setGuestMenuOpen(false);
    document.getElementById("guestSelectToggle").focus();
  });

  // Keep focus on the stepper (on the other button once this one is disabled
  // at the limit).
  wrap.querySelectorAll("[data-guest]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { guest, step } = btn.dataset;
      state.booking[guest] += Number(step);
      renderBookingWidget();
      const same = document.getElementById(btn.id);
      const other = document.getElementById(`${guest}${step === "1" ? "Less" : "More"}`);
      (same.disabled ? other : same).focus();
    });
  });

  if (!guestSelectOutsideClickWired) {
    document.addEventListener("click", () => guestMenuOpen && setGuestMenuOpen(false));
    guestSelectOutsideClickWired = true;
  }
}

// Back from Stripe's hosted payment page: finish the booking and say so.
// The widget redraws its whole DOM (e.g. when the payment config arrives), so the
// message is remembered and re-applied after every render.
let checkoutReturnStarted = false;
let checkoutStatus = null; // { text, cls }
function showCheckoutStatus(text, cls) {
  checkoutStatus = { text, cls };
  applyCheckoutStatus();
}
function applyCheckoutStatus() {
  const el = document.getElementById("bookingStatus");
  if (checkoutStatus && el) {
    el.textContent = checkoutStatus.text;
    el.className = "form-status " + checkoutStatus.cls;
  }
}

// A bank-transfer request that was just sent: its stay, price and transfer
// details stay in the "Your stay" card (the form itself is cleared) until the
// guest starts choosing a new stay.
let completedBooking = null;

// "Your stay" — whatever is known so far: the room, the dates, the price, the
// deposit and, after a bank-transfer request, where to send it. Null when
// nothing is chosen yet, so the card isn't shown at all.
function summaryCardHtml(s) {
  if (!s.roomName && !s.nights) return null;
  const night = (n) => t(n === 1 ? "booking.night" : "booking.nights");
  let price = "";
  if (s.roomName && s.nights) {
    price = `<div class="summary-row">
        <span>${s.nights} ${night(s.nights)} × €${s.perNight}</span>
        <span>€${s.total}</span>
      </div>
      <div class="summary-row summary-total">
        <span>${t("booking.total")}</span>
        <strong>€${s.total}</strong>
      </div>
      ${
        s.deposit
          ? `<div class="summary-row summary-deposit">
              <span>${t("booking.deposit")} ${s.depositPercent}%<small>${t(s.method === "card" ? "booking.payCard" : "booking.payBank")}</small></span>
              <strong>€${s.deposit}</strong>
            </div>`
          : ""
      }`;
  } else if (s.roomName) {
    price = `<div class="summary-row"><span>${t("booking.perNightLabel")}</span><span>€${s.perNight}</span></div>`;
  } else {
    price = `<div class="summary-row"><span>${s.nights} ${night(s.nights)}</span></div>`;
  }
  // One row per kind of guest that's been added: "Възрастни 18+ години … 2".
  const guestRows = GUEST_KINDS.filter(({ key }) => s.guests?.[key] > 0)
    .map(
      ({ key, title, age }) => `<div class="summary-row summary-guest">
        <span>${t(title)}<small>${t(age)}</small></span>
        <span>${s.guests[key]}</span>
      </div>`
    )
    .join("");
  return `<aside class="booking-summary" aria-live="polite">
      <h4>${t("booking.summaryTitle")}</h4>
      ${s.roomName ? `<p class="summary-room">${escapeHtml(s.roomName)}</p>` : ""}
      ${s.checkIn && s.checkOut ? `<p class="summary-dates">${escapeHtml(formatDateLabel(s.checkIn))} – ${escapeHtml(formatDateLabel(s.checkOut))}</p>` : ""}
      ${guestRows}
      ${price}
      ${s.bankTransfer ? bankTransferHtml(s.bankTransfer) : ""}
    </aside>`;
}

// Where and how to transfer the deposit — the same details are emailed too.
function bankTransferHtml(bt) {
  const amount = bt.currency === "EUR" ? `€${bt.amount}` : `${bt.amount} ${bt.currency}`;
  const row = (label, value) => `<div class="bank-row"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
  return `<div class="bank-details">
      <h5>${t("booking.bankTitle")}</h5>
      ${row(t("booking.bankHolder"), bt.holder)}
      ${row("IBAN", bt.iban)}
      ${bt.bic ? row("BIC", bt.bic) : ""}
      ${row(t("booking.bankAmount"), amount)}
      ${row(t("booking.bankReference"), bt.reference)}
      <p>${t("booking.bankNote")}</p>
    </div>`;
}
function handleCheckoutReturn() {
  applyCheckoutStatus();
  if (checkoutReturnStarted || !new URLSearchParams(window.location.search).has("booking_session")) return;
  checkoutReturnStarted = true;
  showCheckoutStatus(t("booking.finalising"), "");
  finishCheckoutReturn().then((result) => {
    if (result?.ok) showCheckoutStatus(result.message, "success");
    else showCheckoutStatus(t("booking.checkoutFailed"), "error");
  });
}

// What's still missing before the card can be entered, as the message to show
// and the field to focus; null when the booking details are complete.
function detailsMissing() {
  const b = state.booking;
  const field = (id) => document.getElementById(id);
  if (!b.checkIn || !b.checkOut) return { message: "booking.selectDatesError" };
  if (!b.roomId) return { message: "booking.selectRoomError", focus: "roomSelectToggle" };
  if (!b.adults) return { message: "booking.guestsError", focus: "guestSelectToggle" };
  if (!field("bookingName")?.value.trim()) return { message: "booking.nameError", focus: "bookingName" };
  const email = field("bookingEmail");
  if (!email?.value.trim() || !email.checkValidity()) return { message: "booking.emailError", focus: "bookingEmail" };
  if ((field("bookingPhone")?.value.match(/\d/g) || []).length < 6) return { message: "booking.phoneError", focus: "bookingPhone" };
  return null;
}

// "Continue to payment" (or Enter in a field): spin to the card, or say what's missing.
function continueToCard() {
  const missing = detailsMissing();
  if (!missing) return flipBookingCard(true);
  const status = document.getElementById("bookingStatus");
  status.textContent = t(missing.message);
  status.className = "form-status error";
  if (missing.focus) document.getElementById(missing.focus)?.focus();
}

// Spins the reservation card around its vertical axis: a quarter turn out, the
// other side drawn while it's edge-on, a quarter turn back in. Stripe's card
// iframes are only mounted once the card faces forward again — Firefox doesn't
// paint them inside a 3D transform — and dropped before spinning away.
let flipping = false;
async function flipBookingCard(toBack) {
  if (flipping) return;
  flipping = true;
  try {
    const spin = !!document.getElementById("bookingForm")?.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const turn = (el, from, to, easing) =>
      el.animate([{ transform: `perspective(1600px) rotateY(${from}deg)` }, { transform: `perspective(1600px) rotateY(${to}deg)` }], { duration: 260, easing }).finished;

    if (!toBack) unmountCard();
    if (spin) await turn(document.getElementById("bookingForm"), 0, 90, "ease-in");
    state.booking.payStep = toBack ? "card" : "details";
    renderBookingWidget();
    if (spin) await turn(document.getElementById("bookingForm"), -90, 0, "ease-out");
  } finally {
    flipping = false;
  }
  if (toBack) {
    mountCardWhenVisible();
    focusCardHolder();
  } else {
    document.getElementById("bookingName")?.focus();
  }
}

export function renderBookingWidget() {
  const root = document.getElementById("bookingWidgetRoot");
  if (!root) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { checkIn, checkOut, roomId, calendarMonth } = state.booking;
  const locale = LOCALE_MAP[state.lang] || "en-US";
  const monthLabel = calendarMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const cells = buildMonthMatrix(calendarMonth.getFullYear(), calendarMonth.getMonth());

  const mondayRef = new Date(2026, 7, 3); // a known Monday, for locale-aware weekday header labels
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayRef);
    d.setDate(mondayRef.getDate() + i);
    return d.toLocaleDateString(locale, { weekday: "short" }).toUpperCase();
  });

  const isPrevDisabled = calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() === today.getMonth();
  const selectedRoom = state.rooms.find((r) => r.id === roomId);
  const roomLabel = selectedRoom
    ? `${escapeHtml(pickLocalized(selectedRoom.name, state.lang))} — €${selectedRoom.basePricePerNight}${t("rooms.perNight")}`
    : t("booking.selectRoom");

  // Who's coming: everything starts at 0 and the guest adds people. Adults
  // plus children fit what the chosen room sleeps (before a room is chosen,
  // the largest room); babies don't count against that. Choosing a smaller
  // room brings the counts down. At least one adult is required to send
  // (detailsMissing / the submit handler), not enforced by the counter.
  const b = state.booking;
  const capacities = selectedRoom ? [selectedRoom.capacity] : state.rooms.map((r) => r.capacity);
  const maxGuests = capacities.length ? Math.max(1, ...capacities) : b.adults + b.children;
  b.adults = Math.min(Math.max(0, b.adults || 0), maxGuests);
  b.children = Math.min(Math.max(0, b.children || 0), maxGuests - b.adults);
  b.babies = Math.min(Math.max(0, b.babies || 0), MAX_BABIES);
  const guests = { adults: b.adults, children: b.children, babies: b.babies };
  const noGuests = !b.adults && !b.children && !b.babies;
  const guestLimits = {
    adults: [0, maxGuests - b.children],
    children: [0, maxGuests - b.adults],
    babies: [0, MAX_BABIES]
  };

  // Preview only — the server recomputes the real quote from the room's stored price.
  // Paying a deposit is the guest's choice, by card ("Онлайн") or by bank
  // transfer — at most one of the two boxes is ticked (state.booking.payMethod).
  const payment = getPaymentConfig();
  const cardOn = !!payment?.enabled;
  const bankOn = !!payment?.bankTransfer;
  const payOnline = cardOn && state.booking.payMethod === "card";
  const payBank = bankOn && state.booking.payMethod === "bank";
  const nights = nightsBetween(checkIn, checkOut);
  const total = selectedRoom ? Math.round(nights * selectedRoom.basePricePerNight * 100) / 100 : 0;
  const deposit = payOnline || payBank ? Math.round(total * payment.depositPercent) / 100 : 0;
  // The stay and what it costs, in its own card beside the reservation form —
  // only once something is chosen. Choosing a new stay replaces the card of a
  // bank-transfer request that was just sent.
  const currentStay = {
    roomName: selectedRoom ? pickLocalized(selectedRoom.name, state.lang) : "",
    perNight: selectedRoom?.basePricePerNight,
    checkIn,
    checkOut,
    guests,
    nights,
    total,
    deposit,
    depositPercent: payment?.depositPercent,
    method: payOnline ? "card" : "bank"
  };
  if (currentStay.roomName || nights > 0) completedBooking = null;
  const summaryCard = summaryCardHtml(completedBooking || currentStay);
  // With "pay online" ticked the reservation card has two sides: the booking
  // details on the front and, once they're all filled in, the bank card on the
  // back — the card spins over to it (see flipBookingCard).
  const onBack = payOnline && state.booking.payStep === "card";
  const payOption = (id, checked, icon, label) => `
        <label class="pay-online-toggle">
          <input type="checkbox" id="${id}" ${checked ? "checked" : ""} />
          <svg class="pay-online-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>
          <span>${label}</span>
        </label>`;
  const CARD_ICON = `<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>`;
  const BANK_ICON = `<path d="M3 9.5 12 4l9 5.5M4.5 20h15M6 10.5v7M10 10.5v7M14 10.5v7M18 10.5v7"/>`;
  const payToggle =
    cardOn || bankOn
      ? `<div class="pay-online">
        <p class="pay-online-title">${t("booking.payChoose").replace("{pct}", payment.depositPercent)}</p>
        <div class="pay-online-options">
          ${cardOn ? payOption("payOnline", payOnline, CARD_ICON, t("booking.payCard")) : ""}
          ${bankOn ? payOption("payBank", payBank, BANK_ICON, t("booking.payBank")) : ""}
        </div>
        ${payOnline ? `<p class="pay-online-hint">${t("booking.payFillFirst")}</p>` : ""}
        ${payBank ? `<p class="pay-online-hint">${t("booking.bankHint")}</p>` : ""}
      </div>`
      : "";
  const submitButton = `<button class="btn btn-gold" type="submit">
        <span class="material-symbols-outlined">event_available</span> ${t("booking.submit")}
      </button>`;
  const frontButton = payOnline
    ? `<button class="btn btn-gold" type="button" id="bookingContinue">
        ${t("booking.payContinue")} <span class="material-symbols-outlined">chevron_right</span>
      </button>`
    : submitButton;
  const backFace = payOnline
    ? `<div class="booking-face booking-face--back" ${onBack ? "" : "hidden"}>
        <button type="button" class="booking-face-back" id="bookingEditDetails">
          <span class="material-symbols-outlined">chevron_left</span> ${t("booking.editDetails")}
        </button>
        <p class="booking-face-summary">${selectedRoom ? escapeHtml(pickLocalized(selectedRoom.name, state.lang)) : ""}${checkIn && checkOut ? ` · ${escapeHtml(formatDateLabel(checkIn))} – ${escapeHtml(formatDateLabel(checkOut))}` : ""} · ${escapeHtml(guestsText(guests))}</p>
        <div class="field">
          <label>${t("booking.card")}</label>
          ${onBack ? renderPayCard() : ""}
          <div class="card-error" id="cardError"></div>
          <button type="button" class="pay-fallback" id="payViaStripe" hidden>${t("booking.payOnStripe")}</button>
          <p class="card-note">${t("booking.depositNote").replace("{pct}", payment.depositPercent)}</p>
        </div>
        ${submitButton}
      </div>`
    : "";

  // The whole widget is redrawn below; keep what the guest already typed.
  const typed = ["bookingName", "bookingEmail", "bookingPhone"].map((id) => [id, document.getElementById(id)?.value || ""]);

  root.innerHTML = `
    <div class="booking-widget-row${summaryCard ? " with-summary" : ""}">
    <div class="booking-card">
      <div class="date-fields">
        <div class="date-field">
          <label>${t("booking.checkIn")}</label>
          <span>${escapeHtml(formatDateLabel(checkIn))}</span>
        </div>
        <div class="date-field">
          <label>${t("booking.checkOut")}</label>
          <span>${escapeHtml(formatDateLabel(checkOut))}</span>
        </div>
      </div>

      <div class="cal-header">
        <button class="cal-nav" id="calPrev" type="button" ${isPrevDisabled ? "disabled" : ""} aria-label="Previous month">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <h4>${escapeHtml(monthLabel)}</h4>
        <button class="cal-nav" id="calNext" type="button" aria-label="Next month">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div class="cal-weekdays">
        ${weekdayLabels.map((w) => `<span>${escapeHtml(w)}</span>`).join("")}
      </div>
      <div class="cal-grid">
        ${cells
          .map(({ date, currentMonth }) => {
            if (!currentMonth) return `<button type="button" class="cal-day muted" disabled>${date.getDate()}</button>`;
            const isPast = date < today;
            const isToday = isSameDay(date, today);
            const isStart = isSameDay(date, checkIn);
            const isEnd = isSameDay(date, checkOut);
            const inRange = checkIn && checkOut && date > checkIn && date < checkOut;
            const classes = ["cal-day"];
            if (isPast) classes.push("disabled");
            if (isToday) classes.push("today");
            if (inRange) classes.push("in-range");
            if (isStart || isEnd) classes.push("selected");
            if (isStart && checkOut) classes.push("range-start");
            if (isEnd && checkIn) classes.push("range-end");
            return `<button type="button" class="${classes.join(" ")}" data-date="${formatDate(date)}" ${isPast ? "disabled" : ""}>${date.getDate()}</button>`;
          })
          .join("")}
      </div>

      <div class="cal-legend">
        <span><span class="swatch available"></span>${t("booking.legendAvailable")}</span>
        <span><span class="swatch unavailable"></span>${t("booking.legendUnavailable")}</span>
        <span><span class="swatch range"></span>${t("booking.legendInRange")}</span>
        <span><span class="swatch selected-swatch"></span>${t("booking.legendSelected")}</span>
      </div>
    </div>

    <form class="contact-form booking-form" id="bookingForm">
      <div class="booking-face booking-face--front" ${onBack ? "hidden" : ""}>
      <div class="field">
        <label>${t("booking.room")}</label>
        <div class="room-select" id="roomSelect">
          <button type="button" class="room-select-toggle" id="roomSelectToggle" aria-haspopup="listbox">
            <span class="${selectedRoom ? "" : "placeholder"}">${roomLabel}</span>
            <span class="material-symbols-outlined caret">expand_more</span>
          </button>
          <ul class="room-select-menu" id="roomSelectMenu" role="listbox">
            ${state.rooms
              .map(
                (r) =>
                  `<li role="option" data-room-id="${r.id}" class="${r.id === roomId ? "active" : ""}">
                    <span>${escapeHtml(pickLocalized(r.name, state.lang))} — €${r.basePricePerNight}${t("rooms.perNight")}</span>
                    <span class="room-option-capacity" title="${r.capacity} ${t("rooms.guests")}"><span class="material-symbols-outlined">group</span>${r.capacity}</span>
                  </li>`
              )
              .join("")}
          </ul>
        </div>
      </div>
      <div class="field">
        <label id="bookingGuestsLabel">${t("booking.guests")}</label>
        <div class="room-select guest-select${guestMenuOpen ? " open" : ""}" id="guestSelect">
          <button type="button" class="room-select-toggle" id="guestSelectToggle" aria-expanded="${guestMenuOpen}" aria-controls="guestSelectMenu" aria-labelledby="bookingGuestsLabel guestSelectValue">
            <span class="guest-select-value${noGuests ? " placeholder" : ""}" id="guestSelectValue"><span class="material-symbols-outlined">group</span>${noGuests ? t("booking.selectGuests") : escapeHtml(guestsText(guests))}</span>
            <span class="material-symbols-outlined caret">expand_more</span>
          </button>
          <div class="room-select-menu guest-select-menu" id="guestSelectMenu">
            ${GUEST_KINDS.map(({ key, title, age }) => {
              const [min, max] = guestLimits[key];
              return `<div class="guest-row" role="group" aria-label="${t(title)}">
                <div class="guest-row-label"><strong>${t(title)}</strong><small>${t(age)}</small></div>
                <div class="guest-stepper">
                  <button type="button" id="${key}Less" data-guest="${key}" data-step="-1" aria-label="${t(title)}: ${t("booking.guestsLess")}" ${guests[key] <= min ? "disabled" : ""}>
                    <span class="material-symbols-outlined">remove</span>
                  </button>
                  <output aria-live="polite">${guests[key]}</output>
                  <button type="button" id="${key}More" data-guest="${key}" data-step="1" aria-label="${t(title)}: ${t("booking.guestsMore")}" ${guests[key] >= max ? "disabled" : ""}>
                    <span class="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>`;
            }).join("")}
            ${selectedRoom ? `<p class="guest-select-note">${t("booking.guestsNote").replace("{n}", maxGuests).replace("{b}", MAX_BABIES)}</p>` : ""}
          </div>
        </div>
      </div>
      <div class="field">
        <label for="bookingName">${t("booking.fullName")}</label>
        <input id="bookingName" name="name" type="text" required placeholder="Jane Doe" />
      </div>
      <div class="form-row">
        <div class="field">
          <label for="bookingEmail">${t("booking.email")}</label>
          <input id="bookingEmail" name="email" type="email" required placeholder="jane@example.com" />
        </div>
        <div class="field">
          <label for="bookingPhone">${t("booking.phone")}</label>
          <input id="bookingPhone" name="phone" type="tel" placeholder="+359 ..." />
        </div>
      </div>
      ${payToggle}
      ${frontButton}
      </div>
      ${backFace}
      <div class="form-status" id="bookingStatus"></div>
    </form>
    ${summaryCard || ""}
    </div>
  `;

  document.getElementById("calPrev").addEventListener("click", () => {
    const m = state.booking.calendarMonth;
    state.booking.calendarMonth = new Date(m.getFullYear(), m.getMonth() - 1, 1);
    renderBookingWidget();
  });
  document.getElementById("calNext").addEventListener("click", () => {
    const m = state.booking.calendarMonth;
    state.booking.calendarMonth = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    renderBookingWidget();
  });

  root.querySelectorAll(".cal-day:not(.muted):not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [y, m, d] = btn.dataset.date.split("-").map(Number);
      const clicked = new Date(y, m - 1, d);
      const b = state.booking;

      if (!b.checkIn || (b.checkIn && b.checkOut)) {
        b.checkIn = clicked;
        b.checkOut = null;
      } else if (clicked > b.checkIn) {
        b.checkOut = clicked;
      } else {
        b.checkIn = clicked;
        b.checkOut = null;
      }
      renderBookingWidget();
    });
  });

  for (const [id, value] of typed) document.getElementById(id).value = value;

  wireRoomSelect();
  wireGuestSelect();

  syncFallbackButton();
  document.getElementById("payViaStripe")?.addEventListener("click", () => document.getElementById("bookingForm").requestSubmit());
  // Ticking one payment box unticks the other; unticking leaves no deposit.
  for (const [id, method] of [["payOnline", "card"], ["payBank", "bank"]]) {
    document.getElementById(id)?.addEventListener("change", (e) => {
      state.booking.payMethod = e.target.checked ? method : null;
      state.booking.payStep = "details";
      state.booking.editingDetails = false; // card + details already complete? then it spins right away
      renderBookingWidget();
      document.getElementById(id)?.focus();
    });
  }
  document.getElementById("bookingContinue")?.addEventListener("click", () => continueToCard());
  document.getElementById("bookingEditDetails")?.addEventListener("click", () => {
    state.booking.editingDetails = true; // don't spin straight back on the next redraw
    flipBookingCard(false);
  });
  // Typing doesn't spin the card mid-word — leaving a field (change) does,
  // once it was the last thing missing.
  for (const id of ["bookingName", "bookingEmail", "bookingPhone"]) {
    document.getElementById(id).addEventListener("change", () => {
      if (payOnline && !onBack && !detailsMissing()) flipBookingCard(true);
    });
  }
  handleCheckoutReturn();

  // Payment config loads once; the first time it says "on", re-render so the checkbox appears.
  if (payment === null) loadPayment().then((c) => (c.enabled || c.bankTransfer) && renderBookingWidget());
  else if (onBack) {
    if (!flipping) mountCardWhenVisible(); // mid-spin, it's mounted once the card faces forward
  } else unmountCard();

  // The last missing detail was a date or the room (each redraws the widget).
  if (payOnline && !onBack && !state.booking.editingDetails && !flipping && !detailsMissing()) {
    requestAnimationFrame(() => flipBookingCard(true));
  }

  document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("bookingStatus");
    const b = state.booking;

    if (!b.checkIn || !b.checkOut) {
      status.textContent = t("booking.selectDatesError");
      status.className = "form-status error";
      return;
    }
    if (!b.roomId) {
      status.textContent = t("booking.selectRoomError");
      status.className = "form-status error";
      return;
    }
    if (!b.adults) {
      status.textContent = t("booking.guestsError");
      status.className = "form-status error";
      setGuestMenuOpen(true);
      document.getElementById("adultsMore")?.focus();
      return;
    }

    const config = getPaymentConfig();
    const payNow = !!config?.enabled && b.payMethod === "card";
    const payByTransfer = !!config?.bankTransfer && b.payMethod === "bank";
    // A deposit is required whenever a way to pay one is offered.
    if ((config?.enabled || config?.bankTransfer) && !payNow && !payByTransfer) {
      status.textContent = t("booking.payRequired");
      status.className = "form-status error";
      document.querySelector(".pay-online")?.classList.add("is-missing");
      document.querySelector(".pay-online input")?.focus();
      return;
    }
    if (payNow && b.payStep !== "card") return continueToCard(); // Enter on the details side
    const useCheckout = payNow && isCardFailed();
    if (payNow && !useCheckout && !getCardHolder()) {
      status.textContent = t("booking.cardHolderError");
      status.className = "form-status error";
      focusCardHolder();
      return;
    }

    checkoutStatus = null; // a new request replaces the last one's message
    status.textContent = t("booking.sending");
    status.className = "form-status";

    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.roomId = b.roomId;
    Object.assign(payload, { adults: b.adults, children: b.children, babies: b.babies });
    const room = state.rooms.find((r) => r.id === b.roomId);
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true; // a double-click would place two holds on the card

    try {
      if (useCheckout) {
        status.textContent = t("booking.redirecting");
        await startCheckout({
          roomId: b.roomId,
          roomName: room ? pickLocalized(room.name, state.lang) : "",
          checkIn: formatDate(b.checkIn),
          checkOut: formatDate(b.checkOut),
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          adults: b.adults,
          children: b.children,
          babies: b.babies
        });
        return; // the browser is navigating to Stripe
      }
      if (payNow) {
        payload.paymentIntentId = await holdDeposit({
          roomId: b.roomId,
          checkIn: formatDate(b.checkIn),
          checkOut: formatDate(b.checkOut),
          name: getCardHolder(),
          email: payload.email
        });
      }
      if (payByTransfer) payload.paymentMethod = "bank_transfer";

      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          roomName: room ? pickLocalized(room.name, state.lang) : "",
          checkIn: formatDate(b.checkIn),
          checkOut: formatDate(b.checkOut)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      status.textContent = data.message;
      status.className = "form-status success";
      form.reset();
      state.booking = { checkIn: null, checkOut: null, roomId: "", adults: 0, children: 0, babies: 0, calendarMonth: startOfMonth(new Date()) };
      checkoutStatus = { text: data.message, cls: "success" };
      // Booked by bank transfer: the stay and where to send the deposit stay in
      // the "Your stay" card. (`b` is still the request's own booking state.)
      if (data.bankTransfer && room) {
        const nights = nightsBetween(b.checkIn, b.checkOut);
        completedBooking = {
          roomName: pickLocalized(room.name, state.lang),
          perNight: room.basePricePerNight,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          guests: { adults: b.adults, children: b.children, babies: b.babies },
          nights,
          total: Math.round(nights * room.basePricePerNight * 100) / 100,
          deposit: data.bankTransfer.amount,
          depositPercent: getPaymentConfig()?.depositPercent,
          method: "bank",
          bankTransfer: data.bankTransfer
        };
      }
      renderBookingWidget(); // shows checkoutStatus and the card
    } catch (err) {
      status.textContent = err.expose ? err.message : t("contact.errorGeneric");
      status.className = "form-status error";
      submitBtn.disabled = false;
    }
  });
}
