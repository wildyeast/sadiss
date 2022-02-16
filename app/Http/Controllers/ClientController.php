<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Client;

class ClientController extends Controller
{
  public function create(Request $request)
  {
    $client = new Client;
    $client->token = create_token();
    $client->performance_id = $request->performance_id;
    $client->save();
    return back()->with('flash', [
        'message' => 'success',
    ]);
  }

  public function delete(Request $request, $id) {
    Client::where('id', $id)->delete();
    return back()->with('flash', [
      'message' => 'success',
    ]);
  }

  public function create_token() {
    // Make token unique? E.g. by making the field unique in db
    return str_random(7);
  }
}
