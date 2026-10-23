<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\RoomRepository;
use App\Services\PriceQuote;
use App\Services\StripeService;

class PaymentController
{
    // What the booking widget needs to decide whether to show the card field.
    // The publishable key is public by design (it ships to every browser).
    public function config(Request $request): void
    {
        if (!StripeService::isEnabled()) {
            Response::json(['enabled' => false]);
            return;
        }
        Response::json([
            'enabled' => true,
            'publishableKey' => StripeService::publishableKey(),
            'depositPercent' => PriceQuote::DEPOSIT_PERCENT,
        ]);
    }

    // Step 1 of a paid request: the amount is worked out here from the room's
    // stored price, never taken from the browser. The browser then confirms
    // the returned client secret with the card, and submits the booking with
    // the PaymentIntent id.
    public function createIntent(Request $request): void
    {
        if (!StripeService::isEnabled()) {
            Response::error('Online payment is not available.', 503);
            return;
        }

        $body = $request->json();
        $roomId = $body['roomId'] ?? null;
        $checkIn = $body['checkIn'] ?? null;
        $checkOut = $body['checkOut'] ?? null;

        if (!$roomId || !$checkIn || !$checkOut) {
            Response::error('Room and dates are required.');
            return;
        }
        if (strtotime($checkOut) <= strtotime($checkIn)) {
            Response::error('Check-out date must be after check-in date.');
            return;
        }

        $room = (new RoomRepository())->find($roomId);
        if ($room === null) {
            Response::error('Selected room could not be found.');
            return;
        }

        $quote = PriceQuote::calculate($checkIn, $checkOut, (float) $room['basePricePerNight']);
        $deposit = PriceQuote::deposit($quote['totalPrice']);
        $currency = $room['currency'] ?? 'EUR';

        try {
            $intent = StripeService::createDepositIntent(
                (int) round($deposit * 100),
                $currency,
                ['roomId' => $roomId, 'checkIn' => $checkIn, 'checkOut' => $checkOut]
            );
        } catch (\Throwable $e) {
            error_log('PaymentController: ' . $e->getMessage());
            Response::error('Could not start the payment. Please try again.', 502);
            return;
        }

        Response::json([
            'clientSecret' => $intent['client_secret'],
            'paymentIntentId' => $intent['id'],
            'depositAmount' => $deposit,
            'currency' => $currency,
        ]);
    }

    // Fallback for browsers that block Stripe's embedded card field (strict
    // tracking protection, extensions): create a Stripe-hosted Checkout page for
    // the same 30% hold. Everything the booking needs travels in the session's
    // metadata, set here on the server, so the browser can't alter it; the
    // booking itself is only created once the guest returns with a paid session
    // (BookingController::complete).
    public function createCheckout(Request $request): void
    {
        if (!StripeService::isEnabled()) {
            Response::error('Online payment is not available.', 503);
            return;
        }

        $body = $request->json();
        $roomId = $body['roomId'] ?? null;
        $roomName = trim((string) ($body['roomName'] ?? ''));
        $checkIn = $body['checkIn'] ?? null;
        $checkOut = $body['checkOut'] ?? null;
        $name = trim((string) ($body['name'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $phone = trim((string) ($body['phone'] ?? ''));
        $lang = (string) ($body['lang'] ?? '');

        if (!$roomId || !$checkIn || !$checkOut || $name === '' || $email === '') {
            Response::error('Room, dates, name and email are required.');
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Please enter a valid email address.');
            return;
        }
        if (strtotime($checkOut) <= strtotime($checkIn)) {
            Response::error('Check-out date must be after check-in date.');
            return;
        }

        $room = (new RoomRepository())->find($roomId);
        if ($room === null) {
            Response::error('Selected room could not be found.');
            return;
        }

        $quote = PriceQuote::calculate($checkIn, $checkOut, (float) $room['basePricePerNight']);
        $deposit = PriceQuote::deposit($quote['totalPrice']);
        $currency = $room['currency'] ?? 'EUR';
        $roomLabel = $roomName !== '' ? $roomName : ($room['name']['en'] ?? 'Room');
        $base = self::returnBase();

        try {
            $session = StripeService::createCheckoutSession([
                'mode' => 'payment',
                // Stripe no longer accepts `payment_method_types`; methods come from the
                // dashboard. Satispay can't hold a payment for later (it charges at
                // once), so it is excluded. Anything else that charges at once is
                // still handled: BookingController::complete accepts a captured
                // deposit as well as a held one.
                'excluded_payment_method_types' => ['satispay'],
                'customer_email' => $email,
                'locale' => in_array($lang, ['bg', 'de', 'es', 'ro', 'en'], true) ? $lang : 'auto',
                'line_items' => [[
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => strtolower($currency),
                        'unit_amount' => (int) round($deposit * 100),
                        'product_data' => [
                            'name' => 'Park Hotel Panorama — ' . PriceQuote::DEPOSIT_PERCENT . '% deposit',
                            'description' => mb_substr("$roomLabel, $checkIn → $checkOut", 0, 250),
                        ],
                    ],
                ]],
                'payment_intent_data' => [
                    'capture_method' => 'manual',
                    'description' => 'Park Hotel Panorama booking deposit',
                    'metadata' => ['roomId' => $roomId],
                ],
                'metadata' => [
                    'roomId' => $roomId,
                    'roomName' => mb_substr($roomLabel, 0, 200),
                    'checkIn' => $checkIn,
                    'checkOut' => $checkOut,
                    'name' => mb_substr($name, 0, 200),
                    'email' => $email,
                    'phone' => mb_substr($phone, 0, 60),
                ],
                'success_url' => $base . '/?booking_session={CHECKOUT_SESSION_ID}#booking',
                'cancel_url' => $base . '/#booking',
            ]);
        } catch (\Throwable $e) {
            error_log('PaymentController: ' . $e->getMessage());
            Response::error('Could not start the payment. Please try again.', 502);
            return;
        }

        Response::json(['url' => $session['url']]);
    }

    // Where Stripe sends the guest back to: the site's own origin. Taken from the
    // request's Origin header, but only trusted when its host is the host this
    // request was made to — otherwise a forged header could point Stripe's
    // redirect at another site.
    private static function returnBase(): string
    {
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $https = (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
        $own = ($https ? 'https' : 'http') . '://' . $host;

        $origin = rtrim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''), '/');
        $originHost = parse_url($origin, PHP_URL_HOST);
        $requestHost = parse_url('http://' . $host, PHP_URL_HOST);
        return ($originHost !== null && $originHost === $requestHost) ? $origin : $own;
    }
}
