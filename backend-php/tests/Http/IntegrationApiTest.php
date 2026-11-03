<?php

namespace Tests\Http;

use Tests\TestCase;
use App\Auth\IntegrationAuth;
use App\Db\Database;
use App\Http\Request;
use App\Http\Router;
use App\Repositories\BookingRepository;
use App\Repositories\RoomRepository;

// Drives the real routes.php table through Router, the way Zamboo would
// call /api/integration/v1/* (minus Apache's /api prefix stripping).
class IntegrationApiTest extends TestCase
{
    private const KEY = 'a3f1c9e07b2d4f6a8c1e3b5d7f9a0c2e4b6d8f0a1c3e5b7d9f1a3c5e7b9d1f3a';

    private string $roomId;

    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE booking_requests, rooms CASCADE');
        IntegrationAuth::init(['api_key' => self::KEY]);
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . self::KEY;
        $_GET = [];

        $room = (new RoomRepository())->create([
            'name' => ['en' => 'Double room', 'bg' => 'Двойна стая', 'de' => '', 'es' => '', 'ro' => ''],
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

    public function tearDown(): void
    {
        unset($_SERVER['HTTP_AUTHORIZATION']);
        $_GET = [];
        IntegrationAuth::init([]);
    }

    private function call(string $method, string $path, array $query = []): array
    {
        $_GET = $query;
        $routes = require __DIR__ . '/../../app/routes.php';
        ob_start();
        (new Router($routes))->dispatch(new Request($method, $path));
        return json_decode(ob_get_clean(), true) ?? [];
    }

    // Created in the past, so it's outside the "current second" the feed holds back.
    private function createBooking(string $name, string $updatedAt): array
    {
        $booking = (new BookingRepository())->create([
            'roomId' => $this->roomId, 'roomName' => 'Двойна стая',
            'checkIn' => '2026-11-10', 'checkOut' => '2026-11-12',
            'name' => $name, 'email' => 'guest@example.com', 'phone' => '+359 88 000 0000', 'adults' => 2, 'children' => 1, 'babies' => 0,
            'nights' => 2, 'pricePerNight' => 50.0, 'totalPrice' => 100.0, 'currency' => 'EUR',
            'paymentIntentId' => 'pi_secret_' . $name, 'depositAmount' => 30.0, 'paymentStatus' => 'authorized',
            'status' => 'new',
        ]);
        Database::pdo()->prepare('UPDATE booking_requests SET updated_at = ? WHERE id = ?')
            ->execute([$updatedAt, $booking['id']]);
        return $booking;
    }

    public function testRejectsMissingKey(): void
    {
        unset($_SERVER['HTTP_AUTHORIZATION']);
        $this->assertEquals('Invalid or missing API key.', $this->call('GET', '/integration/v1/bookings')['error']);
    }

    public function testAdminTokenDoesNotOpenIntegrationApi(): void
    {
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer some-admin-session-token';
        $this->assertEquals('Invalid or missing API key.', $this->call('GET', '/integration/v1/rooms')['error']);
    }

    public function testBookingShapeHidesStripeIds(): void
    {
        $created = $this->createBooking('Ivan', '2026-10-01 08:30:00');

        $booking = $this->call('GET', "/integration/v1/bookings/{$created['id']}");
        $this->assertSame($created['id'], $booking['id']);
        $this->assertEquals('Ivan', $booking['guest']['name']);
        $this->assertEquals('2026-11-10', $booking['checkIn']);
        $this->assertSame(2, $booking['nights']);
        $this->assertSame(2, $booking['adults']);
        $this->assertSame(1, $booking['children']);
        $this->assertSame(0, $booking['babies']);
        $this->assertEquals(100.0, $booking['totalPrice']);
        $this->assertEquals('authorized', $booking['paymentStatus']);
        $this->assertEquals('2026-10-01T08:30:00Z', $booking['updatedAt']);
        $this->assertMatchesRegex('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $booking['receivedAt']);
        $this->assertFalse(str_contains(json_encode($booking), 'pi_secret'), 'Stripe intent id must not be exposed');
    }

    public function testUnknownBookingIs404(): void
    {
        $this->assertEquals('Booking not found.', $this->call('GET', '/integration/v1/bookings/999999')['error']);
    }

    public function testFeedPagesWithCursor(): void
    {
        $first = $this->createBooking('First', '2026-10-01 08:00:00');
        $second = $this->createBooking('Second', '2026-10-01 09:00:00');
        $third = $this->createBooking('Third', '2026-10-01 09:00:00');

        $page1 = $this->call('GET', '/integration/v1/bookings', ['limit' => '2']);
        $this->assertEquals([$first['id'], $second['id']], array_column($page1['bookings'], 'id'));
        $this->assertTrue($page1['hasMore']);
        $this->assertEquals("2026-10-01T09:00:00Z_{$second['id']}", $page1['nextCursor']);

        $page2 = $this->call('GET', '/integration/v1/bookings', ['limit' => '2', 'cursor' => $page1['nextCursor']]);
        $this->assertEquals([$third['id']], array_column($page2['bookings'], 'id'));
        $this->assertFalse($page2['hasMore']);

        // Nothing new: same cursor back, empty list.
        $page3 = $this->call('GET', '/integration/v1/bookings', ['cursor' => $page2['nextCursor']]);
        $this->assertCount(0, $page3['bookings']);
        $this->assertEquals($page2['nextCursor'], $page3['nextCursor']);
    }

    public function testStatusChangeReappearsInFeed(): void
    {
        $booking = $this->createBooking('Maria', '2026-10-01 08:00:00');
        $cursor = $this->call('GET', '/integration/v1/bookings')['nextCursor'];

        $updated = $this->call('PATCH', "/integration/v1/bookings/{$booking['id']}");
        $this->assertEquals('status must be one of: new, contacted, rejected.', $updated['error']);

        (new BookingRepository())->updateStatus($booking['id'], 'rejected');
        Database::pdo()->exec("UPDATE booking_requests SET updated_at = '2026-10-02 08:00:00'");

        $feed = $this->call('GET', '/integration/v1/bookings', ['cursor' => $cursor]);
        $this->assertEquals([$booking['id']], array_column($feed['bookings'], 'id'));
        $this->assertEquals('rejected', $feed['bookings'][0]['status']);
    }

    public function testRejectsBadQuery(): void
    {
        $this->assertEquals('Invalid cursor — pass back nextCursor exactly as received.',
            $this->call('GET', '/integration/v1/bookings', ['cursor' => 'yesterday'])['error']);
        $this->assertEquals('limit must be a whole number from 1 to 500.',
            $this->call('GET', '/integration/v1/bookings', ['limit' => '501'])['error']);
    }

    public function testRoomsListsTypesForMapping(): void
    {
        $rooms = $this->call('GET', '/integration/v1/rooms');
        $this->assertCount(1, $rooms);
        $this->assertEquals($this->roomId, $rooms[0]['id']);
        $this->assertEquals('Двойна стая', $rooms[0]['name']['bg']);
        $this->assertEquals(50.0, $rooms[0]['basePricePerNight']);
    }
}
