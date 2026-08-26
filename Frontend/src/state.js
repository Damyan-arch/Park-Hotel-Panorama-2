export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export const FALLBACK_SETTINGS = {
  hotelName: "Park Hotel Panorama",
  phoneNumber: "+359 897 820 065",
  phoneHref: "tel:+359897820065",
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
