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
    $track->partials_file_name = $request->partials_file_name;
    $track->is_choir = $request->is_choir ? $request->is_choir : false;
    if ($request->hasFile('tts_instructions')) {
      $tts_instructions = file_get_contents($request->file('tts_instructions')->getRealPath());
      $track->tts_instructions = $tts_instructions;
      $track->tts_instructions_file_name = $request->tts_instructions_file_name;
      $track->tts_languages = $request->ttsLanguages;
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
    if ($request->hasFile('tts_instructions')) {
      $tts_instructions = file_get_contents($request->file('tts_instructions')->getRealPath());
      $track->tts_instructions = $tts_instructions;
      $track->tts_instructions_file_name = $request->tts_instructions_file_name;
      $track->tts_languages = $request->ttsLanguages;
    }
    $track->is_choir = $request->is_choir ? $request->is_choir : false;
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

  public function get_duration(Request $request, $id = null)
  {
    $t = Track::where('id', $id)->firstOrFail();
    $partials = json_decode($t->partials);
    $latest_end_time = 0;
    foreach($partials as $p) {
      if ($p->endTime > $latest_end_time) {
        $latest_end_time = $p->endTime;
      }
    }
    return $latest_end_time;
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
      'tts_languages' => $t->tts_languages,
      'is_choir' => $t->is_choir
    ];
  }

  public function get_list(Request $request, $id = null)
  {
    if (isset($id)) {
      return $this->format_list(Track::where('id', $id)->firstOrFail());
    }
    return Track::orderBy('id', 'desc')->get()->map(fn ($t) => $this->format_list($t));
  }


  public function get_column_info(Request $request)
  {
    $columns = DB::select(DB::raw('SHOW COLUMNS FROM tracks'));
    return $columns;
  }

  public function get_partials(Request $request, $id)
  {
    return Track::where('id', $id)->pluck('partials')->firstOrFail();
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
    $number_of_simultaneous_voices = $request->query->get('number_of_simultaneous_voices');

    /*
    if ($number_of_simultaneous_voices) {
      $partials = $this->arrange_partials($partials, $number_of_simultaneous_voices);
    }
    */

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
        if ($number_of_simultaneous_voices) {
          $client->partials = $this->arrange_partials($chunks[$i], $number_of_simultaneous_voices);
        } else {
          $client->partials = $chunks[$i];
        }
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
        if ($value->partial_id) {
          $client->partials = array(0 => $partials[$value->partial_id % count($partials)]);
        } else {
          continue;
        }
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

  public function arrange_partials($partials = false, $max_oscillators = 4)
  {
    $INTERPOLATION_TIME = 0.01; // in seconds

    // This is useful for debugging, you can use the /arrange route :)
    /*
    if (!$partials) {
      $t = Track::where('id', 8)->first();
      $partials = json_decode($t->partials);
    }
    */

    // Only arrange if partial number is larger than max oscillators
    if (count($partials) <= $max_oscillators) {
      return $partials;
    }

    // Initialize oscillators
    $oscillators = [];
    for ($i = 0; $i < $max_oscillators; $i++) {
      array_push($oscillators, [
        'index' => $i,
        'breakpoints' => []
      ]);
    }

    // Sort partials by start time
    usort($partials, function ($a, $b) {
      return $a->startTime > $b->startTime;
    });

    // Arrange oscillators 
    $oscillator_index = 0;
    foreach ($partials as $p) {
      if (empty($oscillators[$oscillator_index]['breakpoints'])) {
        // init
        $oscillators[$oscillator_index]['breakpoints'] = $p->breakpoints;
        $oscillators[$oscillator_index]['startTime'] = $p->breakpoints[0]->time;
      } else {
        $breaktime = $p->breakpoints[0]->time;
        $new_breakpoints = [];
        foreach ($oscillators[$oscillator_index]['breakpoints'] as $bp) {
          if ($bp->time < $breaktime) {
            array_push($new_breakpoints, $bp);
          } else {
            break;
          }
        }
        if (!empty($new_breakpoints)) {
          $last_bp = end($new_breakpoints);
          $first_new_bp = $p->breakpoints[0];
          if ($last_bp && $first_new_bp) {
            // If breakpoint distance > 20ms
            $distance = $first_new_bp->time - $last_bp->time;
            if ($distance > $INTERPOLATION_TIME * 2) {
              // Fade out and back in
              $fade_out = (object) [
                'time' => $last_bp->time + $INTERPOLATION_TIME,
                'freq' => $last_bp->freq,
                'amp' => 0
              ];
              $fade_in = (object) [
                'time' => $first_new_bp->time - $INTERPOLATION_TIME,
                'freq' => $first_new_bp->freq,
                'amp' => 0
              ];
              array_push($new_breakpoints, $fade_out); 
              array_push($new_breakpoints, $fade_in); 
              //dd($last_bp, $fade_out, $fade_in, $first_new_bp);
            } else {
              // Add breakpoint in between
              $in_between = (object) [ 
                'time' => $last_bp->time + ($distance / 2),
                'freq' => ($last_bp->freq + $first_new_bp->freq) / 2 ,
                'amp' => ($last_bp->amp + $first_new_bp->amp) / 2 ,
              ];
              array_push($new_breakpoints, $in_between);
            }
          }
        }
        array_push($new_breakpoints, ...$p->breakpoints);
        $oscillators[$oscillator_index]['endTime'] = end($p->breakpoints)->time;
        $oscillators[$oscillator_index]['breakpoints'] = $new_breakpoints;
      }
      $oscillator_index = ($oscillator_index + 1) % $max_oscillators;
    }
    return $oscillators;
  }
}
