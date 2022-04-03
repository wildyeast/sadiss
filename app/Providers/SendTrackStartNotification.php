<?php

namespace App\Providers;

use App\Providers\TrackStarted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendTrackStartNotification
{
    /**
     * Create the event listener.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     *
     * @param  \App\Providers\TrackStarted  $event
     * @return void
     */
    public function handle(TrackStarted $event)
    {
        //
    }
}
