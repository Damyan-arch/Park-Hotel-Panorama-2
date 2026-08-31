<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\AmenityRepository;
use App\Services\TranslateService;

class AdminAmenitiesController
{
    public function create(Request $request): void
    {
        $body = $request->json();
        $icon = $body['icon'] ?? null;
        $title = $body['title'] ?? null;

        if (!$icon || !$title) {
            Response::error('Icon and title are required.');
            return;
        }

        $amenity = (new AmenityRepository())->create([
            'icon' => $icon,
            'title' => TranslateService::translateToAllLanguages($title),
            'text' => TranslateService::translateToAllLanguages($body['text'] ?? ''),
            'underMaintenance' => (bool) ($body['underMaintenance'] ?? false),
        ]);

        Response::json($amenity, 201);
    }

    public function update(Request $request): void
    {
        $id = $request->param('id');
        $repo = new AmenityRepository();
        $existing = $repo->find($id);
        if ($existing === null) {
            Response::error('Amenity not found.', 404);
            return;
        }

        $body = $request->json();
        $patch = [];
        foreach (['icon', 'title', 'text', 'underMaintenance'] as $field) {
            if (array_key_exists($field, $body)) $patch[$field] = $body[$field];
        }

        if (array_key_exists('title', $patch)) $patch['title'] = TranslateService::translateIfChanged($patch['title'], $existing['title']);
        if (array_key_exists('text', $patch)) $patch['text'] = TranslateService::translateIfChanged($patch['text'], $existing['text']);

        $amenity = $repo->update($id, $patch);
        if ($amenity === null) {
            Response::error('Amenity not found.', 404);
            return;
        }
        Response::json($amenity);
    }

    public function delete(Request $request): void
    {
        $removed = (new AmenityRepository())->delete($request->param('id'));
        if (!$removed) {
            Response::error('Amenity not found.', 404);
            return;
        }
        Response::noContent();
    }
}
