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

    $unique_partials = $partials;

    // If more clients than partials, duplicate original partials until this is no longer the case.
    while (count($clients) > count($partials)) {
      $partials = array_merge($partials, $unique_partials);
    }
    
    // Array of chunk arrays, same length as registered clients array.
    $chunks = array_fill(0, count($clients), []);

    // Distribute partials between chunks.
    // In conjuction with partial duplication above, this guarantees that all partials are played equally often.
    // Not all clients get the same amount of partials though.
    $counter = 0;
    while ($partial = array_pop($partials)) {
      array_push($chunks[$counter], $partial);
      $counter++;
      if ($counter > count($clients) - 1) {
        $counter = 0;
      }
    }
    foreach($clients as $i=>$value) {
      $client = Client::where('id', $value->id)->firstOrFail();
      $client->partials = $chunks[$i];
      $client->start_time = date('Y-m-d H:i:s', strtotime('+ 5 second'));
      $client->save();
    }
    return Response::json(['data' => $chunks]);
  }

  /**
   * 
   * @param Array $list
   * @param int $p
   * @return multitype:multitype:
   * @link http://www.php.net/manual/en/function.array-chunk.php#75022
   * https://stackoverflow.com/a/15723262/16725862 is where I got this from
   */
  function partition(Array $list, $p) {
    $listlen = count($list);
    $partlen = floor($listlen / $p);
    $partrem = $listlen % $p;
    $partition = array();
    $mark = 0;
    for($px = 0; $px < $p; $px ++) {
        $incr = ($px < $partrem) ? $partlen + 1 : $partlen;
        $partition[$px] = array_slice($list, $mark, $incr);
        $mark += $incr;
    }
    return $partition;
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
