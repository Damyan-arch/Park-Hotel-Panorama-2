<?php

namespace App\Services;

// GD-based port of the Node backend's sharp pipeline:
// .resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 })
class ImageService
{
    private const MAX_WIDTH = 1600;
    private const QUALITY = 78;

    public static function processToWebp(string $sourcePath, string $destPath): void
    {
        $data = file_get_contents($sourcePath);
        if ($data === false) {
            throw new \RuntimeException('Failed to read the uploaded file.');
        }

        $image = @imagecreatefromstring($data);
        if ($image === false) {
            throw new \RuntimeException('Unsupported or corrupt image.');
        }

        $width = imagesx($image);
        $height = imagesy($image);

        if ($width > self::MAX_WIDTH) {
            $newWidth = self::MAX_WIDTH;
            $newHeight = (int) round($height * (self::MAX_WIDTH / $width));

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        $ok = imagewebp($image, $destPath, self::QUALITY);
        imagedestroy($image);

        if (!$ok) {
            throw new \RuntimeException('Failed to encode image as WebP.');
        }
    }
}
