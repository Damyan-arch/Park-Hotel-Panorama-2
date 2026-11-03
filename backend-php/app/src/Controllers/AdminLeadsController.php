<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\BookingRepository;
use App\Repositories\InquiryRepository;
use App\Services\BankTransfer;
use App\Services\StripeService;

class AdminLeadsController
{
    // Deposits still "held" in our database may have been captured or released
    // in the Stripe dashboard (or expired) since — so each load asks Stripe about
    // those, newest first, and saves the answer. Capped so a long list of open
    // holds can't make the admin slow; a Stripe hiccup just keeps the old status.
    private const MAX_STATUS_CHECKS = 25;

    public function bookings(Request $request): void
    {
        $repo = new BookingRepository();
        $bookings = $repo->all();

        if (StripeService::isEnabled()) {
            $checks = 0;
            foreach ($bookings as &$booking) {
                if ($checks >= self::MAX_STATUS_CHECKS) break;
                if (empty($booking['paymentIntentId']) || $booking['paymentStatus'] !== 'authorized') continue;
                $checks++;
                try {
                    $status = StripeService::depositStatus(StripeService::retrieveIntent($booking['paymentIntentId']));
                } catch (\Throwable $e) {
                    error_log('AdminLeadsController: ' . $e->getMessage());
                    continue;
                }
                if ($status !== null && $status !== $booking['paymentStatus']) {
                    $repo->updatePaymentStatus($booking['id'], $status);
                    $booking['paymentStatus'] = $status;
                }
            }
            unset($booking);
        }

        Response::json(array_map([$this, 'withPaymentUrl'], $bookings));
    }

    // "Take payment" / "Release hold" buttons in the admin.
    public function captureDeposit(Request $request): void
    {
        $this->settleDeposit($request, 'capture');
    }

    public function releaseDeposit(Request $request): void
    {
        $this->settleDeposit($request, 'cancel');
    }

    // Stripe is asked for the deposit's current state first: if it was already
    // captured or released (in the Stripe dashboard, or the hold expired), that
    // state is saved and returned instead of an error.
    private function settleDeposit(Request $request, string $action): void
    {
        $repo = new BookingRepository();
        $booking = $repo->find((int) $request->param('id'));
        if ($booking === null) {
            Response::error('Booking not found.', 404);
            return;
        }
        if (!StripeService::isEnabled() || empty($booking['paymentIntentId'])) {
            Response::error('This booking has no card deposit.');
            return;
        }

        try {
            $intent = StripeService::retrieveIntent($booking['paymentIntentId']);
            if (($intent['status'] ?? null) === 'requires_capture') {
                $intent = $action === 'capture'
                    ? StripeService::captureIntent($booking['paymentIntentId'])
                    : StripeService::cancelIntent($booking['paymentIntentId']);
            }
        } catch (\Throwable $e) {
            error_log('AdminLeadsController: ' . $e->getMessage());
            Response::error('Stripe could not complete this. Please try again.', 502);
            return;
        }

        $status = StripeService::depositStatus($intent);
        if ($status !== null && $status !== $booking['paymentStatus']) {
            $repo->updatePaymentStatus($booking['id'], $status);
            $booking['paymentStatus'] = $status;
        }
        Response::json($this->withPaymentUrl($booking));
    }

    // "Mark as received" (or undo) for a deposit paid by bank transfer — staff
    // see the money on the account; nothing here can check that for them.
    public function markTransfer(Request $request): void
    {
        $repo = new BookingRepository();
        $booking = $repo->find((int) $request->param('id'));
        if ($booking === null) {
            Response::error('Booking not found.', 404);
            return;
        }
        if (!in_array($booking['paymentStatus'], [BankTransfer::AWAITING, BankTransfer::RECEIVED], true)) {
            Response::error('This booking has no bank transfer deposit.');
            return;
        }

        $status = !empty($request->json()['received']) ? BankTransfer::RECEIVED : BankTransfer::AWAITING;
        $repo->updatePaymentStatus($booking['id'], $status);
        $booking['paymentStatus'] = $status;
        Response::json($this->withPaymentUrl($booking));
    }

    private function withPaymentUrl(array $booking): array
    {
        $booking['paymentUrl'] = !empty($booking['paymentIntentId']) && StripeService::isEnabled()
            ? StripeService::dashboardPaymentUrl($booking['paymentIntentId'], StripeService::accountId())
            : null;
        return $booking;
    }

    public function inquiries(Request $request): void
    {
        Response::json((new InquiryRepository())->all());
    }

    public function updateBookingStatus(Request $request): void
    {
        $status = $request->json()['status'] ?? null;
        if (!$status) {
            Response::error('Status is required.');
            return;
        }
        if (!in_array($status, BookingRepository::STATUSES, true)) {
            Response::error('Invalid status.');
            return;
        }

        $booking = (new BookingRepository())->updateStatus((int) $request->param('id'), $status);
        if ($booking === null) {
            Response::error('Booking not found.', 404);
            return;
        }
        Response::json($booking);
    }

    public function updateInquiryStatus(Request $request): void
    {
        $status = $request->json()['status'] ?? null;
        if (!$status) {
            Response::error('Status is required.');
            return;
        }

        $inquiry = (new InquiryRepository())->updateStatus((int) $request->param('id'), $status);
        if ($inquiry === null) {
            Response::error('Inquiry not found.', 404);
            return;
        }
        Response::json($inquiry);
    }
}
