<?php

namespace App\Repositories;

use App\Db\Database;

class BookingRepository
{
    // Ordered newest-first, matching the Node route's `[...bookings].reverse()`.
    public function all(): array
    {
        $stmt = Database::pdo()->query('SELECT * FROM booking_requests ORDER BY id DESC');
        return array_map([$this, 'toArray'], $stmt->fetchAll());
    }

    public function find(int $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM booking_requests WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $this->toArray($row);
    }

    public function existsByPaymentIntent(string $paymentIntentId): bool
    {
        $stmt = Database::pdo()->prepare('SELECT 1 FROM booking_requests WHERE payment_intent_id = ?');
        $stmt->execute([$paymentIntentId]);
        return $stmt->fetchColumn() !== false;
    }

    public function create(array $booking): array
    {
        $id = Database::insertReturningId(
            'INSERT INTO booking_requests (room_id, room_name, check_in, check_out, name, email, phone, nights, price_per_night, total_price, currency, payment_intent_id, deposit_amount, payment_status, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $booking['roomId'], $booking['roomName'], $booking['checkIn'], $booking['checkOut'],
                $booking['name'], $booking['email'], $booking['phone'],
                $booking['nights'] ?? null, $booking['pricePerNight'] ?? null,
                $booking['totalPrice'] ?? null, $booking['currency'] ?? null,
                $booking['paymentIntentId'] ?? null, $booking['depositAmount'] ?? null,
                $booking['paymentStatus'] ?? null,
                $booking['status'],
            ]
        );
        return $this->find((int) $id);
    }

    public function updateStatus(int $id, string $status): ?array
    {
        if ($this->find($id) === null) return null;
        $stmt = Database::pdo()->prepare('UPDATE booking_requests SET status = ? WHERE id = ?');
        $stmt->execute([$status, $id]);
        return $this->find($id);
    }

    public function updatePaymentStatus(int $id, string $paymentStatus): void
    {
        $stmt = Database::pdo()->prepare('UPDATE booking_requests SET payment_status = ? WHERE id = ?');
        $stmt->execute([$paymentStatus, $id]);
    }

    private function toArray(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'roomId' => $row['room_id'],
            'roomName' => $row['room_name'],
            'checkIn' => $row['check_in'],
            'checkOut' => $row['check_out'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            // Null for requests made before prices were recorded.
            'nights' => $row['nights'] === null ? null : (int) $row['nights'],
            'pricePerNight' => $row['price_per_night'] === null ? null : (float) $row['price_per_night'],
            'totalPrice' => $row['total_price'] === null ? null : (float) $row['total_price'],
            'currency' => $row['currency'],
            // Card deposit held at request time; null when none was taken.
            'paymentIntentId' => $row['payment_intent_id'],
            'depositAmount' => $row['deposit_amount'] === null ? null : (float) $row['deposit_amount'],
            'paymentStatus' => $row['payment_status'],
            'status' => $row['status'],
            'receivedAt' => $row['received_at'],
        ];
    }
}
