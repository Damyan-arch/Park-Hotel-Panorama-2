<?php

namespace Tests\Services;

use Tests\TestCase;
use App\Services\BankTransfer;
use App\Services\MailService;

class MailServiceTest extends TestCase
{
    public function tearDown(): void
    {
        BankTransfer::init([]);
    }

    private function booking(array $overrides = []): array
    {
        return $overrides + [
            'id' => 37, 'name' => 'Jane <Doe>', 'email' => 'jane@example.com', 'phone' => null, 'roomName' => 'Double room',
            'checkIn' => '2026-10-28', 'checkOut' => '2026-10-30',
            'nights' => 2, 'pricePerNight' => 70.0, 'totalPrice' => 140.0, 'currency' => 'EUR',
            'depositAmount' => null, 'paymentStatus' => null, 'paymentIntentId' => null,
        ];
    }

    public function testBankTransferDetailsAreInBothVersions(): void
    {
        BankTransfer::init(['holder' => 'Hotel Ltd', 'iban' => 'BG91UBBS80021075213550', 'bic' => 'UBBSBGSF']);
        $mail = MailService::guestConfirmation($this->booking(['depositAmount' => 42.0, 'paymentStatus' => BankTransfer::AWAITING]));

        foreach (['text', 'html'] as $version) {
            foreach (['Данни за банковия превод', 'Bank transfer details', 'Hotel Ltd', 'BG91 UBBS 8002 1075 2135 50', 'UBBSBGSF', '42 EUR', 'Booking 37'] as $expected) {
                $this->assertTrue(str_contains($mail[$version], $expected), "$version is missing '$expected'");
            }
        }
    }

    public function testNoBankBoxWithoutABankTransfer(): void
    {
        BankTransfer::init(['holder' => 'Hotel Ltd', 'iban' => 'BG91UBBS80021075213550']);
        $mail = MailService::guestConfirmation($this->booking());

        $this->assertFalse(str_contains($mail['html'], 'IBAN'));
        $this->assertTrue(str_contains($mail['text'], 'Double room'));
    }

    public function testGuestConfirmationListsEveryKindOfGuestInBothLanguages(): void
    {
        $mail = MailService::guestConfirmation($this->booking(['adults' => 2, 'children' => 1, 'babies' => 0]));

        foreach (['text', 'html'] as $version) {
            foreach ([
                'Гости: 3 души', '– Възрастни (18+ г.): 2', '– Деца (4–17 г.): 1', '– Бебета (0–3 г.): 0',
                'Guests: 3 people', '– Adults (18+): 2', '– Children (4–17): 1', '– Babies (0–3): 0',
            ] as $expected) {
                $this->assertTrue(str_contains($mail[$version], $expected), "$version is missing '$expected'");
            }
        }

        $one = MailService::guestConfirmation($this->booking(['adults' => 1, 'children' => 0, 'babies' => 0]));
        $this->assertTrue(str_contains($one['text'], 'Guests: 1 person'));
        $this->assertTrue(str_contains($one['text'], 'Гости: 1 човек'));

        // Old requests carry no guests: nothing about them is said.
        $this->assertFalse(str_contains(MailService::guestConfirmation($this->booking())['text'], 'Guests:'));
    }

    public function testHotelNotificationListsEveryKindOfGuest(): void
    {
        $mail = MailService::bookingNotification($this->booking(['adults' => 2, 'children' => 0, 'babies' => 1]));

        foreach (['Гости: 3 души', '– Възрастни (18+ г.): 2', '– Деца (4–17 г.): 0', '– Бебета (0–3 г.): 1', 'Име на госта: Jane <Doe>'] as $expected) {
            $this->assertTrue(str_contains($mail['text'], $expected), "missing '$expected'");
        }
        $this->assertTrue(str_contains(MailService::bookingNotification($this->booking())['text'], 'Гости: не са посочени'));
    }

    public function testHtmlEscapesGuestInput(): void
    {
        $mail = MailService::guestConfirmation($this->booking());

        $this->assertTrue(str_contains($mail['html'], 'Jane &lt;Doe&gt;'));
        $this->assertFalse(str_contains($mail['html'], 'Jane <Doe>'));
    }
}
