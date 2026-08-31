<?php

namespace App\Http;

use App\Auth\AdminAuth;

class Router
{
    private array $routes = [];

    // $routes: array of [method, pattern, [ControllerClass, 'method'], ?'admin']
    // pattern uses {name} placeholders, e.g. '/rooms/{id}'.
    public function __construct(array $routes)
    {
        $this->routes = $routes;
    }

    public function dispatch(Request $request): void
    {
        foreach ($this->routes as $route) {
            [$method, $pattern, $handler] = $route;
            $requiresAdmin = ($route[3] ?? null) === 'admin';

            if ($method !== $request->method) continue;

            $params = $this->match($pattern, $request->path);
            if ($params === null) continue;

            $request->params = $params;

            if ($requiresAdmin && !AdminAuth::requireAdmin($request)) {
                Response::error('Not authenticated.', 401);
                return;
            }

            [$class, $action] = $handler;
            (new $class())->$action($request);
            return;
        }

        Response::error('Not found.', 404);
    }

    // Returns an assoc array of extracted {placeholders}, or null if the path
    // doesn't match this pattern at all.
    private function match(string $pattern, string $path): ?array
    {
        $names = [];
        $regex = preg_replace_callback('/\{(\w+)\}/', function ($m) use (&$names) {
            $names[] = $m[1];
            return '([^/]+)';
        }, $pattern);

        if (!preg_match('#^' . $regex . '$#', $path, $matches)) return null;

        array_shift($matches);
        return array_combine($names, $matches);
    }
}
