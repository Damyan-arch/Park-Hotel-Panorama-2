<?php

namespace App\Services;

// Notifies the hotel by email when a booking request comes in, using PHP's
// built-in mail() — no SMTP credentials, no Composer dependency, matching this
// backend's zero-third-party-dependency style. Never throws: a mail failure
// must never block the guest's booking confirmation.
class MailService
{
    private static string $notifyTo = '';
    private static string $fromEmail = '';
    private static string $fromName = 'Park Hotel Panorama';

    public static function init(array $config): void
    {
        self::$notifyTo = trim($config['notify_to'] ?? '');
        self::$fromEmail = trim($config['from_email'] ?? '');
        self::$fromName = $config['from_name'] ?? 'Park Hotel Panorama';
    }

    public static function sendBookingNotification(array $booking): void
    {
        if (self::$notifyTo === '') {
            error_log('MailService: mail.notify_to is not configured — skipping booking notification email.');
            return;
        }

        try {
            $subject = 'New booking request: ' . $booking['roomName'];
            $lines = [
                "A new booking request has been submitted.",
                "",
                "Room: {$booking['roomName']}",
                "Check-in: {$booking['checkIn']}",
                "Check-out: {$booking['checkOut']}",
                "Guest: {$booking['name']}",
                "Email: {$booking['email']}",
                "Phone: " . ($booking['phone'] ?: '—'),
                "",
                "Review it in the admin dashboard under Booking Requests.",
            ];
            $body = implode("\r\n", $lines);

            $fromHeader = self::$fromEmail !== ''
                ? sprintf('%s <%s>', self::$fromName, self::$fromEmail)
                : self::$fromName;

            $headers = [
                'From: ' . $fromHeader,
                'Reply-To: ' . $booking['email'],
                'Content-Type: text/plain; charset=UTF-8',
            ];

            $sent = mail(self::$notifyTo, $subject, $body, implode("\r\n", $headers));
            if (!$sent) {
                error_log('MailService: mail() returned false sending booking notification for booking #' . ($booking['id'] ?? '?'));
            }
        } catch (\Throwable $e) {
            error_log('MailService: failed to send booking notification. ' . $e->getMessage());
        }
    }
}
