<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\BookingRepository;
use App\Repositories\RoomRepository;

// /api/integration/v1/* — the API Mistral's Zamboo (hotel PMS) calls to pull
// booking requests made on the website. Documented for them in
// INTEGRATION_API.md; field names and shapes here are a contract with an
// outside system, so change them only by adding a v2.
class IntegrationController
{
    private const DEFAULT_LIMIT = 100;
    private const MAX_LIMIT = 500;

    // Cursor is "<updatedAt ISO>_<id>", e.g. "2026-10-26T12:00:00Z_42" —
    // documented as opaque, but readable for anyone debugging it.
    private const CURSOR_PATTERN = '/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})Z_(\d+)$/';

    public function bookings(Request $request): void
    {
        $limit = $request->query('limit') ?? (string) self::DEFAULT_LIMIT;
        if (!ctype_digit($limit) || (int) $limit < 1 || (int) $limit > self::MAX_LIMIT) {
            Response::error('limit must be a whole number from 1 to ' . self::MAX_LIMIT . '.');
            return;
        }
        $limit = (int) $limit;

        $cursor = $request->query('cursor');
        $since = null;
        $afterId = 0;
        if ($cursor !== null && $cursor !== '') {
            if (!preg_match(self::CURSOR_PATTERN, $cursor, $m)) {
                Response::error('Invalid cursor — pass back nextCursor exactly as received.');
                return;
            }
            $since = "$m[1] $m[2]";
            $afterId = (int) $m[3];
        }

        // One extra row tells us whether another page follows.
        $rows = (new BookingRepository())->changedSince($since, $afterId, gmdate('Y-m-d H:i:s'), $limit + 1);
        $hasMore = count($rows) > $limit;
        $rows = array_slice($rows, 0, $limit);

        $bookings = array_map([$this, 'format'], $rows);
        $last = end($bookings);
        Response::json([
            'bookings' => $bookings,
            // Unchanged when nothing new — the caller just keeps using it.
            'nextCursor' => $last ? $last['updatedAt'] . '_' . $last['id'] : ($cursor ?: null),
            'hasMore' => $hasMore,
        ]);
    }

    public function booking(Request $request): void
    {
        $booking = (new BookingRepository())->find((int) $request->param('id'));
        if ($booking === null) {
            Response::error('Booking not found.', 404);
            return;
        }
        Response::json($this->format($booking));
    }

    // Lets Zamboo mark a request as handled ("contacted") or "rejected" — the
    // same statuses, with the same meaning, as the buttons in our admin panel.
    public function updateBookingStatus(Request $request): void
    {
        $status = $request->json()['status'] ?? null;
        if (!in_array($status, BookingRepository::STATUSES, true)) {
            Response::error('status must be one of: ' . implode(', ', BookingRepository::STATUSES) . '.');
            return;
        }

        $booking = (new BookingRepository())->updateStatus((int) $request->param('id'), $status);
        if ($booking === null) {
            Response::error('Booking not found.', 404);
            return;
        }
        Response::json($this->format($booking));
    }

    // Room types, so Zamboo can map our roomId to its own rooms once.
    public function rooms(Request $request): void
    {
        Response::json(array_map(fn($room) => [
            'id' => $room['id'],
            'name' => $room['name'],
            'type' => $room['type'],
            'capacity' => $room['capacity'],
            'basePricePerNight' => $room['basePricePerNight'],
            'currency' => $room['currency'],
        ], (new RoomRepository())->all()));
    }

    // Our internal Stripe ids stay out; timestamps go out as ISO 8601 UTC.
    private function format(array $booking): array
    {
        return [
            'id' => $booking['id'],
            'status' => $booking['status'],
            'roomId' => $booking['roomId'],
            'roomName' => $booking['roomName'],
            'checkIn' => $booking['checkIn'],
            'checkOut' => $booking['checkOut'],
            'nights' => $booking['nights'],
            'adults' => $booking['adults'],
            'children' => $booking['children'],
            'babies' => $booking['babies'],
            'guest' => [
                'name' => $booking['name'],
                'email' => $booking['email'],
                'phone' => $booking['phone'],
            ],
            'pricePerNight' => $booking['pricePerNight'],
            'totalPrice' => $booking['totalPrice'],
            'currency' => $booking['currency'],
            'depositAmount' => $booking['depositAmount'],
            'paymentStatus' => $booking['paymentStatus'],
            'receivedAt' => self::isoUtc($booking['receivedAt']),
            'updatedAt' => self::isoUtc($booking['updatedAt']),
        ];
    }

    // DB values are UTC (Database::init forces the session time zone): MySQL
    // gives "2026-10-26 12:00:00", Postgres "2026-10-26 12:00:00+00".
    private static function isoUtc(string $value): string
    {
        $utc = new \DateTimeZone('UTC');
        return (new \DateTimeImmutable($value, $utc))->setTimezone($utc)->format('Y-m-d\TH:i:s\Z');
    }
}
