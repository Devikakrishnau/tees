<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use App\Models\TeacherEvaluation;
use App\Models\TeacherWeeklyReport;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        try {
            // Clear Spatie Permission cache to prevent issues after migrate:fresh
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            // Create roles
            $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
            Role::firstOrCreate(['name' => 'Teacher', 'guard_name' => 'web']);
            Role::firstOrCreate(['name' => 'Student', 'guard_name' => 'web']);

            // Create Super Admin User
            $superAdmin = User::firstOrCreate(
                ['email' => 'admin@tees.com'],
                ['name' => 'Super Admin', 'password' => Hash::make('password')]
            );

            $superAdmin->assignRole($superAdminRole);

            // Dummy Data for TEES
            TeacherEvaluation::firstOrCreate(
                ['video_url' => 'http://example.com/video1.mp4'],
                [
                    'teacher_id' => $superAdmin->id,
                    'class_id' => 101,
                    'speaking_speed_wpm' => 130.5,
                    'filler_words_count' => 12,
                    'sentiment_score' => 0.8,
                    'student_attention_score' => 88.5,
                    'explanation_quality_score' => 82.0,
                    'overall_quality_index' => 85.0,
                    'ai_feedback' => ['summary' => 'Good pace, but try to ask more interactive questions.'],
                    'created_at' => Carbon::now()->subDays(2)
                ]
            );

            TeacherEvaluation::firstOrCreate(
                ['video_url' => 'http://example.com/video2.mp4'],
                [
                    'teacher_id' => $superAdmin->id,
                    'class_id' => 102,
                    'speaking_speed_wpm' => 140.0,
                    'filler_words_count' => 8,
                    'sentiment_score' => 0.9,
                    'student_attention_score' => 92.0,
                    'explanation_quality_score' => 88.0,
                    'overall_quality_index' => 90.0,
                    'ai_feedback' => ['summary' => 'Excellent engagement and very clear explanations.'],
                    'created_at' => Carbon::now()->subDays(1)
                ]
            );

            TeacherWeeklyReport::firstOrCreate(
                ['teacher_id' => $superAdmin->id, 'week_start_date' => Carbon::now()->startOfWeek()],
                [
                    'week_end_date' => Carbon::now()->endOfWeek(),
                    'avg_speaking_speed_wpm' => 135.25,
                    'total_filler_words' => 20,
                    'avg_sentiment_score' => 0.85,
                    'avg_student_attention_score' => 90.25,
                    'avg_explanation_quality_score' => 85.0,
                    'weekly_quality_index' => 87.5,
                    'improvement_suggestions' => 'You are doing great! Try to reduce the use of filler words during complex explanations to improve clarity further.',
                ]
            );
            
            echo "Database Seeder completed successfully!\n";
        } catch (\Exception $e) {
            echo "Seeder crashed: " . $e->getMessage() . "\n";
            echo $e->getTraceAsString() . "\n";
        }
    }
}
