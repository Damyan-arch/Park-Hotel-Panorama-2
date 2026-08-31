<?php
// Loaded once per request by public/index.php.

date_default_timezone_set('UTC');

// Simple PSR-4-ish autoloader: App\Foo\Bar -> app/src/Foo/Bar.php
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    if (strncmp($prefix, $class, strlen($prefix)) !== 0) return;
    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/src/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) require $path;
});

use App\Http\Response;

// Every response is JSON, including on a PHP error/exception — mirrors the
// Node server never crashing bare on an unhandled route error.
set_exception_handler(function (Throwable $e) {
    error_log('Unhandled exception: ' . $e->getMessage());
    Response::json(['error' => 'Internal server error.'], 500);
});
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

$configFile = __DIR__ . '/config.local.php';
if (!is_file($configFile)) {
    error_log('config.local.php is missing — copy config.example.php and fill in real values.');
    Response::json(['error' => 'Server is not configured.'], 500);
    exit;
}
$config = require $configFile;

if (empty($config['admin']['password'])) {
    error_log('admin.password must be set in config.local.php — refusing to serve requests without it.');
    Response::json(['error' => 'Server is not configured.'], 500);
    exit;
}

// Same-origin requests (no Origin header, e.g. server-rendered same-domain
// fetches) always pass; cross-origin needs an explicit allow-list match, plus
// devtunnel preview links — mirrors the Node CORS setup, kept for local dev
// (Vite on a different port) even though production serves everything from
// one SiteGround origin.
$allowedOrigins = array_filter(array_map('trim', explode(',', $config['frontend_origins'] ?? '')));
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
if ($origin !== null) {
    $host = parse_url($origin, PHP_URL_HOST) ?: '';
    $allowed = in_array($origin, $allowedOrigins, true) || (bool) preg_match('/\.devtunnels\.ms$/', $host);
    if ($allowed) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

App\Db\Database::init($config['db']);
App\Auth\AdminAuth::init($config['admin']);
App\Services\TranslateService::init($config['deepl_api_key'] ?? '');

define('UPLOADS_DIR', rtrim($config['uploads_dir'] ?? '', '/'));

return $config;
