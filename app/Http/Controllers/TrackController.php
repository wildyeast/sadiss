<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Track;


class TrackController extends Controller
{
  public function create(Request $request)
  {
    if (!$request->file('sourcefile')) {
      // TODO Handle error
    }
    dd($request->file('sourcefile'));
    $sourcefile = file_get_contents($request->file('sourcefile')->getRealPath());
    $converted = $this->convert_source_file($sourcefile);
    $track = new Track;
    $track->title = $request->title;
    $track->description = $request->description;
    $track->partials = $converted;
    $track->save();
    return back()->with('flash', [
        'message' => 'success',
    ]);
  }

  public function get(Request $request, $id=null) {
    if (isset($id)) {
      return Track::where('id', $id)->firstOrFail();
    }
    return Track::all();
  }

  public function get_column_info (Request $request) {
    $columns = DB::select( DB::raw('SHOW COLUMNS FROM tracks'));
    return $columns;
  }

  private function convert_source_file($sourcefile)
  {
    $partials = [];
    // Parse file line by line
    $partial =  [];
    foreach(preg_split("/((\r?\n)|(\r\n?))/", $sourcefile) as $i=>$line){
      if ($i < 4 || empty($line)) {
        continue;
      }
      if (empty($partial)) {
        // Create partial
        $meta = explode(' ', $line);
        $partial['index'] = $meta[0]; // TODO perhaps not needed 
        $partial['length'] = $meta[1]; // That too
        $partial['startTime'] = $meta[2];
        $partial['endTime'] = $meta[3];
        $partial['breakpoints'] = [];
        continue;
      }
      // Add breakpoint info
      $breakpoints = explode(' ', $line);
      $breakpoint = [];
      for ($i = 0; $i < count($breakpoints); $i += 3) {
        $breakpoint['time'] = $breakpoints[$i];
        $breakpoint['freq'] = $breakpoints[$i + 1];
        $breakpoint['amp'] = $breakpoints[$i + 2];
        array_push($partial['breakpoints'], $breakpoint);
      }
      array_push($partials, $partial);
      $partial = [];
      return json_encode($partials);
    }
  }
}
