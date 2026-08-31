<?php

namespace App\Repositories;

use App\Db\Database;
use App\Support\Uuid;

class AmenityRepository
{
    public function all(): array
    {
        $stmt = Database::pdo()->query('SELECT * FROM amenities');
        return array_map([$this, 'toArray'], $stmt->fetchAll());
    }

    public function find(string $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM amenities WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $this->toArray($row);
    }

    // $amenity['id'] lets the data-migration script preserve legacy ids.
    public function create(array $amenity): array
    {
        $id = $amenity['id'] ?? Uuid::v4();
        $stmt = Database::pdo()->prepare(
            'INSERT INTO amenities (id, icon, title, text, under_maintenance) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $amenity['icon'],
            json_encode((object) $amenity['title']),
            json_encode((object) $amenity['text']),
            $amenity['underMaintenance'] ? 1 : 0,
        ]);
        return $this->find($id);
    }

    public function update(string $id, array $patch): ?array
    {
        if ($this->find($id) === null) return null;

        $dbColumn = ['icon' => 'icon', 'title' => 'title', 'text' => 'text', 'underMaintenance' => 'under_maintenance'];
        $jsonFields = ['title', 'text'];

        $sets = [];
        $params = [];
        foreach ($patch as $field => $value) {
            if (!isset($dbColumn[$field])) continue;
            $sets[] = $dbColumn[$field] . ' = ?';
            if (in_array($field, $jsonFields, true)) {
                $params[] = json_encode((object) $value);
            } elseif ($field === 'underMaintenance') {
                $params[] = $value ? 1 : 0;
            } else {
                $params[] = $value;
            }
        }
        if ($sets) {
            $params[] = $id;
            $stmt = Database::pdo()->prepare('UPDATE amenities SET ' . implode(', ', $sets) . ' WHERE id = ?');
            $stmt->execute($params);
        }

        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = Database::pdo()->prepare('DELETE FROM amenities WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    private function toArray(array $row): array
    {
        return [
            'id' => $row['id'],
            'icon' => $row['icon'],
            'title' => json_decode($row['title'], true),
            'text' => json_decode($row['text'], true),
            'underMaintenance' => (bool) $row['under_maintenance'],
        ];
    }
}
