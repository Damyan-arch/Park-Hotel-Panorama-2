<?php

namespace Tests\Http;

use Tests\TestCase;
use App\Http\Router;
use App\Http\Request;

// A tiny fake controller, not one of the app's real ones — keeps this test a
// true isolated unit test of Router's matching/dispatch logic, independent
// of any real route/controller/DB.
class FakeController
{
    public static array $lastParams = [];

    public function show(Request $request): void
    {
        self::$lastParams = $request->params;
    }
}

class RouterTest extends TestCase
{
    private function dispatchAndCapture(array $routes, string $method, string $path): array
    {
        $router = new Router($routes);
        $request = new Request($method, $path);
        ob_start();
        $router->dispatch($request);
        $output = ob_get_clean();
        return json_decode($output, true) ?? [];
    }

    public function testMatchesStaticRoute(): void
    {
        FakeController::$lastParams = ['stale' => 'value'];
        $this->dispatchAndCapture([['GET', '/rooms', [FakeController::class, 'show']]], 'GET', '/rooms');
        $this->assertEquals([], FakeController::$lastParams);
    }

    public function testExtractsPlaceholderParams(): void
    {
        $this->dispatchAndCapture([['GET', '/rooms/{id}', [FakeController::class, 'show']]], 'GET', '/rooms/abc-123');
        $this->assertEquals(['id' => 'abc-123'], FakeController::$lastParams);
    }

    public function testExtractsMultiplePlaceholders(): void
    {
        $this->dispatchAndCapture(
            [['PATCH', '/admin/x/{a}/y/{b}', [FakeController::class, 'show']]],
            'PATCH',
            '/admin/x/one/y/two'
        );
        $this->assertEquals(['a' => 'one', 'b' => 'two'], FakeController::$lastParams);
    }

    public function testDoesNotMatchWrongMethod(): void
    {
        $result = $this->dispatchAndCapture([['GET', '/rooms', [FakeController::class, 'show']]], 'POST', '/rooms');
        $this->assertEquals('Not found.', $result['error']);
    }

    public function testReturns404ForUnmatchedPath(): void
    {
        $result = $this->dispatchAndCapture([['GET', '/rooms', [FakeController::class, 'show']]], 'GET', '/nonexistent');
        $this->assertEquals('Not found.', $result['error']);
    }

    public function testAdminRouteRejectsMissingToken(): void
    {
        $result = $this->dispatchAndCapture(
            [['GET', '/admin/secret', [FakeController::class, 'show'], 'admin']],
            'GET',
            '/admin/secret'
        );
        $this->assertEquals('Not authenticated.', $result['error']);
    }
}
