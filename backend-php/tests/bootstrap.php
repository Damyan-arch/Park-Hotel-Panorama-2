<?php
// Test bootstrap — run via `php tests/run.php`, never deployed to SiteGround.
//
// Isolation strategy: rather than a separate database (the DB role used in
// dev doesn't have CREATEDB privilege, confirmed while setting this up), each
// run drops and recreates a dedicated `test_suite` schema inside the SAME
// database the app already uses, and points the test connection's
// search_path at it. Every run starts from a completely clean, fresh schema
// — real data in the `public` schema is never touched.

date_default_timezone_set('UTC');

spl_autoload_register(function ($class) {
    foreach (['App\\' => __DIR__ . '/../app/src/', 'Tests\\' => __DIR__ . '/'] as $prefix => $baseDir) {
        if (strncmp($prefix, $class, strlen($prefix)) !== 0) continue;
        $path = $baseDir . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
        if (is_file($path)) { require $path; return; }
    }
});

use App\Db\Database;
use App\Services\TranslateService;

$configFile = __DIR__ . '/config.local.php';
if (!is_file($configFile)) {
    fwrite(STDERR, "Copy tests/config.example.php to tests/config.local.php first (same DB server as the app, tests use their own schema within it).\n");
    exit(1);
}
$config = require $configFile;

Database::init($config['db']);
$pdo = Database::pdo();

$pdo->exec('DROP SCHEMA IF EXISTS test_suite CASCADE');
$pdo->exec('CREATE SCHEMA test_suite');
$pdo->exec('SET search_path TO test_suite');

// NOTE: don't try to skip "comment-only" chunks here — the leading file
// header comment has no trailing semicolon of its own, so a naive split
// merges it into the same chunk as the first real CREATE TABLE statement.
// Postgres handles the embedded `--` comment fine within one exec() call;
// filtering by "starts with --" previously discarded that whole chunk,
// silently skipping the `settings` table.
foreach (array_filter(array_map('trim', explode(';', file_get_contents(__DIR__ . '/../database/schema.postgres.sql')))) as $statement) {
    $pdo->exec($statement);
}

// No network calls in the automated suite — DEEPL_API_KEY stays unconfigured,
// which exercises TranslateService's own graceful-fallback path (same text
// in every language) rather than hitting the real API. The real API call was
// verified manually earlier this session (and a real bug was found there —
// see TranslateServiceTest's docblock for why it isn't re-tested here).
TranslateService::init('');

// STDERR, not STDOUT/echo — any real output here trips PHP's "headers already
// sent" tracking the moment a test calls Response::json() (which calls
// header()), corrupting that test's captured output.
fwrite(STDERR, "Test schema ready.\n");
