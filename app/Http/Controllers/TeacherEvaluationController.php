<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TeacherEvaluation;
use App\Models\TeacherWeeklyReport;
use Illuminate\Support\Facades\Auth;

class TeacherEvaluationController extends Controller
{
    /**
     * Get Teacher Quality Index Dashboard data
     */
    public function dashboard(Request $request)
    {
        $teacherId = Auth::id();
        
        if ($request->has('teacher_id') && Auth::user()->hasAnyRole(['Super Admin'])) {
            $teacherId = $request->teacher_id;
        }

        $latestWeeklyReport = TeacherWeeklyReport::where('teacher_id', $teacherId)
                                ->orderBy('week_start_date', 'desc')
                                ->first();

        $recentEvaluations = TeacherEvaluation::where('teacher_id', $teacherId)
                                ->orderBy('created_at', 'desc')
                                ->take(5)
                                ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'latest_report' => $latestWeeklyReport,
                'recent_evaluations' => $recentEvaluations
            ]
        ]);
    }

    /**
     * Get the single most recent evaluation (for live analysis polling)
     */
    public function latestEvaluation(Request $request)
    {
        $teacherId = Auth::id();
        $since = $request->query('since'); // optional: only return if newer than this timestamp

        $query = TeacherEvaluation::where('teacher_id', $teacherId)
                    ->orderBy('created_at', 'desc');

        if ($since) {
            $query->where('created_at', '>', $since);
        }

        $evaluation = $query->first();

        return response()->json([
            'success' => true,
            'ready'   => !is_null($evaluation),
            'data'    => $evaluation
        ]);
    }

    /**
     * Get specific weekly report details
     */
    public function getWeeklyReport($id)
    {
        $report = TeacherWeeklyReport::findOrFail($id);
        
        if (Auth::id() !== $report->teacher_id && !Auth::user()->hasAnyRole(['Super Admin'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Store new evaluation (Will be called by the Python AI Service)
     */
    public function storeEvaluation(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'video_url' => 'nullable|string',
            'speaking_speed_wpm' => 'nullable|numeric',
            'filler_words_count' => 'nullable|integer',
            'sentiment_score' => 'nullable|numeric',
            'student_attention_score' => 'nullable|numeric',
            'explanation_quality_score' => 'nullable|numeric',
            'overall_quality_index' => 'nullable|numeric',
            'ai_feedback' => 'nullable|array',
            'timeline_breakdown' => 'nullable|array'
        ]);

        $evaluation = TeacherEvaluation::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Evaluation stored successfully',
            'data' => $evaluation
        ], 201);
    }

    /**
     * Trigger AI Analysis
     */
    public function triggerAnalysis(Request $request)
    {
        $request->validate([
            'video_url' => 'required|url',
            'class_id' => 'nullable|integer',
        ]);

        // Send request to Python AI Microservice
        try {
            $response = \Illuminate\Support\Facades\Http::post('http://ai_service:8000/analyze-video', [
                'teacher_id' => Auth::id(),
                'class_id' => $request->class_id,
                'video_url' => $request->video_url
            ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Video analysis queued successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to queue analysis on AI microservice'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'AI microservice is currently unreachable.'
            ], 503);
        }
    }
}
