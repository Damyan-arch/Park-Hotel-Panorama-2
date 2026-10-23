import { state } from "./state.js";
import { t, LOCALE_MAP } from "./i18n.js";

export function formatDate(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDateLabel(date) {
  if (!date) return t("booking.selectDate");
  return date.toLocaleDateString(LOCALE_MAP[state.lang] || "en-US", { day: "numeric", month: "short", year: "numeric" });
}

// Nights between check-in and check-out (21st -> 26th is 5). Goes through
// Date.UTC so a daylight-saving change inside the range can't skew the count.
export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = Date.UTC(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
  const end = Date.UTC(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());
  return Math.round((end - start) / 86400000);
}

export function isSameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
