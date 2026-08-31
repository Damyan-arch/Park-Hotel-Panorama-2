<?php
// Copy to config.local.php (gitignored). Same DB server/role as the app's
// config.local.php — tests run inside their own `test_suite` schema within
// this database, never touching the real `public` schema data.

return [
    'db' => [
        'driver' => 'pgsql',
        'host' => 'localhost',
        'port' => 5432,
        'name' => 'park_hotel_panorama',
        'user' => '',
        'password' => '',
    ],
];
