# Teacher Engagement & Self-Evaluation System (TEES)
## Full Working Principle and Implementation Guide

### 1. Project Overview
TEES (Teacher Engagement & Self-Evaluation System) is a comprehensive, AI-powered platform designed to help educators evaluate and improve their teaching methodologies. The system allows teachers to submit recordings of their classes, which are then analyzed by a suite of Artificial Intelligence models to extract actionable insights.

### 2. The Technology Stack
The TEES platform is built using a modern, decoupled microservices architecture:

#### A. Frontend (React + Vite)
- **Framework**: React.js bundled with Vite for lightning-fast performance.
- **Styling**: Vanilla CSS utilizing modern glassmorphism UI design, CSS Variables, and CSS Grid/Flexbox.
- **Routing**: `react-router-dom` handles role-based access control (Super Admin, Teacher, Student).
- **Communication**: `axios` is used to send asynchronous REST API requests to the Laravel backend.

#### B. Backend API (Laravel 11/12)
- **Framework**: PHP Laravel.
- **Database**: MySQL.
- **Authentication**: Laravel Sanctum provides secure API tokens. CORS is configured to allow the React frontend to communicate securely.
- **Authorization**: `spatie/laravel-permission` is used to strictly enforce Roles (Admin, Teacher, Student) and permissions across routes.
- **Responsibilities**: Stores user data, saves AI evaluation reports, aggregates weekly statistics, and serves JSON data to the React dashboard.

#### C. AI Microservice (Python FastAPI)
- **Framework**: FastAPI running on Uvicorn (`port 8000`).
- **Audio Extraction**: Uses `yt-dlp` to dynamically rip audio streams directly from YouTube links in real-time.
- **Speech-to-Text**: Utilizes OpenAI's `Whisper` (tiny model) to perfectly transcribe spoken words and generate accurate timestamps.
- **Sentiment & Tone Analysis**: Uses HuggingFace `transformers` (specifically a Fine-Tuned DistilBERT model) to analyze the positivity and tone of the transcript.
- **Responsibilities**: Operates in the background. Once the analysis is complete, it calculates WPM (Words Per Minute), extracts filler words, validates if the video is actually educational, generates a timeline breakdown, and pushes a Webhook POST request back to Laravel.

---

### 3. Full Working Principle (The Pipeline)

**Step 1: Video Submission**
1. A Teacher logs into the React Dashboard.
2. They click "New Analysis" and paste a YouTube URL of their recorded class.
3. React sends a POST request to the Laravel Backend (`/api/teacher/evaluations/upload`).

**Step 2: Microservice Handoff**
1. Laravel receives the URL and verifies the Teacher's identity using their Sanctum token.
2. Laravel immediately fires an asynchronous HTTP POST request to the Python FastAPI microservice (`http://127.0.0.1:8000/analyze-video`).
3. Laravel tells the React frontend "Analysis Started", allowing the user to continue using the dashboard without freezing the UI.

**Step 3: AI Processing (Python)**
1. **Validation**: Python receives the URL.
2. **Download**: `yt-dlp` reaches out to YouTube and downloads only the audio layer as a temporary `.webm` file.
3. **Transcription**: The Whisper Neural Network loads the audio into memory and transcribes the entire video, calculating precise start/end timestamps for every sentence.
4. **Educational Verification**: The algorithm scans the vocabulary for educational keywords (e.g., "learn", "concept"). If none are found, it instantly rejects the video.
5. **Data Calculation**: 
   - *Speaking Speed*: Total Words / Video Duration.
   - *Filler Words*: Regex search for "um", "uh", "like".
   - *Sentiment*: HuggingFace Pipeline analyzes the text for positive/negative tone.
6. **Timeline Generation**: The Whisper timestamps are converted into a readable JSON Timeline Breakdown.

**Step 4: The Webhook Return**
1. Python bundles all the calculated metrics, AI Feedback summaries, and the Timeline Breakdown into a JSON payload.
2. Python fires a Webhook request *back* to Laravel (`http://127.0.0.1:8080/api/ai/evaluations/store`).
3. Python deletes the temporary audio file to save disk space.

**Step 5: Storage & Display**
1. Laravel receives the AI data and saves a new `TeacherEvaluation` record in the MySQL Database.
2. The Teacher refreshes their React Dashboard.
3. React fetches the latest evaluation data, instantly rendering the live metrics (Teaching Quality Index, Student Attention, Explanation Quality, Speaking Speed), the AI Improvement Suggestions, and the Timeline Breakdown.

---

### 4. Database Architecture
- **users**: Stores ID, name, email, password.
- **roles / model_has_roles**: Spatie tables mapping users to specific roles.
- **teacher_evaluations**: Stores raw AI data per video (`video_url`, `overall_quality_index`, `ai_feedback` [JSON], `timeline_breakdown` [JSON], etc.).
- **teacher_weekly_reports**: Aggregates the last 7 days of evaluations to provide long-term trending analytics.

### 5. Production Deployment Strategy
The project is container-ready. 
1. **Docker**: A `docker-compose.yml` orchestrates 4 containers: Nginx (Routing), Laravel App, MySQL DB, and Python FastAPI.
2. **Mobile**: The frontend utilizes `Ionic Capacitor`, allowing the exact same React codebase to be compiled directly into an Android APK inside Android Studio.
