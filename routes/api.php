<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Authentication route (Basic stub for now)
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    $user = \App\Models\User::where('email', $credentials['email'])->first();

    if ($user && \Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password)) {
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json(['token' => $token, 'role' => $user->roles->pluck('name')]);
    }
    return response()->json(['error' => 'Unauthorized'], 401);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Super Admin Routes
    Route::middleware('role:Super Admin')->prefix('admin')->group(function () {
        Route::post('/users', [AdminController::class, 'storeUser']);
    });

    // Teacher Routes
    Route::middleware('role:Teacher|Super Admin')->prefix('teacher')->group(function () {
        Route::get('/evaluations/dashboard', [\App\Http\Controllers\TeacherEvaluationController::class, 'dashboard']);
        Route::get('/evaluations/report/{id}', [\App\Http\Controllers\TeacherEvaluationController::class, 'getWeeklyReport']);
        Route::get('/evaluations/latest', [\App\Http\Controllers\TeacherEvaluationController::class, 'latestEvaluation']);
        Route::post('/evaluations/analyze', [\App\Http\Controllers\TeacherEvaluationController::class, 'triggerAnalysis']);
        Route::post('/evaluations/upload', [\App\Http\Controllers\TeacherEvaluationController::class, 'uploadVideoFile']);
        Route::delete('/evaluations/{id}', [\App\Http\Controllers\TeacherEvaluationController::class, 'deleteEvaluation']);
    });
});

// Webhook/Endpoint for Python AI Service to push evaluation results
Route::post('/ai/evaluations/store', [\App\Http\Controllers\TeacherEvaluationController::class, 'storeEvaluation']);
