<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Track extends Model
{

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime:d.m.Y H:m',
        'updated_at' => 'datetime:d.m.Y H:m',
    ];

    public function performances()
    {
        return $this->belongsToMany(Performance::class);
    }
}
