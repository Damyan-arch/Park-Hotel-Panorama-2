<?php

namespace App\Auth;

use App\Http\Request;
use App\Repositories\AdminSessionRepository;

class AdminAuth
{
    private const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours, matches the Node backend

    private static array $emails = [];
    private static string $password = '';

    public static function init(array $adminConfig): void
    {
        self::$emails = array_filter(array_map(
            fn($e) => strtolower(trim($e)),
            explode(',', $adminConfig['emails'] ?? '')
        ));
        self::$password = $adminConfig['password'] ?? '';
    }

    // Returns a new bearer token on success, or null on invalid credentials.
    public static function attemptLogin(?string $email, ?string $password): ?string
    {
        $normalizedEmail = strtolower(trim($email ?? ''));
        if (
            $email === null || $password === null
            || !in_array($normalizedEmail, self::$emails, true)
            || !hash_equals(self::$password, $password)
        ) {
            return null;
        }

        $token = bin2hex(random_bytes(32));
        $expiresAt = gmdate('Y-m-d H:i:s', time() + self::SESSION_TTL_SECONDS);
        (new AdminSessionRepository())->create($token, $expiresAt);
        return $token;
    }

    public static function requireAdmin(Request $request): bool
    {
        $token = $request->bearerToken();
        if ($token === null) return false;

        $repo = new AdminSessionRepository();
        $session = $repo->find($token);

        if ($session === null || $session['expiresAt'] < time()) {
            if ($session !== null) $repo->delete($token);
            return false;
        }

        return true;
    }

    public static function logout(Request $request): void
    {
        $token = $request->bearerToken();
        if ($token !== null) (new AdminSessionRepository())->delete($token);
    }
}
