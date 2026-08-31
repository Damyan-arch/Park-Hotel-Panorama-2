<?php

namespace Tests;

class AssertionFailed extends \Exception
{
}

// Deliberately not PHPUnit — the app has zero Composer dependencies, and
// adding one just for testing would be the first. This is a small, plain
// assertion set, enough for what this codebase actually needs to verify.
abstract class TestCase
{
    protected function assertTrue($value, string $message = 'Failed asserting that value is true'): void
    {
        if ($value !== true) throw new AssertionFailed($message);
    }

    protected function assertFalse($value, string $message = 'Failed asserting that value is false'): void
    {
        if ($value !== false) throw new AssertionFailed($message);
    }

    protected function assertNull($value, string $message = 'Failed asserting that value is null'): void
    {
        if ($value !== null) throw new AssertionFailed($message . ' — got: ' . var_export($value, true));
    }

    protected function assertNotNull($value, string $message = 'Failed asserting that value is not null'): void
    {
        if ($value === null) throw new AssertionFailed($message);
    }

    protected function assertEquals($expected, $actual, string $message = ''): void
    {
        if ($expected != $actual) {
            $msg = $message ?: 'Failed asserting equality';
            throw new AssertionFailed("$msg — expected " . var_export($expected, true) . ', got ' . var_export($actual, true));
        }
    }

    protected function assertSame($expected, $actual, string $message = ''): void
    {
        if ($expected !== $actual) {
            $msg = $message ?: 'Failed asserting same';
            throw new AssertionFailed("$msg — expected " . var_export($expected, true) . ', got ' . var_export($actual, true));
        }
    }

    protected function assertCount(int $expected, array $array, string $message = ''): void
    {
        $actual = count($array);
        if ($expected !== $actual) {
            $msg = $message ?: 'Failed asserting count';
            throw new AssertionFailed("$msg — expected $expected, got $actual");
        }
    }

    protected function assertMatchesRegex(string $pattern, string $value, string $message = ''): void
    {
        if (!preg_match($pattern, $value)) {
            $msg = $message ?: 'Failed asserting pattern match';
            throw new AssertionFailed("$msg — '$value' does not match $pattern");
        }
    }
}
