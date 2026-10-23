<?php

namespace Tests\Services;

use Tests\TestCase;
use App\Services\PriceQuote;
use App\Services\StripeService;

class StripeServiceTest extends TestCase
{
    public function tearDown(): void
    {
        StripeService::setTransport(null);
        StripeService::init([]);
    }

    public function testDisabledUntilBothKeysAreSet(): void
    {
        StripeService::init([]);
        $this->assertFalse(StripeService::isEnabled());

        StripeService::init(['publishable_key' => 'pk_test_x']);
        $this->assertFalse(StripeService::isEnabled());

        StripeService::init(['publishable_key' => 'pk_test_x', 'secret_key' => 'sk_test_x']);
        $this->assertTrue(StripeService::isEnabled());
    }

    public function testDepositIsThirtyPercentOfTotal(): void
    {
        $this->assertEquals(165.0, PriceQuote::deposit(550.0));
        $this->assertEquals(255.0, PriceQuote::deposit(850.0));
        $this->assertEquals(10.01, PriceQuote::deposit(33.37));
    }

    public function testCreateDepositIntentRequestsManualCapture(): void
    {
        $seen = null;
        StripeService::setTransport(function ($method, $path, $params) use (&$seen) {
            $seen = [$method, $path, $params];
            return ['id' => 'pi_1', 'client_secret' => 'pi_1_secret'];
        });

        $intent = StripeService::createDepositIntent(16500, 'EUR', ['roomId' => 'r1']);

        $this->assertEquals('pi_1', $intent['id']);
        $this->assertEquals('POST', $seen[0]);
        $this->assertEquals('/payment_intents', $seen[1]);
        $this->assertSame(16500, $seen[2]['amount']);
        $this->assertEquals('eur', $seen[2]['currency']);
        $this->assertEquals('manual', $seen[2]['capture_method']);
    }

    private function heldIntent(array $overrides = []): array
    {
        return array_merge([
            'status' => 'requires_capture',
            'amount' => 16500,
            'currency' => 'eur',
            'metadata' => ['roomId' => 'r1'],
        ], $overrides);
    }

    public function testHeldDepositForTheRightStayIsAccepted(): void
    {
        $this->assertTrue(StripeService::isValidHeldDeposit($this->heldIntent(), 16500, 'EUR', 'r1'));
    }

    public function testDepositThatIsNotHeldIsRejected(): void
    {
        foreach (['requires_payment_method', 'requires_action', 'succeeded', 'canceled'] as $status) {
            $this->assertFalse(
                StripeService::isValidHeldDeposit($this->heldIntent(['status' => $status]), 16500, 'EUR', 'r1'),
                "status $status must not be accepted"
            );
        }
    }

    public function testDepositForTheWrongAmountOrRoomIsRejected(): void
    {
        $this->assertFalse(StripeService::isValidHeldDeposit($this->heldIntent(['amount' => 100]), 16500, 'EUR', 'r1'));
        $this->assertFalse(StripeService::isValidHeldDeposit($this->heldIntent(), 16500, 'EUR', 'other-room'));
        $this->assertFalse(StripeService::isValidHeldDeposit($this->heldIntent(['currency' => 'usd']), 16500, 'EUR', 'r1'));
    }

    private function paidSession(array $intent = [], array $session = []): array
    {
        return array_merge([
            'status' => 'complete',
            'payment_intent' => array_merge(['id' => 'pi_1', 'status' => 'requires_capture', 'amount' => 16500, 'currency' => 'eur'], $intent),
        ], $session);
    }

    public function testFinishedCheckoutWithAHeldDepositIsAuthorized(): void
    {
        $this->assertEquals('authorized', StripeService::checkoutDepositState($this->paidSession(), 16500, 'EUR'));
    }

    // A payment method that can't hold a payment charges it at once.
    public function testFinishedCheckoutThatChargedAtOnceIsCaptured(): void
    {
        $this->assertEquals('captured', StripeService::checkoutDepositState($this->paidSession(['status' => 'succeeded']), 16500, 'EUR'));
    }

    public function testUnfinishedOrWrongCheckoutIsRejected(): void
    {
        $this->assertNull(StripeService::checkoutDepositState($this->paidSession([], ['status' => 'open']), 16500, 'EUR'));
        $this->assertNull(StripeService::checkoutDepositState($this->paidSession(['status' => 'requires_payment_method']), 16500, 'EUR'));
        $this->assertNull(StripeService::checkoutDepositState($this->paidSession(['status' => 'canceled']), 16500, 'EUR'));
        $this->assertNull(StripeService::checkoutDepositState($this->paidSession(['amount' => 100]), 16500, 'EUR'));
        $this->assertNull(StripeService::checkoutDepositState($this->paidSession(['currency' => 'usd']), 16500, 'EUR'));
        $this->assertNull(StripeService::checkoutDepositState(['status' => 'complete', 'payment_intent' => 'pi_unexpanded'], 16500, 'EUR'));
    }

    public function testCheckoutSessionsGoThroughTheTransport(): void
    {
        $seen = [];
        StripeService::setTransport(function ($method, $path, $params) use (&$seen) {
            $seen[] = [$method, $path, $params];
            return ['id' => 'cs_1', 'url' => 'https://checkout.stripe.com/c/pay/cs_1'];
        });

        $created = StripeService::createCheckoutSession(['mode' => 'payment']);
        StripeService::retrieveCheckoutSession('cs_1');

        $this->assertEquals('cs_1', $created['id']);
        $this->assertEquals(['POST', '/checkout/sessions'], [$seen[0][0], $seen[0][1]]);
        $this->assertEquals(['GET', '/checkout/sessions/cs_1'], [$seen[1][0], $seen[1][1]]);
        $this->assertEquals(['payment_intent'], $seen[1][2]['expand']);
    }

    public function testDepositStatusFollowsTheIntent(): void
    {
        $this->assertEquals('authorized', StripeService::depositStatus(['status' => 'requires_capture']));
        $this->assertEquals('captured', StripeService::depositStatus(['status' => 'succeeded']));
        $this->assertEquals('canceled', StripeService::depositStatus(['status' => 'canceled', 'cancellation_reason' => 'requested_by_customer']));
        $this->assertEquals('expired', StripeService::depositStatus(['status' => 'canceled', 'cancellation_reason' => 'automatic']));
        $this->assertNull(StripeService::depositStatus(['status' => 'processing']));
    }
}
