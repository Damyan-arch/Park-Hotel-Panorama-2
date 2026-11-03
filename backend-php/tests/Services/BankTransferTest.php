<?php

namespace Tests\Services;

use Tests\TestCase;
use App\Services\BankTransfer;

class BankTransferTest extends TestCase
{
    public function tearDown(): void
    {
        BankTransfer::init([]);
    }

    public function testOffUntilIbanAndHolderAreSet(): void
    {
        BankTransfer::init([]);
        $this->assertFalse(BankTransfer::isEnabled());

        BankTransfer::init(['iban' => 'BG91UBBS80021075213550']);
        $this->assertFalse(BankTransfer::isEnabled());

        BankTransfer::init(['iban' => 'BG91UBBS80021075213550', 'holder' => 'Hotel Ltd']);
        $this->assertTrue(BankTransfer::isEnabled());
    }

    public function testInstructionsForABooking(): void
    {
        BankTransfer::init(['iban' => 'bg91 ubbs 8002 1075 2135 50', 'holder' => 'Hotel Ltd', 'bic' => 'ubbsbgsf', 'bank' => 'UBB']);

        $this->assertEquals([
            'holder' => 'Hotel Ltd',
            'iban' => 'BG91 UBBS 8002 1075 2135 50',
            'bic' => 'UBBSBGSF',
            'bank' => 'UBB',
            'amount' => 63.0,
            'currency' => 'EUR',
            'reference' => 'Booking 42',
        ], BankTransfer::instructions(['id' => 42, 'depositAmount' => 63, 'currency' => 'EUR']));
    }
}
