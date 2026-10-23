<?php

namespace Tests\Services;

use Tests\TestCase;
use App\Services\PriceQuote;

class PriceQuoteTest extends TestCase
{
    public function testFiveNightsAtHundredIsFiveHundred(): void
    {
        $quote = PriceQuote::calculate('2026-10-21', '2026-10-26', 100.0);

        $this->assertSame(5, $quote['nights']);
        $this->assertEquals(100.0, $quote['pricePerNight']);
        $this->assertEquals(500.0, $quote['totalPrice']);
    }

    public function testSingleNight(): void
    {
        $this->assertSame(1, PriceQuote::nights('2026-10-21', '2026-10-22'));
    }

    public function testRangeAcrossMonthAndYearBoundary(): void
    {
        $this->assertSame(4, PriceQuote::nights('2026-12-29', '2027-01-02'));
    }

    // Europe/Sofia switches to winter time on 2026-10-25; a naive
    // seconds / 86400 would come out a fraction short and round down.
    public function testRangeAcrossDaylightSavingChange(): void
    {
        $this->assertSame(5, PriceQuote::nights('2026-10-21', '2026-10-26'));
    }

    public function testFractionalPriceIsRoundedToCents(): void
    {
        $quote = PriceQuote::calculate('2026-10-21', '2026-10-24', 33.333);
        $this->assertEquals(100.0, $quote['totalPrice']);
    }
}
