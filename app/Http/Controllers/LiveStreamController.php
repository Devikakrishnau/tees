<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LiveEvaluationChunk;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class LiveStreamController extends Controller
{
    /**
     * Start a new live stream session and return the stream info
     */
    public function startStream(Request $request)
    {
        $request->validate([
            'stream_key' => 'required|string',
            'class_id' => 'nullable|integer',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Live stream session initiated.',
            'stream_key' => $request->stream_key
        ]);
    }

    /**
     * Ingest a video chunk, save it, and send it to AI microservice for instant analysis.
     * The AI microservice will return chunk stats synchronously or asynchronously.
     */
    public function ingestChunk(Request $request)
    {
        $request->validate([
            'stream_key' => 'required|string',
            'video_chunk' => 'required|file|mimes:mp4,webm,mov,avi|max:51200', // 50MB max chunk
            'chunk_index' => 'required|integer'
        ]);

        if ($request->hasFile('video_chunk')) {
            $file = $request->file('video_chunk');
            $filename = time() . '_chunk_' . $request->chunk_index . '_' . $file->getClientOriginalName();
            
            // Store chunk temporarily
            $path = $file->storeAs('live_chunks', $filename, 'public');
            $videoUrl = url('/storage/' . $path);

            try {
                // Send chunk to AI Microservice for fast analysis
                // We assume the AI returns chunk scores synchronously for real-time tracking
                $response = Http::post('http://ai_service:8000/analyze-chunk', [
                    'teacher_id' => Auth::id(),
                    'stream_key' => $request->stream_key,
                    'chunk_index' => $request->chunk_index,
                    'video_url' => $videoUrl
                ]);

                if ($response->successful()) {
                    $aiData = $response->json();
                    
                    // Store the result directly into live_evaluation_chunks
                    $chunkData = LiveEvaluationChunk::create([
                        'stream_key' => $request->stream_key,
                        'teacher_id' => Auth::id(),
                        'chunk_index' => $request->chunk_index,
                        'student_attention_score' => $aiData['student_attention_score'] ?? 0,
                        'explanation_quality_score' => $aiData['explanation_quality_score'] ?? 0,
                        'speaking_speed_wpm' => $aiData['speaking_speed_wpm'] ?? 0,
                        'ai_feedback' => $aiData['ai_feedback'] ?? []
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Chunk analyzed successfully',
                        'data' => $chunkData
                    ]);
                }

                return response()->json(['success' => false, 'message' => 'AI analysis failed'], 500);

            } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => 'AI microservice unreachable'], 503);
            }
        }

        return response()->json(['success' => false, 'message' => 'No chunk uploaded'], 400);
    }

    /**
     * Get real-time chunk data for the dashboard line chart
     */
    public function getStreamData($streamKey)
    {
        $chunks = LiveEvaluationChunk::where('stream_key', $streamKey)
                    ->orderBy('chunk_index', 'asc')
                    ->get();
                    
        return response()->json([
            'success' => true,
            'data' => $chunks
        ]);
    }
}
