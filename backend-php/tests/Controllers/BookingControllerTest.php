<?php

namespace Tests\Controllers;

use Tests\TestCase;
use App\Controllers\BookingController;

class BookingControllerTest extends TestCase
{
    private const ROOM = ['capacity' => 3];

    public function testOccupancyWithinTheRoomIsAccepted(): void
    {
        $this->assertSame(
            ['adults' => 2, 'children' => 1, 'babies' => 2],
            BookingController::occupancy(['adults' => 2, 'children' => '1', 'babies' => 2], self::ROOM)
        );
        // Children and babies may be left out.
        $this->assertSame(['adults' => 1, 'children' => 0, 'babies' => 0], BookingController::occupancy(['adults' => 1], self::ROOM));
    }

    public function testBabiesDoNotCountAgainstCapacity(): void
    {
        $this->assertSame(
            ['adults' => 3, 'children' => 0, 'babies' => 1],
            BookingController::occupancy(['adults' => 3, 'children' => 0, 'babies' => 1], self::ROOM)
        );
    }

    public function testOccupancyThatDoesNotFitIsRejected(): void
    {
        foreach ([
            ['adults' => 2, 'children' => 2],     // over capacity
            ['adults' => 0, 'children' => 2],     // no adult
            ['adults' => 1, 'babies' => 3],       // too many babies
            ['adults' => 1, 'children' => -1],
            ['adults' => 1.5],
            ['adults' => 'two'],
        ] as $input) {
            $this->assertFalse(BookingController::occupancy($input, self::ROOM), json_encode($input));
        }
    }

    public function testMissingOccupancyIsAllowed(): void
    {
        $this->assertNull(BookingController::occupancy([], self::ROOM));
        $this->assertNull(BookingController::occupancy(['adults' => ''], self::ROOM));
    }
}
