<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function get () {
      $perfs = Performance::all();
      dd($perfs);
    }
}
