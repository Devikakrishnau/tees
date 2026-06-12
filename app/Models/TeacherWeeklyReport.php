<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherWeeklyReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'week_start_date',
        'week_end_date',
        'avg_speaking_speed_wpm',
        'total_filler_words',
        'avg_sentiment_score',
        'avg_student_attention_score',
        'avg_explanation_quality_score',
        'weekly_quality_index',
        'improvement_suggestions',
    ];

    protected $casts = [
        'avg_speaking_speed_wpm' => 'float',
        'avg_sentiment_score' => 'float',
        'avg_student_attention_score' => 'float',
        'avg_explanation_quality_score' => 'float',
        'weekly_quality_index' => 'float',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
