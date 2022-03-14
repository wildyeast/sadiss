<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Track;
use App\Models\Client;
use Response;


class TrackController extends Controller
{
  public function create(Request $request)
  {
    if (!$request->file('sourcefile')) {
      // TODO Handle error
    }
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

  public function delete(Request $request, $id) {
    Track::where('id', $id)->delete();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function edit(Request $request, $id) {
    $track = Track::where('id', $id)->firstOrFail();
    $track->title = $request->title;
    $track->description = $request->description;
    if ($request->file('sourcefile')) {
      $sourcefile = file_get_contents($request->file('sourcefile')->getRealPath());
      $converted = $this->convert_source_file($sourcefile);
      $track->partials = $converted;
    }
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

  public function start_track (Request $request, $id) {
    $clients = app('App\Http\Controllers\ClientController')->get($request);
    $partials = json_decode(Track::where('id', $id)->firstOrFail()->partials);
    $chunk_length = ceil(count($partials) / count($clients));
    // TODO: Chunking needs improvements: Currently if e.g. 7 partials and 3 clients, the chunks are 3, 3, 1.
    // 3, 2, 2 would be better
    $chunks = array_chunk($partials, $chunk_length);
    foreach($clients as $i=>$value) {
      $client = Client::where('id', $value->id)->firstOrFail();
      $client->partials = $chunks[$i];
      $client->start_time = date('Y-m-d H:i:s', strtotime('+ 15 second'));
      $client->save();
    }
    return Response::json(['data' => $chunks]);
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
    }
    return json_encode($partials);
  }
}
