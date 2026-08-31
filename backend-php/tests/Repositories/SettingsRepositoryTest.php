<?php

namespace Tests\Repositories;

use Tests\TestCase;
use App\Db\Database;
use App\Repositories\SettingsRepository;

class SettingsRepositoryTest extends TestCase
{
    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE settings');
    }

    public function testGetCreatesDefaultRowWhenMissing(): void
    {
        $result = (new SettingsRepository())->get();
        $this->assertEquals([], $result);
    }

    public function testUpdateMergesIntoExistingData(): void
    {
        $repo = new SettingsRepository();
        $repo->update(['hotelName' => 'Test Hotel', 'phone' => '123']);
        $merged = $repo->update(['phone' => '456']);

        $this->assertEquals('Test Hotel', $merged['hotelName']);
        $this->assertEquals('456', $merged['phone']);
    }

    public function testGetReflectsPriorUpdates(): void
    {
        (new SettingsRepository())->update(['foo' => 'bar']);
        $result = (new SettingsRepository())->get();
        $this->assertEquals('bar', $result['foo']);
    }
}
