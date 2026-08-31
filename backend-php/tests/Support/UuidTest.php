<?php

namespace Tests\Support;

use Tests\TestCase;
use App\Support\Uuid;

class UuidTest extends TestCase
{
    public function testProducesRfc4122V4Format(): void
    {
        $id = Uuid::v4();
        $this->assertMatchesRegex('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $id);
    }

    public function testProducesUniqueValues(): void
    {
        $this->assertTrue(Uuid::v4() !== Uuid::v4());
    }
}
