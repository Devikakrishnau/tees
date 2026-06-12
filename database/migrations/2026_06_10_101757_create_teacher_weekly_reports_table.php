<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('teacher_weekly_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_id');
            $table->date('week_start_date');
            $table->date('week_end_date');
            
            // Aggregated Metrics
            $table->decimal('avg_speaking_speed_wpm', 5, 2)->nullable();
            $table->integer('total_filler_words')->default(0);
            $table->decimal('avg_sentiment_score', 5, 2)->nullable();
            $table->decimal('avg_student_attention_score', 5, 2)->nullable();
            $table->decimal('avg_explanation_quality_score', 5, 2)->nullable();
            
            $table->decimal('weekly_quality_index', 5, 2)->nullable();
            $table->text('improvement_suggestions')->nullable();
            
            $table->timestamps();
            
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_weekly_reports');
    }
};
