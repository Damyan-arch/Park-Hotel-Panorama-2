<?php

namespace Tests\Auth;

use Tests\TestCase;
use App\Db\Database;
use App\Auth\AdminAuth;
use App\Http\Request;

class AdminAuthTest extends TestCase
{
    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE admin_sessions');
        AdminAuth::init(['emails' => 'Admin@Example.com, second@example.com', 'password' => 'correct-horse']);
        unset($_SERVER['HTTP_AUTHORIZATION']);
    }

    private function requestWithBearer(?string $token): Request
    {
        if ($token !== null) {
            $_SERVER['HTTP_AUTHORIZATION'] = "Bearer $token";
        } else {
            unset($_SERVER['HTTP_AUTHORIZATION']);
        }
        return new Request('GET', '/admin/whatever');
    }

    public function testAttemptLoginRejectsWrongPassword(): void
    {
        $this->assertNull(AdminAuth::attemptLogin('admin@example.com', 'wrong'));
    }

    public function testAttemptLoginRejectsUnknownEmail(): void
    {
        $this->assertNull(AdminAuth::attemptLogin('nobody@example.com', 'correct-horse'));
    }

    public function testAttemptLoginIsCaseInsensitiveOnEmail(): void
    {
        // Config has "Admin@Example.com" — login should still work lowercased/mixed-case.
        $this->assertNotNull(AdminAuth::attemptLogin('ADMIN@example.com', 'correct-horse'));
    }

    public function testAttemptLoginSucceedsAndTokenPassesRequireAdmin(): void
    {
        $token = AdminAuth::attemptLogin('admin@example.com', 'correct-horse');
        $this->assertNotNull($token);

        $this->assertTrue(AdminAuth::requireAdmin($this->requestWithBearer($token)));
    }

    public function testRequireAdminRejectsMissingToken(): void
    {
        $this->assertFalse(AdminAuth::requireAdmin($this->requestWithBearer(null)));
    }

    public function testRequireAdminRejectsUnknownToken(): void
    {
        $this->assertFalse(AdminAuth::requireAdmin($this->requestWithBearer('not-a-real-token')));
    }

    public function testLogoutRevokesToken(): void
    {
        $token = AdminAuth::attemptLogin('admin@example.com', 'correct-horse');
        $request = $this->requestWithBearer($token);

        $this->assertTrue(AdminAuth::requireAdmin($request));
        AdminAuth::logout($request);
        $this->assertFalse(AdminAuth::requireAdmin($request));
    }

    public function testRequireAdminRejectsAndCleansUpExpiredSession(): void
    {
        // Simulate an already-expired session directly, bypassing attemptLogin's fixed TTL.
        Database::pdo()
            ->prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)')
            ->execute(['expired-token', gmdate('Y-m-d H:i:s', time() - 3600)]);

        $this->assertFalse(AdminAuth::requireAdmin($this->requestWithBearer('expired-token')));

        $stmt = Database::pdo()->prepare('SELECT COUNT(*) FROM admin_sessions WHERE token = ?');
        $stmt->execute(['expired-token']);
        $this->assertEquals(0, (int) $stmt->fetchColumn());
    }
}
