<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Performance extends Model
{
    use HasFactory;

    protected $fillable = ['location'];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_active' => 'boolean',
        'start_time' => 'datetime:d.m.Y H:m',
        'end_time' => 'datetime:d.m.Y H:m',
        'created_at' => 'datetime:d.m.Y H:m',
        'updated_at' => 'datetime:d.m.Y H:m',
    ];

    public function tracks()
    {
        return $this->belongsToMany(Track::class);
    }

}
