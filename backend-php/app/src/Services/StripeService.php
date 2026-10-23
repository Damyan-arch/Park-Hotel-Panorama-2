<?php

namespace App\Services;

// Minimal Stripe client over curl — no Composer/SDK, matching this backend's
// zero-third-party-dependency style. Card details never reach this server:
// the browser sends them straight to Stripe via Stripe.js and we only ever
// handle the resulting PaymentIntent id.
//
// The deposit is a manual-capture PaymentIntent: the card is *authorised* (the
// amount is held) when the guest submits the request, and captured later once
// the hotel confirms availability. An uncaptured hold lapses on its own after
// about 7 days.
//
// Payments are disabled — and bookings keep working without a card — until
// both keys are set in config.local.php.
class StripeService
{
    private static string $secretKey = '';
    private static string $publishableKey = '';
    // Swapped out in tests so nothing touches the network.
    private static $transport = null;

    public static function init(array $config): void
    {
        self::$secretKey = trim($config['secret_key'] ?? '');
        self::$publishableKey = trim($config['publishable_key'] ?? '');
    }

    public static function isEnabled(): bool
    {
        return self::$secretKey !== '' && self::$publishableKey !== '';
    }

    public static function publishableKey(): string
    {
        return self::$publishableKey;
    }

    // callable(string $method, string $path, array $params): array, or null to restore curl.
    public static function setTransport(?callable $transport): void
    {
        self::$transport = $transport;
    }

    // $amountMinor is in the currency's smallest unit (cents).
    public static function createDepositIntent(int $amountMinor, string $currency, array $metadata): array
    {
        return self::request('POST', '/payment_intents', [
            'amount' => $amountMinor,
            'currency' => strtolower($currency),
            'capture_method' => 'manual',
            // Current Stripe API versions reject `payment_method_types`; methods
            // come from the dashboard instead. Redirect-based methods are
            // excluded because the page only confirms with a card.
            'automatic_payment_methods' => ['enabled' => 'true', 'allow_redirects' => 'never'],
            'description' => 'Park Hotel Panorama booking deposit',
            'metadata' => $metadata,
        ]);
    }

    public static function retrieveIntent(string $id): array
    {
        return self::request('GET', '/payment_intents/' . rawurlencode($id), []);
    }

    // Fallback for browsers that block Stripe's embedded card field: the guest
    // pays on Stripe's own page instead. Same result — a manual-capture hold.
    public static function createCheckoutSession(array $params): array
    {
        return self::request('POST', '/checkout/sessions', $params);
    }

    public static function retrieveCheckoutSession(string $id): array
    {
        return self::request('GET', '/checkout/sessions/' . rawurlencode($id), ['expand' => ['payment_intent']]);
    }

    // The state of a finished Checkout session's deposit, for exactly the amount
    // we'd charge: 'authorized' when it is held (not yet captured), 'captured'
    // when the payment method charged it at once, or null when the session isn't
    // finished or doesn't match.
    public static function checkoutDepositState(array $session, int $expectedAmountMinor, string $currency): ?string
    {
        $intent = $session['payment_intent'] ?? null;
        if (($session['status'] ?? null) !== 'complete' || !is_array($intent)) return null;
        if ((int) ($intent['amount'] ?? -1) !== $expectedAmountMinor) return null;
        if (strtolower((string) ($intent['currency'] ?? '')) !== strtolower($currency)) return null;

        return match ($intent['status'] ?? null) {
            'requires_capture' => 'authorized',
            'succeeded' => 'captured',
            default => null,
        };
    }

    // Our payment_status for a deposit PaymentIntent, as it is on Stripe right now:
    // held, captured (charged — from the dashboard, or a method that charges at
    // once), released (cancelled by hand) or expired (Stripe lets an uncaptured
    // hold lapse after about 7 days). Null for states we don't track.
    public static function depositStatus(array $intent): ?string
    {
        switch ($intent['status'] ?? null) {
            case 'requires_capture':
                return 'authorized';
            case 'succeeded':
                return 'captured';
            case 'canceled':
                return ($intent['cancellation_reason'] ?? null) === 'automatic' ? 'expired' : 'canceled';
            default:
                return null;
        }
    }

    // True only for a deposit that is authorised (held, not yet captured), for
    // exactly the amount we'd charge for this stay and room. Guards against a
    // booking being submitted with someone else's intent, or a cheaper one.
    public static function isValidHeldDeposit(array $intent, int $expectedAmountMinor, string $currency, string $roomId): bool
    {
        return ($intent['status'] ?? null) === 'requires_capture'
            && (int) ($intent['amount'] ?? -1) === $expectedAmountMinor
            && strtolower((string) ($intent['currency'] ?? '')) === strtolower($currency)
            && ($intent['metadata']['roomId'] ?? null) === $roomId;
    }

    private static function request(string $method, string $path, array $params): array
    {
        if (self::$transport !== null) {
            return (self::$transport)($method, $path, $params);
        }

        $url = 'https://api.stripe.com/v1' . $path;
        if ($method === 'GET' && $params) {
            $url .= '?' . http_build_query($params);
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_USERPWD => self::$secretKey . ':',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
        ]);
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        }
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        $data = is_string($body) ? json_decode($body, true) : null;
        if (!is_array($data) || $status >= 400) {
            $message = is_array($data) ? ($data['error']['message'] ?? 'unknown error') : 'no response';
            throw new \RuntimeException("Stripe $method $path failed ($status): $message");
        }
        return $data;
    }
}
