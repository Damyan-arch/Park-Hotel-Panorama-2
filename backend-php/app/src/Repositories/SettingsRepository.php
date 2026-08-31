<?php

namespace App\Repositories;

use App\Db\Database;

class SettingsRepository
{
    private const ID = 1;

    public function get(): array
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT data FROM settings WHERE id = ?');
        $stmt->execute([self::ID]);
        $row = $stmt->fetch();

        if ($row === false) {
            $stmt = $pdo->prepare('INSERT INTO settings (id, data) VALUES (?, ?)');
            $stmt->execute([self::ID, json_encode((object) [])]);
            return [];
        }

        return json_decode($row['data'], true) ?? [];
    }

    public function update(array $patch): array
    {
        $merged = array_merge($this->get(), $patch);

        $pdo = Database::pdo();
        if (Database::driver() === 'mysql') {
            $stmt = $pdo->prepare(
                'INSERT INTO settings (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)'
            );
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO settings (id, data) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data'
            );
        }
        $stmt->execute([self::ID, json_encode((object) $merged)]);

        return $merged;
    }
}
