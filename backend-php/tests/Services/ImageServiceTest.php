<?php

namespace Tests\Services;

use Tests\TestCase;
use App\Services\ImageService;

class ImageServiceTest extends TestCase
{
    private array $tempFiles = [];

    private function tempPath(string $ext): string
    {
        $path = sys_get_temp_dir() . '/imgtest-' . bin2hex(random_bytes(6)) . '.' . $ext;
        $this->tempFiles[] = $path;
        return $path;
    }

    public function tearDown(): void
    {
        foreach ($this->tempFiles as $f) {
            if (is_file($f)) unlink($f);
        }
        $this->tempFiles = [];
    }

    public function testDownscalesImagesWiderThan1600(): void
    {
        $source = $this->tempPath('png');
        $im = imagecreatetruecolor(2000, 1000);
        imagepng($im, $source);
        imagedestroy($im);

        $dest = $this->tempPath('webp');
        ImageService::processToWebp($source, $dest);

        $info = getimagesize($dest);
        $this->assertEquals(1600, $info[0]);
        $this->assertEquals(800, $info[1]); // aspect ratio preserved (2000:1000 = 1600:800)
        $this->assertEquals('image/webp', $info['mime']);
    }

    public function testDoesNotUpscaleImagesNarrowerThan1600(): void
    {
        $source = $this->tempPath('png');
        $im = imagecreatetruecolor(400, 300);
        imagepng($im, $source);
        imagedestroy($im);

        $dest = $this->tempPath('webp');
        ImageService::processToWebp($source, $dest);

        $info = getimagesize($dest);
        $this->assertEquals(400, $info[0]);
        $this->assertEquals(300, $info[1]);
        $this->assertEquals('image/webp', $info['mime']);
    }

    public function testThrowsOnCorruptInput(): void
    {
        $source = $this->tempPath('png');
        file_put_contents($source, 'not an image');

        $threw = false;
        try {
            ImageService::processToWebp($source, $this->tempPath('webp'));
        } catch (\RuntimeException $e) {
            $threw = true;
        }
        $this->assertTrue($threw, 'Expected processToWebp to throw on corrupt input');
    }
}
