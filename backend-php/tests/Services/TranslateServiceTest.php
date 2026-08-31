<?php

namespace Tests\Services;

// Deliberately does NOT test the real DeepL network call — that needs a live
// API key/network and would make the suite slow, flaky, and quota-consuming.
// The real call was verified manually this session (and a real bug was found
// there: DeepL requires the key via an `Authorization: DeepL-Auth-Key <key>`
// header, not the `auth_key` body field older docs described — fixed in
// TranslateService::callDeepL). These tests cover the parts that don't need
// the network: the empty-input short-circuit, the no-API-key fallback (which
// is also what runs here since bootstrap.php configures an empty key), and
// translateIfChanged's skip-if-unchanged optimization.

use Tests\TestCase;
use App\Services\TranslateService;

class TranslateServiceTest extends TestCase
{
    public function setUp(): void
    {
        TranslateService::init(''); // no key -> no network calls possible
    }

    public function testEmptySourceReturnsAllEmptyStrings(): void
    {
        $result = TranslateService::translateToAllLanguages('   ');
        foreach (TranslateService::languages() as $lang) {
            $this->assertEquals('', $result[$lang]);
        }
    }

    public function testNoApiKeyFallsBackToSameTextForEveryLanguage(): void
    {
        $result = TranslateService::translateToAllLanguages('Hello world');
        foreach (TranslateService::languages() as $lang) {
            $this->assertEquals('Hello world', $result[$lang]);
        }
    }

    public function testIsConfiguredReflectsInitState(): void
    {
        $this->assertFalse(TranslateService::isConfigured());
        TranslateService::init('some-key:fx');
        $this->assertTrue(TranslateService::isConfigured());
        TranslateService::init(''); // restore for other tests in this run
    }

    public function testTranslateIfChangedReturnsExistingWhenEnUnchanged(): void
    {
        $existing = ['en' => 'Same text', 'bg' => 'Същият текст', 'de' => 'X', 'es' => 'X', 'ro' => 'X'];
        $result = TranslateService::translateIfChanged('Same text', $existing);
        $this->assertEquals($existing, $result);
    }

    public function testTranslateIfChangedRetranslatesWhenEnDiffers(): void
    {
        $existing = ['en' => 'Old text', 'bg' => 'Стар текст', 'de' => 'X', 'es' => 'X', 'ro' => 'X'];
        $result = TranslateService::translateIfChanged('New text', $existing);
        // No API key configured -> falls back to the new text everywhere, proving
        // it actually re-ran translateToAllLanguages rather than reusing $existing.
        $this->assertEquals('New text', $result['en']);
        $this->assertEquals('New text', $result['bg']);
    }

    public function testTranslateIfChangedWithNoExistingValueTranslates(): void
    {
        $result = TranslateService::translateIfChanged('Brand new', null);
        $this->assertEquals('Brand new', $result['en']);
    }
}
