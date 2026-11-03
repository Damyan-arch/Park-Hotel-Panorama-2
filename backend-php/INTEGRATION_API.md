# Park Hotel Panorama — Booking Integration API (v1)

This API lets a hotel system (e.g. Zamboo) read the booking requests guests
send through **parkhotelpanorama.com**, and optionally update their status.

- **Base URL:** `https://parkhotelpanorama.com/api/integration/v1`
- **Format:** JSON (UTF-8) in both directions
- **Times:** ISO 8601, always UTC (`2026-10-26T12:00:00Z`)
- **Dates:** `YYYY-MM-DD`

## Important: these are requests, not confirmed reservations

A booking on the website is a **request**. The guest picks a room type and
dates, and hotel staff then confirm or decline it. The website does not track
availability or assign physical rooms, so:

- `roomId` / `roomName` is a **room type** (e.g. "Double room with balcony"),
  not a room number.
- A request may overlap with other reservations. Checking availability is up to
  the hotel system.
- The guest gives how many adults, children and babies are staying. Guest
  notes and children's exact ages are not collected.

## Authentication

Every request must carry the API key the hotel gave you:

```
Authorization: Bearer <API key>
```

A missing or wrong key returns `401`. The key is a secret: only call the API
server-side, over HTTPS. Never put the key in a browser or mobile app. If the
key leaks, ask the hotel to issue a new one.

## Polling

There are no webhooks in v1. Poll `GET /bookings` with a cursor (see
[Recommended sync](#recommended-sync)), **at most once every 5 minutes**. The
website runs on shared hosting with a CPU budget.

---

## Endpoints

### `GET /bookings` — changes feed

Returns bookings that were **created or changed** (status or payment) since
your cursor. The oldest change comes first.

| Query param | Required | Description |
|---|---|---|
| `cursor` | no | The `nextCursor` from your previous call. Omit it on the very first call to get every booking from the beginning. |
| `limit` | no | Page size, 1–500. Default 100. |

Response `200`:

```json
{
  "bookings": [ { …booking… }, … ],
  "nextCursor": "2026-10-26T12:00:00Z_42",
  "hasMore": false
}
```

- **`nextCursor`**: store it and send it back on your next call. Treat it as an
  opaque string. If there were no changes, it comes back unchanged. It is
  `null` only when you sent no cursor and there are no bookings at all.
- **`hasMore`**: `true` means another page is ready. Call again with the new
  cursor right away.
- **Upsert by `id`.** The same booking appears again every time it changes,
  e.g. when staff reject it. Update your copy; don't create a duplicate.
- Changes from the last second are held back until the next call, so nothing
  is ever skipped.

### `GET /bookings/{id}` — one booking

Response `200`: a booking object (below). `404` if there is no such booking.

### `PATCH /bookings/{id}` — set the status (optional)

```json
{ "status": "contacted" }
```

`status` must be `new`, `contacted` or `rejected`, the same statuses staff
set in the website's admin panel. Response `200`: the updated booking. Only
use this if you've agreed with the hotel when the hotel system should change
the status. Staff use these statuses in their daily work.

### `GET /rooms` — room types

Lists the website's room types, so you can map each `roomId` to a room type in
your system once.

```json
[
  {
    "id": "8f0c6a52-1d2e-4c35-9b7a-3f6e1c2d4a10",
    "name": { "bg": "Двойна стая", "en": "Double room", "de": "…", "es": "…", "ro": "…" },
    "type": "DOUBLE",
    "capacity": 2,
    "basePricePerNight": 50,
    "currency": "EUR"
  }
]
```

---

## The booking object

```json
{
  "id": 42,
  "status": "new",
  "roomId": "8f0c6a52-1d2e-4c35-9b7a-3f6e1c2d4a10",
  "roomName": "Двойна стая",
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-12",
  "nights": 2,
  "adults": 2,
  "children": 1,
  "babies": 0,
  "guest": {
    "name": "Ivan Petrov",
    "email": "ivan@example.com",
    "phone": "+359 88 123 4567"
  },
  "pricePerNight": 50,
  "totalPrice": 100,
  "currency": "EUR",
  "depositAmount": 30,
  "paymentStatus": "authorized",
  "receivedAt": "2026-10-26T11:58:31Z",
  "updatedAt": "2026-10-26T11:58:31Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Stable, unique. Use it as the external reference. |
| `status` | string | `new` = not yet handled by staff · `contacted` = staff have handled it / contacted the guest · `rejected` = declined |
| `roomId` | string or null | Room type id (see `GET /rooms`). `null` if that room type was later deleted from the website. |
| `roomName` | string | Room type name as the guest saw it. |
| `checkIn`, `checkOut` | date | Arrival and departure dates. |
| `nights` | integer or null | `null` on old requests made before prices were recorded. |
| `adults` | integer or null | Guests aged 18+. At least 1. All three counts are `null` on old requests made before guests were asked for. |
| `children` | integer or null | Guests aged 4–17. `adults + children` is at most the room type's `capacity`. |
| `babies` | integer or null | Guests aged 0–3, up to 2. Not counted against `capacity` (they sleep in a cot). |
| `guest.name`, `guest.email` | string | Always present. |
| `guest.phone` | string or null | |
| `pricePerNight`, `totalPrice` | number or null | The price quoted to the guest. `null` on old requests. |
| `currency` | string or null | e.g. `EUR`. |
| `depositAmount` | number or null | Deposit asked for. `null` = no deposit. |
| `paymentStatus` | string or null | See below. |
| `receivedAt` | datetime | When the guest sent the request. |
| `updatedAt` | datetime | Last change. |

`paymentStatus` values:

| Value | Meaning |
|---|---|
| `null` | No deposit was taken. |
| `authorized` | Card deposit is held on the guest's card, not yet charged. |
| `captured` | Card deposit was charged. |
| `canceled` | Card hold was released by the hotel. |
| `expired` | Card hold expired without being charged. |
| `awaiting_transfer` | Guest chose to pay the deposit by bank transfer; not yet received. |
| `transfer_received` | Hotel confirmed the bank transfer arrived. |

New fields may be added to these objects later. Ignore fields you don't know.
Existing fields won't be removed or changed within v1.

## Errors

Errors return a JSON body `{ "error": "<message>" }` with:

| Status | When |
|---|---|
| `400` | Bad `cursor`, `limit` or `status`. |
| `401` | Missing or wrong API key. |
| `404` | Unknown booking id or path. |
| `500` | Server problem. Retry later with the same cursor. |

## Recommended sync

```
cursor = load_saved_cursor()            # null the first time
loop every 5 minutes:
    do:
        page = GET /bookings?cursor={cursor}&limit=100
        for booking in page.bookings:
            upsert booking by booking.id   # new request, or status/payment change
        cursor = page.nextCursor
        save_cursor(cursor)               # only after the page is stored
    while page.hasMore
```

Example call:

```
curl -H "Authorization: Bearer $API_KEY" \
  "https://parkhotelpanorama.com/api/integration/v1/bookings?limit=100"
```
