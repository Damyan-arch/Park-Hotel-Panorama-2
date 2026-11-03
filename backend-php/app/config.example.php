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
        'emails' => 'you@example.com',
        'password' => '', // required — the app refuses to boot without this set
    ],
    'frontend_origins' => 'http://localhost:4202',
    'deepl_api_key' => '',

    // Notification email sent to the hotel whenever a guest submits a booking
    // request. Uses PHP's built-in mail() — no SMTP credentials needed, works
    // on SiteGround out of the box (deliverability isn't guaranteed without
    // SPF/DKIM, but this is a fine starting point).
    'mail' => [
        'notify_to' => '',
        'from_email' => '',
        'from_name' => 'Park Hotel Panorama',
    ],

    // Stripe keys for the 30% card deposit (https://dashboard.stripe.com/apikeys).
    // Use the TEST keys (pk_test_... / sk_test_...) until you go live. Leave
    // either empty to disable online payment — bookings then work without a card.
    'stripe' => [
        'publishable_key' => '',
        'secret_key' => '',
    ],

    // The "pay the deposit by bank transfer" option. Guests are shown these
    // details after sending a request. Leave iban empty to hide the option.
    'bank_transfer' => [
        'holder' => '', // account holder, e.g. the company name
        'iban' => '',
        'bic' => '',
        'bank' => '',
    ],

    // API key for Mistral's Zamboo (or any outside system) to read booking
    // requests from /api/integration/v1/* — see INTEGRATION_API.md. Generate
    // one with: php -r "echo bin2hex(random_bytes(32));"
    // At least 32 characters; leave empty to keep the integration API off.
    'integration' => [
        'api_key' => '',
    ],

    // Absolute filesystem path to public_html/images/uploads on THIS server —
    // varies per account/environment, so it's not hardcoded as a relative
    // path. On SiteGround this is typically something like
    // /home/<account>/public_html/images/uploads (check via File Manager/SSH).
    'uploads_dir' => '/change/me/public_html/images/uploads',
];
