import { renderHeader } from "./sections/header.js";
import { renderHero } from "./sections/hero.js";
import { renderAbout } from "./sections/about.js";
import { renderAmenitiesSection } from "./sections/amenities.js";
import { renderLeisure } from "./sections/leisure.js";
import { renderRoomsSection } from "./sections/rooms.js";
import { renderRestaurant } from "./sections/restaurant.js";
import { renderGallerySection } from "./sections/gallery.js";
import { renderLocation } from "./sections/location.js";
import { renderBookingSection } from "./sections/booking.js";
import { renderFooter } from "./sections/footer.js";
import { renderEventsWidget } from "./sections/events-widget.js";

export function renderShell() {
  const app = document.getElementById("app");
  app.innerHTML = `
    ${renderHeader()}

    <main>
      ${renderHero()}

      ${renderAbout()}

      ${renderAmenitiesSection()}

      ${renderLeisure()}

      ${renderRoomsSection()}

      ${renderRestaurant()}

      ${renderGallerySection()}

      ${renderLocation()}

      ${renderBookingSection()}
    </main>

    ${renderFooter()}

    ${renderEventsWidget()}
  `;
}
