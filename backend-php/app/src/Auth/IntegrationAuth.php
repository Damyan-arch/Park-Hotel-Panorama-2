<?php

namespace App\Auth;

use App\Http\Request;

// API key for outside systems (Mistral's Zamboo) calling /api/integration/*.
// One static key from config.local.php, sent as `Authorization: Bearer <key>` —
// separate from admin logins, so it can be rotated without touching staff.
class IntegrationAuth
{
    // Short keys are refused outright, so a placeholder like "test" left in
    // config.local.php can't open the API.
    private const MIN_KEY_LENGTH = 32;

    private static string $apiKey = '';

    public static function init(array $integrationConfig): void
    {
        self::$apiKey = trim($integrationConfig['api_key'] ?? '');
        if (self::$apiKey !== '' && strlen(self::$apiKey) < self::MIN_KEY_LENGTH) {
            error_log('integration.api_key is shorter than ' . self::MIN_KEY_LENGTH . ' characters — the integration API stays disabled.');
            self::$apiKey = '';
        }
    }

    public static function isEnabled(): bool
    {
        return self::$apiKey !== '';
    }

    public static function check(Request $request): bool
    {
        $token = $request->bearerToken();
        return self::isEnabled() && $token !== null && hash_equals(self::$apiKey, $token);
    }
}
