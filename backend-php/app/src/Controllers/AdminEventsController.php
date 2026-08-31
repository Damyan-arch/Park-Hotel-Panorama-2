<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\EventRepository;
use App\Services\TranslateService;

class AdminEventsController
{
    public function create(Request $request): void
    {
        $body = $request->json();
        $title = $body['title'] ?? null;
        $date = $body['date'] ?? null;

        if (!$title || !$date) {
            Response::error('Title and date are required.');
            return;
        }

        $event = (new EventRepository())->create([
            'title' => TranslateService::translateToAllLanguages($title),
            'date' => $date,
            'time' => $body['time'] ?? '',
            'description' => TranslateService::translateToAllLanguages($body['description'] ?? ''),
            'imageUrl' => $body['imageUrl'] ?? '',
            'infoUrl' => $body['infoUrl'] ?? '',
        ]);

        Response::json($event, 201);
    }

    public function update(Request $request): void
    {
        $id = $request->param('id');
        $repo = new EventRepository();
        $existing = $repo->find($id);
        if ($existing === null) {
            Response::error('Event not found.', 404);
            return;
        }

        $body = $request->json();
        $patch = [];
        foreach (['title', 'date', 'time', 'description', 'imageUrl', 'infoUrl'] as $field) {
            if (array_key_exists($field, $body)) $patch[$field] = $body[$field];
        }

        if (array_key_exists('title', $patch)) $patch['title'] = TranslateService::translateIfChanged($patch['title'], $existing['title']);
        if (array_key_exists('description', $patch)) {
            $patch['description'] = TranslateService::translateIfChanged($patch['description'], $existing['description']);
        }

        $event = $repo->update($id, $patch);
        if ($event === null) {
            Response::error('Event not found.', 404);
            return;
        }
        Response::json($event);
    }

    public function delete(Request $request): void
    {
        $removed = (new EventRepository())->delete($request->param('id'));
        if (!$removed) {
            Response::error('Event not found.', 404);
            return;
        }
        Response::noContent();
    }
}
