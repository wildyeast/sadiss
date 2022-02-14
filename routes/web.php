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

Route::get('/tracks/{id}', function () {
  return Inertia::render('ListEntryDetailsPage');
})->middleware(['auth', 'verified'])->name('tracks.show');
Route::get('/tracks', function () {
    return Inertia::render('ListPage');
})->middleware(['auth', 'verified'])->name('tracks');

Route::get('/composers/{id}', function () {
  return Inertia::render('ListEntryDetailsPage');
})->middleware(['auth', 'verified'])->name('composers.show');
Route::get('/composers', function () {
    return Inertia::render('ListPage');
})->middleware(['auth', 'verified'])->name('composers');

Route::get('/performances/{id}', function () {
  return Inertia::render('ListEntryDetailsPage');
})->middleware(['auth', 'verified'])->name('performances.show');
Route::get('/performances', function () {
    return Inertia::render('ListPage');
})->middleware(['auth', 'verified'])->name('performances');

Route::inertia('/tracks/add', 'AddOrEditPage')
  ->middleware(['auth', 'verified'])
  ->name('tracks.add');
Route::inertia('/composers/add', 'AddOrEditPage')
  ->middleware(['auth', 'verified'])
  ->name('composers.add');
Route::inertia('/performances/add', 'AddOrEditPage')
  ->middleware(['auth', 'verified'])
  ->name('performances.add');
  
Route::inertia('/tracks/edit', 'AddOrEditPage')
  ->middleware(['auth', 'verified'])
  ->name('tracks.edit');
Route::inertia('/composers/edit', 'AddOrEditPage')
  ->middleware(['auth', 'verified'])
  ->name('composers.edit');
Route::inertia('/performances/edit', 'AddOrEditPage')
  ->middleware(['auth', 'verified'])
  ->name('performances.edit');

require __DIR__.'/auth.php';
