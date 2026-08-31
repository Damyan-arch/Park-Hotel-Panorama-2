<?php

namespace App\Controllers;

use App\Auth\AdminAuth;
use App\Http\Request;
use App\Http\Response;

class AdminAuthController
{
    public function login(Request $request): void
    {
        $body = $request->json();
        $token = AdminAuth::attemptLogin($body['email'] ?? null, $body['password'] ?? null);

        if ($token === null) {
            Response::error('Invalid email or password.', 401);
            return;
        }

        Response::json(['token' => $token]);
    }

    // Router already required admin auth to reach this route, so the token is valid — just revoke it.
    public function logout(Request $request): void
    {
        AdminAuth::logout($request);
        Response::json(['success' => true]);
    }
}
