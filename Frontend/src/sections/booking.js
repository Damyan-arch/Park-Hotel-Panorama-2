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

  // Preview only — the server recomputes the real quote from the room's stored price.
  // Paying online is the guest's choice: the card only appears once they tick it.
  const payment = getPaymentConfig();
  const paymentOn = !!payment?.enabled;
  const payOnline = paymentOn && !!state.booking.payOnline;
  const nights = nightsBetween(checkIn, checkOut);
  const total = selectedRoom ? Math.round(nights * selectedRoom.basePricePerNight * 100) / 100 : 0;
  const deposit = payOnline ? Math.round(total * payment.depositPercent) / 100 : 0;
  const priceSummary =
    selectedRoom && nights > 0
      ? `<div class="booking-price">
          <div class="booking-price-row">
            <span>${nights} ${t(nights === 1 ? "booking.night" : "booking.nights")} × €${selectedRoom.basePricePerNight}</span>
            <strong>${t("booking.total")}: €${total}</strong>
          </div>
          ${
            payOnline
              ? `<div class="booking-price-row deposit">
                  <span>${t("booking.deposit")} ${payment.depositPercent}%</span>
                  <strong>€${deposit}</strong>
                </div>`
              : ""
          }
        </div>`
      : "";
  // With "pay online" ticked the reservation card has two sides: the booking
  // details on the front and, once they're all filled in, the bank card on the
  // back — the card spins over to it (see flipBookingCard).
  const onBack = payOnline && state.booking.payStep === "card";
  const payToggle = paymentOn
    ? `<div class="pay-online">
        <label class="pay-online-toggle">
          <input type="checkbox" id="payOnline" ${payOnline ? "checked" : ""} />
          <svg class="pay-online-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/></svg>
          <span>${t("booking.payOnline").replace("{pct}", payment.depositPercent)}</span>
        </label>
        ${payOnline ? `<p class="pay-online-hint">${t("booking.payFillFirst")}</p>` : ""}
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
        <p class="booking-face-summary">${selectedRoom ? escapeHtml(pickLocalized(selectedRoom.name, state.lang)) : ""}${checkIn && checkOut ? ` · ${escapeHtml(formatDateLabel(checkIn))} – ${escapeHtml(formatDateLabel(checkOut))}` : ""}</p>
        <div class="field">
          <label>${t("booking.card")}</label>
          ${onBack ? renderPayCard() : ""}
          <div class="card-error" id="cardError"></div>
          <button type="button" class="pay-fallback" id="payViaStripe" hidden>${t("booking.payOnStripe")}</button>
          <p class="card-note">${t("booking.depositNote").replace("{pct}", payment.depositPercent)}</p>
        </div>
        ${priceSummary}
        ${submitButton}
      </div>`
    : "";

  // The whole widget is redrawn below; keep what the guest already typed.
  const typed = ["bookingName", "bookingEmail", "bookingPhone"].map((id) => [id, document.getElementById(id)?.value || ""]);

  root.innerHTML = `
    <div class="booking-widget-row">
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
                  `<li role="option" data-room-id="${r.id}" class="${r.id === roomId ? "active" : ""}">${escapeHtml(pickLocalized(r.name, state.lang))} — €${r.basePricePerNight}${t("rooms.perNight")}</li>`
              )
              .join("")}
          </ul>
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
      ${priceSummary}
      ${frontButton}
      </div>
      ${backFace}
      <div class="form-status" id="bookingStatus"></div>
    </form>
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

  syncFallbackButton();
  document.getElementById("payViaStripe")?.addEventListener("click", () => document.getElementById("bookingForm").requestSubmit());
  document.getElementById("payOnline")?.addEventListener("change", (e) => {
    state.booking.payOnline = e.target.checked;
    state.booking.payStep = "details";
    state.booking.editingDetails = false; // already complete? then it spins right away
    renderBookingWidget();
    document.getElementById("payOnline")?.focus();
  });
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
  if (payment === null) loadPayment().then((c) => c.enabled && renderBookingWidget());
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

    const payNow = !!getPaymentConfig()?.enabled && !!b.payOnline;
    if (payNow && b.payStep !== "card") return continueToCard(); // Enter on the details side
    const useCheckout = payNow && isCardFailed();
    if (payNow && !useCheckout && !getCardHolder()) {
      status.textContent = t("booking.cardHolderError");
      status.className = "form-status error";
      focusCardHolder();
      return;
    }

    status.textContent = t("booking.sending");
    status.className = "form-status";

    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.roomId = b.roomId;
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
          phone: payload.phone
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
      state.booking = { checkIn: null, checkOut: null, roomId: "", calendarMonth: startOfMonth(new Date()) };
      renderBookingWidget();
      document.getElementById("bookingStatus").textContent = data.message;
      document.getElementById("bookingStatus").className = "form-status success";
    } catch (err) {
      status.textContent = err.expose ? err.message : t("contact.errorGeneric");
      status.className = "form-status error";
      submitBtn.disabled = false;
    }
  });
}
