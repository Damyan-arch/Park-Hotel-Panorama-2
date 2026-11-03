<?php

namespace App\Services;

// The "pay the deposit by bank transfer" option: no payment provider and no
// fees — the guest is given the hotel's IBAN, the amount and a payment
// reference (on screen and by email), and staff mark the booking as paid in
// the admin once the money shows up on the account.
//
// Off until an IBAN and account holder are set in config.local.php.
class BankTransfer
{
    // Our payment_status values for a transfer deposit.
    public const AWAITING = 'awaiting_transfer';
    public const RECEIVED = 'transfer_received';

    private static array $account = ['iban' => '', 'holder' => '', 'bic' => '', 'bank' => ''];

    public static function init(array $config): void
    {
        self::$account = [
            'iban' => strtoupper(preg_replace('/\s+/', '', (string) ($config['iban'] ?? ''))),
            'holder' => trim((string) ($config['holder'] ?? '')),
            'bic' => strtoupper(trim((string) ($config['bic'] ?? ''))),
            'bank' => trim((string) ($config['bank'] ?? '')),
        ];
    }

    public static function isEnabled(): bool
    {
        return self::$account['iban'] !== '' && self::$account['holder'] !== '';
    }

    // Short, ASCII-only, so every bank's form accepts it, and unique per booking
    // so staff can match the incoming payment.
    public static function reference(int $bookingId): string
    {
        return 'Booking ' . $bookingId;
    }

    // "BG91UBBS8002…" → "BG91 UBBS 8002 …", the way it's printed on statements.
    public static function formatIban(string $iban): string
    {
        return trim(chunk_split($iban, 4, ' '));
    }

    // What the guest needs to make the transfer for this booking.
    public static function instructions(array $booking): array
    {
        return [
            'holder' => self::$account['holder'],
            'iban' => self::formatIban(self::$account['iban']),
            'bic' => self::$account['bic'],
            'bank' => self::$account['bank'],
            'amount' => (float) $booking['depositAmount'],
            'currency' => $booking['currency'] ?? 'EUR',
            'reference' => self::reference((int) $booking['id']),
        ];
    }
}
