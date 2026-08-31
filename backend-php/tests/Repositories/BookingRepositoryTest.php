<?php

namespace Tests\Repositories;

use Tests\TestCase;
use App\Db\Database;
use App\Repositories\BookingRepository;
use App\Repositories\RoomRepository;

class BookingRepositoryTest extends TestCase
{
    private string $roomId;

    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE booking_requests, rooms CASCADE');
        $room = (new RoomRepository())->create([
            'name' => ['en' => 'Room', 'bg' => '', 'de' => '', 'es' => '', 'ro' => ''],
            'type' => 'DOUBLE',
            'description' => ['en' => '', 'bg' => '', 'de' => '', 'es' => '', 'ro' => ''],
            'capacity' => 2,
            'sizeSqm' => 20,
            'basePricePerNight' => 50,
            'currency' => 'EUR',
            'imageUrl' => '/x.webp',
        ]);
        $this->roomId = $room['id'];
    }

    private function sampleBooking(array $overrides = []): array
    {
        return array_merge([
            'roomId' => $this->roomId,
            'roomName' => 'Room',
            'checkIn' => '2026-09-10',
            'checkOut' => '2026-09-12',
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => '555-1234',
            'status' => 'new',
        ], $overrides);
    }

    public function testCreateThenFindRoundTrips(): void
    {
        $repo = new BookingRepository();
        $created = $repo->create($this->sampleBooking());

        $found = $repo->find($created['id']);
        $this->assertEquals('Jane Doe', $found['name']);
        $this->assertEquals('jane@example.com', $found['email']);
        $this->assertEquals('new', $found['status']);
        $this->assertNotNull($found['receivedAt']);
    }

    public function testAllOrdersNewestFirst(): void
    {
        $repo = new BookingRepository();
        $first = $repo->create($this->sampleBooking(['name' => 'First']));
        $second = $repo->create($this->sampleBooking(['name' => 'Second']));

        $all = $repo->all();
        $this->assertEquals($second['id'], $all[0]['id']);
        $this->assertEquals($first['id'], $all[1]['id']);
    }

    public function testUpdateStatus(): void
    {
        $repo = new BookingRepository();
        $created = $repo->create($this->sampleBooking());

        $updated = $repo->updateStatus($created['id'], 'confirmed');
        $this->assertEquals('confirmed', $updated['status']);
    }

    public function testUpdateStatusReturnsNullForUnknownId(): void
    {
        $this->assertNull((new BookingRepository())->updateStatus(999999, 'confirmed'));
    }
}
