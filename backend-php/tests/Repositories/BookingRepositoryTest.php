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

    public function testPriceQuoteRoundTrips(): void
    {
        $repo = new BookingRepository();
        $created = $repo->create($this->sampleBooking([
            'nights' => 5, 'pricePerNight' => 100.0, 'totalPrice' => 500.0, 'currency' => 'EUR',
        ]));

        $this->assertSame(5, $created['nights']);
        $this->assertEquals(100.0, $created['pricePerNight']);
        $this->assertEquals(500.0, $created['totalPrice']);
        $this->assertEquals('EUR', $created['currency']);
    }

    public function testGuestsRoundTrip(): void
    {
        $repo = new BookingRepository();

        $created = $repo->create($this->sampleBooking(['adults' => 2, 'children' => 1, 'babies' => 0]));
        $this->assertSame(2, $created['adults']);
        $this->assertSame(1, $created['children']);
        $this->assertSame(0, $created['babies']);

        $old = $repo->create($this->sampleBooking());
        $this->assertNull($old['adults']);
        $this->assertNull($old['babies']);
    }

    public function testBookingWithoutQuoteHasNullPrice(): void
    {
        $created = (new BookingRepository())->create($this->sampleBooking());

        $this->assertNull($created['nights']);
        $this->assertNull($created['totalPrice']);
    }

    public function testUpdatePaymentStatus(): void
    {
        $repo = new BookingRepository();
        $created = $repo->create($this->sampleBooking([
            'paymentIntentId' => 'pi_test_1', 'depositAmount' => 15.0, 'paymentStatus' => 'authorized',
        ]));

        $repo->updatePaymentStatus($created['id'], 'captured');
        $this->assertEquals('captured', $repo->find($created['id'])['paymentStatus']);
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

    public function testStatusAndPaymentUpdatesBumpUpdatedAt(): void
    {
        $repo = new BookingRepository();
        $created = $repo->create($this->sampleBooking(['paymentStatus' => 'authorized']));
        Database::pdo()->exec("UPDATE booking_requests SET updated_at = '2026-01-01 00:00:00'");

        $repo->updateStatus($created['id'], 'contacted');
        $this->assertTrue(strtotime($repo->find($created['id'])['updatedAt']) > strtotime('2026-01-02'));

        Database::pdo()->exec("UPDATE booking_requests SET updated_at = '2026-01-01 00:00:00'");
        $repo->updatePaymentStatus($created['id'], 'captured');
        $this->assertTrue(strtotime($repo->find($created['id'])['updatedAt']) > strtotime('2026-01-02'));
    }

    public function testChangedSinceUsesUpdatedAtAndIdAsCursor(): void
    {
        $repo = new BookingRepository();
        $a = $repo->create($this->sampleBooking(['name' => 'A']));
        $b = $repo->create($this->sampleBooking(['name' => 'B']));
        $c = $repo->create($this->sampleBooking(['name' => 'C']));
        $pdo = Database::pdo();
        // A and C share a second; B is later — order is (updated_at, id).
        $pdo->exec("UPDATE booking_requests SET updated_at = '2026-05-01 10:00:00' WHERE id IN ({$a['id']}, {$c['id']})");
        $pdo->exec("UPDATE booking_requests SET updated_at = '2026-05-01 11:00:00' WHERE id = {$b['id']}");

        $all = $repo->changedSince(null, 0, '2026-06-01 00:00:00', 10);
        $this->assertEquals([$a['id'], $c['id'], $b['id']], array_column($all, 'id'));

        $afterA = $repo->changedSince('2026-05-01 10:00:00', $a['id'], '2026-06-01 00:00:00', 10);
        $this->assertEquals([$c['id'], $b['id']], array_column($afterA, 'id'));

        $this->assertCount(1, $repo->changedSince(null, 0, '2026-06-01 00:00:00', 1));
    }

    public function testChangedSinceExcludesTheCurrentSecond(): void
    {
        $repo = new BookingRepository();
        $repo->create($this->sampleBooking());
        Database::pdo()->exec("UPDATE booking_requests SET updated_at = '2026-05-01 10:00:00'");

        $this->assertCount(0, $repo->changedSince(null, 0, '2026-05-01 10:00:00', 10));
        $this->assertCount(1, $repo->changedSince(null, 0, '2026-05-01 10:00:01', 10));
    }

    public function testUpdateStatusReturnsNullForUnknownId(): void
    {
        $this->assertNull((new BookingRepository())->updateStatus(999999, 'confirmed'));
    }
}
