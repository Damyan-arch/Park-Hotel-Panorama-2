import { state, FALLBACK_SETTINGS, FALLBACK_AMENITIES } from "./state.js";
import { fetchJSON } from "./dom-utils.js";
import { renderShell } from "./shell.js";
import { wireNav, wireLangSwitch } from "./sections/header.js";
import { renderAmenities } from "./sections/amenities.js";
import { renderRooms } from "./sections/rooms.js";
import { renderGallery } from "./sections/gallery.js";
import { renderBookingWidget } from "./sections/booking.js";
import { wireEventsWidgetVisibility } from "./sections/events-widget.js";

function renderAll() {
  renderShell();
  wireNav();
  wireLangSwitch(renderAll);
  wireEventsWidgetVisibility();
  renderAmenities();
  renderRooms();
  renderGallery();
  renderBookingWidget();
}

async function init() {
  renderAll();

  const [settings, amenities, rooms, gallery, events] = await Promise.all([
    fetchJSON("/settings", FALLBACK_SETTINGS),
    fetchJSON("/amenities", FALLBACK_AMENITIES),
    fetchJSON("/rooms", []),
    fetchJSON("/gallery", []),
    fetchJSON("/events", [])
  ]);

  // Spread over the fallbacks: the settings row is a free-form JSON blob, so a
  // key the hotel has never saved (email, phoneHref, ...) would otherwise be
  // undefined and render as an empty contact line.
  state.settings = { ...FALLBACK_SETTINGS, ...settings };
  state.amenities = amenities;
  state.rooms = rooms;
  state.gallery = gallery;
  state.events = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  renderAll();
}

init();
