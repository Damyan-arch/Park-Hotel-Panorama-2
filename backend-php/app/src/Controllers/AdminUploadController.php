<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\ImageService;

// Local-disk upload — restored to the pre-DigitalOcean-Spaces pattern, since
// real SiteGround shared hosting has persistent local disk (unlike App
// Platform's rebuilt-on-every-deploy filesystem, which is why Spaces was
// needed there at all).
class AdminUploadController
{
    private const MAX_BYTES = 8 * 1024 * 1024;

    public function upload(Request $request): void
    {
        $file = $_FILES['image'] ?? null;

        if ($file === null || $file['error'] === UPLOAD_ERR_NO_FILE) {
            Response::error('No image file was provided.');
            return;
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Upload failed.');
            return;
        }
        if ($file['size'] > self::MAX_BYTES) {
            Response::error('File must be 8MB or smaller.');
            return;
        }

        // Sniff actual content rather than trusting the client-supplied Content-Type.
        $mime = @mime_content_type($file['tmp_name']);
        if (!$mime || !str_starts_with($mime, 'image/')) {
            Response::error('Only image files are allowed.');
            return;
        }

        if (!is_dir(UPLOADS_DIR) && !mkdir(UPLOADS_DIR, 0755, true) && !is_dir(UPLOADS_DIR)) {
            Response::error('Failed to process the uploaded image.', 500);
            return;
        }

        $filename = ((int) round(microtime(true) * 1000)) . '-' . bin2hex(random_bytes(6)) . '.webp';
        $destPath = UPLOADS_DIR . '/' . $filename;

        try {
            ImageService::processToWebp($file['tmp_name'], $destPath);
        } catch (\Throwable $e) {
            error_log('Image upload failed: ' . $e->getMessage());
            Response::error('Failed to process the uploaded image.', 500);
            return;
        }

        Response::json(['url' => "/images/uploads/$filename"], 201);
    }
}
