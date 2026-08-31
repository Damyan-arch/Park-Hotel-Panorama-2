<?php
// Run LOCALLY (php database/export-legacy-data.php) against the current dev
// Postgres — reads the same credentials Backend/.env already has — and
// writes legacy-data.json. Upload that file into this database/ folder on
// SiteGround via SFTP, then run import-legacy-data.php there.
//
// Deliberately excludes booking_requests, contact_inquiries and
// admin_sessions — those are operational/transient data, not site content.

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('CLI only.');
}

function parseEnvFile(string $path): array
{
    $env = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $env[trim($key)] = trim($value);
    }
    return $env;
}

$envFile = __DIR__ . '/../../Backend/.env';
if (!is_file($envFile)) {
    fwrite(STDERR, "Can't find Backend/.env. Run this from the repo root's backend-php/database/ folder,\n");
    fwrite(STDERR, "or edit this script with your dev database credentials directly.\n");
    exit(1);
}
$env = parseEnvFile($envFile);

$pdo = new PDO(
    "pgsql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname={$env['DB_NAME']}",
    $env['DB_USER'],
    $env['DB_PASSWORD'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

$data = [];

$settingsRow = $pdo->query('SELECT data FROM settings WHERE id = 1')->fetch();
$data['settings'] = $settingsRow ? json_decode($settingsRow['data'], true) : (object) [];

$data['rooms'] = array_map(function ($row) {
    return [
        'id' => $row['id'], 'name' => json_decode($row['name'], true), 'type' => $row['type'],
        'description' => json_decode($row['description'], true), 'capacity' => (int) $row['capacity'],
        'sizeSqm' => (int) $row['size_sqm'], 'basePricePerNight' => (float) $row['base_price_per_night'],
        'currency' => $row['currency'], 'imageUrl' => $row['image_url'],
    ];
}, $pdo->query('SELECT * FROM rooms')->fetchAll());

$data['gallery'] = array_map(function ($row) {
    return [
        'id' => $row['id'], 'imageUrl' => $row['image_url'], 'alt' => $row['alt'],
        'sortOrder' => (int) $row['sort_order'],
    ];
}, $pdo->query('SELECT * FROM gallery_images ORDER BY sort_order')->fetchAll());

$data['events'] = array_map(function ($row) {
    return [
        'id' => $row['id'], 'title' => json_decode($row['title'], true), 'date' => $row['date'],
        'time' => $row['time'], 'description' => json_decode($row['description'], true),
        'imageUrl' => $row['image_url'], 'infoUrl' => $row['info_url'],
    ];
}, $pdo->query('SELECT * FROM events')->fetchAll());

$data['amenities'] = array_map(function ($row) {
    return [
        'id' => $row['id'], 'icon' => $row['icon'], 'title' => json_decode($row['title'], true),
        'text' => json_decode($row['text'], true), 'underMaintenance' => (bool) $row['under_maintenance'],
    ];
}, $pdo->query('SELECT * FROM amenities')->fetchAll());

file_put_contents(
    __DIR__ . '/legacy-data.json',
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
);

echo 'Exported ' . count($data['rooms']) . ' room(s), ' . count($data['gallery']) . ' gallery image(s), '
    . count($data['events']) . ' event(s), ' . count($data['amenities'])
    . " amenity(ies) to database/legacy-data.json\n";
