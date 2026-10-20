export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export const FALLBACK_SETTINGS = {
  hotelName: "Park Hotel Panorama",
  phoneNumber: "+359 897 820 065",
  phoneHref: "tel:+359897820065",
  email: "panorama.tryavna@gmail.com",
  address: "Tryavna, Bulgaria",
  mapQuery: "Park Hotel Panorama, Tryavna, Bulgaria",
  facebookUrl: "https://www.facebook.com/",
  restaurantHoursDays: "Mon – Sun",
  restaurantHoursText: "From 7:00 PM to 10:30 PM",
  aboutTitle: "",
  aboutText: "",
  tagline: "",
  copyrightYear: 2026,
  heroImage: "/images/gallery/lounge-lobby.webp",
  aboutImage: "/images/gallery/courtyard-garden.webp",
  aboutFloatImage: "/images/gallery/rose-garden.webp",
  restaurantImage: "/images/gallery/restaurant-hall.webp",
  heroStat1Value: "4",
  heroStat1Label: "",
  heroStat2Value: "6+",
  heroStat2Label: "",
  heroStat3Value: "< 2h",
  heroStat3Label: "",
  heroStat4Value: "5★",
  heroStat4Label: "",
  leisurePlayTitle: "",
  leisurePlayText: "",
  leisureSpaTitle: "",
  leisureSpaText: "",
  leisurePlayImage1: "/images/leisure/playground-1.webp",
  leisurePlayImage2: "/images/leisure/playground-2.webp",
  leisurePlayImage3: "/images/leisure/playground-3.webp",
  leisurePlayImage4: "/images/leisure/kids-football.webp",
  leisureSpaImage: "/images/leisure/hot-tub.webp"
};

export const FALLBACK_AMENITIES = [];

export const state = {
  lang: localStorage.getItem("php_lang") || "bg",
  settings: FALLBACK_SETTINGS,
  amenities: FALLBACK_AMENITIES,
  rooms: [],
  gallery: [],
  events: [],
  booking: { checkIn: null, checkOut: null, roomId: "", calendarMonth: startOfMonth(new Date()) }
};

// Event dates are plain YYYY-MM-DD calendar days. `new Date("2026-10-02")`
// parses that as UTC midnight, so comparing it against local midnight — or
// formatting it — shifts the day backwards for viewers west of UTC (an event
// dated today landed under "Past" in New York, and rendered as the day before).
// Parsing the parts explicitly makes the date mean the same calendar day in
// every timezone. Lives here rather than in date-utils.js because the admin
// bundle needs it and date-utils.js pulls in the whole i18n table.
export function parseDateOnly(dateStr) {
  const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
