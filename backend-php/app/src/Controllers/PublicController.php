<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\SettingsRepository;
use App\Repositories\RoomRepository;
use App\Repositories\AmenityRepository;
use App\Repositories\GalleryRepository;
use App\Repositories\EventRepository;

class PublicController
{
    public function index(Request $request): void
    {
        Response::json(['message' => 'Park Hotel Panorama API', 'status' => 'ok']);
    }

    public function settings(Request $request): void
    {
        Response::json((new SettingsRepository())->get());
    }

    public function rooms(Request $request): void
    {
        Response::json((new RoomRepository())->all());
    }

    public function amenities(Request $request): void
    {
        Response::json((new AmenityRepository())->all());
    }

    public function gallery(Request $request): void
    {
        Response::json((new GalleryRepository())->all());
    }

    public function events(Request $request): void
    {
        Response::json((new EventRepository())->all());
    }
}
