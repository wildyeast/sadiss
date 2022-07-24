<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Track;
use App\Models\Client;
use Carbon\Carbon;
use Response;

use App\Providers\TrackStarted;
use Illuminate\Support\Facades\Event;

class TrackController extends Controller
{
  public function create(Request $request)
  {
    if (!$request->file('sourcefile')) {
      // TODO Handle error
    }
    $sourcefile = file_get_contents($request->file('sourcefile')->getRealPath());
    $converted = $this->convert_source_file($sourcefile);
    $tts_instructions = file_get_contents($request->file('tts_instructions')->getRealPath());
    $track = new Track;
    $track->title = $request->title;
    $track->description = $request->description;
    $track->partials = $converted;
    $track->tts_instructions = $tts_instructions;
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
    return Track::orderBy('id', 'desc')->get();
  }

  public function get_column_info (Request $request) {
    $columns = DB::select( DB::raw('SHOW COLUMNS FROM tracks'));
    return $columns;
  }

  public function start_track (Request $request, $id, $startTime, $performance_id=null) {
    $clients = null;
    if (isset($performance_id)) {
      $clients = app('App\Http\Controllers\ClientController')->get_active_clients_delete_others($request, $performance_id);
    } else {
      $clients = app('App\Http\Controllers\ClientController')->get_active_clients_delete_others($request);
    }
    $track = Track::where('id', $id)->firstOrFail();
    $partials = json_decode($track->partials);
    $tts_instructions = $track->tts_instructions;
    $tts_language = $request->query->get('tts_language');
    $choir_mode = $request->query->get('choir_mode');
    $waveform = $request->query->get('waveform');
    $partial_overlap = $request->query->get('partial_overlap');

    if ($choir_mode == "false") {
      $unique_partials = $partials;

      if (!$partial_overlap) {
        // If more clients than partials, duplicate original partials until this is no longer the case.
        while (count($clients) > count($partials)) {
          $partials = array_merge($partials, $unique_partials);
        }
      } else {
        // If overlap is set, duplicate partials $partial_overlap times
        for ($i = 1; $i < $partial_overlap; $i++) {
          $partials = array_merge($partials, $unique_partials); 
        } 
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
        $client->partials = $this->arrange_partials($chunks[$i]);
        $client->start_time = $startTime;
        $client->tts_instructions = $tts_instructions;
        $client->tts_language = $tts_language;
        $client->waveform = $waveform;
        $client->save();
      }
    }
    else {
      // Choir mode
      foreach($clients as $i=>$value) {
        $client = Client::where('id', $value->id)->firstOrFail();
        $client->partials = array(0 => $partials[$value->partial_id]);
        $client->start_time = $startTime;
        $client->tts_instructions = $tts_instructions;
        $client->tts_language = $tts_language;
        $client->waveform = $waveform;
        $client->save();
      }
    }

    // return Response::json(['data' => $chunks]); // Commented for debuggin
    return Response::json(['data' => $partials]); // Used in debugging
  }

  // Used for sending all partials to all clients
  public function start_track_all_partials (Request $request, $id, $startTime, $performance_id=null) {
    $clients = null;
    if (isset($performance_id)) {
      $clients = app('App\Http\Controllers\ClientController')->get_active_clients_delete_others($request, $performance_id);
    } else {
      $clients = app('App\Http\Controllers\ClientController')->get_active_clients_delete_others($request);
    }
    $track = Track::where('id', $id)->firstOrFail();
    $partials = json_decode($track->partials);
    $tts_instructions = $track->tts_instructions;
    $tts_language = $request->query->get('tts_language');
    $waveform = $request->query->get('waveform');

    foreach($clients as $i=>$value) {
      $client = Client::where('id', $value->id)->firstOrFail();
      // $client->partials = $chunks[$i]; // Commented for debugging
      $client->partials = $partials;
      $client->start_time = $startTime;
      $client->tts_instructions = $tts_instructions;
      $client->tts_language = $tts_language;
      $client->waveform = $waveform;
      $client->save();
    }

    return Response::json(['data' => $partials]);
  }

  public function start_track_real (Request $request) {
    $data = "TestData";

    event(new TrackStarted($data));

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

  public function arrange_partials()
  {
    $MAX_OSCILLATORS = 7;
    $partials_json = '[{"index":"0","length":"20","startTime":"0.000000","endTime":"3.095000","breakpoints":[{"time":"0.000000","freq":"739.988831","amp":"0.000001"},{"time":"0.009500","freq":"739.988831","amp":"0.036308"},{"time":"0.019000","freq":"739.988831","amp":"0.002291"},{"time":"0.066500","freq":"739.988831","amp":"0.002291"},{"time":"0.095000","freq":"739.988831","amp":"0.000001"},{"time":"1.000000","freq":"739.988831","amp":"0.000001"},{"time":"1.009500","freq":"739.988831","amp":"0.036308"},{"time":"1.019000","freq":"739.988831","amp":"0.002291"},{"time":"1.066500","freq":"739.988831","amp":"0.002291"},{"time":"1.095000","freq":"739.988831","amp":"0.000001"},{"time":"2.000000","freq":"739.988831","amp":"0.000001"},{"time":"2.009500","freq":"739.988831","amp":"0.036308"},{"time":"2.019000","freq":"739.988831","amp":"0.002291"},{"time":"2.066500","freq":"739.988831","amp":"0.002291"},{"time":"2.095000","freq":"739.988831","amp":"0.000001"},{"time":"3.000000","freq":"739.988831","amp":"0.000001"},{"time":"3.009500","freq":"739.988831","amp":"0.036308"},{"time":"3.019000","freq":"739.988831","amp":"0.002291"},{"time":"3.066500","freq":"739.988831","amp":"0.002291"},{"time":"3.095000","freq":"739.988831","amp":"0.000001"}]},{"index":"1","length":"20","startTime":"4.000000","endTime":"7.095000","breakpoints":[{"time":"4.000000","freq":"739.988831","amp":"0.000001"},{"time":"4.009500","freq":"739.988831","amp":"0.036308"},{"time":"4.019000","freq":"739.988831","amp":"0.002291"},{"time":"4.066500","freq":"739.988831","amp":"0.002291"},{"time":"4.095000","freq":"739.988831","amp":"0.000001"},{"time":"5.000000","freq":"739.988831","amp":"0.000001"},{"time":"5.009500","freq":"739.988831","amp":"0.036308"},{"time":"5.019000","freq":"739.988831","amp":"0.002291"},{"time":"5.066500","freq":"739.988831","amp":"0.002291"},{"time":"5.095000","freq":"739.988831","amp":"0.000001"},{"time":"6.000000","freq":"739.988831","amp":"0.000001"},{"time":"6.009500","freq":"739.988831","amp":"0.036308"},{"time":"6.019000","freq":"739.988831","amp":"0.002291"},{"time":"6.066500","freq":"739.988831","amp":"0.002291"},{"time":"6.095000","freq":"739.988831","amp":"0.000001"},{"time":"7.000000","freq":"739.988831","amp":"0.000001"},{"time":"7.009500","freq":"739.988831","amp":"0.036308"},{"time":"7.019000","freq":"739.988831","amp":"0.002291"},{"time":"7.066500","freq":"739.988831","amp":"0.002291"},{"time":"7.095000","freq":"739.988831","amp":"0.000001"}]},{"index":"2","length":"20","startTime":"8.000000","endTime":"11.095000","breakpoints":[{"time":"8.000000","freq":"739.988831","amp":"0.000001"},{"time":"8.009500","freq":"739.988831","amp":"0.036308"},{"time":"8.019000","freq":"739.988831","amp":"0.002291"},{"time":"8.066500","freq":"739.988831","amp":"0.002291"},{"time":"8.095000","freq":"739.988831","amp":"0.000001"},{"time":"9.000000","freq":"739.988831","amp":"0.000001"},{"time":"9.009500","freq":"739.988831","amp":"0.036308"},{"time":"9.019000","freq":"739.988831","amp":"0.002291"},{"time":"9.066500","freq":"739.988831","amp":"0.002291"},{"time":"9.095000","freq":"739.988831","amp":"0.000001"},{"time":"10.000000","freq":"739.988831","amp":"0.000001"},{"time":"10.009500","freq":"739.988831","amp":"0.036308"},{"time":"10.019000","freq":"739.988831","amp":"0.002291"},{"time":"10.066500","freq":"739.988831","amp":"0.002291"},{"time":"10.095000","freq":"739.988831","amp":"0.000001"},{"time":"11.000000","freq":"739.988831","amp":"0.000001"},{"time":"11.009500","freq":"739.988831","amp":"0.036308"},{"time":"11.019000","freq":"739.988831","amp":"0.002291"},{"time":"11.066500","freq":"739.988831","amp":"0.002291"},{"time":"11.095000","freq":"739.988831","amp":"0.000001"}]},{"index":"3","length":"20","startTime":"12.000000","endTime":"15.095000","breakpoints":[{"time":"12.000000","freq":"739.988831","amp":"0.000001"},{"time":"12.009500","freq":"739.988831","amp":"0.036308"},{"time":"12.019000","freq":"739.988831","amp":"0.002291"},{"time":"12.066500","freq":"739.988831","amp":"0.002291"},{"time":"12.095000","freq":"739.988831","amp":"0.000001"},{"time":"13.000000","freq":"739.988831","amp":"0.000001"},{"time":"13.009500","freq":"739.988831","amp":"0.036308"},{"time":"13.019000","freq":"739.988831","amp":"0.002291"},{"time":"13.066500","freq":"739.988831","amp":"0.002291"},{"time":"13.095000","freq":"739.988831","amp":"0.000001"},{"time":"14.000000","freq":"739.988831","amp":"0.000001"},{"time":"14.009500","freq":"739.988831","amp":"0.036308"},{"time":"14.019000","freq":"739.988831","amp":"0.002291"},{"time":"14.066500","freq":"739.988831","amp":"0.002291"},{"time":"14.095000","freq":"739.988831","amp":"0.000001"},{"time":"15.000000","freq":"739.988831","amp":"0.000001"},{"time":"15.009500","freq":"739.988831","amp":"0.036308"},{"time":"15.019000","freq":"739.988831","amp":"0.002291"},{"time":"15.066500","freq":"739.988831","amp":"0.002291"},{"time":"15.095000","freq":"739.988831","amp":"0.000001"}]},{"index":"4","length":"20","startTime":"16.000000","endTime":"19.094999","breakpoints":[{"time":"16.000000","freq":"739.988831","amp":"0.000001"},{"time":"16.009501","freq":"739.988831","amp":"0.036308"},{"time":"16.018999","freq":"739.988831","amp":"0.002291"},{"time":"16.066500","freq":"739.988831","amp":"0.002291"},{"time":"16.094999","freq":"739.988831","amp":"0.000001"},{"time":"17.000000","freq":"739.988831","amp":"0.000001"},{"time":"17.009501","freq":"739.988831","amp":"0.036308"},{"time":"17.018999","freq":"739.988831","amp":"0.002291"},{"time":"17.066500","freq":"739.988831","amp":"0.002291"},{"time":"17.094999","freq":"739.988831","amp":"0.000001"},{"time":"18.000000","freq":"739.988831","amp":"0.000001"},{"time":"18.009501","freq":"739.988831","amp":"0.036308"},{"time":"18.018999","freq":"739.988831","amp":"0.002291"},{"time":"18.066500","freq":"739.988831","amp":"0.002291"},{"time":"18.094999","freq":"739.988831","amp":"0.000001"},{"time":"19.000000","freq":"739.988831","amp":"0.000001"},{"time":"19.009501","freq":"739.988831","amp":"0.036308"},{"time":"19.018999","freq":"739.988831","amp":"0.002291"},{"time":"19.066500","freq":"739.988831","amp":"0.002291"},{"time":"19.094999","freq":"739.988831","amp":"0.000001"}]},{"index":"5","length":"20","startTime":"20.000000","endTime":"23.094999","breakpoints":[{"time":"20.000000","freq":"739.988831","amp":"0.000001"},{"time":"20.009501","freq":"739.988831","amp":"0.036308"},{"time":"20.018999","freq":"739.988831","amp":"0.002291"},{"time":"20.066500","freq":"739.988831","amp":"0.002291"},{"time":"20.094999","freq":"739.988831","amp":"0.000001"},{"time":"21.000000","freq":"739.988831","amp":"0.000001"},{"time":"21.009501","freq":"739.988831","amp":"0.036308"},{"time":"21.018999","freq":"739.988831","amp":"0.002291"},{"time":"21.066500","freq":"739.988831","amp":"0.002291"},{"time":"21.094999","freq":"739.988831","amp":"0.000001"},{"time":"22.000000","freq":"739.988831","amp":"0.000001"},{"time":"22.009501","freq":"739.988831","amp":"0.036308"},{"time":"22.018999","freq":"739.988831","amp":"0.002291"},{"time":"22.066500","freq":"739.988831","amp":"0.002291"},{"time":"22.094999","freq":"739.988831","amp":"0.000001"},{"time":"23.000000","freq":"739.988831","amp":"0.000001"},{"time":"23.009501","freq":"739.988831","amp":"0.036308"},{"time":"23.018999","freq":"739.988831","amp":"0.002291"},{"time":"23.066500","freq":"739.988831","amp":"0.002291"},{"time":"23.094999","freq":"739.988831","amp":"0.000001"}]},{"index":"6","length":"20","startTime":"24.000000","endTime":"27.094999","breakpoints":[{"time":"24.000000","freq":"739.988831","amp":"0.000001"},{"time":"24.009501","freq":"739.988831","amp":"0.036308"},{"time":"24.018999","freq":"739.988831","amp":"0.002291"},{"time":"24.066500","freq":"739.988831","amp":"0.002291"},{"time":"24.094999","freq":"739.988831","amp":"0.000001"},{"time":"25.000000","freq":"739.988831","amp":"0.000001"},{"time":"25.009501","freq":"739.988831","amp":"0.036308"},{"time":"25.018999","freq":"739.988831","amp":"0.002291"},{"time":"25.066500","freq":"739.988831","amp":"0.002291"},{"time":"25.094999","freq":"739.988831","amp":"0.000001"},{"time":"26.000000","freq":"739.988831","amp":"0.000001"},{"time":"26.009501","freq":"739.988831","amp":"0.036308"},{"time":"26.018999","freq":"739.988831","amp":"0.002291"},{"time":"26.066500","freq":"739.988831","amp":"0.002291"},{"time":"26.094999","freq":"739.988831","amp":"0.000001"},{"time":"27.000000","freq":"739.988831","amp":"0.000001"},{"time":"27.009501","freq":"739.988831","amp":"0.036308"},{"time":"27.018999","freq":"739.988831","amp":"0.002291"},{"time":"27.066500","freq":"739.988831","amp":"0.002291"},{"time":"27.094999","freq":"739.988831","amp":"0.000001"}]},{"index":"7","length":"20","startTime":"28.000000","endTime":"31.094999","breakpoints":[{"time":"28.000000","freq":"739.988831","amp":"0.000001"},{"time":"28.009501","freq":"739.988831","amp":"0.036308"},{"time":"28.018999","freq":"739.988831","amp":"0.002291"},{"time":"28.066500","freq":"739.988831","amp":"0.002291"},{"time":"28.094999","freq":"739.988831","amp":"0.000001"},{"time":"29.000000","freq":"739.988831","amp":"0.000001"},{"time":"29.009501","freq":"739.988831","amp":"0.036308"},{"time":"29.018999","freq":"739.988831","amp":"0.002291"},{"time":"29.066500","freq":"739.988831","amp":"0.002291"},{"time":"29.094999","freq":"739.988831","amp":"0.000001"},{"time":"30.000000","freq":"739.988831","amp":"0.000001"},{"time":"30.009501","freq":"739.988831","amp":"0.036308"},{"time":"30.018999","freq":"739.988831","amp":"0.002291"},{"time":"30.066500","freq":"739.988831","amp":"0.002291"},{"time":"30.094999","freq":"739.988831","amp":"0.000001"},{"time":"31.000000","freq":"739.988831","amp":"0.000001"},{"time":"31.009501","freq":"739.988831","amp":"0.036308"},{"time":"31.018999","freq":"739.988831","amp":"0.002291"},{"time":"31.066500","freq":"739.988831","amp":"0.002291"},{"time":"31.094999","freq":"739.988831","amp":"0.000001"}]}]';
    $partials = json_decode($partials_json);

    // Only arrange if partial number is larger than max oscillators
    if (count($partials) <= $MAX_OSCILLATORS) {
      return $partials;
    }

    // Initialize oscillators
    $oscillators = [];
    for ($i = 0; $i < $MAX_OSCILLATORS; $i++) {
      array_push($oscillators, [
        'index' => $i,
        'breakpoints' => []
      ]);
    }

    // Sort partials by start time

    $oscillator_index = 0;
    foreach ($partials as $p) {
      $o = $oscillators[$oscillator_index];
      if (empty($o['breakpoints'])) {
        $o['breakpoints'] = $p->breakpoints;
      }
      $oscillator_index = ($oscillator_index + 1) % $MAX_OSCILLATORS;
    }
    dd('osc', $oscillators);

  }
}
