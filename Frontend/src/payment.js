import { state } from "./state.js";
import { API_BASE, escapeHtml } from "./dom-utils.js";
import { t } from "./i18n.js";

// Card deposit via Stripe, entered on a two-sided card (look based on a card
// design from Uiverse.io, by Jules-gitclerc).
//
//   front: cardholder name (our own input) + card number (Stripe field)
//   back:  expiry + CVV (Stripe fields)
//
// The card number, expiry and CVV live in iframes served by Stripe — they never
// touch our page's JS or our server, which is what keeps this out of PCI scope.
// We only handle the PaymentIntent that comes back. The cardholder name is a
// plain input of ours, sent to Stripe as the billing name.
//
// The inputs sit in an overlay layer on top of the card artwork, never inside
// the flipping faces: no transform, clipping, containment or perspective on any
// ancestor of a Stripe iframe. Browsers (Firefox especially) fail to paint /
// deliver clicks to cross-origin iframes inside such elements. The overlays are
// shown/hidden with opacity, not visibility, because a visibility:hidden field
// can't be focused — and focusing a back-side field is what flips the card.

const MASTERCARD_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 48 48" aria-hidden="true"><path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z"/><path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z"/><path fill="#ff3d00" d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48C20.376,15.05,18,19.245,18,24z"/></svg>`;

// The card number is drawn over a "0000 0000 0000 0000" mask (CSS ::before on
// #cardNumber): each typed digit hides the zero under it, the rest stay. Stripe's
// frame can't tell the page what — or how much — was typed, so the two layers
// are lined up instead: the same monospaced font, and every digit gets a solid
// outline in the card colour that blanks out the zero beneath it. The outline
// is wide enough to cover the zero even when the two layers sit a pixel apart
// (they're drawn separately, so at some zoom levels they don't line up exactly).
const NUMBER_FONT = 'ui-monospace, Menlo, Consolas, "Courier New", monospace';
const CARD_COLOR = "#1f2937";
// Copies of the digit shifted up to 2px in every direction: a crisp, opaque
// outline (a blurred halo has see-through edges the zero shows through).
const DIGIT_OUTLINE = (() => {
  const shadows = [];
  for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) shadows.push(`${x}px ${y}px 0 ${CARD_COLOR}`);
  return shadows.join(", ");
})();

export function renderPayCard() {
  return `
    <div class="pay-card" id="payCard">
      <div class="pay-card-faces">
        <div class="pay-card-front"></div>
        <div class="pay-card-back"></div>
      </div>
      <div class="pay-card-fields pay-card-fields--front">
        <div class="pay-card-row">
          <input class="pay-card-holder" id="cardHolder" name="cardHolder" type="text" autocomplete="cc-name" maxlength="60" placeholder="${escapeHtml(t("booking.cardHolder"))}" />
          <div class="pay-card-brand" id="payCardLogo">${MASTERCARD_LOGO}</div>
        </div>
        <div id="cardNumber" class="pay-card-input" data-loading="${escapeHtml(t("booking.cardLoading"))}"></div>
      </div>
      <div class="pay-card-fields pay-card-fields--back">
        <div class="pay-card-row">
          <div id="cardExpiry" class="pay-card-input"></div>
          <div id="cardCvc" class="pay-card-input"></div>
        </div>
        <button type="button" class="pay-card-flip" id="payCardFlip">↺ ${t("booking.cardFront")}</button>
      </div>
    </div>`;
}

function setCardBrand(brand) {
  const box = document.getElementById("payCardLogo");
  if (!box) return;
  if (brand === "mastercard") box.innerHTML = MASTERCARD_LOGO;
  else if (brand && brand !== "unknown") box.innerHTML = `<span class="pay-card-brand-name">${escapeHtml(brand.toUpperCase())}</span>`;
  else box.innerHTML = MASTERCARD_LOGO; // the design's default, until a brand is recognised
}

let config = null; // null until loaded; { enabled: false } when payments are off or unreachable
let loading = null;
let stripe = null;
let cardNumber = null; // the element passed to confirmCardPayment; expiry/CVV elements are found by Stripe automatically
let cardParts = [];
let loadTimer = null; // "taking too long" timer of the most recent mount
let cardFailed = false; // true while the embedded card field can't be used in this browser

// When the embedded card field can't load (strict tracking protection, an
// extension, a VPN...), the guest pays on Stripe's own page instead.
export function isCardFailed() {
  return cardFailed;
}

function setFallbackVisible(visible) {
  const btn = document.getElementById("payViaStripe");
  if (btn) btn.hidden = !visible;
}

// Re-applied after every render, since the widget redraws its whole DOM.
export function syncFallbackButton() {
  setFallbackVisible(cardFailed);
}

export function getPaymentConfig() {
  return config;
}

function loadStripeJs() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) return resolve(window.Stripe);
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => resolve(window.Stripe);
    script.onerror = () => reject(new Error("Stripe.js failed to load"));
    document.head.appendChild(script);
  });
}

// Stripe.js (plus the fraud-detection scripts it pulls in — over 80 extra
// requests) is only fetched once the card is about to be used, so it doesn't
// slow down the page load for visitors who never reach the booking form.
let stripeReady = null;
function ensureStripe() {
  if (!stripeReady) {
    stripeReady = loadStripeJs().then((Stripe) => (stripe = Stripe(config.publishableKey)));
    stripeReady.catch(() => (stripeReady = null)); // allow a retry on the next render
  }
  return stripeReady;
}

function showCardMessage(text) {
  const el = document.getElementById("cardError");
  if (el) el.textContent = text;
}

// "Couldn't load the card field" + why. The reason is logged for everyone but
// only shown on the page in the dev build, to make problems on a visitor's
// machine (blockers, VPN, network) easy to diagnose locally.
function cardLoadFailed(why, err) {
  cardFailed = true;
  setFallbackVisible(true);
  const detail = err && err.message ? ": " + err.message : "";
  console.warn("[payment] card field failed:", why, err || "");
  showCardMessage(t("booking.cardLoadFailed") + (import.meta.env.DEV ? ` [${why}${detail}]` : ""));
}

// Called after every render of the widget. Mounts the card straight away when
// Stripe is already loaded, otherwise waits until the card is near the viewport.
export function mountCardWhenVisible() {
  const target = document.getElementById("payCard");
  if (!target) return;
  if (stripe) return mountCard();

  const go = () =>
    ensureStripe().then(
      () => {
        try {
          mountCard();
        } catch (err) {
          cardLoadFailed("mount", err);
        }
      },
      (err) => cardLoadFailed("script", err)
    );
  if (!("IntersectionObserver" in window)) return go();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      go();
    },
    { rootMargin: "300px" }
  );
  io.observe(target);
}

export function loadPayment() {
  if (!loading) {
    loading = (async () => {
      try {
        const res = await fetch(`${API_BASE}/payment-config`);
        const data = await res.json();
        if (!res.ok || !data.enabled) return (config = { enabled: false });
        return (config = data);
      } catch {
        return (config = { enabled: false });
      }
    })();
  }
  return loading;
}

// The guest turned "pay online" off: drop the card fields and the pending
// "taking too long" timer, so it can't report a failure for a card that's gone.
export function unmountCard() {
  clearTimeout(loadTimer);
  cardParts.forEach((part) => part.destroy());
  cardParts = [];
  cardNumber = null;
}

// The widget re-renders its whole DOM on every calendar/room change, so the
// card fields are rebuilt each time — anything typed into them is lost then,
// like the other form fields.
export function mountCard() {
  if (!stripe || !document.getElementById("cardNumber")) return;
  cardParts.forEach((part) => part.destroy());

  const elements = stripe.elements({ locale: state.lang });
  const style = {
    base: {
      fontFamily: "Manrope, 'Segoe UI', sans-serif",
      fontSize: "14px",
      fontWeight: "600",
      color: "#ffffff",
      "::placeholder": { color: "#9ca3af" }
    },
    invalid: { color: "#ff8f80" }
  };
  const numberStyle = { ...style, base: { ...style.base, fontFamily: NUMBER_FONT, letterSpacing: "0px", textShadow: DIGIT_OUTLINE } };
  cardNumber = elements.create("cardNumber", { style: numberStyle, showIcon: false, disableLink: true, placeholder: " " });
  const expiry = elements.create("cardExpiry", { style, placeholder: t("booking.expiryPlaceholder") });
  const cvc = elements.create("cardCvc", { style, placeholder: "CVV" });
  cardNumber.mount("#cardNumber");
  expiry.mount("#cardExpiry");
  cvc.mount("#cardCvc");
  cardParts = [cardNumber, expiry, cvc];

  // The number field shows a "loading" hint until Stripe's frame is ready, and
  // a message if that takes unreasonably long (slow network, blocked scripts).
  clearTimeout(loadTimer); // a previous render's timer must not report on this mount
  loadTimer = setTimeout(() => cardLoadFailed("timeout"), 20000);
  cardNumber.on("ready", () => {
    clearTimeout(loadTimer);
    cardFailed = false;
    setFallbackVisible(false);
    document.getElementById("cardNumber")?.classList.add("is-ready");
    if (document.getElementById("cardError")?.textContent.startsWith(t("booking.cardLoadFailed"))) showCardMessage("");
  });
  // Stripe reports element-level load problems here.
  cardNumber.on("loaderror", (e) => cardLoadFailed("loaderror", e.error));

  // Front first, then spin. The card only turns to the back (expiry + CVV) once
  // the front is done — a cardholder name AND a complete number, in whichever
  // order they're entered. Until then the focus stays on the front, on
  // whichever of the two is still missing.
  const holder = document.getElementById("cardHolder");
  let numberComplete = false;
  const frontDone = () => numberComplete && !!holder?.value.trim();
  const focusMissingFront = () => {
    if (!holder || holder.value.trim()) return cardNumber.focus();
    // Firefox won't move focus out of Stripe's frame straight to a page
    // element; release it from the Stripe field first.
    cardNumber.blur();
    setTimeout(() => holder.focus(), 0);
  };

  holder?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey && frontDone())) {
      e.preventDefault(); // Enter must not submit the booking from here
      if (frontDone()) expiry.focus();
      else cardNumber.focus();
    }
  });
  cardNumber.on("change", (e) => {
    // The zero mask goes away once the number is finished — complete, or full
    // length but invalid (Stripe then reports an error and shows it in red).
    document.getElementById("cardNumber")?.classList.toggle("is-complete", !!e.complete || !!e.error);
    setCardBrand(e.brand);
    const justCompleted = e.complete && !numberComplete;
    numberComplete = !!e.complete;
    if (justCompleted) {
      if (frontDone()) expiry.focus();
      else focusMissingFront();
    }
  });
  expiry.on("change", (e) => e.complete && cvc.focus());

  // The card shows its back while the expiry or CVV has focus, its front
  // otherwise. Reaching the back early (e.g. tabbing past an incomplete
  // number) sends the focus back to what's missing on the front.
  const payCard = () => document.getElementById("payCard");
  const showBack = (back) => payCard()?.classList.toggle("flipped", back);
  const onBackFocus = () => {
    if (!frontDone()) return focusMissingFront();
    showBack(true);
  };
  holder?.addEventListener("focus", () => showBack(false));
  cardNumber.on("focus", () => showBack(false));
  expiry.on("focus", onBackFocus);
  cvc.on("focus", onBackFocus);
  document.getElementById("payCardFlip")?.addEventListener("click", () => cardNumber.focus());

  // Each element reports its own error; show the first one that has one.
  const errors = [];
  cardParts.forEach((part, i) =>
    part.on("change", (e) => {
      errors[i] = e.error ? e.error.message : "";
      const el = document.getElementById("cardError");
      if (el) el.textContent = errors.find(Boolean) || "";
    })
  );
}

export function getCardHolder() {
  // Shown in capitals on the card, and sent to Stripe the same way.
  return (document.getElementById("cardHolder")?.value.trim() || "").toUpperCase();
}

// Brings the cardholder field into view on the front of the card.
export function focusCardHolder() {
  document.getElementById("payCard")?.classList.remove("flipped");
  document.getElementById("cardHolder")?.focus();
}

// Asks the server for a deposit PaymentIntent (it works out the amount itself),
// then has Stripe place the hold on the card. Resolves to the PaymentIntent id.
export async function holdDeposit({ roomId, checkIn, checkOut, name, email }) {
  if (!stripe || !cardNumber) throw new Error("The card field is not ready yet.");
  const res = await fetch(`${API_BASE}/payment-intents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, checkIn, checkOut })
  });
  const intent = await res.json();
  if (!res.ok) throw new Error(intent.error || "Could not start the payment.");

  const { error, paymentIntent } = await stripe.confirmCardPayment(intent.clientSecret, {
    payment_method: { card: cardNumber, billing_details: { name, email } }
  });
  if (error) {
    const err = new Error(error.message);
    err.expose = true; // Stripe's message is localised and meant for the guest
    throw err;
  }
  if (paymentIntent.status !== "requires_capture") throw new Error("Deposit was not authorised.");
  return paymentIntent.id;
}

// Fallback: send the guest to a Stripe-hosted page for the same 30% hold. The
// server builds the session from its own price for the room and dates; the
// booking is only created when they come back paid (see finishCheckoutReturn).
export async function startCheckout({ roomId, roomName, checkIn, checkOut, name, email, phone }) {
  const res = await fetch(`${API_BASE}/checkout-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, roomName, checkIn, checkOut, name, email, phone, lang: state.lang })
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || "Could not start the payment.");
  window.location.assign(data.url);
}

// Stripe sends the guest back to /?booking_session=cs_... after paying. Returns
// null when this page load isn't such a return; otherwise { ok, message }.
let returnHandled = false;
export async function finishCheckoutReturn() {
  if (returnHandled) return null;
  const sessionId = new URLSearchParams(window.location.search).get("booking_session");
  if (!sessionId) return null;
  returnHandled = true;
  try {
    const res = await fetch(`${API_BASE}/bookings/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "failed");
    // Drop the session id so a refresh doesn't try to complete it again.
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    return { ok: true, message: data.message };
  } catch {
    return { ok: false };
  }
}
