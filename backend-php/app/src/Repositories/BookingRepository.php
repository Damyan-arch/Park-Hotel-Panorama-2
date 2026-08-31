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

    public function create(array $booking): array
    {
        $id = Database::insertReturningId(
            'INSERT INTO booking_requests (room_id, room_name, check_in, check_out, name, email, phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $booking['roomId'], $booking['roomName'], $booking['checkIn'], $booking['checkOut'],
                $booking['name'], $booking['email'], $booking['phone'], $booking['status'],
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
            'status' => $row['status'],
            'receivedAt' => $row['received_at'],
        ];
    }
}
