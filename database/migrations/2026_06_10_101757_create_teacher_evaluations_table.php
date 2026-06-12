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
        Schema::create('teacher_evaluations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->string('video_url')->nullable();
            
            // Metrics
            $table->decimal('speaking_speed_wpm', 5, 2)->nullable();
            $table->integer('filler_words_count')->default(0);
            $table->decimal('sentiment_score', 5, 2)->nullable();
            $table->decimal('student_attention_score', 5, 2)->nullable();
            $table->decimal('explanation_quality_score', 5, 2)->nullable();
            
            $table->decimal('overall_quality_index', 5, 2)->nullable();
            $table->json('ai_feedback')->nullable();
            
            $table->timestamps();
            
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_evaluations');
    }
};
