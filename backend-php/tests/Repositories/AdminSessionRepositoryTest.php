<?php

namespace Tests\Repositories;

use Tests\TestCase;
use App\Db\Database;
use App\Repositories\AdminSessionRepository;

class AdminSessionRepositoryTest extends TestCase
{
    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE admin_sessions');
    }

    public function testCreateThenFindRoundTrips(): void
    {
        $repo = new AdminSessionRepository();
        $expiresAt = gmdate('Y-m-d H:i:s', time() + 3600);
        $repo->create('token-abc', $expiresAt);

        $found = $repo->find('token-abc');
        $this->assertNotNull($found);
        $this->assertEquals('token-abc', $found['token']);
        // Allow a couple seconds of drift between building $expiresAt and the DB round-trip.
        $this->assertTrue(abs($found['expiresAt'] - strtotime($expiresAt)) < 5);
    }

    public function testFindReturnsNullForUnknownToken(): void
    {
        $this->assertNull((new AdminSessionRepository())->find('does-not-exist'));
    }

    public function testDeleteRemovesSession(): void
    {
        $repo = new AdminSessionRepository();
        $repo->create('token-xyz', gmdate('Y-m-d H:i:s', time() + 3600));
        $repo->delete('token-xyz');
        $this->assertNull($repo->find('token-xyz'));
    }
}
