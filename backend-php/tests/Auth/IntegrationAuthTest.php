<?php

namespace Tests\Auth;

use Tests\TestCase;
use App\Auth\IntegrationAuth;
use App\Http\Request;

class IntegrationAuthTest extends TestCase
{
    private const KEY = 'a3f1c9e07b2d4f6a8c1e3b5d7f9a0c2e4b6d8f0a1c3e5b7d9f1a3c5e7b9d1f3a';

    public function tearDown(): void
    {
        unset($_SERVER['HTTP_AUTHORIZATION']);
        IntegrationAuth::init([]);
    }

    private function requestWithBearer(?string $token): Request
    {
        if ($token !== null) {
            $_SERVER['HTTP_AUTHORIZATION'] = "Bearer $token";
        } else {
            unset($_SERVER['HTTP_AUTHORIZATION']);
        }
        return new Request('GET', '/integration/v1/bookings');
    }

    public function testAcceptsConfiguredKey(): void
    {
        IntegrationAuth::init(['api_key' => self::KEY]);
        $this->assertTrue(IntegrationAuth::check($this->requestWithBearer(self::KEY)));
    }

    public function testRejectsWrongKey(): void
    {
        IntegrationAuth::init(['api_key' => self::KEY]);
        $this->assertFalse(IntegrationAuth::check($this->requestWithBearer(strrev(self::KEY))));
    }

    public function testRejectsMissingKey(): void
    {
        IntegrationAuth::init(['api_key' => self::KEY]);
        $this->assertFalse(IntegrationAuth::check($this->requestWithBearer(null)));
    }

    public function testDisabledWhenKeyNotConfigured(): void
    {
        IntegrationAuth::init(['api_key' => '']);
        $this->assertFalse(IntegrationAuth::isEnabled());
        // An empty bearer must not match an empty configured key.
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ';
        $this->assertFalse(IntegrationAuth::check(new Request('GET', '/integration/v1/bookings')));
    }

    public function testShortKeyKeepsApiDisabled(): void
    {
        IntegrationAuth::init(['api_key' => 'test']); // logs a warning to stderr — expected

        $this->assertFalse(IntegrationAuth::isEnabled());
        $this->assertFalse(IntegrationAuth::check($this->requestWithBearer('test')));
    }
}
