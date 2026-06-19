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
        Schema::create('live_evaluation_chunks', function (Blueprint $table) {
            $table->id();
            $table->string('stream_key')->index();
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->integer('chunk_index')->default(0);
            
            $table->decimal('student_attention_score', 5, 2)->nullable();
            $table->decimal('explanation_quality_score', 5, 2)->nullable();
            $table->decimal('speaking_speed_wpm', 5, 2)->nullable();
            
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
        Schema::dropIfExists('live_evaluation_chunks');
    }
};
