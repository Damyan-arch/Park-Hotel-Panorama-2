<?php

namespace App\Repositories;

use App\Db\Database;
use App\Support\Uuid;

class GalleryRepository
{
    // Sorted by sort_order to match the Node route's `.sort((a,b) => a.sortOrder - b.sortOrder)`.
    public function all(): array
    {
        $stmt = Database::pdo()->query('SELECT * FROM gallery_images ORDER BY sort_order ASC');
        return array_map([$this, 'toArray'], $stmt->fetchAll());
    }

    public function count(): int
    {
        return (int) Database::pdo()->query('SELECT COUNT(*) FROM gallery_images')->fetchColumn();
    }

    public function find(string $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM gallery_images WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $this->toArray($row);
    }

    // $image['id'] lets the data-migration script preserve legacy ids.
    public function create(array $image): array
    {
        $id = $image['id'] ?? Uuid::v4();
        $stmt = Database::pdo()->prepare(
            'INSERT INTO gallery_images (id, image_url, alt, sort_order) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$id, $image['imageUrl'], $image['alt'], $image['sortOrder']]);
        return $this->find($id);
    }

    public function update(string $id, array $patch): ?array
    {
        if ($this->find($id) === null) return null;

        $dbColumn = ['imageUrl' => 'image_url', 'alt' => 'alt', 'sortOrder' => 'sort_order'];
        $sets = [];
        $params = [];
        foreach ($patch as $field => $value) {
            if (!isset($dbColumn[$field])) continue;
            $sets[] = $dbColumn[$field] . ' = ?';
            $params[] = $value;
        }
        if ($sets) {
            $params[] = $id;
            $stmt = Database::pdo()->prepare('UPDATE gallery_images SET ' . implode(', ', $sets) . ' WHERE id = ?');
            $stmt->execute($params);
        }

        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = Database::pdo()->prepare('DELETE FROM gallery_images WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    private function toArray(array $row): array
    {
        return [
            'id' => $row['id'],
            'imageUrl' => $row['image_url'],
            'alt' => $row['alt'],
            'sortOrder' => (int) $row['sort_order'],
        ];
    }
}
