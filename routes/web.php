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
  return redirect()->route('tracks');
});

Route::middleware(['auth', 'verified'])->group(function () {
  Route::inertia('/tracks', 'ListPage')
    ->name('tracks');
  Route::inertia('/performances', 'ListPage')
    ->name('performances');

  // Routes to 'add'
  Route::inertia('/tracks/add', 'AddOrEditTrackPage')
    ->name('tracks.add');
  Route::inertia('/performances/add', 'AddOrEditPage')
    ->name('performances.add');

  // Routes to 'edit'
  Route::inertia('/tracks/edit', 'AddOrEditTrackPage')
    ->name('tracks.edit');
  Route::inertia('/performances/edit', 'AddOrEditPage')
    ->name('performances.edit');

  // Routes to DetailsPage
  Route::inertia('/tracks/{id}', 'ListEntryDetailsPage')
    ->name('tracks.show');
  Route::inertia('/performances/{id}', 'ListEntryDetailsPage')
    ->name('performances.show');
});


require __DIR__ . '/auth.php';
