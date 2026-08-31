<?php

namespace App\Repositories;

use App\Db\Database;

class AdminSessionRepository
{
    public function create(string $token, string $expiresAt): void
    {
        $stmt = Database::pdo()->prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)');
        $stmt->execute([$token, $expiresAt]);
    }

    // Returns ['token' => ..., 'expiresAt' => <unix timestamp>] or null.
    public function find(string $token): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM admin_sessions WHERE token = ?');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if ($row === false) return null;
        return ['token' => $row['token'], 'expiresAt' => strtotime($row['expires_at'])];
    }

    public function delete(string $token): void
    {
        $stmt = Database::pdo()->prepare('DELETE FROM admin_sessions WHERE token = ?');
        $stmt->execute([$token]);
    }
}
