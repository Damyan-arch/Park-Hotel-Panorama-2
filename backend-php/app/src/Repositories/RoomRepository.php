<?php

namespace App\Repositories;

use App\Db\Database;
use App\Support\Uuid;

class RoomRepository
{
    public function all(): array
    {
        $stmt = Database::pdo()->query('SELECT * FROM rooms');
        return array_map([$this, 'toArray'], $stmt->fetchAll());
    }

    public function find(string $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM rooms WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $this->toArray($row);
    }

    // $room['id'] lets the data-migration script preserve legacy ids (matching
    // the precedent in Backend/data/seed.js); normal admin-created rooms omit
    // it and get a fresh UUID.
    public function create(array $room): array
    {
        $id = $room['id'] ?? Uuid::v4();
        $stmt = Database::pdo()->prepare(
            'INSERT INTO rooms (id, name, type, description, capacity, size_sqm, base_price_per_night, currency, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            json_encode((object) $room['name']),
            $room['type'],
            json_encode((object) $room['description']),
            $room['capacity'],
            $room['sizeSqm'],
            $room['basePricePerNight'],
            $room['currency'],
            $room['imageUrl'],
        ]);
        return $this->find($id);
    }

    // $patch may contain any subset of the mutable fields.
    public function update(string $id, array $patch): ?array
    {
        $existing = $this->find($id);
        if ($existing === null) return null;

        $columns = [
            'name' => fn($v) => json_encode((object) $v),
            'type' => fn($v) => $v,
            'description' => fn($v) => json_encode((object) $v),
            'capacity' => fn($v) => $v,
            'sizeSqm' => fn($v) => $v,
            'basePricePerNight' => fn($v) => $v,
            'currency' => fn($v) => $v,
            'imageUrl' => fn($v) => $v,
        ];
        $dbColumn = [
            'name' => 'name', 'type' => 'type', 'description' => 'description',
            'capacity' => 'capacity', 'sizeSqm' => 'size_sqm',
            'basePricePerNight' => 'base_price_per_night', 'currency' => 'currency', 'imageUrl' => 'image_url',
        ];

        $sets = [];
        $params = [];
        foreach ($patch as $field => $value) {
            if (!isset($columns[$field])) continue;
            $sets[] = $dbColumn[$field] . ' = ?';
            $params[] = $columns[$field]($value);
        }
        if (!$sets) return $existing;

        $params[] = $id;
        $stmt = Database::pdo()->prepare('UPDATE rooms SET ' . implode(', ', $sets) . ' WHERE id = ?');
        $stmt->execute($params);

        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = Database::pdo()->prepare('DELETE FROM rooms WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    private function toArray(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => json_decode($row['name'], true),
            'type' => $row['type'],
            'description' => json_decode($row['description'], true),
            'capacity' => (int) $row['capacity'],
            'sizeSqm' => (int) $row['size_sqm'],
            'basePricePerNight' => (float) $row['base_price_per_night'],
            'currency' => $row['currency'],
            'imageUrl' => $row['image_url'],
        ];
    }
}
