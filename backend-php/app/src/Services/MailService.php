<?php

namespace App\Services;

// Notifies the hotel by email when a booking request or contact enquiry comes
// in, using PHP's built-in mail() — no SMTP credentials, no Composer
// dependency, matching this backend's zero-third-party-dependency style.
//
// Never throws: a mail failure must never block the guest's confirmation. Note
// that mail() reports failure as a PHP *warning*, which bootstrap.php's
// set_error_handler turns into an ErrorException — so the catch blocks here are
// load-bearing, not decorative, and must stay `\Throwable` (unqualified
// `Throwable` would resolve to App\Services\Throwable and never match).
//
// Written in Bulgarian: only hotel staff read these.
class MailService
{
    private static string $notifyTo = '';
    private static string $contactNotifyTo = '';
    private static string $fromEmail = '';
    private static string $fromName = 'Park Hotel Panorama';
    private static string $hotelPhone = '+359 897 820 065';

    // date('F') is English-only and strftime() is deprecated as of PHP 8.1, so
    // the month names are spelled out here rather than pulled from a locale
    // that SiteGround may not have installed.
    private const MONTHS_BG = [
        1 => 'януари', 2 => 'февруари', 3 => 'март', 4 => 'април',
        5 => 'май', 6 => 'юни', 7 => 'юли', 8 => 'август',
        9 => 'септември', 10 => 'октомври', 11 => 'ноември', 12 => 'декември',
    ];

    public static function init(array $config): void
    {
        self::$notifyTo = trim($config['notify_to'] ?? '');
        // Contact enquiries can go to a different inbox than booking requests;
        // falls back to notify_to so a single-address setup still works.
        self::$contactNotifyTo = trim($config['contact_notify_to'] ?? '') ?: self::$notifyTo;
        self::$fromEmail = trim($config['from_email'] ?? '');
        self::$fromName = $config['from_name'] ?? 'Park Hotel Panorama';
        self::$hotelPhone = trim($config['hotel_phone'] ?? '') ?: '+359 897 820 065';
    }

    // '2026-11-14' -> '14 November 2026', for the English half of the guest email.
    private static function formatDateEn(?string $date): string
    {
        $ts = strtotime((string) $date);
        return $ts === false ? (string) $date : date('j F Y', $ts);
    }

    // '2026-11-14' -> '14 ноември 2026 г.', matching how the site itself renders
    // dates in Bulgarian. Falls back to the raw value if it won't parse, so a
    // malformed date never costs us the whole notification.
    private static function formatDateBg(?string $date): string
    {
        $ts = strtotime((string) $date);
        if ($ts === false) return (string) $date;

        return sprintf(
            '%d %s %d г.',
            (int) date('j', $ts),
            self::MONTHS_BG[(int) date('n', $ts)],
            (int) date('Y', $ts)
        );
    }

    // '500.0' -> '500 EUR', '99.5' -> '99.50 EUR'. Whole amounts drop the
    // decimals, matching how the site shows room prices.
    private static function formatMoney(float $amount, ?string $currency): string
    {
        $decimals = floor($amount) == $amount ? 0 : 2;
        return number_format($amount, $decimals, '.', '') . ' ' . ($currency ?: 'EUR');
    }

    // '5 нощувки × 100 EUR = 500 EUR' / '5 nights × 100 EUR = 500 EUR'.
    // Null for requests that carry no quote.
    private static function priceSummary(array $booking, string $lang): ?string
    {
        if (($booking['totalPrice'] ?? null) === null || empty($booking['nights'])) return null;

        $nights = (int) $booking['nights'];
        $perNight = self::formatMoney((float) $booking['pricePerNight'], $booking['currency'] ?? null);
        $total = self::formatMoney((float) $booking['totalPrice'], $booking['currency'] ?? null);

        $label = $lang === 'bg'
            ? $nights . ($nights === 1 ? ' нощувка' : ' нощувки')
            : $nights . ($nights === 1 ? ' night' : ' nights');
        return "$label × $perNight = $total";
    }

    // A non-ASCII subject must be MIME-encoded or mail clients show mojibake.
    private static function encodeSubject(string $subject): string
    {
        if (function_exists('mb_encode_mimeheader')) {
            return mb_encode_mimeheader($subject, 'UTF-8', 'B');
        }
        return '=?UTF-8?B?' . base64_encode($subject) . '?=';
    }

    private static function fromHeader(): string
    {
        return self::$fromEmail !== ''
            ? sprintf('%s <%s>', self::$fromName, self::$fromEmail)
            : self::$fromName;
    }

    public static function sendBookingNotification(array $booking): void
    {
        if (self::$notifyTo === '') {
            error_log('MailService: mail.notify_to is not configured — skipping booking notification email.');
            return;
        }

        try {
            $subject = 'Нова заявка за резервация: ' . $booking['roomName'];
            $lines = [
                'Получена е нова заявка за резервация.',
                '',
                "Стая: {$booking['roomName']}",
                'Настаняване: ' . self::formatDateBg($booking['checkIn']),
                'Напускане: ' . self::formatDateBg($booking['checkOut']),
            ];
            if ($price = self::priceSummary($booking, 'bg')) {
                $lines[] = "Цена: $price";
            }
            $lines = array_merge($lines, [
                "Гост: {$booking['name']}",
                "Имейл: {$booking['email']}",
                'Телефон: ' . ($booking['phone'] ?: '—'),
                '',
                'Прегледайте я в администраторския панел, раздел Booking Requests.',
            ]);

            $headers = [
                'From: ' . self::fromHeader(),
                'Reply-To: ' . $booking['email'],
                'Content-Type: text/plain; charset=UTF-8',
            ];

            $sent = mail(
                self::$notifyTo,
                self::encodeSubject($subject),
                implode("\r\n", $lines),
                implode("\r\n", $headers)
            );
            if (!$sent) {
                error_log('MailService: mail() returned false sending booking notification for booking #' . ($booking['id'] ?? '?'));
            }
        } catch (\Throwable $e) {
            error_log('MailService: failed to send booking notification. ' . $e->getMessage());
        }
    }

    // Sent to the guest, unlike the two notifications above. Bilingual because
    // the booking request doesn't record which of the site's five languages the
    // guest was browsing in — Bulgarian first, English second, so most guests
    // can read at least one half. $booking['roomName'] is deliberately the name
    // as the GUEST saw it, not the Bulgarian override used for staff.
    public static function sendGuestBookingConfirmation(array $booking): void
    {
        $to = trim($booking['email'] ?? '');
        if ($to === '') return;

        try {
            $subject = 'Получихме Вашата заявка · We received your request — Park Hotel Panorama';
            $lines = [
                "Здравейте, {$booking['name']},",
                '',
                'Получихме Вашата заявка за резервация. Това НЕ е потвърждение —',
                'ще се свържем с Вас скоро, за да потвърдим наличността.',
                '',
                "Стая: {$booking['roomName']}",
                'Настаняване: ' . self::formatDateBg($booking['checkIn']),
                'Напускане: ' . self::formatDateBg($booking['checkOut']),
            ];
            if ($price = self::priceSummary($booking, 'bg')) {
                $lines[] = "Обща цена: $price";
            }
            $lines = array_merge($lines, [
                '',
                'Ако нещо трябва да се промени, отговорете на този имейл',
                'или ни се обадете на ' . self::$hotelPhone . '.',
                '',
                str_repeat('-', 48),
                '',
                "Hello {$booking['name']},",
                '',
                'We have received your booking request. This is NOT a confirmation —',
                'we will contact you shortly to confirm availability.',
                '',
                "Room: {$booking['roomName']}",
                'Check-in: ' . self::formatDateEn($booking['checkIn']),
                'Check-out: ' . self::formatDateEn($booking['checkOut']),
            ]);
            if ($price = self::priceSummary($booking, 'en')) {
                $lines[] = "Total price: $price";
            }
            $lines = array_merge($lines, [
                '',
                'If anything needs changing, reply to this email',
                'or call us on ' . self::$hotelPhone . '.',
                '',
                'Park Hotel Panorama',
                'Трявна, България · Tryavna, Bulgaria',
            ]);

            $headers = [
                'From: ' . self::fromHeader(),
                // Replies must reach the hotel, not the unattended noreply box.
                'Reply-To: ' . (self::$notifyTo !== '' ? self::$notifyTo : self::fromHeader()),
                'Content-Type: text/plain; charset=UTF-8',
            ];

            $sent = mail(
                $to,
                self::encodeSubject($subject),
                implode("\r\n", $lines),
                implode("\r\n", $headers)
            );
            if (!$sent) {
                error_log('MailService: mail() returned false sending guest confirmation for booking #' . ($booking['id'] ?? '?'));
            }
        } catch (\Throwable $e) {
            error_log('MailService: failed to send guest confirmation. ' . $e->getMessage());
        }
    }

    public static function sendContactNotification(array $inquiry): void
    {
        if (self::$contactNotifyTo === '') {
            error_log('MailService: no contact_notify_to/notify_to configured — skipping contact notification email.');
            return;
        }

        try {
            $subject = 'Ново запитване от сайта: ' . $inquiry['name'];
            $lines = [
                'Получено е ново запитване през формата за контакт.',
                '',
                "Име: {$inquiry['name']}",
                "Имейл: {$inquiry['email']}",
                'Телефон: ' . ($inquiry['phone'] ?: '—'),
            ];
            // Only shown when the enquiry was about a specific room.
            if (!empty($inquiry['roomName'])) {
                $lines[] = "Стая: {$inquiry['roomName']}";
            }
            $lines[] = '';
            $lines[] = 'Съобщение:';
            $lines[] = (string) $inquiry['message'];
            $lines[] = '';
            $lines[] = 'Прегледайте го в администраторския панел, раздел Inquiries.';

            $headers = [
                'From: ' . self::fromHeader(),
                'Reply-To: ' . $inquiry['email'],
                'Content-Type: text/plain; charset=UTF-8',
            ];

            $sent = mail(
                self::$contactNotifyTo,
                self::encodeSubject($subject),
                implode("\r\n", $lines),
                implode("\r\n", $headers)
            );
            if (!$sent) {
                error_log('MailService: mail() returned false sending contact notification for inquiry #' . ($inquiry['id'] ?? '?'));
            }
        } catch (\Throwable $e) {
            error_log('MailService: failed to send contact notification. ' . $e->getMessage());
        }
    }
}
