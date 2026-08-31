<?php

require __DIR__ . '/../app/bootstrap.php';

use App\Http\Request;
use App\Http\Router;

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
// Strip the /api prefix (Apache routes everything under /api/ here — see .htaccess)
// so route patterns in routes.php stay relative, e.g. '/rooms' not '/api/rooms'.
$path = preg_replace('#^/api#', '', $path);
if ($path === '') $path = '/';

$request = new Request($_SERVER['REQUEST_METHOD'], $path);
$routes = require __DIR__ . '/../app/routes.php';

(new Router($routes))->dispatch($request);
