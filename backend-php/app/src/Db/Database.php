<?php

namespace App\Db;

use PDO;

class Database
{
    private static ?PDO $pdo = null;
    private static string $driver = 'pgsql';

    public static function init(array $config): void
    {
        self::$driver = $config['driver'] ?? 'pgsql';
        $dsn = self::$driver === 'mysql'
            ? "mysql:host={$config['host']};port={$config['port']};dbname={$config['name']};charset=utf8mb4"
            : "pgsql:host={$config['host']};port={$config['port']};dbname={$config['name']}";

        self::$pdo = new PDO($dsn, $config['user'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        // The app writes naive UTC datetime strings (gmdate(), no offset) into
        // timestamptz columns — e.g. AdminAuth's session expiry. Without this,
        // Postgres interprets those naive strings using ITS OWN session
        // timezone default (confirmed non-UTC here: Europe/Kiev), silently
        // shifting every stored timestamp by the server's UTC offset.
        if (self::$driver === 'mysql') {
            self::$pdo->exec("SET time_zone = '+00:00'");
        } else {
            self::$pdo->exec("SET TIME ZONE 'UTC'");
        }
    }

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            throw new \RuntimeException('Database::init() must be called before Database::pdo().');
        }
        return self::$pdo;
    }

    public static function driver(): string
    {
        return self::$driver;
    }

    // Postgres needs `RETURNING id`; MySQL uses lastInsertId() — isolated here
    // so repositories don't need their own driver branches.
    public static function insertReturningId(string $sql, array $params): string
    {
        $pdo = self::pdo();
        if (self::$driver === 'mysql') {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return (string) $pdo->lastInsertId();
        }
        $stmt = $pdo->prepare($sql . ' RETURNING id');
        $stmt->execute($params);
        return (string) $stmt->fetchColumn();
    }
}
