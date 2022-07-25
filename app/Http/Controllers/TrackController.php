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

use function PHPUnit\Framework\isNull;

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
    if (!isNull($request->file('tts_instructions'))) {
      $tts_instructions = file_get_contents($request->file('tts_instructions')->getRealPath());
      $track->tts_instructions = $tts_instructions;
    }
    $track->partials = $converted;
    $track->save();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function delete(Request $request, $id)
  {
    Track::where('id', $id)->delete();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function edit(Request $request, $id)
  {
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

  public function get(Request $request, $id = null)
  {
    if (isset($id)) {
      return Track::where('id', $id)->firstOrFail();
    }
    return Track::orderBy('id', 'desc')->get();
  }

  public function get_column_info(Request $request)
  {
    $columns = DB::select(DB::raw('SHOW COLUMNS FROM tracks'));
    return $columns;
  }

  public function start_track(Request $request, $id, $startTime, $performance_id = null)
  {
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

      foreach ($clients as $i => $value) {
        $client = Client::where('id', $value->id)->firstOrFail();
        $client->partials = $this->arrange_partials($chunks[$i]);
        $client->start_time = $startTime;
        $client->tts_instructions = $tts_instructions;
        $client->tts_language = $tts_language;
        $client->waveform = $waveform;
        $client->save();
      }
    } else {
      // Choir mode
      foreach ($clients as $i => $value) {
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
  public function start_track_all_partials(Request $request, $id, $startTime, $performance_id = null)
  {
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

    foreach ($clients as $i => $value) {
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

  public function start_track_real(Request $request)
  {
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
  function partition(array $list, $p)
  {
    $listlen = count($list);
    $partlen = floor($listlen / $p);
    $partrem = $listlen % $p;
    $partition = array();
    $mark = 0;
    for ($px = 0; $px < $p; $px++) {
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
    foreach (preg_split("/((\r?\n)|(\r\n?))/", $sourcefile) as $i => $line) {
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
    $log = [];

    $MAX_OSCILLATORS = 64;
    $t = Track::where('id', 2)->first();
    $partials = json_decode($t->partials);

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
      if (empty($oscillators[$oscillator_index]['breakpoints'])) {
        $oscillators[$oscillator_index]['breakpoints'] = $p->breakpoints;
        array_push($log, 'init osc ' . $oscillator_index);
      } else {
        $breaktime = $p->breakpoints[0]->time;
        array_push($log, 'breaktime ' . $breaktime);
        //dd($break_time);
        // find oscillator 
        $new_breakpoints = [];
        foreach ($oscillators[$oscillator_index]['breakpoints'] as $bp) {
          if ($bp->time < $breaktime) {
            array_push($new_breakpoints, $bp);
          } else {
          //dd($bp->time, $breaktime, $bp->time > $breaktime);
            array_push($new_breakpoints, ...$p->breakpoints);
            array_push($log, $new_breakpoints);
            //dd($p->breakpoints);
            continue;
          }
        }
        $oscillators[$oscillator_index]['breakpoints'] = $new_breakpoints;
        // dd($oscillators[$oscillator_index]['breakpoints']);
      }
      $oscillator_index = ($oscillator_index + 1) % $MAX_OSCILLATORS;
    }
    dd($log);
    return $oscillators;
  }
}
