<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Performance;

class PerformanceController extends Controller
{
    public function get(Request $request, $id=null) {
      if (isset($id)) {
        return Performance::where('id', $id)->firstOrFail();
      }
      return Performance::all();
    }

    public function get_column_info (Request $request) {
      $columns = DB::select( DB::raw('SHOW COLUMNS FROM performances'));
      return $columns;
    }
}
