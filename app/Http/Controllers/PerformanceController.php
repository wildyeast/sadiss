<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Performance;

class PerformanceController extends Controller
{
  public function create(Request $request)
  {
    $performance = new Performance;
    $performance->location = $request->location;
    $performance->start_time = $request->start_time;
    $performance->end_time = $request->end_time;
    $performance->is_active = $request->is_active ? true : false;;
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
    $performance->location = $request->location;
    $performance->start_time = $request->start_time;
    $performance->end_time = $request->end_time;
    $performance->is_active = $request->is_active ? true : false;
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

  private function format_list($t)
  {
    return [
      'id' => $t->id,
      'created_at' => $t->created_at,
      'title' => $t->title,
      'description' => $t->description,
      'partials' => isset($t->partials),
      'tts_instructions' => isset($t->tts_instructions),
      'is_choir' => $t->is_choir
    ];
  }
}
