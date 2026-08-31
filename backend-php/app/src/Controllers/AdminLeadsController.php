<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\BookingRepository;
use App\Repositories\InquiryRepository;

class AdminLeadsController
{
    public function bookings(Request $request): void
    {
        Response::json((new BookingRepository())->all());
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
