<?php
// Run ON SITEGROUND (php database/import-legacy-data.php) once: after
// schema.postgres.sql (or schema.mysql.sql) has been applied to a fresh
// database, and legacy-data.json (produced by export-legacy-data.php) has
// been uploaded into this same database/ folder via SFTP.
//
// Inserts through the same Repository classes the live app uses, so JSON
// encoding / camelCase-snake_case mapping is guaranteed identical to what the
// app itself would write — no raw-SQL dialect risk between Postgres/MySQL.
// Legacy ids are preserved (matching the precedent in Backend/data/seed.js).
//
// NOTE: if `settings` ever grows a field that references a room/gallery/event
// id (e.g. a "featured room"), verify it after import — ids ARE preserved
// here, so this is only a concern if something in your settings JSON was
// referencing an id that for some other reason changed.

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('CLI only.');
}

require __DIR__ . '/../app/src/Db/Database.php';
require __DIR__ . '/../app/src/Support/Uuid.php';
require __DIR__ . '/../app/src/Repositories/SettingsRepository.php';
require __DIR__ . '/../app/src/Repositories/RoomRepository.php';
require __DIR__ . '/../app/src/Repositories/GalleryRepository.php';
require __DIR__ . '/../app/src/Repositories/EventRepository.php';
require __DIR__ . '/../app/src/Repositories/AmenityRepository.php';

use App\Db\Database;
use App\Repositories\SettingsRepository;
use App\Repositories\RoomRepository;
use App\Repositories\GalleryRepository;
use App\Repositories\EventRepository;
use App\Repositories\AmenityRepository;

$config = require __DIR__ . '/../app/config.local.php';
Database::init($config['db']);

$jsonFile = __DIR__ . '/legacy-data.json';
if (!is_file($jsonFile)) {
    fwrite(STDERR, "legacy-data.json not found — upload it here first (produced by export-legacy-data.php).\n");
    exit(1);
}
$data = json_decode(file_get_contents($jsonFile), true);

(new SettingsRepository())->update($data['settings'] ?? []);
echo "Imported settings.\n";

$roomsRepo = new RoomRepository();
foreach ($data['rooms'] ?? [] as $room) {
    $roomsRepo->create($room);
}
echo 'Imported ' . count($data['rooms'] ?? []) . " room(s).\n";

$galleryRepo = new GalleryRepository();
foreach ($data['gallery'] ?? [] as $image) {
    $galleryRepo->create($image);
}
echo 'Imported ' . count($data['gallery'] ?? []) . " gallery image(s).\n";

$eventsRepo = new EventRepository();
foreach ($data['events'] ?? [] as $event) {
    $eventsRepo->create($event);
}
echo 'Imported ' . count($data['events'] ?? []) . " event(s).\n";

$amenitiesRepo = new AmenityRepository();
foreach ($data['amenities'] ?? [] as $amenity) {
    $amenitiesRepo->create($amenity);
}
echo 'Imported ' . count($data['amenities'] ?? []) . " amenity(ies).\n";

echo "Import complete.\n";
