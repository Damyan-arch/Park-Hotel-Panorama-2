<?php

namespace App\Repositories;

use App\Db\Database;
use App\Support\Uuid;

class EventRepository
{
    // Sorted by date to match the Node route's `.sort((a,b) => new Date(a.date) - new Date(b.date))`.
    public function all(): array
    {
        $stmt = Database::pdo()->query('SELECT * FROM events ORDER BY date ASC');
        return array_map([$this, 'toArray'], $stmt->fetchAll());
    }

    public function find(string $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $this->toArray($row);
    }

    // $event['id'] lets the data-migration script preserve legacy ids.
    public function create(array $event): array
    {
        $id = $event['id'] ?? Uuid::v4();
        $stmt = Database::pdo()->prepare(
            'INSERT INTO events (id, title, date, time, description, image_url, info_url, gallery)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            json_encode((object) $event['title']),
            $event['date'],
            $event['time'],
            json_encode((object) $event['description']),
            $event['imageUrl'],
            $event['infoUrl'],
            self::encodeGallery($event['gallery'] ?? []),
        ]);
        return $this->find($id);
    }

    public function update(string $id, array $patch): ?array
    {
        if ($this->find($id) === null) return null;

        $dbColumn = [
            'title' => 'title', 'date' => 'date', 'time' => 'time',
            'description' => 'description', 'imageUrl' => 'image_url', 'infoUrl' => 'info_url',
            'gallery' => 'gallery',
        ];
        $jsonFields = ['title', 'description'];

        $sets = [];
        $params = [];
        foreach ($patch as $field => $value) {
            if (!isset($dbColumn[$field])) continue;
            $sets[] = $dbColumn[$field] . ' = ?';
            if ($field === 'gallery') {
                $params[] = self::encodeGallery($value);
            } else {
                $params[] = in_array($field, $jsonFields, true) ? json_encode((object) $value) : $value;
            }
        }
        if ($sets) {
            $params[] = $id;
            $stmt = Database::pdo()->prepare('UPDATE events SET ' . implode(', ', $sets) . ' WHERE id = ?');
            $stmt->execute($params);
        }

        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = Database::pdo()->prepare('DELETE FROM events WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    // Always a JSON *array* of image paths — the (object) cast used for the
    // localized fields would rewrite a list as {"0": "...", "1": "..."}.
    private static function encodeGallery($gallery): string
    {
        $urls = array_values(array_filter(
            array_map('strval', is_array($gallery) ? $gallery : []),
            static fn ($url) => $url !== ''
        ));
        return json_encode($urls);
    }

    private function toArray(array $row): array
    {
        return [
            'id' => $row['id'],
            'title' => json_decode($row['title'], true),
            'date' => $row['date'],
            'time' => $row['time'],
            'description' => json_decode($row['description'], true),
            'imageUrl' => $row['image_url'],
            'infoUrl' => $row['info_url'],
            // The column is nullable on MySQL (no DEFAULT allowed on JSON), so
            // rows created before the gallery migration decode to null.
            'gallery' => json_decode($row['gallery'] ?? '[]', true) ?: [],
        ];
    }
}
