<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Repositories\GalleryRepository;

class AdminGalleryController
{
    public function create(Request $request): void
    {
        $body = $request->json();
        $imageUrl = $body['imageUrl'] ?? null;
        if (!$imageUrl) {
            Response::error('Image is required.');
            return;
        }

        $repo = new GalleryRepository();
        $sortOrder = isset($body['sortOrder']) && is_numeric($body['sortOrder'])
            ? (int) $body['sortOrder']
            : $repo->count();

        $image = $repo->create([
            'imageUrl' => $imageUrl,
            'alt' => $body['alt'] ?? '',
            'sortOrder' => $sortOrder,
        ]);

        Response::json($image, 201);
    }

    public function update(Request $request): void
    {
        $body = $request->json();
        if (isset($body['sortOrder'])) $body['sortOrder'] = (int) $body['sortOrder'];

        $image = (new GalleryRepository())->update($request->param('id'), $body);
        if ($image === null) {
            Response::error('Image not found.', 404);
            return;
        }
        Response::json($image);
    }

    public function delete(Request $request): void
    {
        $removed = (new GalleryRepository())->delete($request->param('id'));
        if (!$removed) {
            Response::error('Image not found.', 404);
            return;
        }
        Response::noContent();
    }
}
