<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Response;
use Carbon\Carbon;
use App\Models\Client;

class ClientController extends Controller
{
  public function create(Request $request)
  {
    $client = new Client;
    $client->token = $this->create_token();
    $client->performance_id = $request->performance_id;
    $client->save();
    // return back()->with('flash', [
    //     'message' => 'success',
    // ]);
    return Response::json(['token' => $client->token, 'id' => $client->id]);
  }

  public function delete(Request $request, $id) {
    Client::where('id', $id)->delete();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function get(Request $request, $id=null) {
    if (isset($id)) {
      $client = Client::where('id', $id)->firstOrFail();
      return $client;
    }
    return Client::all();
  }

  // Watch out for side effects when using this function:
  // Calling this sets last_listening_time for the client with requested token
  public function get_by_token(Request $request) {
    $client = Client::where('token', $request->token)->firstOrFail();
    $client->last_listening_time = Carbon::now();
    $client->save();
    $current_date = Carbon::now()->getPreciseTimestamp(3);
    return Response::json(['client' => $client, 'time' => $current_date]);
  }

  // Returns all clients that have made a listening call in the last $DOWNTIME_CUTOFF_IN_SEC seconds
  // and deletes all others.
  // TODO: There must be a better way to do this. 
  public function get_active_clients_delete_others(Request $request) {
    $DOWNTIME_CUTOFF_IN_SEC = 5;

    $clients = Client::all();
    $active_clients = [];
    foreach($clients as $i=>$client) {
      if ($client->last_listening_time == null) {
        continue;
      }
      $diff = Carbon::parse($client->last_listening_time)->diffInSeconds(Carbon::now());
      if ($diff <= $DOWNTIME_CUTOFF_IN_SEC) {
        array_push($active_clients, $client);
      } else {
        $client->delete();
      }
    }
    
    return $active_clients;
  }

  public function create_token() {
    // Make token unique? E.g. by making the field unique in db
    return Str::random(7);
  }
}
