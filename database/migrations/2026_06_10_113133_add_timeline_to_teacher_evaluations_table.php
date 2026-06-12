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
        Schema::table('teacher_evaluations', function (Blueprint $table) {
            $table->json('timeline_breakdown')->nullable()->after('ai_feedback');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_evaluations', function (Blueprint $table) {
            $table->dropColumn('timeline_breakdown');
        });
    }
};
