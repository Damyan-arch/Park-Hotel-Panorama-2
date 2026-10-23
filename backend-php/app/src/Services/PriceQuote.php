<?php

namespace App\Services;

// Stay price for a booking request: nights x the room's nightly rate. Computed
// server-side from the room's stored price — the guest's browser only displays
// a preview and its numbers are never trusted.
//
// Check-out day is not charged (check-in 21st, check-out 26th = 5 nights).
class PriceQuote
{
    public static function nights(string $checkIn, string $checkOut): int
    {
        // Midnight-normalised so a stray time component can't shift the count.
        $in = (new \DateTimeImmutable($checkIn))->setTime(0, 0);
        $out = (new \DateTimeImmutable($checkOut))->setTime(0, 0);
        return (int) $in->diff($out)->days;
    }

    // Share of the total taken up front as a card deposit.
    public const DEPOSIT_PERCENT = 30;

    public static function deposit(float $totalPrice): float
    {
        return round($totalPrice * self::DEPOSIT_PERCENT / 100, 2);
    }

    public static function calculate(string $checkIn, string $checkOut, float $pricePerNight): array
    {
        $nights = self::nights($checkIn, $checkOut);
        return [
            'nights' => $nights,
            'pricePerNight' => $pricePerNight,
            'totalPrice' => round($nights * $pricePerNight, 2),
        ];
    }
}
