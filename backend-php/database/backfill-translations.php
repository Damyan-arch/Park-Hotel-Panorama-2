<?php
// CLI port of Backend/server.js's boot-time backfillTranslations(). Node ran
// this automatically once per process start; a PHP shared-hosting request
// has no such long-lived boot hook, so run this manually after adding/
// changing DEEPL_API_KEY, or wire it to a SiteGround Cron Job periodically:
//   php database/backfill-translations.php

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('CLI only.');
}

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    if (strncmp($prefix, $class, strlen($prefix)) !== 0) return;
    $path = __DIR__ . '/../app/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) require $path;
});

use App\Db\Database;
use App\Services\TranslateService;
use App\Repositories\RoomRepository;
use App\Repositories\EventRepository;
use App\Repositories\AmenityRepository;

$config = require __DIR__ . '/../app/config.local.php';
Database::init($config['db']);
TranslateService::init($config['deepl_api_key'] ?? '');

if (!TranslateService::isConfigured()) {
    echo "DEEPL_API_KEY is not set — nothing to backfill.\n";
    exit(0);
}

function needsBackfill(?array $localized): bool
{
    if (!$localized) return false;
    foreach (TranslateService::languages() as $lang) {
        if (empty($localized[$lang])) return true;
    }
    return false;
}

function pickSourceText(array $localized): string
{
    foreach (TranslateService::languages() as $lang) {
        if (!empty($localized[$lang])) return $localized[$lang];
    }
    return '';
}

$backfilled = 0;

$roomsRepo = new RoomRepository();
foreach ($roomsRepo->all() as $room) {
    $patch = [];
    if (needsBackfill($room['name'])) $patch['name'] = TranslateService::translateToAllLanguages(pickSourceText($room['name']));
    if (needsBackfill($room['description'])) {
        $patch['description'] = TranslateService::translateToAllLanguages(pickSourceText($room['description']));
    }
    if ($patch) {
        $roomsRepo->update($room['id'], $patch);
        $backfilled++;
    }
}

$eventsRepo = new EventRepository();
foreach ($eventsRepo->all() as $event) {
    $patch = [];
    if (needsBackfill($event['title'])) $patch['title'] = TranslateService::translateToAllLanguages(pickSourceText($event['title']));
    if (needsBackfill($event['description'])) {
        $patch['description'] = TranslateService::translateToAllLanguages(pickSourceText($event['description']));
    }
    if ($patch) {
        $eventsRepo->update($event['id'], $patch);
        $backfilled++;
    }
}

$amenitiesRepo = new AmenityRepository();
foreach ($amenitiesRepo->all() as $amenity) {
    $patch = [];
    if (needsBackfill($amenity['title'])) $patch['title'] = TranslateService::translateToAllLanguages(pickSourceText($amenity['title']));
    if (needsBackfill($amenity['text'])) $patch['text'] = TranslateService::translateToAllLanguages(pickSourceText($amenity['text']));
    if ($patch) {
        $amenitiesRepo->update($amenity['id'], $patch);
        $backfilled++;
    }
}

echo $backfilled ? "DeepL: backfilled translations for $backfilled existing item(s).\n" : "Nothing needed backfilling.\n";
