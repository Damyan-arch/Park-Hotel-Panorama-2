<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\BookingRepository;
use App\Repositories\RoomRepository;
use App\Services\BankTransfer;
use App\Services\MailService;
use App\Services\PriceQuote;
use App\Services\StripeService;

class BookingController
{
    public function create(Request $request): void
    {
        $body = $request->json();
        $roomId = $body['roomId'] ?? null;
        $roomName = $body['roomName'] ?? null;
        $checkIn = $body['checkIn'] ?? null;
        $checkOut = $body['checkOut'] ?? null;
        $name = $body['name'] ?? null;
        $email = $body['email'] ?? null;
        $phone = $body['phone'] ?? null;

        if (!$roomId || !$checkIn || !$checkOut || !$name || !$email) {
            Response::error('Room, dates, name and email are required.');
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

        $guests = self::occupancy($body, $room);
        if ($guests === false) {
            Response::error(self::occupancyError($room));
            return;
        }

        $bookingRoomName = $roomName ?: ($room['name']['en'] ?? '');

        // Snapshot of the quote at request time, so a later price change in the
        // admin doesn't rewrite what the guest was told.
        $quote = PriceQuote::calculate($checkIn, $checkOut, (float) $room['basePricePerNight']);
        $currency = $room['currency'] ?? 'EUR';

        // A deposit is required whenever a way to pay one is set up: by card (only
        // accepted if Stripe confirms it is held for the right amount) or by bank
        // transfer (staff mark it received later). With neither configured,
        // requests are taken without one.
        $payment = [];
        $paymentIntentId = $body['paymentIntentId'] ?? null;
        if ($paymentIntentId) {
            if (!StripeService::cardOffered()) {
                Response::error('Online payment is not available.', 503);
                return;
            }

            $repo = new BookingRepository();
            if ($repo->existsByPaymentIntent($paymentIntentId)) {
                Response::error('This payment has already been used for a booking.', 409);
                return;
            }

            $deposit = PriceQuote::deposit($quote['totalPrice']);
            try {
                $intent = StripeService::retrieveIntent($paymentIntentId);
            } catch (\Throwable $e) {
                error_log('BookingController: ' . $e->getMessage());
                Response::error('Could not verify the payment. Please try again.', 502);
                return;
            }
            if (!StripeService::isValidHeldDeposit($intent, (int) round($deposit * 100), $currency, $roomId)) {
                Response::error('The card deposit could not be verified.', 402);
                return;
            }

            $payment = [
                'paymentIntentId' => $paymentIntentId,
                'depositAmount' => $deposit,
                'paymentStatus' => 'authorized',
            ];
        } elseif (($body['paymentMethod'] ?? null) === 'bank_transfer') {
            // Nothing to verify yet: the guest transfers the deposit after this,
            // and staff mark it received in the admin.
            if (!BankTransfer::isEnabled()) {
                Response::error('Bank transfer is not available.', 503);
                return;
            }
            $payment = [
                'depositAmount' => PriceQuote::deposit($quote['totalPrice']),
                'paymentStatus' => BankTransfer::AWAITING,
            ];
        } elseif (StripeService::cardOffered() || BankTransfer::isEnabled()) {
            Response::error('Please choose how to pay the deposit.', 402);
            return;
        }

        $this->saveAndRespond(
            ['roomId' => $roomId, 'roomName' => $bookingRoomName, 'checkIn' => $checkIn, 'checkOut' => $checkOut, 'name' => $name, 'email' => $email, 'phone' => $phone] + ($guests ?? []),
            $room,
            $quote + $payment + ['currency' => $currency]
        );
    }

    // Second half of the Stripe-hosted Checkout fallback: the guest comes back
    // from Stripe's page with a session id. The booking is built from the
    // session's metadata (written by the server when it created the session),
    // never from anything the browser sends now, and only if Stripe confirms the
    // right deposit is held.
    public function complete(Request $request): void
    {
        if (!StripeService::cardOffered()) {
            Response::error('Online payment is not available.', 503);
            return;
        }

        $sessionId = (string) ($request->json()['sessionId'] ?? '');
        if (!preg_match('/^cs_[A-Za-z0-9_]+$/', $sessionId)) {
            Response::error('Invalid payment session.');
            return;
        }

        try {
            $session = StripeService::retrieveCheckoutSession($sessionId);
        } catch (\Throwable $e) {
            error_log('BookingController: ' . $e->getMessage());
            Response::error('Could not verify the payment. Please try again.', 502);
            return;
        }

        $meta = $session['metadata'] ?? [];
        $intentId = is_array($session['payment_intent'] ?? null) ? ($session['payment_intent']['id'] ?? null) : null;
        if (!$intentId || empty($meta['roomId']) || empty($meta['checkIn']) || empty($meta['checkOut']) || empty($meta['name']) || empty($meta['email'])) {
            Response::error('The card deposit could not be verified.', 402);
            return;
        }

        $roomName = $meta['roomName'] ?? '';
        $repo = new BookingRepository();
        // Reloading the return page must not create a second booking or send more emails.
        if ($repo->existsByPaymentIntent($intentId)) {
            Response::json(['success' => true, 'message' => self::thanks($meta['name'], $roomName)]);
            return;
        }

        $room = (new RoomRepository())->find($meta['roomId']);
        if ($room === null) {
            Response::error('Selected room could not be found.');
            return;
        }

        $quote = PriceQuote::calculate($meta['checkIn'], $meta['checkOut'], (float) $room['basePricePerNight']);
        $deposit = PriceQuote::deposit($quote['totalPrice']);
        $currency = $room['currency'] ?? 'EUR';
        $paymentStatus = StripeService::checkoutDepositState($session, (int) round($deposit * 100), $currency);
        if ($paymentStatus === null) {
            Response::error('The card deposit could not be verified.', 402);
            return;
        }

        // Checked when the session was created; the deposit is already held, so
        // counts that no longer fit (the room's capacity changed meanwhile) are
        // dropped rather than refusing the booking.
        $guests = self::occupancy($meta, $room) ?: [];

        $this->saveAndRespond(
            ['roomId' => $meta['roomId'], 'roomName' => $roomName ?: ($room['name']['en'] ?? ''), 'checkIn' => $meta['checkIn'], 'checkOut' => $meta['checkOut'], 'name' => $meta['name'], 'email' => $meta['email'], 'phone' => $meta['phone'] ?? null] + $guests,
            $room,
            $quote + ['currency' => $currency, 'paymentIntentId' => $intentId, 'depositAmount' => $deposit, 'paymentStatus' => $paymentStatus]
        );
    }

    // Babies (0–3) sleep in a cot, so they don't count against the room's
    // capacity — but a room takes at most this many. Matches MAX_BABIES in the
    // booking widget (Frontend/src/sections/booking.js).
    public const MAX_BABIES = 2;

    // Who the request is for, as ['adults', 'children', 'babies']: adults 18+,
    // children 4–17, babies 0–3. At least one adult, and adults plus children
    // fit the room's capacity. Null when no counts were sent (a page loaded
    // before the field existed — the request is still taken); false when they
    // were sent but don't fit.
    public static function occupancy(array $input, array $room): array|false|null
    {
        if (($input['adults'] ?? '') === '') return null;

        $counts = [];
        foreach (['adults', 'children', 'babies'] as $key) {
            $counts[$key] = filter_var($input[$key] ?? 0, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
            if ($counts[$key] === false) return false;
        }
        if ($counts['adults'] < 1 || $counts['babies'] > self::MAX_BABIES) return false;
        if ($counts['adults'] + $counts['children'] > self::capacity($room)) return false;
        return $counts;
    }

    public static function occupancyError(array $room): string
    {
        return 'This room sleeps up to ' . self::capacity($room) . ' adults and children, with at least one adult'
            . ' (plus up to ' . self::MAX_BABIES . ' babies under 4).';
    }

    private static function capacity(array $room): int
    {
        return max(1, (int) ($room['capacity'] ?? 1));
    }

    private static function thanks(string $name, string $roomName): string
    {
        return "Thank you, $name! Your request for the $roomName has been received — we'll confirm availability shortly.";
    }

    // Stores the request, emails the hotel and the guest, and answers the browser.
    private function saveAndRespond(array $input, array $room, array $extra): void
    {
        $created = (new BookingRepository())->create($extra + $input + ['status' => 'new']);

        // The guest sees — and the booking stores — the room name in whichever
        // language they browsed in. The notification is read by hotel staff, so
        // it gets the Bulgarian name instead.
        $notification = $created;
        $notification['roomName'] = ($room['name']['bg'] ?? '') ?: $created['roomName'];
        MailService::sendBookingNotification($notification);

        // $created, not $notification — the guest gets the room name in the
        // language they were browsing in.
        MailService::sendGuestBookingConfirmation($created);

        $response = [
            'success' => true,
            'message' => self::thanks($input['name'], $input['roomName']),
        ];
        if ($created['paymentStatus'] === BankTransfer::AWAITING) {
            $response['bankTransfer'] = BankTransfer::instructions($created);
        }
        Response::json($response, 201);
    }
}
