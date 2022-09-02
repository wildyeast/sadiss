<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Carbon\Carbon;

use App\Http\Controllers\TrackController;
use App\Http\Controllers\PerformanceController;
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
Route::get('/track/{id}/partials', [TrackController::class, 'get_partials']);
Route::post('/track/{id}/start/{startTime}/{performance_id}', [TrackController::class, 'start_track'])
  ->name('track.start');
Route::post('/track/{id}/start_all/{startTime}/{performance_id}', [TrackController::class, 'start_track_all_partials'])
  ->name('track.startall');
Route::get('/track', [TrackController::class, 'get']);
Route::get('/tracklist', [TrackController::class, 'get_list']);
Route::get('/track/{id}', [TrackController::class, 'get']);
Route::get('/track/{id}/duration', [TrackController::class, 'get_duration']);
Route::get('/tracklist/{id}', [TrackController::class, 'get_list']);

Route::post('/performance/add_tracks/{id}', [PerformanceController::class, 'attach_tracks_to_performance']);
Route::get('/performance/get_tracks/{id}', [PerformanceController::class, 'get_tracks']);
Route::get('/performance/columns', [PerformanceController::class, 'get_column_info']);
Route::post('/performance/create', [PerformanceController::class, 'create'])
  ->name('performance.create');
Route::post('/performance/delete/{id}', [PerformanceController::class, 'delete'])
  ->name('performance.delete');
Route::post('/performance/edit/{id}', [PerformanceController::class, 'edit'])
  ->name('performance.edit');
Route::get('/performance/{id}/partial_ids', [PerformanceController::class, 'get_partial_indices_of_track_with_most_partials']);
Route::get('/performance', [PerformanceController::class, 'get']);
Route::get('/performance/{id}', [PerformanceController::class, 'get']);

Route::post('/client/create', [ClientController::class, 'create'])
  ->name('client.create');
Route::post('/client/delete/{id}', [ClientController::class, 'delete'])
  ->name('client.delete');
Route::get('/client', [ClientController::class, 'get']);

// Adding routes in this group disables throttling for them, preventing 429 errors. Kinda dangerous though I guess.
Route::group(['excluded_middleware' => 'throttle:api'], function () {
  Route::get('/time', function () {
    $current_date = Carbon::now()->getPreciseTimestamp(3);
    return Response::json(['time' => $current_date]);
  });
  Route::get('/client/active', [ClientController::class, 'get_active_clients_delete_others'])
    ->name('client.active');
  Route::get('/client/active/{performance_id}', [ClientController::class, 'get_active_clients_delete_others']);
  Route::get('/client/{token}', [ClientController::class, 'get_by_token'])
    ->name('client.get_by_token');
  Route::get('/client', [ClientController::class, 'get']);

  Route::get('/arrange', [TrackController::class, 'arrange_partials']);
});
