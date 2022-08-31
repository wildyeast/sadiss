<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('performances', function (Blueprint $table) {
            $table->tinyInteger('output_device');
            $table->boolean('calibrate_output_latency');
            $table->string('display_title')->nullable();
            $table->dropColumn('start_time');
            $table->dropColumn('end_time');
            $table->renameColumn('location', 'title');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('performances', function (Blueprint $table) {
            $table->dropColumn('output_device');
            $table->dropColumn('calibrate_output_latency');
            $table->dropColumn('display_title');
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->renameColumn('title', 'location');
        });
    }
};
