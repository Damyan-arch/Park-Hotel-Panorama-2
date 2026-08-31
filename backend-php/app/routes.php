<?php
// Route table — mirrors Backend/server.js exactly (same paths, methods, and
// which routes require admin auth), so the frontend contract doesn't change.
// [METHOD, path pattern (relative to /api), [ControllerClass, 'method'], ?'admin']

use App\Controllers\PublicController;
use App\Controllers\ContactController;
use App\Controllers\BookingController;
use App\Controllers\AdminAuthController;
use App\Controllers\AdminLeadsController;
use App\Controllers\AdminUploadController;
use App\Controllers\AdminSettingsController;
use App\Controllers\AdminRoomsController;
use App\Controllers\AdminGalleryController;
use App\Controllers\AdminAmenitiesController;
use App\Controllers\AdminEventsController;

return [
    ['GET', '/', [PublicController::class, 'index']],
    ['GET', '/settings', [PublicController::class, 'settings']],
    ['GET', '/rooms', [PublicController::class, 'rooms']],
    ['GET', '/amenities', [PublicController::class, 'amenities']],
    ['GET', '/gallery', [PublicController::class, 'gallery']],
    ['GET', '/events', [PublicController::class, 'events']],

    ['POST', '/contact', [ContactController::class, 'create']],
    ['POST', '/bookings', [BookingController::class, 'create']],

    ['POST', '/admin/login', [AdminAuthController::class, 'login']],
    ['POST', '/admin/logout', [AdminAuthController::class, 'logout'], 'admin'],

    ['GET', '/admin/bookings', [AdminLeadsController::class, 'bookings'], 'admin'],
    ['GET', '/admin/inquiries', [AdminLeadsController::class, 'inquiries'], 'admin'],
    ['PATCH', '/admin/bookings/{id}', [AdminLeadsController::class, 'updateBookingStatus'], 'admin'],
    ['PATCH', '/admin/inquiries/{id}', [AdminLeadsController::class, 'updateInquiryStatus'], 'admin'],

    ['POST', '/admin/upload', [AdminUploadController::class, 'upload'], 'admin'],

    ['PUT', '/admin/settings', [AdminSettingsController::class, 'update'], 'admin'],

    ['POST', '/admin/rooms', [AdminRoomsController::class, 'create'], 'admin'],
    ['PUT', '/admin/rooms/{id}', [AdminRoomsController::class, 'update'], 'admin'],
    ['DELETE', '/admin/rooms/{id}', [AdminRoomsController::class, 'delete'], 'admin'],

    ['POST', '/admin/gallery', [AdminGalleryController::class, 'create'], 'admin'],
    ['PUT', '/admin/gallery/{id}', [AdminGalleryController::class, 'update'], 'admin'],
    ['DELETE', '/admin/gallery/{id}', [AdminGalleryController::class, 'delete'], 'admin'],

    ['POST', '/admin/amenities', [AdminAmenitiesController::class, 'create'], 'admin'],
    ['PUT', '/admin/amenities/{id}', [AdminAmenitiesController::class, 'update'], 'admin'],
    ['DELETE', '/admin/amenities/{id}', [AdminAmenitiesController::class, 'delete'], 'admin'],

    ['POST', '/admin/events', [AdminEventsController::class, 'create'], 'admin'],
    ['PUT', '/admin/events/{id}', [AdminEventsController::class, 'update'], 'admin'],
    ['DELETE', '/admin/events/{id}', [AdminEventsController::class, 'delete'], 'admin'],
];
