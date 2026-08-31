<?php

namespace Tests\Repositories;

use Tests\TestCase;
use App\Db\Database;
use App\Repositories\RoomRepository;

class RoomRepositoryTest extends TestCase
{
    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE rooms CASCADE');
    }

    private function sampleRoom(array $overrides = []): array
    {
        return array_merge([
            'name' => ['en' => 'Test Room', 'bg' => 'Тестова стая', 'de' => '', 'es' => '', 'ro' => ''],
            'type' => 'DOUBLE',
            'description' => ['en' => 'A room.', 'bg' => '', 'de' => '', 'es' => '', 'ro' => ''],
            'capacity' => 2,
            'sizeSqm' => 20,
            'basePricePerNight' => 99.5,
            'currency' => 'EUR',
            'imageUrl' => '/images/rooms/test.webp',
        ], $overrides);
    }

    public function testCreateThenFindRoundTrips(): void
    {
        $repo = new RoomRepository();
        $created = $repo->create($this->sampleRoom());

        $found = $repo->find($created['id']);
        $this->assertNotNull($found);
        $this->assertEquals('Test Room', $found['name']['en']);
        $this->assertEquals('Тестова стая', $found['name']['bg']);
        $this->assertEquals('DOUBLE', $found['type']);
        $this->assertEquals(2, $found['capacity']);
        $this->assertEquals(20, $found['sizeSqm']);
        $this->assertEquals(99.5, $found['basePricePerNight']);
        $this->assertEquals('EUR', $found['currency']);
    }

    public function testCreatePreservesGivenId(): void
    {
        // rooms.id is a real Postgres `uuid` column — must be valid UUID format,
        // unlike events/amenities whose id column is a plain varchar.
        $legacyId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
        $repo = new RoomRepository();
        $created = $repo->create($this->sampleRoom(['id' => $legacyId]));
        $this->assertEquals($legacyId, $created['id']);
    }

    public function testFindReturnsNullForUnknownId(): void
    {
        $this->assertNull((new RoomRepository())->find('00000000-0000-0000-0000-000000000000'));
    }

    public function testUpdatePatchesOnlyGivenFields(): void
    {
        $repo = new RoomRepository();
        $created = $repo->create($this->sampleRoom());

        $updated = $repo->update($created['id'], ['capacity' => 4]);

        $this->assertEquals(4, $updated['capacity']);
        $this->assertEquals('Test Room', $updated['name']['en']); // untouched
    }

    public function testUpdateReturnsNullForUnknownId(): void
    {
        $this->assertNull((new RoomRepository())->update('00000000-0000-0000-0000-000000000000', ['capacity' => 1]));
    }

    public function testDeleteRemovesRoomAndReturnsTrue(): void
    {
        $repo = new RoomRepository();
        $created = $repo->create($this->sampleRoom());

        $this->assertTrue($repo->delete($created['id']));
        $this->assertNull($repo->find($created['id']));
    }

    public function testDeleteReturnsFalseForUnknownId(): void
    {
        $this->assertFalse((new RoomRepository())->delete('00000000-0000-0000-0000-000000000000'));
    }

    public function testAllReturnsEveryCreatedRoom(): void
    {
        $repo = new RoomRepository();
        $repo->create($this->sampleRoom());
        $repo->create($this->sampleRoom());

        $this->assertCount(2, $repo->all());
    }
}
