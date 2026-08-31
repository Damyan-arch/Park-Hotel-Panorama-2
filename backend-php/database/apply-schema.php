<?php
// Run once against a fresh database, from the command line:
//   php database/apply-schema.php schema.postgres.sql
// (or schema.mysql.sql if the SiteGround plan doesn't offer Postgres)
// Works purely through PHP/PDO — no psql or mysql CLI binary required, since
// SSH/CLI access isn't guaranteed on every SiteGround plan tier.

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('CLI only.');
}

$file = $argv[1] ?? null;
if (!$file || !is_file(__DIR__ . '/' . $file)) {
    fwrite(STDERR, "Usage: php apply-schema.php <schema.postgres.sql|schema.mysql.sql>\n");
    exit(1);
}

require __DIR__ . '/../app/src/Db/Database.php';

$config = require __DIR__ . '/../app/config.local.php';
App\Db\Database::init($config['db']);

$sql = file_get_contents(__DIR__ . '/' . $file);
$pdo = App\Db\Database::pdo();

foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
    echo "Running: " . substr($statement, 0, 60) . "...\n";
    $pdo->exec($statement);
}

echo "Schema applied successfully.\n";
