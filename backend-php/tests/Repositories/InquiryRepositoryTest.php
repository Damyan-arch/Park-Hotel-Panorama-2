<?php

namespace Tests\Repositories;

use Tests\TestCase;
use App\Db\Database;
use App\Repositories\InquiryRepository;

class InquiryRepositoryTest extends TestCase
{
    public function setUp(): void
    {
        Database::pdo()->exec('TRUNCATE contact_inquiries');
    }

    private function sampleInquiry(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => null,
            'roomName' => null,
            'message' => 'Hello there.',
            'status' => 'new',
        ], $overrides);
    }

    public function testCreateThenFindRoundTrips(): void
    {
        $repo = new InquiryRepository();
        $created = $repo->create($this->sampleInquiry());

        $found = $repo->find($created['id']);
        $this->assertEquals('Jane Doe', $found['name']);
        $this->assertEquals('Hello there.', $found['message']);
        $this->assertEquals('new', $found['status']);
    }

    public function testAllOrdersNewestFirst(): void
    {
        $repo = new InquiryRepository();
        $first = $repo->create($this->sampleInquiry(['name' => 'First']));
        $second = $repo->create($this->sampleInquiry(['name' => 'Second']));

        $all = $repo->all();
        $this->assertEquals($second['id'], $all[0]['id']);
        $this->assertEquals($first['id'], $all[1]['id']);
    }

    public function testUpdateStatus(): void
    {
        $repo = new InquiryRepository();
        $created = $repo->create($this->sampleInquiry());

        $updated = $repo->updateStatus($created['id'], 'resolved');
        $this->assertEquals('resolved', $updated['status']);
    }
}
