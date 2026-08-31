<?php

namespace App\Services;

// Direct DeepL REST API port of Backend/services/translate.js — same behavior:
// auto-detect source language, translate to the other 4, tolerate individual
// per-language failures, retry on rate-limit, skip the API call entirely when
// the "en" value hasn't actually changed.
class TranslateService
{
    private const LANGUAGES = ['en', 'bg', 'de', 'es', 'ro'];
    private const TARGET_CODE = ['en' => 'EN-US', 'bg' => 'BG', 'de' => 'DE', 'es' => 'ES', 'ro' => 'RO'];

    private static bool $warnedMissingKey = false;
    private static ?string $configuredKey = null;

    public static function init(string $apiKey): void
    {
        self::$configuredKey = $apiKey;
    }

    public static function isConfigured(): bool
    {
        return !empty(self::apiKey());
    }

    private static function apiKey(): string
    {
        return self::$configuredKey ?? '';
    }

    public static function languages(): array
    {
        return self::LANGUAGES;
    }

    private static function emptyLocalized(): array
    {
        return array_fill_keys(self::LANGUAGES, '');
    }

    public static function translateToAllLanguages(string $sourceText): array
    {
        $trimmed = trim($sourceText);
        if ($trimmed === '') return self::emptyLocalized();

        if (!self::apiKey()) {
            if (!self::$warnedMissingKey) {
                error_log(
                    'DEEPL_API_KEY is not set — room/event/amenity text will show the same text in every language until a key is added.'
                );
                self::$warnedMissingKey = true;
            }
            return array_fill_keys(self::LANGUAGES, $trimmed);
        }

        $result = self::emptyLocalized();

        try {
            $probe = self::callWithRetry(fn() => self::callDeepL($trimmed, self::TARGET_CODE['en'], null));
            $detected = strtolower($probe['detected_source_language'] ?? 'en');
            $sourceLang = in_array($detected, self::LANGUAGES, true) ? $detected : 'en';

            $result[$sourceLang] = $trimmed;
            $result['en'] = $sourceLang === 'en' ? $trimmed : $probe['text'];

            foreach (self::LANGUAGES as $lang) {
                if ($result[$lang] !== '') continue;
                try {
                    $translated = self::callWithRetry(fn() => self::callDeepL($trimmed, self::TARGET_CODE[$lang], null));
                    $result[$lang] = $translated['text'];
                } catch (\Throwable $e) {
                    error_log("DeepL translation to \"$lang\" failed, using original text instead. " . $e->getMessage());
                    $result[$lang] = $trimmed;
                }
            }
        } catch (\Throwable $e) {
            error_log('DeepL translation failed, using original text for every language. ' . $e->getMessage());
            foreach (self::LANGUAGES as $lang) {
                if ($result[$lang] === '') $result[$lang] = $trimmed;
            }
        }

        return $result;
    }

    public static function translateIfChanged(string $newText, ?array $existingLocalized): array
    {
        if ($existingLocalized && ($existingLocalized['en'] ?? null) === $newText) {
            return $existingLocalized;
        }
        return self::translateToAllLanguages($newText);
    }

    private static function callWithRetry(callable $fn, int $retries = 4, int $delayMs = 1500)
    {
        $attempt = 0;
        while (true) {
            try {
                return $fn();
            } catch (DeepLRateLimitException $e) {
                if ($attempt >= $retries) throw $e;
                usleep($delayMs * ($attempt + 1) * 1000);
                $attempt++;
            }
        }
    }

    // Returns the first translations[] entry as ['text' => ..., 'detected_source_language' => ...].
    private static function callDeepL(string $text, string $targetLang, ?string $sourceLang): array
    {
        $apiKey = self::apiKey();
        $endpoint = str_ends_with($apiKey, ':fx')
            ? 'https://api-free.deepl.com/v2/translate'
            : 'https://api.deepl.com/v2/translate';

        $fields = ['text' => $text, 'target_lang' => $targetLang];
        if ($sourceLang) $fields['source_lang'] = $sourceLang;

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($fields),
            CURLOPT_HTTPHEADER => ["Authorization: DeepL-Auth-Key $apiKey"],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status === 429) throw new DeepLRateLimitException('Too many requests (429).');
        if ($body === false || $status >= 300) {
            throw new \RuntimeException("DeepL request failed (HTTP $status).");
        }

        $decoded = json_decode($body, true);
        return $decoded['translations'][0] ?? throw new \RuntimeException('Unexpected DeepL response shape.');
    }
}
