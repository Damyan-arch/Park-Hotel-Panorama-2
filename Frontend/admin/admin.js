const API_BASE = "http://localhost:3002/api";
const MEDIA_BASE = "http://localhost:3002";
const TOKEN_KEY = "php_admin_token";

const ICON_SUGGESTIONS = [
  "spa", "museum", "directions_bike", "restaurant", "wine_bar", "hiking",
  "pool", "local_bar", "terrain", "park", "hot_tub", "golf_course", "kayaking",
  "landscape", "local_cafe", "nightlife", "photo_camera", "shopping_bag"
];

let state = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  tab: "bookings",
  bookings: [],
  inquiries: [],
  rooms: [],
  gallery: [],
  amenities: [],
  settings: {},
  loading: false,
  loginError: "",
  modal: null // { title, bodyHtml, onMount(form), onSubmit(form) }
};

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${MEDIA_BASE}${pathOrUrl}`;
}

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

async function apiFetch(path, options = {}) {
  const isJsonBody = typeof options.body === "string";
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...options.headers
    }
  });

  if (res.status === 401) {
    logout();
    throw new Error("Session expired.");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const data = await apiFetch("/admin/upload", { method: "POST", body: fd });
  return data.url;
}

function logout() {
  state.token = null;
  localStorage.removeItem(TOKEN_KEY);
  render();
}

async function loadData() {
  state.loading = true;
  render();
  try {
    const [bookings, inquiries, rooms, gallery, amenities, settings] = await Promise.all([
      apiFetch("/admin/bookings"),
      apiFetch("/admin/inquiries"),
      apiFetch("/rooms"),
      apiFetch("/gallery"),
      apiFetch("/amenities"),
      apiFetch("/settings")
    ]);
    state.bookings = bookings;
    state.inquiries = inquiries;
    state.rooms = rooms;
    state.gallery = [...gallery].sort((a, b) => a.sortOrder - b.sortOrder);
    state.amenities = amenities;
    state.settings = settings;
  } catch (err) {
    console.warn(err);
  } finally {
    state.loading = false;
    render();
  }
}

async function toggleLeadStatus(kind, id, currentStatus) {
  const nextStatus = currentStatus === "new" ? "contacted" : "new";
  try {
    await apiFetch(`/admin/${kind}/${id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
    const list = kind === "bookings" ? state.bookings : state.inquiries;
    const entry = list.find((e) => e.id === id);
    if (entry) entry.status = nextStatus;
    render();
  } catch (err) {
    alert(err.message);
  }
}

/* ---------- Modal ---------- */

function closeModal() {
  state.modal = null;
  renderModal();
}

function renderModal() {
  const root = document.getElementById("modalRoot");
  if (!root) return;

  if (!state.modal) {
    root.className = "modal-overlay";
    root.innerHTML = "";
    return;
  }

  root.className = "modal-overlay open";
  root.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <h3>${escapeHtml(state.modal.title)}</h3>
        <button class="modal-close" id="modalCloseBtn" type="button"><span class="material-symbols-outlined">close</span></button>
      </div>
      <form id="modalForm">
        ${state.modal.bodyHtml}
        <div class="modal-error" id="modalError"></div>
        <div class="modal-actions">
          <button type="button" class="btn" id="modalCancelBtn">Cancel</button>
          <button type="submit" class="btn primary">${escapeHtml(state.modal.submitLabel || "Save")}</button>
        </div>
      </form>
    </div>
  `;

  root.addEventListener("click", (e) => {
    if (e.target === root) closeModal();
  });
  document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
  document.getElementById("modalCancelBtn").addEventListener("click", closeModal);

  const form = document.getElementById("modalForm");
  if (state.modal.onMount) state.modal.onMount(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("modalError");
    errorEl.textContent = "";
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await state.modal.onSubmit(form);
      closeModal();
      await loadData();
    } catch (err) {
      errorEl.textContent = err.message || "Something went wrong.";
      submitBtn.disabled = false;
    }
  });
}

function openModal(config) {
  state.modal = config;
  renderModal();
}

function imagePickerHtml(id, currentUrl) {
  return `
    <div class="field">
      <label for="${id}">Image</label>
      <div class="image-picker">
        <img id="${id}Preview" src="${currentUrl ? mediaUrl(currentUrl) : ""}" class="${currentUrl ? "" : "empty"}" alt="" />
        <input id="${id}" type="file" accept="image/*" />
      </div>
    </div>
  `;
}

function wireImagePicker(form, id) {
  const input = form.querySelector(`#${id}`);
  const preview = form.querySelector(`#${id}Preview`);
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("empty");
  });
}

/* ---------- Login ---------- */

function renderLogin() {
  const app = document.getElementById("admin-app");
  app.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <h1>Staff Sign In</h1>
        <p class="sub">Park Hotel Panorama — internal access only.</p>
        <form id="loginForm">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="login-submit" type="submit">
            <span class="material-symbols-outlined">lock_open</span> Sign In
          </button>
          <div class="login-error">${escapeHtml(state.loginError)}</div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.target).entries());
    try {
      const data = await apiFetch("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
      state.token = data.token;
      state.loginError = "";
      localStorage.setItem(TOKEN_KEY, data.token);
      await loadData();
    } catch (err) {
      document.querySelector(".login-error").textContent = "Invalid email or password.";
      document.getElementById("password").value = "";
      document.getElementById("password").focus();
    }
  });
}

/* ---------- Leads (bookings / inquiries) ---------- */

function renderEntryCard(kind, entry) {
  const isBooking = kind === "bookings";
  return `
    <div class="entry-card">
      <div class="entry-main">
        <strong>${escapeHtml(entry.name)}</strong>
        <div class="entry-meta">
          <span><span class="material-symbols-outlined">mail</span>${escapeHtml(entry.email)}</span>
          ${entry.phone ? `<span><span class="material-symbols-outlined">call</span>${escapeHtml(entry.phone)}</span>` : ""}
          ${isBooking ? `<span><span class="material-symbols-outlined">bed</span>${escapeHtml(entry.roomName)}</span>` : ""}
          ${isBooking ? `<span><span class="material-symbols-outlined">event</span>${escapeHtml(entry.checkIn)} → ${escapeHtml(entry.checkOut)}</span>` : ""}
          <span><span class="material-symbols-outlined">schedule</span>${formatDateTime(entry.receivedAt)}</span>
        </div>
        ${!isBooking ? `<div class="entry-message">${escapeHtml(entry.message)}</div>` : ""}
      </div>
      <div class="entry-side">
        <span class="status-badge ${entry.status}">${entry.status === "new" ? "New" : "Contacted"}</span>
        <button class="status-toggle" data-kind="${kind}" data-id="${entry.id}" data-status="${entry.status}">
          Mark as ${entry.status === "new" ? "contacted" : "new"}
        </button>
      </div>
    </div>
  `;
}

function renderLeadsPanel(kind) {
  const list = kind === "bookings" ? state.bookings : state.inquiries;
  return list.length
    ? `<div class="entry-list">${list.map((entry) => renderEntryCard(kind, entry)).join("")}</div>`
    : `<div class="empty-state">Nothing here yet.</div>`;
}

/* ---------- Rooms ---------- */

function roomFormFields(room = {}) {
  return `
    ${imagePickerHtml("roomImage", room.imageUrl)}
    <div class="field">
      <label for="roomName">Name</label>
      <input id="roomName" value="${escapeHtml(room.name || "")}" required />
    </div>
    <div class="form-row">
      <div class="field">
        <label for="roomType">Type</label>
        <input id="roomType" value="${escapeHtml(room.type || "")}" placeholder="SUITE, DOUBLE, FAMILY…" required />
      </div>
      <div class="field">
        <label for="roomCurrency">Currency</label>
        <input id="roomCurrency" value="${escapeHtml(room.currency || "EUR")}" />
      </div>
    </div>
    <div class="field">
      <label for="roomDescription">Description</label>
      <textarea id="roomDescription" rows="3">${escapeHtml(room.description || "")}</textarea>
    </div>
    <div class="form-row three">
      <div class="field">
        <label for="roomCapacity">Guests</label>
        <input id="roomCapacity" type="number" min="1" value="${room.capacity ?? 2}" required />
      </div>
      <div class="field">
        <label for="roomSize">Size (m²)</label>
        <input id="roomSize" type="number" min="0" value="${room.sizeSqm ?? 20}" required />
      </div>
      <div class="field">
        <label for="roomPrice">Price / night</label>
        <input id="roomPrice" type="number" min="0" value="${room.basePricePerNight ?? 50}" required />
      </div>
    </div>
  `;
}

function openRoomModal(room = null) {
  openModal({
    title: room ? "Edit Room" : "Add Room",
    bodyHtml: roomFormFields(room || {}),
    submitLabel: room ? "Save Changes" : "Add Room",
    onMount: (form) => wireImagePicker(form, "roomImage"),
    onSubmit: async (form) => {
      const imageFile = form.querySelector("#roomImage").files[0];
      let imageUrl = room?.imageUrl || "";
      if (imageFile) imageUrl = await uploadImage(imageFile);
      if (!imageUrl) throw new Error("Please choose an image.");

      const payload = {
        name: form.querySelector("#roomName").value.trim(),
        type: form.querySelector("#roomType").value.trim().toUpperCase(),
        currency: form.querySelector("#roomCurrency").value.trim() || "EUR",
        description: form.querySelector("#roomDescription").value.trim(),
        capacity: form.querySelector("#roomCapacity").value,
        sizeSqm: form.querySelector("#roomSize").value,
        basePricePerNight: form.querySelector("#roomPrice").value,
        imageUrl
      };

      if (room) {
        await apiFetch(`/admin/rooms/${room.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/admin/rooms", { method: "POST", body: JSON.stringify(payload) });
      }
    }
  });
}

async function deleteRoom(id) {
  if (!confirm("Delete this room? This cannot be undone.")) return;
  try {
    await apiFetch(`/admin/rooms/${id}`, { method: "DELETE" });
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

function renderRoomsPanel() {
  return `
    <div class="panel-toolbar">
      <button class="btn primary" id="addRoomBtn"><span class="material-symbols-outlined">add</span> Add Room</button>
    </div>
    ${
      state.rooms.length
        ? `<div class="card-grid">
            ${state.rooms
              .map(
                (r) => `
              <div class="content-card">
                <img class="content-thumb" src="${mediaUrl(r.imageUrl)}" alt="${escapeHtml(r.name)}" />
                <div class="content-body">
                  <strong>${escapeHtml(r.name)}</strong>
                  <span class="content-sub">${escapeHtml(r.type)} · ${r.capacity} guests · ${r.sizeSqm} m² · €${r.basePricePerNight}/night</span>
                </div>
                <div class="content-actions">
                  <button class="icon-btn" data-edit-room="${r.id}" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                  <button class="icon-btn danger" data-delete-room="${r.id}" title="Delete"><span class="material-symbols-outlined">delete</span></button>
                </div>
              </div>`
              )
              .join("")}
          </div>`
        : `<div class="empty-state">No rooms yet.</div>`
    }
  `;
}

/* ---------- Gallery ---------- */

function galleryFormFields(image = {}) {
  return `
    ${imagePickerHtml("galleryImage", image.imageUrl)}
    <div class="field">
      <label for="galleryAlt">Description (alt text)</label>
      <input id="galleryAlt" value="${escapeHtml(image.alt || "")}" placeholder="e.g. Hotel courtyard and garden" />
    </div>
    <div class="field">
      <label for="gallerySort">Sort order</label>
      <input id="gallerySort" type="number" min="0" value="${image.sortOrder ?? state.gallery.length}" />
    </div>
  `;
}

function openGalleryModal(image = null) {
  openModal({
    title: image ? "Edit Photo" : "Add Photo",
    bodyHtml: galleryFormFields(image || {}),
    submitLabel: image ? "Save Changes" : "Add Photo",
    onMount: (form) => wireImagePicker(form, "galleryImage"),
    onSubmit: async (form) => {
      const imageFile = form.querySelector("#galleryImage").files[0];
      let imageUrl = image?.imageUrl || "";
      if (imageFile) imageUrl = await uploadImage(imageFile);
      if (!imageUrl) throw new Error("Please choose an image.");

      const payload = {
        imageUrl,
        alt: form.querySelector("#galleryAlt").value.trim(),
        sortOrder: form.querySelector("#gallerySort").value
      };

      if (image) {
        await apiFetch(`/admin/gallery/${image.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/admin/gallery", { method: "POST", body: JSON.stringify(payload) });
      }
    }
  });
}

async function deleteGalleryImage(id) {
  if (!confirm("Delete this photo? This cannot be undone.")) return;
  try {
    await apiFetch(`/admin/gallery/${id}`, { method: "DELETE" });
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

function renderGalleryPanel() {
  return `
    <div class="panel-toolbar">
      <button class="btn primary" id="addPhotoBtn"><span class="material-symbols-outlined">add_photo_alternate</span> Add Photo</button>
    </div>
    ${
      state.gallery.length
        ? `<div class="photo-grid">
            ${state.gallery
              .map(
                (g) => `
              <div class="photo-card">
                <img src="${mediaUrl(g.imageUrl)}" alt="${escapeHtml(g.alt)}" />
                <div class="photo-overlay">
                  <button class="icon-btn" data-edit-gallery="${g.id}" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                  <button class="icon-btn danger" data-delete-gallery="${g.id}" title="Delete"><span class="material-symbols-outlined">delete</span></button>
                </div>
                <span class="photo-caption">${escapeHtml(g.alt || "—")}</span>
              </div>`
              )
              .join("")}
          </div>`
        : `<div class="empty-state">No photos yet.</div>`
    }
  `;
}

/* ---------- Amenities ---------- */

function amenityFormFields(amenity = {}) {
  return `
    <div class="field">
      <label for="amenityIcon">Icon name</label>
      <div class="icon-input-row">
        <span class="material-symbols-outlined icon-live-preview" id="amenityIconPreview">${escapeHtml(amenity.icon || "star")}</span>
        <input id="amenityIcon" value="${escapeHtml(amenity.icon || "")}" list="iconSuggestions" placeholder="e.g. spa" required />
      </div>
      <datalist id="iconSuggestions">
        ${ICON_SUGGESTIONS.map((i) => `<option value="${i}"></option>`).join("")}
      </datalist>
      <p class="field-hint">Any <a href="https://fonts.google.com/icons" target="_blank" rel="noopener">Material Symbols</a> name works.</p>
    </div>
    <div class="field">
      <label for="amenityTitle">Title</label>
      <input id="amenityTitle" value="${escapeHtml(amenity.title || "")}" required />
    </div>
    <div class="field">
      <label for="amenityText">Description</label>
      <textarea id="amenityText" rows="3">${escapeHtml(amenity.text || "")}</textarea>
    </div>
  `;
}

function openAmenityModal(amenity = null) {
  openModal({
    title: amenity ? "Edit Amenity" : "Add Amenity",
    bodyHtml: amenityFormFields(amenity || {}),
    submitLabel: amenity ? "Save Changes" : "Add Amenity",
    onMount: (form) => {
      const iconInput = form.querySelector("#amenityIcon");
      const preview = form.querySelector("#amenityIconPreview");
      iconInput.addEventListener("input", () => {
        preview.textContent = iconInput.value.trim() || "star";
      });
    },
    onSubmit: async (form) => {
      const payload = {
        icon: form.querySelector("#amenityIcon").value.trim(),
        title: form.querySelector("#amenityTitle").value.trim(),
        text: form.querySelector("#amenityText").value.trim()
      };

      if (amenity) {
        await apiFetch(`/admin/amenities/${amenity.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/admin/amenities", { method: "POST", body: JSON.stringify(payload) });
      }
    }
  });
}

async function deleteAmenity(id) {
  if (!confirm("Delete this amenity? This cannot be undone.")) return;
  try {
    await apiFetch(`/admin/amenities/${id}`, { method: "DELETE" });
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

function renderAmenitiesPanel() {
  return `
    <div class="panel-toolbar">
      <button class="btn primary" id="addAmenityBtn"><span class="material-symbols-outlined">add</span> Add Amenity</button>
    </div>
    ${
      state.amenities.length
        ? `<div class="entry-list">
            ${state.amenities
              .map(
                (a) => `
              <div class="entry-card amenity-row">
                <div class="icon-badge"><span class="material-symbols-outlined">${escapeHtml(a.icon)}</span></div>
                <div class="entry-main">
                  <strong>${escapeHtml(a.title)}</strong>
                  <div class="entry-message">${escapeHtml(a.text)}</div>
                </div>
                <div class="content-actions">
                  <button class="icon-btn" data-edit-amenity="${a.id}" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                  <button class="icon-btn danger" data-delete-amenity="${a.id}" title="Delete"><span class="material-symbols-outlined">delete</span></button>
                </div>
              </div>`
              )
              .join("")}
          </div>`
        : `<div class="empty-state">No amenities yet.</div>`
    }
  `;
}

/* ---------- Hotel Info (settings) ---------- */

function renderSettingsPanel() {
  const s = state.settings;
  return `
    <form id="settingsForm" class="settings-form">
      <h4>Text & Contact Details</h4>
      <div class="form-row">
        <div class="field"><label for="setHotelName">Hotel name</label><input id="setHotelName" value="${escapeHtml(s.hotelName || "")}" /></div>
        <div class="field"><label for="setPhone">Phone number</label><input id="setPhone" value="${escapeHtml(s.phoneNumber || "")}" /></div>
      </div>
      <div class="form-row">
        <div class="field"><label for="setAddress">Address</label><input id="setAddress" value="${escapeHtml(s.address || "")}" /></div>
        <div class="field"><label for="setFacebook">Facebook URL</label><input id="setFacebook" value="${escapeHtml(s.facebookUrl || "")}" /></div>
      </div>
      <div class="form-row">
        <div class="field"><label for="setHoursDays">Restaurant days</label><input id="setHoursDays" value="${escapeHtml(s.restaurantHoursDays || "")}" /></div>
        <div class="field"><label for="setHoursText">Restaurant hours</label><input id="setHoursText" value="${escapeHtml(s.restaurantHoursText || "")}" /></div>
      </div>
      <div class="field"><label for="setMapQuery">Map search query</label><input id="setMapQuery" value="${escapeHtml(s.mapQuery || "")}" /></div>

      <h4>Homepage Copy (English)</h4>
      <div class="field"><label for="setTagline">Hero title</label><input id="setTagline" value="${escapeHtml(s.tagline || "")}" /></div>
      <div class="field"><label for="setAboutTitle">About title</label><input id="setAboutTitle" value="${escapeHtml(s.aboutTitle || "")}" /></div>
      <div class="field"><label for="setAboutText">About / hero text</label><textarea id="setAboutText" rows="4">${escapeHtml(s.aboutText || "")}</textarea></div>
      <p class="field-hint">These override the English homepage copy only — other languages keep their own translations.</p>

      <h4>Site Photos</h4>
      <div class="form-row">
        ${imagePickerHtml("setHeroImage", s.heroImage)}
        ${imagePickerHtml("setRestaurantImage", s.restaurantImage)}
      </div>
      <div class="form-row">
        ${imagePickerHtml("setAboutImage", s.aboutImage)}
        ${imagePickerHtml("setAboutFloatImage", s.aboutFloatImage)}
      </div>

      <div class="modal-error" id="settingsError"></div>
      <button type="submit" class="btn primary"><span class="material-symbols-outlined">save</span> Save Hotel Info</button>
      <span class="save-confirm" id="settingsSaved"></span>
    </form>
  `;
}

function wireSettingsPanel() {
  const form = document.getElementById("settingsForm");
  if (!form) return;

  ["setHeroImage", "setRestaurantImage", "setAboutImage", "setAboutFloatImage"].forEach((id) => wireImagePicker(form, id));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("settingsError");
    const savedEl = document.getElementById("settingsSaved");
    errorEl.textContent = "";
    savedEl.textContent = "";

    try {
      const imageFields = [
        ["setHeroImage", "heroImage"],
        ["setRestaurantImage", "restaurantImage"],
        ["setAboutImage", "aboutImage"],
        ["setAboutFloatImage", "aboutFloatImage"]
      ];

      const payload = {
        hotelName: form.querySelector("#setHotelName").value.trim(),
        phoneNumber: form.querySelector("#setPhone").value.trim(),
        address: form.querySelector("#setAddress").value.trim(),
        facebookUrl: form.querySelector("#setFacebook").value.trim(),
        restaurantHoursDays: form.querySelector("#setHoursDays").value.trim(),
        restaurantHoursText: form.querySelector("#setHoursText").value.trim(),
        mapQuery: form.querySelector("#setMapQuery").value.trim(),
        tagline: form.querySelector("#setTagline").value.trim(),
        aboutTitle: form.querySelector("#setAboutTitle").value.trim(),
        aboutText: form.querySelector("#setAboutText").value.trim()
      };

      for (const [inputId, field] of imageFields) {
        const file = form.querySelector(`#${inputId}`).files[0];
        if (file) payload[field] = await uploadImage(file);
      }

      state.settings = await apiFetch("/admin/settings", { method: "PUT", body: JSON.stringify(payload) });
      savedEl.textContent = "Saved.";
      setTimeout(() => { if (document.body.contains(savedEl)) savedEl.textContent = ""; }, 3000);
    } catch (err) {
      errorEl.textContent = err.message || "Something went wrong.";
    }
  });
}

/* ---------- Dashboard shell ---------- */

const TABS = [
  { key: "bookings", label: "Booking Requests" },
  { key: "inquiries", label: "Contact Messages" },
  { key: "rooms", label: "Rooms" },
  { key: "gallery", label: "Gallery" },
  { key: "amenities", label: "Amenities" },
  { key: "settings", label: "Hotel Info" }
];

function tabCount(key) {
  if (key === "bookings") return state.bookings.length;
  if (key === "inquiries") return state.inquiries.length;
  if (key === "rooms") return state.rooms.length;
  if (key === "gallery") return state.gallery.length;
  if (key === "amenities") return state.amenities.length;
  return null;
}

function renderPanel() {
  if (state.loading) return `<div class="loading-state">Loading…</div>`;
  switch (state.tab) {
    case "bookings":
    case "inquiries":
      return renderLeadsPanel(state.tab);
    case "rooms":
      return renderRoomsPanel();
    case "gallery":
      return renderGalleryPanel();
    case "amenities":
      return renderAmenitiesPanel();
    case "settings":
      return renderSettingsPanel();
    default:
      return "";
  }
}

function renderDashboard() {
  const app = document.getElementById("admin-app");

  app.innerHTML = `
    <div class="dash">
      <div class="dash-header">
        <div>
          <h1>Front Desk Dashboard</h1>
          <p>Manage bookings, messages, rooms, photos and site content.</p>
        </div>
        <div class="dash-actions">
          <button class="btn" id="refreshBtn"><span class="material-symbols-outlined">refresh</span> Refresh</button>
          <button class="btn logout" id="logoutBtn"><span class="material-symbols-outlined">logout</span> Sign Out</button>
        </div>
      </div>

      <div class="tabs">
        ${TABS.map((tab) => {
          const count = tabCount(tab.key);
          return `<button class="tab ${state.tab === tab.key ? "active" : ""}" data-tab="${tab.key}">
            ${tab.label} ${count !== null ? `<span class="count">${count}</span>` : ""}
          </button>`;
        }).join("")}
      </div>

      <div id="panelRoot">${renderPanel()}</div>
    </div>
    <div class="modal-overlay" id="modalRoot"></div>
  `;

  document.getElementById("refreshBtn").addEventListener("click", loadData);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  app.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      render();
    });
  });

  wirePanelEvents();
}

function wirePanelEvents() {
  const panel = document.getElementById("panelRoot");
  if (!panel) return;

  panel.querySelectorAll(".status-toggle").forEach((btn) => {
    btn.addEventListener("click", () => toggleLeadStatus(btn.dataset.kind, Number(btn.dataset.id), btn.dataset.status));
  });

  panel.querySelector("#addRoomBtn")?.addEventListener("click", () => openRoomModal());
  panel.querySelectorAll("[data-edit-room]").forEach((btn) =>
    btn.addEventListener("click", () => openRoomModal(state.rooms.find((r) => r.id === btn.dataset.editRoom)))
  );
  panel.querySelectorAll("[data-delete-room]").forEach((btn) =>
    btn.addEventListener("click", () => deleteRoom(btn.dataset.deleteRoom))
  );

  panel.querySelector("#addPhotoBtn")?.addEventListener("click", () => openGalleryModal());
  panel.querySelectorAll("[data-edit-gallery]").forEach((btn) =>
    btn.addEventListener("click", () => openGalleryModal(state.gallery.find((g) => g.id === btn.dataset.editGallery)))
  );
  panel.querySelectorAll("[data-delete-gallery]").forEach((btn) =>
    btn.addEventListener("click", () => deleteGalleryImage(btn.dataset.deleteGallery))
  );

  panel.querySelector("#addAmenityBtn")?.addEventListener("click", () => openAmenityModal());
  panel.querySelectorAll("[data-edit-amenity]").forEach((btn) =>
    btn.addEventListener("click", () => openAmenityModal(state.amenities.find((a) => a.id === btn.dataset.editAmenity)))
  );
  panel.querySelectorAll("[data-delete-amenity]").forEach((btn) =>
    btn.addEventListener("click", () => deleteAmenity(btn.dataset.deleteAmenity))
  );

  wireSettingsPanel();
}

function render() {
  if (!state.token) {
    renderLogin();
  } else {
    renderDashboard();
  }
}

if (state.token) {
  loadData();
} else {
  render();
}
