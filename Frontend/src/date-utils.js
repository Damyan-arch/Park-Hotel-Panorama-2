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

export function isSameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
