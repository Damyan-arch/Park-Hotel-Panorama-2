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

    // Who the stay is for: the total, then every kind of guest — zeros
    // included, so "no children" is stated rather than left to be inferred:
    //   Гости: 3 души
    //   – Възрастни (18+ г.): 2
    //   – Деца (4–17 г.): 1
    //   – Бебета (0–3 г.): 0
    // Null for requests made before the guests were asked for.
    private static function guestsLines(array $booking, string $lang): ?array
    {
        if (($booking['adults'] ?? null) === null) return null;

        $bg = $lang === 'bg';
        $counts = array_map(fn ($key) => (int) ($booking[$key] ?? 0), ['adults' => 'adults', 'children' => 'children', 'babies' => 'babies']);
        $total = array_sum($counts);
        $labels = $bg
            ? ['adults' => 'Възрастни (18+ г.)', 'children' => 'Деца (4–17 г.)', 'babies' => 'Бебета (0–3 г.)']
            : ['adults' => 'Adults (18+)', 'children' => 'Children (4–17)', 'babies' => 'Babies (0–3)'];

        $lines = [$bg
            ? 'Гости: ' . $total . ($total === 1 ? ' човек' : ' души')
            : 'Guests: ' . $total . ($total === 1 ? ' person' : ' people')];
        foreach ($labels as $key => $label) {
            $lines[] = "– $label: {$counts[$key]}";
        }
        return $lines;
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
            $mail = self::bookingNotification($booking);
            $headers = [
                'From: ' . self::fromHeader(),
                'Reply-To: ' . $booking['email'],
                'Content-Type: text/plain; charset=UTF-8',
            ];

            $sent = mail(
                self::$notifyTo,
                self::encodeSubject($mail['subject']),
                $mail['text'],
                implode("\r\n", $headers)
            );
            if (!$sent) {
                error_log('MailService: mail() returned false sending booking notification for booking #' . ($booking['id'] ?? '?'));
            }
        } catch (\Throwable $e) {
            error_log('MailService: failed to send booking notification. ' . $e->getMessage());
        }
    }

    // The hotel's notification as ['subject', 'text'].
    public static function bookingNotification(array $booking): array
    {
        $subject = 'Нова заявка за резервация: ' . $booking['roomName'];
        $lines = [
            'Получена е нова заявка за резервация.',
            '',
            "Стая: {$booking['roomName']}",
            'Настаняване: ' . self::formatDateBg($booking['checkIn']),
            'Напускане: ' . self::formatDateBg($booking['checkOut']),
        ];
        $lines = array_merge($lines, self::guestsLines($booking, 'bg') ?? ['Гости: не са посочени (стара заявка)']);
        if ($price = self::priceSummary($booking, 'bg')) {
            $lines[] = "Цена: $price";
        }
        if (($booking['paymentStatus'] ?? null) === BankTransfer::AWAITING) {
            $lines[] = sprintf(
                'Депозит %d%%: %s — по банков превод, още не е получен (основание: %s)',
                PriceQuote::DEPOSIT_PERCENT,
                self::formatMoney((float) $booking['depositAmount'], $booking['currency'] ?? null),
                BankTransfer::reference((int) $booking['id'])
            );
        } elseif (($booking['depositAmount'] ?? null) !== null) {
            $lines[] = sprintf(
                'Депозит %d%%: %s — блокиран по картата, не е таксуван (Stripe: %s)',
                PriceQuote::DEPOSIT_PERCENT,
                self::formatMoney((float) $booking['depositAmount'], $booking['currency'] ?? null),
                $booking['paymentIntentId'] ?? '—'
            );
        }
        $lines = array_merge($lines, [
            "Име на госта: {$booking['name']}",
            "Имейл: {$booking['email']}",
            'Телефон: ' . ($booking['phone'] ?: '—'),
            '',
            'Прегледайте я в администраторския панел, раздел Booking Requests.',
        ]);

        return ['subject' => $subject, 'text' => implode("\r\n", $lines)];
    }

    // Sent to the guest, unlike the two notifications above. Bilingual because
    // the booking request doesn't record which of the site's five languages the
    // guest was browsing in — Bulgarian first, English second, so most guests
    // can read at least one half. $booking['roomName'] is deliberately the name
    // as the GUEST saw it, not the Bulgarian override used for staff.
    //
    // Sent as HTML (with a plain-text copy for clients that don't show HTML), so
    // the bank-transfer details appear in the same box as on the website.
    public static function sendGuestBookingConfirmation(array $booking): void
    {
        $to = trim($booking['email'] ?? '');
        if ($to === '') return;

        try {
            $mail = self::guestConfirmation($booking);
            $boundary = 'php-' . bin2hex(random_bytes(12));
            $headers = [
                'From: ' . self::fromHeader(),
                // Replies must reach the hotel, not the unattended noreply box.
                'Reply-To: ' . (self::$notifyTo !== '' ? self::$notifyTo : self::fromHeader()),
                'MIME-Version: 1.0',
                "Content-Type: multipart/alternative; boundary=\"$boundary\"",
            ];
            $part = fn (string $type, string $content) => "--$boundary\r\n"
                . "Content-Type: $type; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: base64\r\n\r\n"
                . chunk_split(base64_encode($content));
            $body = $part('text/plain', $mail['text']) . $part('text/html', $mail['html']) . "--$boundary--";

            $sent = mail($to, self::encodeSubject($mail['subject']), $body, implode("\r\n", $headers));
            if (!$sent) {
                error_log('MailService: mail() returned false sending guest confirmation for booking #' . ($booking['id'] ?? '?'));
            }
        } catch (\Throwable $e) {
            error_log('MailService: failed to send guest confirmation. ' . $e->getMessage());
        }
    }

    // The guest confirmation as ['subject', 'text', 'html']. The content is a
    // list of parts — lines of text, a divider, or the bank-transfer box — so
    // the plain-text and HTML versions always say the same thing.
    public static function guestConfirmation(array $booking): array
    {
        $parts = array_merge(
            self::guestConfirmationParts($booking, 'bg'),
            [['rule']],
            self::guestConfirmationParts($booking, 'en'),
            [['lines', ['Park Hotel Panorama', 'Трявна, България · Tryavna, Bulgaria']]]
        );

        return [
            'subject' => 'Получихме Вашата заявка · We received your request — Park Hotel Panorama',
            'text' => self::partsToText($parts),
            'html' => self::partsToHtml($parts),
        ];
    }

    private static function guestConfirmationParts(array $booking, string $lang): array
    {
        $bg = $lang === 'bg';
        $date = fn ($d) => $bg ? self::formatDateBg($d) : self::formatDateEn($d);
        $parts = [
            ['lines', [$bg ? "Здравейте, {$booking['name']}," : "Hello {$booking['name']},"]],
            ['lines', [$bg
                ? 'Получихме Вашата заявка за резервация. Това НЕ е потвърждение — ще се свържем с Вас скоро, за да потвърдим наличността.'
                : 'We have received your booking request. This is NOT a confirmation — we will contact you shortly to confirm availability.']],
        ];

        $details = [
            ($bg ? 'Стая: ' : 'Room: ') . $booking['roomName'],
            ($bg ? 'Настаняване: ' : 'Check-in: ') . $date($booking['checkIn']),
            ($bg ? 'Напускане: ' : 'Check-out: ') . $date($booking['checkOut']),
        ];
        $details = array_merge($details, self::guestsLines($booking, $lang) ?? []);
        if ($price = self::priceSummary($booking, $lang)) {
            $details[] = ($bg ? 'Обща цена: ' : 'Total price: ') . $price;
        }
        $parts[] = ['lines', $details];

        if (($booking['paymentStatus'] ?? null) === BankTransfer::AWAITING) {
            $parts[] = ['bank', $booking, $lang];
        } elseif (($booking['depositAmount'] ?? null) !== null) {
            $deposit = self::formatMoney((float) $booking['depositAmount'], $booking['currency'] ?? null);
            $parts[] = ['lines', $bg
                ? ["Блокирана сума по картата (депозит): $deposit", 'Тя се таксува само ако потвърдим резервацията; в противен случай блокадата се освобождава.']
                : ["Amount held on your card (deposit): $deposit", 'It is only charged if we confirm your booking; otherwise the hold is released.']];
        }

        $parts[] = ['lines', [$bg
            ? 'Ако нещо трябва да се промени, отговорете на този имейл или ни се обадете на ' . self::$hotelPhone . '.'
            : 'If anything needs changing, reply to this email or call us on ' . self::$hotelPhone . '.']];
        return $parts;
    }

    // The bank-transfer details as label => value rows, plus the heading and note
    // — the same wording as the box on the website.
    private static function bankTransferRows(array $booking, string $lang): array
    {
        $t = BankTransfer::instructions($booking);
        $bg = $lang === 'bg';
        $rows = [($bg ? 'Получател' : 'Recipient') => $t['holder'], 'IBAN' => $t['iban']];
        if ($t['bic'] !== '') $rows['BIC'] = $t['bic'];
        if ($t['bank'] !== '') $rows[$bg ? 'Банка' : 'Bank'] = $t['bank'];
        $rows[$bg ? 'Сума' : 'Amount'] = self::formatMoney($t['amount'], $t['currency']);
        $rows[$bg ? 'Основание' : 'Payment reference'] = $t['reference'];

        return [
            'title' => $bg ? 'Данни за банковия превод' : 'Bank transfer details',
            'intro' => $bg ? 'Моля, преведете депозита по сметка:' : 'Please transfer the deposit to:',
            'rows' => $rows,
            'note' => $bg
                ? 'Моля, посочете основанието, за да разпознаем превода Ви.'
                : 'Please include the payment reference so we can match your transfer.',
        ];
    }

    private static function partsToText(array $parts): string
    {
        $blocks = [];
        foreach ($parts as $part) {
            switch ($part[0]) {
                case 'lines':
                    $blocks[] = implode("\r\n", $part[1]);
                    break;
                case 'rule':
                    $blocks[] = str_repeat('-', 48);
                    break;
                case 'bank':
                    $box = self::bankTransferRows($part[1], $part[2] ?? 'bg');
                    $lines = [$box['title'], $box['intro']];
                    foreach ($box['rows'] as $label => $value) $lines[] = "  $label: $value";
                    $lines[] = $box['note'];
                    $blocks[] = implode("\r\n", $lines);
                    break;
            }
        }
        return implode("\r\n\r\n", $blocks);
    }

    private static function partsToHtml(array $parts): string
    {
        $e = fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
        $html = '';
        foreach ($parts as $part) {
            switch ($part[0]) {
                case 'lines':
                    $html .= '<p style="margin:0 0 16px">' . implode('<br>', array_map($e, $part[1])) . '</p>';
                    break;
                case 'rule':
                    $html .= '<hr style="border:0;border-top:1px solid #e6e2da;margin:28px 0">';
                    break;
                case 'bank':
                    $box = self::bankTransferRows($part[1], $part[2] ?? 'bg');
                    $rows = '';
                    foreach ($box['rows'] as $label => $value) {
                        $rows .= '<tr>'
                            . '<td style="padding:7px 0;border-bottom:1px dashed #e0dbd1;color:#58534a;font-size:14px">' . $e($label) . '</td>'
                            . '<td style="padding:7px 0;border-bottom:1px dashed #e0dbd1;color:#201e1a;font-size:14px;font-weight:700;text-align:right">' . $e($value) . '</td>'
                            . '</tr>';
                    }
                    $html .= '<div style="margin:0 0 16px;padding:16px 18px;border:1px solid #e6e2da;border-radius:12px;background:#faf6ee">'
                        . '<div style="margin:0 0 4px;font-size:15px;font-weight:700;color:#201e1a">' . $e($box['title']) . '</div>'
                        . '<div style="margin:0 0 8px;font-size:13px;color:#58534a">' . $e($box['intro']) . '</div>'
                        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' . $rows . '</table>'
                        . '<div style="margin-top:10px;font-size:12px;line-height:1.45;color:#85806f">' . $e($box['note']) . '</div>'
                        . '</div>';
                    break;
            }
        }
        return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
            . '<body style="margin:0;padding:24px 12px;background:#f6f1e7">'
            . '<div style="max-width:560px;margin:0 auto;padding:28px 24px;background:#fffdf9;border-radius:14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#201e1a">'
            . $html
            . '</div></body></html>';
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
