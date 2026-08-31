<?php

namespace Tests\Repositories;

use Tests\TestCase;
use App\Db\Database;
use App\Repositories\AmenityRepository;

class AmenityRepositoryTest extends TestCase
{
    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE amenities');
    }

    private function sampleAmenity(array $overrides = []): array
    {
        return array_merge([
            'icon' => 'wifi',
            'title' => ['en' => 'Free Wi-Fi', 'bg' => '', 'de' => '', 'es' => '', 'ro' => ''],
            'text' => ['en' => 'Everywhere.', 'bg' => '', 'de' => '', 'es' => '', 'ro' => ''],
            'underMaintenance' => false,
        ], $overrides);
    }

    public function testCreateThenFindRoundTrips(): void
    {
        $repo = new AmenityRepository();
        $created = $repo->create($this->sampleAmenity());

        $found = $repo->find($created['id']);
        $this->assertEquals('wifi', $found['icon']);
        $this->assertEquals('Free Wi-Fi', $found['title']['en']);
        $this->assertFalse($found['underMaintenance']);
    }

    public function testUnderMaintenanceFlagPersistsAsBoolean(): void
    {
        $repo = new AmenityRepository();
        $created = $repo->create($this->sampleAmenity(['underMaintenance' => true]));
        $found = $repo->find($created['id']);
        $this->assertTrue($found['underMaintenance']);
    }

    public function testUpdateThenDelete(): void
    {
        $repo = new AmenityRepository();
        $created = $repo->create($this->sampleAmenity());

        $updated = $repo->update($created['id'], ['underMaintenance' => true]);
        $this->assertTrue($updated['underMaintenance']);

        $this->assertTrue($repo->delete($created['id']));
        $this->assertNull($repo->find($created['id']));
    }
}
