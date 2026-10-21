<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\BookingRepository;
use App\Repositories\RoomRepository;
use App\Services\MailService;
use App\Services\PriceQuote;

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

        $bookingRoomName = $roomName ?: ($room['name']['en'] ?? '');

        // Snapshot of the quote at request time, so a later price change in the
        // admin doesn't rewrite what the guest was told.
        $quote = PriceQuote::calculate($checkIn, $checkOut, (float) $room['basePricePerNight']);

        $created = (new BookingRepository())->create($quote + [
            'roomId' => $roomId,
            'roomName' => $bookingRoomName,
            'checkIn' => $checkIn,
            'checkOut' => $checkOut,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'currency' => $room['currency'] ?? 'EUR',
            'status' => 'new',
        ]);

        // The guest sees — and the booking stores — the room name in whichever
        // language they browsed in. The notification is read by hotel staff, so
        // it gets the Bulgarian name instead.
        $notification = $created;
        $notification['roomName'] = ($room['name']['bg'] ?? '') ?: $created['roomName'];
        MailService::sendBookingNotification($notification);

        // $created, not $notification — the guest gets the room name in the
        // language they were browsing in.
        MailService::sendGuestBookingConfirmation($created);

        Response::json([
            'success' => true,
            'message' => "Thank you, $name! Your request for the $bookingRoomName has been received — we'll confirm availability shortly.",
        ], 201);
    }
}
