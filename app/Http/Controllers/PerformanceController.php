<?php

namespace App\Http\Controllers;

use App\Models\Track;
use App\Models\Performance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PerformanceController extends Controller
{
  public function create(Request $request)
  {
    $performance = new Performance;
    $performance->title = $request->title;
    $performance->display_title = $request->display_title;
    $performance->is_active = $request->is_active ? true : false;
    $performance->tts_languages = $request->ttsLanguages;
    $performance->output_device = $request->output_device;
    $performance->calibrate_output_latency = $request->calibrate_output_latency ? true : false;
    $performance->save();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function delete(Request $request, $id)
  {
    Performance::where('id', $id)->delete();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function edit(Request $request, $id)
  {
    $performance = Performance::where('id', $id)->firstOrFail();
    $performance->title = $request->title;
    $performance->display_title = $request->display_title;
    $performance->is_active = $request->is_active ? true : false;
    $performance->tts_languages = $request->ttsLanguages;
    $performance->output_device = $request->output_device;
    $performance->calibrate_output_latency = $request->calibrate_output_latency ? true : false;
    $performance->save();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function get(Request $request, $id = null)
  {
    if (isset($id)) {
      return Performance::where('id', $id)->firstOrFail();
    }
    return Performance::all();
  }

  public function get_column_info(Request $request)
  {
    $columns = DB::select(DB::raw('SHOW COLUMNS FROM performances'));
    return $columns;
  }

  public function attach_tracks_to_performance(Request $request)
  {
    $performance = Performance::find($request->id);
    $performance->tracks()->detach(); // Detach all tracks from performance
    $tracks = $request->query->get('tracks');
    $performance->tracks()->attach($tracks);
  }

  public function get_tracks(Request $request)
  {
    $performance = Performance::find($request->id);
    $tracks = $performance->tracks()->get()->map(fn ($t) => $this->format_list($t));
    return $tracks;
  }

  public function get_partial_indices_of_track_with_most_partials(Request $request)
  {
    $partials_of_all_tracks = Performance::find($request->id)->tracks()->where('is_choir', true)->pluck('partials')->toArray();
    $partials_of_track_with_most_partials = max(array_map(fn ($partial) => json_decode($partial), $partials_of_all_tracks));
    $partial_ids = array_map(fn ($partial) => $partial->index, $partials_of_track_with_most_partials);
    return $partial_ids;
  }

  private function format_list($t)
  {
    return [
      'id' => $t->id,
      'created_at' => $t->created_at,
      'title' => $t->title,
      'description' => $t->description,
      'partials' => isset($t->partials),
      'tts_instructions' => isset($t->tts_instructions),
      'is_choir' => $t->is_choir,
    ];
  }
}
