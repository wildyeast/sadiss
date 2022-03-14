<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Client;
use Response;

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
    return Response::json(['token' => $client->token]);
  }

  public function delete(Request $request, $id) {
    Client::where('id', $id)->delete();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function get(Request $request, $id=null) {
    if (isset($id)) {
      return Client::where('id', $id)->firstOrFail();
    }
    return Client::all();
  }

  public function create_token() {
    // Make token unique? E.g. by making the field unique in db
    return Str::random(7);
  }
}
