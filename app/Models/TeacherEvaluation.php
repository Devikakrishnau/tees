<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'class_id',
        'video_url',
        'speaking_speed_wpm',
        'filler_words_count',
        'sentiment_score',
        'student_attention_score',
        'explanation_quality_score',
        'overall_quality_index',
        'ai_feedback',
        'timeline_breakdown',
    ];

    protected $casts = [
        'ai_feedback' => 'array',
        'timeline_breakdown' => 'array',
        'speaking_speed_wpm' => 'float',
        'sentiment_score' => 'float',
        'student_attention_score' => 'float',
        'explanation_quality_score' => 'float',
        'overall_quality_index' => 'float',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
