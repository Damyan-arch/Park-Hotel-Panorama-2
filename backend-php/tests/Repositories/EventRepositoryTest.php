<?php

namespace Tests\Repositories;

use Tests\TestCase;
use App\Db\Database;
use App\Repositories\EventRepository;

class EventRepositoryTest extends TestCase
{
    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE events');
    }

    private function sampleEvent(array $overrides = []): array
    {
        return array_merge([
            'title' => ['en' => 'Test Event', 'bg' => '', 'de' => '', 'es' => '', 'ro' => ''],
            'date' => '2026-12-01',
            'time' => '18:00',
            'description' => ['en' => 'Fun times.', 'bg' => '', 'de' => '', 'es' => '', 'ro' => ''],
            'imageUrl' => '',
            'infoUrl' => '',
        ], $overrides);
    }

    public function testCreateThenFindRoundTrips(): void
    {
        $repo = new EventRepository();
        $created = $repo->create($this->sampleEvent());

        $found = $repo->find($created['id']);
        $this->assertEquals('Test Event', $found['title']['en']);
        $this->assertEquals('2026-12-01', $found['date']);
        $this->assertEquals('18:00', $found['time']);
    }

    public function testAllIsSortedByDate(): void
    {
        $repo = new EventRepository();
        $repo->create($this->sampleEvent(['date' => '2026-12-25']));
        $repo->create($this->sampleEvent(['date' => '2026-01-01']));

        $dates = array_column($repo->all(), 'date');
        $this->assertEquals(['2026-01-01', '2026-12-25'], $dates);
    }

    public function testUpdateThenDelete(): void
    {
        $repo = new EventRepository();
        $created = $repo->create($this->sampleEvent());

        $updated = $repo->update($created['id'], ['time' => '20:00']);
        $this->assertEquals('20:00', $updated['time']);

        $this->assertTrue($repo->delete($created['id']));
        $this->assertNull($repo->find($created['id']));
    }

    public function testGalleryRoundTripsAsAList(): void
    {
        $repo = new EventRepository();
        $created = $repo->create($this->sampleEvent(['gallery' => ['/images/uploads/a.webp', '/images/uploads/b.webp']]));
        $this->assertEquals(['/images/uploads/a.webp', '/images/uploads/b.webp'], $created['gallery']);

        // A list, not a {"0": ...} map — the localized-field encoder would have
        // objectified it, which breaks .map() on the events page.
        $updated = $repo->update($created['id'], ['gallery' => ['/images/uploads/c.webp']]);
        $this->assertEquals([0], array_keys($updated['gallery']));
        $this->assertEquals(['/images/uploads/c.webp'], $updated['gallery']);
    }

    public function testGalleryDefaultsToEmptyList(): void
    {
        $created = (new EventRepository())->create($this->sampleEvent());
        $this->assertEquals([], $created['gallery']);
    }

    public function testUpdateReturnsNullForUnknownId(): void
    {
        $this->assertNull((new EventRepository())->update('unknown-id', ['time' => '20:00']));
    }
}
