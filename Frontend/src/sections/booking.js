import { state, startOfMonth } from "../state.js";
import { t, LOCALE_MAP, pickLocalized } from "../i18n.js";
import { API_BASE, escapeHtml } from "../dom-utils.js";
import { formatDate, formatDateLabel, isSameDay } from "../date-utils.js";
import { FACEBOOK_ICON_SVG } from "../icons.js";

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
      <button class="btn btn-gold" type="submit">
        <span class="material-symbols-outlined">event_available</span> ${t("booking.submit")}
      </button>
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

  wireRoomSelect();

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

    status.textContent = t("booking.sending");
    status.className = "form-status";

    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.roomId = b.roomId;
    const room = state.rooms.find((r) => r.id === b.roomId);

    try {
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
      status.textContent = t("contact.errorGeneric");
      status.className = "form-status error";
    }
  });
}
