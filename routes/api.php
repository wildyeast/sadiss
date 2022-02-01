<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TrackController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\ComposerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/track/columns', [TrackController::class, 'get_column_info']);
Route::post('/track/create', [TrackController::class, 'create'])
  ->name('track.create');
Route::get('/track', [TrackController::class, 'get']);
Route::get('/track/{id}', [TrackController::class, 'get']);

Route::get('/performance/columns', [PerformanceController::class, 'get_column_info']);
Route::post('/performance/create', [PerformanceController::class, 'create'])
  ->name('performance.create');
Route::get('/performance', [PerformanceController::class, 'get']);
Route::get('/performance/{id}', [PerformanceController::class, 'get']);

Route::get('/composer/columns', [ComposerController::class, 'get_column_info']);
Route::post('/composer/create', [ComposerController::class, 'create'])
  ->name('composer.create');
Route::get('/composer', [ComposerController::class, 'get']);
Route::get('/composer/{id}', [ComposerController::class, 'get']);


