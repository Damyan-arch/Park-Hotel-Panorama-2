<?php

namespace App\Repositories;

use App\Db\Database;

class InquiryRepository
{
    // Ordered newest-first, matching the Node route's `[...inquiries].reverse()`.
    public function all(): array
    {
        $stmt = Database::pdo()->query('SELECT * FROM contact_inquiries ORDER BY id DESC');
        return array_map([$this, 'toArray'], $stmt->fetchAll());
    }

    public function find(int $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM contact_inquiries WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $this->toArray($row);
    }

    public function create(array $inquiry): array
    {
        $id = Database::insertReturningId(
            'INSERT INTO contact_inquiries (name, email, phone, room_name, message, status)
             VALUES (?, ?, ?, ?, ?, ?)',
            [
                $inquiry['name'], $inquiry['email'], $inquiry['phone'],
                $inquiry['roomName'], $inquiry['message'], $inquiry['status'],
            ]
        );
        return $this->find((int) $id);
    }

    public function updateStatus(int $id, string $status): ?array
    {
        if ($this->find($id) === null) return null;
        $stmt = Database::pdo()->prepare('UPDATE contact_inquiries SET status = ? WHERE id = ?');
        $stmt->execute([$status, $id]);
        return $this->find($id);
    }

    private function toArray(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'roomName' => $row['room_name'],
            'message' => $row['message'],
            'status' => $row['status'],
            'receivedAt' => $row['received_at'],
        ];
    }
}
