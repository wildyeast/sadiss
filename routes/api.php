<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Carbon\Carbon;

use App\Http\Controllers\TrackController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\ComposerController;
use App\Http\Controllers\ClientController;

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
Route::post('/track/delete/{id}', [TrackController::class, 'delete'])
  ->name('track.delete');
Route::post('/track/edit/{id}', [TrackController::class, 'edit'])
  ->name('track.edit');
Route::post('/track/{id}/start', [TrackController::class, 'start_track'])
  ->name('track.start');
Route::get('/track', [TrackController::class, 'get']);
Route::get('/track/{id}', [TrackController::class, 'get']);

Route::get('/performance/columns', [PerformanceController::class, 'get_column_info']);
Route::post('/performance/create', [PerformanceController::class, 'create'])
  ->name('performance.create');
Route::post('/performance/delete/{id}', [PerformanceController::class, 'delete'])
  ->name('performance.delete');
Route::post('/performance/edit/{id}', [PerformanceController::class, 'edit'])
  ->name('performance.edit');
Route::get('/performance', [PerformanceController::class, 'get']);
Route::get('/performance/{id}', [PerformanceController::class, 'get']);

Route::get('/composer/columns', [ComposerController::class, 'get_column_info']);
Route::post('/composer/create', [ComposerController::class, 'create'])
  ->name('composer.create');
Route::post('/composer/delete/{id}', [ComposerController::class, 'delete'])
  ->name('composer.delete');
Route::post('/composer/edit/{id}', [ComposerController::class, 'edit'])
  ->name('composer.edit');
Route::get('/composer', [ComposerController::class, 'get']);
Route::get('/composer/{id}', [ComposerController::class, 'get']);

Route::post('/client/create', [ClientController::class, 'create'])
  ->name('client.create');
Route::post('/client/delete/{id}', [ClientController::class, 'delete'])
  ->name('client.delete');
Route::get('/client/{token}', [ClientController::class, 'get_by_token'])
  ->name('client.get_by_token');
Route::get('/client', [ClientController::class, 'get']);

Route::group(['excluded_middleware' => 'throttle:api'], function () {
  Route::get('/time', function () {
    $current_date = Carbon::now()->getPreciseTimestamp(3);
    return Response::json(['time' => $current_date]);
  });
  Route::get('/client/{token}', [ClientController::class, 'get_by_token'])
    ->name('client.get_by_token');
  Route::get('/client', [ClientController::class, 'get']);
});
