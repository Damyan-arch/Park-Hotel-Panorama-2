const API_BASE = "/api";

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeHtmlMultiline(str = "") {
  return escapeHtml(str).replace(/\n/g, "<br>");
}

function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : pathOrUrl;
}

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error("Failed to load events");
    return await res.json();
  } catch (err) {
    console.warn("Could not load events", err);
    return [];
  }
}

function render(events) {
  const app = document.getElementById("events-app");
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  app.innerHTML = `
    <header class="events-header">
      <div class="container events-header-row">
        <a href="/" class="brand">
          <img src="/images/brand/logo-mark-v2.png" alt="Park Hotel Panorama logo" />
          <span>Park Hotel Panorama<small>Tryavna, Bulgaria</small></span>
        </a>
        <a class="btn btn-line" href="/">
          <span class="material-symbols-outlined">arrow_back</span> Back to Home
        </a>
      </div>
    </header>

    <main class="events-page container">
      <div class="section-head">
        <div class="eyebrow">What's On</div>
        <h1>Upcoming Events</h1>
        <p>Join us for seasonal gatherings, tastings and local celebrations at Park Hotel Panorama.</p>
      </div>

      ${
        sorted.length
          ? `<div class="events-full-grid">
              ${sorted
                .map(
                  (ev) => `
                <article class="event-full-card">
                  ${ev.imageUrl ? `<img src="${mediaUrl(ev.imageUrl)}" alt="${escapeHtml(ev.title)}" />` : ""}
                  <div class="event-full-body">
                    <h2>${escapeHtml(ev.title)}</h2>
                    <div class="event-full-meta">
                      <span><span class="material-symbols-outlined">event</span>${formatEventDate(ev.date)}</span>
                      ${ev.time ? `<span><span class="material-symbols-outlined">schedule</span>${escapeHtml(ev.time)}</span>` : ""}
                    </div>
                    <p>${escapeHtmlMultiline(ev.description)}</p>
                    ${
                      ev.infoUrl
                        ? `<a class="btn btn-line event-full-link" href="${escapeHtml(ev.infoUrl)}" target="_blank" rel="noopener">More Information</a>`
                        : ""
                    }
                  </div>
                </article>`
                )
                .join("")}
            </div>`
          : `<div class="events-empty">No events are scheduled right now — check back soon.</div>`
      }
    </main>

    <footer class="events-footer">
      <div class="container">
        <a class="btn btn-gold" href="tel:+359897820065"><span class="material-symbols-outlined">call</span> Call Us Now</a>
      </div>
    </footer>
  `;
}

render(await fetchEvents());
