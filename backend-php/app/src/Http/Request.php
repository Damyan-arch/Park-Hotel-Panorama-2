<?php

namespace App\Http;

class Request
{
    public array $params = []; // filled in by the Router from {placeholders}
    private ?array $jsonBody = null;

    public function __construct(
        public readonly string $method,
        public readonly string $path
    ) {
    }

    // Mirrors Express's `req.body || {}` — a missing/invalid JSON body never
    // throws, callers just see an empty array.
    public function json(): array
    {
        if ($this->jsonBody !== null) return $this->jsonBody;
        $raw = file_get_contents('php://input');
        $decoded = $raw !== false ? json_decode($raw, true) : null;
        $this->jsonBody = is_array($decoded) ? $decoded : [];
        return $this->jsonBody;
    }

    public function param(string $name): ?string
    {
        return $this->params[$name] ?? null;
    }

    public function header(string $name): ?string
    {
        $key = 'HTTP_' . str_replace('-', '_', strtoupper($name));
        return $_SERVER[$key] ?? null;
    }

    public function bearerToken(): ?string
    {
        $header = $this->header('Authorization') ?? '';
        return str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;
    }
}
