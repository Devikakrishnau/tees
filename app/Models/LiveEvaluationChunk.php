<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LiveEvaluationChunk extends Model
{
    use HasFactory;

    protected $fillable = [
        'stream_key',
        'teacher_id',
        'class_id',
        'chunk_index',
        'student_attention_score',
        'explanation_quality_score',
        'speaking_speed_wpm',
        'ai_feedback',
    ];

    protected $casts = [
        'ai_feedback' => 'array',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
