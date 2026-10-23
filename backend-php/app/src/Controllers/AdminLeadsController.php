<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\BookingRepository;
use App\Repositories\InquiryRepository;
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

        Response::json($bookings);
    }

    public function inquiries(Request $request): void
    {
        Response::json((new InquiryRepository())->all());
    }

    private const BOOKING_STATUSES = ['new', 'contacted', 'rejected'];

    public function updateBookingStatus(Request $request): void
    {
        $status = $request->json()['status'] ?? null;
        if (!$status) {
            Response::error('Status is required.');
            return;
        }
        if (!in_array($status, self::BOOKING_STATUSES, true)) {
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
