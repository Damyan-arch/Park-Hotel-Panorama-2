<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\SettingsRepository;

class AdminSettingsController
{
    public function update(Request $request): void
    {
        Response::json((new SettingsRepository())->update($request->json()));
    }
}
