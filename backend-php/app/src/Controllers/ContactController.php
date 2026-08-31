<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\InquiryRepository;

class ContactController
{
    public function create(Request $request): void
    {
        $body = $request->json();
        $name = $body['name'] ?? null;
        $email = $body['email'] ?? null;
        $message = $body['message'] ?? null;

        if (!$name || !$email || !$message) {
            Response::error('Name, email and message are required.');
            return;
        }

        (new InquiryRepository())->create([
            'name' => $name,
            'email' => $email,
            'phone' => $body['phone'] ?? null,
            'roomName' => $body['roomName'] ?? null,
            'message' => $message,
            'status' => 'new',
        ]);

        Response::json([
            'success' => true,
            'message' => 'Thank you! Your message has been received — we reply within a few hours.',
        ], 201);
    }
}
