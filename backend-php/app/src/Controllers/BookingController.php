<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\BookingRepository;
use App\Repositories\RoomRepository;

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

        (new BookingRepository())->create([
            'roomId' => $roomId,
            'roomName' => $bookingRoomName,
            'checkIn' => $checkIn,
            'checkOut' => $checkOut,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'status' => 'new',
        ]);

        Response::json([
            'success' => true,
            'message' => "Thank you, $name! Your request for the $bookingRoomName has been received — we'll confirm availability shortly.",
        ], 201);
    }
}
