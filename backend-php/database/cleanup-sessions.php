<?php
// Optional: wire this to a SiteGround Cron Job (e.g. nightly) to prune
// expired admin_sessions rows. Not required for correctness — requireAdmin()
// already rejects and deletes an expired session lazily on lookup — this
// just keeps the table small over time for sessions that expired without
// ever being looked up again.
//   php database/cleanup-sessions.php

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('CLI only.');
}

require __DIR__ . '/../app/src/Db/Database.php';

$config = require __DIR__ . '/../app/config.local.php';
App\Db\Database::init($config['db']);

$driver = App\Db\Database::driver();
$now = $driver === 'mysql' ? gmdate('Y-m-d H:i:s') : gmdate('Y-m-d H:i:sP');

$stmt = App\Db\Database::pdo()->prepare('DELETE FROM admin_sessions WHERE expires_at < ?');
$stmt->execute([$now]);

echo 'Deleted ' . $stmt->rowCount() . " expired session(s).\n";
