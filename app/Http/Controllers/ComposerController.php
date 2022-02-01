<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Composer;

class ComposerController extends Controller
{
    public function create(Request $request)
    {
      $composer = new Composer;
      $composer->name = $request->name;
      $composer->description = $request->description;
      $composer->photo = $request->photo;
      $composer->website_url = $request->website_url;
      $composer->is_active = $request->is_active;
      $composer->save();
      return back()->with('flash', [
          'message' => 'success',
      ]);
    }

    public function get(Request $request, $id=null) {
      if (isset($id)) {
        return Composer::where('id', $id)->firstOrFail();
      }
      return Composer::all();
    }

    public function get_column_info (Request $request) {
      $columns = DB::select( DB::raw('SHOW COLUMNS FROM composers'));
      return $columns;
    }
}
