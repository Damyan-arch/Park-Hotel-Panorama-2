<?php
// Run the whole suite:  php tests/run.php
// Run one class:        php tests/run.php Repositories/RoomRepositoryTest

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('CLI only.');
}

require __DIR__ . '/bootstrap.php';

function discoverTestFiles(string $dir): array
{
    $files = [];
    foreach (scandir($dir) as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        $path = "$dir/$entry";
        if (is_dir($path)) {
            $files = array_merge($files, discoverTestFiles($path));
        } elseif (str_ends_with($entry, 'Test.php')) {
            $files[] = $path;
        }
    }
    return $files;
}

$only = $argv[1] ?? null;
$testsDir = __DIR__;
$files = discoverTestFiles($testsDir);
sort($files);

$totalPass = 0;
$totalFail = 0;
$failures = [];

foreach ($files as $file) {
    $relative = str_replace('\\', '/', substr($file, strlen($testsDir) + 1));
    $relative = substr($relative, 0, -4); // strip .php
    if ($only !== null && $relative !== $only) continue;

    $class = 'Tests\\' . str_replace('/', '\\', $relative);
    require_once $file;

    if (!class_exists($class)) {
        fwrite(STDERR, "Skipping $relative — class $class not found in file.\n");
        continue;
    }

    $instance = new $class();
    $methods = array_filter(get_class_methods($instance), fn($m) => str_starts_with($m, 'test'));

    echo "\n$relative\n";
    foreach ($methods as $method) {
        try {
            if (method_exists($instance, 'setUp')) $instance->setUp();
            $instance->$method();
            if (method_exists($instance, 'tearDown')) $instance->tearDown();
            echo "  \u{2713} $method\n";
            $totalPass++;
        } catch (\Throwable $e) {
            echo "  \u{2717} $method — " . $e->getMessage() . "\n";
            $totalFail++;
            $failures[] = "$class::$method — " . $e->getMessage();
        }
    }
}

echo "\n" . str_repeat('-', 60) . "\n";
echo "Passed: $totalPass, Failed: $totalFail\n";

if ($failures) {
    echo "\nFailures:\n";
    foreach ($failures as $f) echo "  - $f\n";
}

exit($totalFail > 0 ? 1 : 0);
