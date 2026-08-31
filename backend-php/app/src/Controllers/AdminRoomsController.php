<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\RoomRepository;
use App\Services\TranslateService;

class AdminRoomsController
{
    public function create(Request $request): void
    {
        $body = $request->json();
        $name = $body['name'] ?? null;
        $type = $body['type'] ?? null;
        $imageUrl = $body['imageUrl'] ?? null;

        if (!$name || !$type || !$imageUrl) {
            Response::error('Name, type and image are required.');
            return;
        }

        $room = (new RoomRepository())->create([
            'name' => TranslateService::translateToAllLanguages($name),
            'type' => $type,
            'description' => TranslateService::translateToAllLanguages($body['description'] ?? ''),
            'capacity' => ((int) ($body['capacity'] ?? 0)) ?: 1,
            'sizeSqm' => (int) ($body['sizeSqm'] ?? 0),
            'basePricePerNight' => (float) ($body['basePricePerNight'] ?? 0),
            'currency' => $body['currency'] ?? 'EUR',
            'imageUrl' => $imageUrl,
        ]);

        Response::json($room, 201);
    }

    public function update(Request $request): void
    {
        $id = $request->param('id');
        $repo = new RoomRepository();
        $existing = $repo->find($id);
        if ($existing === null) {
            Response::error('Room not found.', 404);
            return;
        }

        $body = $request->json();
        $patch = [];
        foreach (['name', 'type', 'description', 'capacity', 'sizeSqm', 'basePricePerNight', 'currency', 'imageUrl'] as $field) {
            if (array_key_exists($field, $body)) $patch[$field] = $body[$field];
        }

        if (array_key_exists('capacity', $patch)) $patch['capacity'] = (int) $patch['capacity'];
        if (array_key_exists('sizeSqm', $patch)) $patch['sizeSqm'] = (int) $patch['sizeSqm'];
        if (array_key_exists('basePricePerNight', $patch)) $patch['basePricePerNight'] = (float) $patch['basePricePerNight'];
        if (array_key_exists('name', $patch)) $patch['name'] = TranslateService::translateIfChanged($patch['name'], $existing['name']);
        if (array_key_exists('description', $patch)) {
            $patch['description'] = TranslateService::translateIfChanged($patch['description'], $existing['description']);
        }

        $room = $repo->update($id, $patch);
        if ($room === null) {
            Response::error('Room not found.', 404);
            return;
        }
        Response::json($room);
    }

    public function delete(Request $request): void
    {
        $removed = (new RoomRepository())->delete($request->param('id'));
        if (!$removed) {
            Response::error('Room not found.', 404);
            return;
        }
        Response::noContent();
    }
}
