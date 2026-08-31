<?php

namespace Tests\Repositories;

use Tests\TestCase;
use App\Db\Database;
use App\Repositories\GalleryRepository;

class GalleryRepositoryTest extends TestCase
{
    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE gallery_images');
    }

    public function testCreateThenFindRoundTrips(): void
    {
        $repo = new GalleryRepository();
        $created = $repo->create(['imageUrl' => '/images/gallery/a.webp', 'alt' => 'A photo', 'sortOrder' => 0]);

        $found = $repo->find($created['id']);
        $this->assertEquals('/images/gallery/a.webp', $found['imageUrl']);
        $this->assertEquals('A photo', $found['alt']);
        $this->assertEquals(0, $found['sortOrder']);
    }

    public function testCountReflectsInsertedRows(): void
    {
        $repo = new GalleryRepository();
        $this->assertEquals(0, $repo->count());
        $repo->create(['imageUrl' => '/x.webp', 'alt' => '', 'sortOrder' => 0]);
        $this->assertEquals(1, $repo->count());
    }

    public function testAllIsSortedBySortOrder(): void
    {
        $repo = new GalleryRepository();
        $repo->create(['imageUrl' => '/c.webp', 'alt' => '', 'sortOrder' => 2]);
        $repo->create(['imageUrl' => '/a.webp', 'alt' => '', 'sortOrder' => 0]);
        $repo->create(['imageUrl' => '/b.webp', 'alt' => '', 'sortOrder' => 1]);

        $urls = array_column($repo->all(), 'imageUrl');
        $this->assertEquals(['/a.webp', '/b.webp', '/c.webp'], $urls);
    }

    public function testUpdateThenDelete(): void
    {
        $repo = new GalleryRepository();
        $created = $repo->create(['imageUrl' => '/x.webp', 'alt' => '', 'sortOrder' => 0]);

        $updated = $repo->update($created['id'], ['alt' => 'Updated alt']);
        $this->assertEquals('Updated alt', $updated['alt']);

        $this->assertTrue($repo->delete($created['id']));
        $this->assertNull($repo->find($created['id']));
    }
}
