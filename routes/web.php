<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TrackController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::post('/track/create', [TrackController::class, 'create'])
  ->name('track.create');

Route::get('/tracks', function () {
    return Inertia::render('ListPage');
})->middleware(['auth', 'verified'])->name('tracks');

Route::get('/composers', function () {
    return Inertia::render('ListPage');
})->middleware(['auth', 'verified'])->name('composers');

Route::get('/performances', function () {
    return Inertia::render('ListPage');
})->middleware(['auth', 'verified'])->name('performances');

Route::inertia('/tracks/add', 'AddOrEditComponent')
  ->middleware(['auth', 'verified'])
  ->name('tracks.add');
Route::inertia('/composers/add', 'AddOrEditComponent')
  ->middleware(['auth', 'verified'])
  ->name('composers.add');
Route::inertia('/performances/add', 'AddOrEditComponent')
  ->middleware(['auth', 'verified'])
  ->name('performances.add');
  
Route::inertia('/tracks/edit', 'AddOrEditComponent')
  ->middleware(['auth', 'verified'])
  ->name('tracks.edit');
Route::inertia('/composers/edit', 'AddOrEditComponent')
  ->middleware(['auth', 'verified'])
  ->name('composers.edit');
Route::inertia('/performances/edit', 'AddOrEditComponent')
  ->middleware(['auth', 'verified'])
  ->name('performances.edit');

Route::get('/track/columns', [TrackController::class, 'get_track_column_info']);
Route::get('/track', [TrackController::class, 'get']);
Route::get('/track/{id}', [TrackController::class, 'get']);

require __DIR__.'/auth.php';
