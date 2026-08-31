<?php

namespace App\Http;

class Response
{
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        // The CLI SAPI (only ever used by the test suite and database/*.php
        // scripts, never the real deployed app) has no real headers to send —
        // calling header() there errors the moment anything has echoed
        // already, which the test runner's own progress output always has.
        if (PHP_SAPI !== 'cli') {
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function noContent(): void
    {
        http_response_code(204);
    }

    public static function error(string $message, int $status = 400): void
    {
        self::json(['error' => $message], $status);
    }
}
