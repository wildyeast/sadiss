<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Composer;

class ComposerController extends Controller
{
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
