<?php
// Copy this file to config.local.php (gitignored) and fill in real values.
// config.local.php is the ONLY place secrets live — never commit it, and the
// public/.htaccess denies direct HTTP access to this whole app/ folder anyway.

return [
    'db' => [
        'driver' => 'pgsql', // 'pgsql' or 'mysql' — see database/schema.mysql.sql if not on Postgres
        'host' => 'localhost',
        'port' => 5432,
        'name' => 'park_hotel_panorama',
        'user' => '',
        'password' => '',
    ],
    'admin' => [
        // Comma-separated, case-insensitive
        'emails' => 'damian.tsvetkov@hermeses.com',
        'password' => '', // required — the app refuses to boot without this set
    ],
    'frontend_origins' => 'http://localhost:4202',
    'deepl_api_key' => '',

    // Absolute filesystem path to public_html/images/uploads on THIS server —
    // varies per account/environment, so it's not hardcoded as a relative
    // path. On SiteGround this is typically something like
    // /home/<account>/public_html/images/uploads (check via File Manager/SSH).
    'uploads_dir' => '/change/me/public_html/images/uploads',
];
