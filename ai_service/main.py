import os
import re
import cv2
import requests
import time
from fastapi import FastAPI, BackgroundTasks
from typing import Optional
from pydantic import BaseModel

app = FastAPI(title="TEES Advanced Multimodal AI Engine")

LARAVEL_API_URL = os.environ.get("LARAVEL_API_URL", "http://127.0.0.1:8080/api/ai/evaluations/store")

class VideoAnalysisRequest(BaseModel):
    teacher_id: int
    class_id: Optional[int] = None
    video_url: str


# ─────────────────────────────────────────────────────────────
# Educational Content Validator
# Runs BEFORE the full pipeline — rejects non-teaching videos early
# ─────────────────────────────────────────────────────────────

EDUCATIONAL_KEYWORDS = [
    # Core teaching signals
    "learn", "learning", "teach", "teaching", "teacher", "student", "students",
    "class", "lesson", "lecture", "course", "chapter", "topic", "subject",
    "explain", "explanation", "understand", "understanding", "concept",
    "definition", "theory", "principle", "formula", "equation",
    # Instructional verbs
    "today we", "let me explain", "in this video", "we will", "we are going to",
    "let's learn", "let's understand", "let us", "welcome back", "welcome to",
    "this lesson", "this lecture", "this chapter", "this class",
    # Academic vocabulary
    "introduction", "conclusion", "summary", "recap", "review", "exercise",
    "example", "problem", "solution", "answer", "question", "quiz",
    "homework", "assignment", "exam", "test", "notes", "board", "slide",
    "calculate", "solve", "analyse", "analyze", "describe", "compare",
    "science", "math", "mathematics", "history", "geography", "biology",
    "chemistry", "physics", "english", "literature", "economics",
    # Engagement signals
    "pause", "look at", "refer", "notice", "important", "remember",
    "key point", "note that", "as you can see", "let me show", "objective",
]

NON_EDUCATIONAL_SIGNALS = [
    # Music / entertainment signals
    "chorus", "verse", "hook", "drop", "beat", "lyrics", "melody",
    "subscribe", "like and subscribe", "watch till the end",
    "comment below", "follow me", "smash the like", "notification bell",
    "vlog", "prank", "challenge", "reaction", "unboxing", "haul",
    "cooking", "recipe", "ingredients", "fry", "bake", "sauté",
    "gaming", "gameplay", "level up", "boss fight", "speedrun",
    "workout", "exercise routine", "reps", "sets", "gains",
]

def validate_educational_content(transcript: str, video_title: str = "") -> dict:
    """
    Returns {is_valid: bool, reason: str, confidence: float}
    Checks:
    1. Minimum speech length (< 20 words = likely music/no speech)
    2. Educational keyword density
    3. Non-educational signal detection
    """
    text = transcript.lower().strip()
    words = text.split()
    word_count = len(words)

    # Check 1 — too short to be a class video
    if word_count < 30:
        return {
            "is_valid": False,
            "reason": f"This video contains almost no spoken words ({word_count} words detected). It appears to be a music video, silent video, or non-educational content.",
            "confidence": 0.95
        }

    # Check 2 — educational keyword hits
    edu_hits = sum(1 for kw in EDUCATIONAL_KEYWORDS if kw in text)
    edu_density = edu_hits / max(word_count, 1) * 100

    # Check 3 — non-educational signals
    non_edu_hits = sum(1 for kw in NON_EDUCATIONAL_SIGNALS if kw in text)

    # Check 4 — video title signals
    title_lower = video_title.lower()
    title_edu = any(kw in title_lower for kw in ["lecture", "lesson", "class", "tutorial", "learn", "teach", "course", "chapter"])
    title_non_edu = any(kw in title_lower for kw in ["music", "song", "mv", "official video", "prank", "vlog", "cooking", "gaming", "funny", "meme", "reaction"])

    # Decision logic
    if non_edu_hits >= 3 and edu_hits < 2:
        return {
            "is_valid": False,
            "reason": f"This video does not appear to be a classroom or teaching video. It contains entertainment signals (music, vlog, gaming, etc.) and lacks educational content markers.",
            "confidence": 0.90
        }

    if title_non_edu and edu_hits < 3:
        return {
            "is_valid": False,
            "reason": f"The video title and content suggest this is not an educational or teaching video. Please upload a genuine class recording or lecture video.",
            "confidence": 0.85
        }

    if edu_density < 0.3 and edu_hits < 2 and not title_edu:
        return {
            "is_valid": False,
            "reason": f"This video lacks the vocabulary and structure of a teaching session. Only {edu_hits} educational keywords were detected across {word_count} spoken words. Please upload a class or lecture recording.",
            "confidence": 0.80
        }

    # Passed validation
    return {
        "is_valid": True,
        "reason": f"Validated as educational content ({edu_hits} teaching signals detected).",
        "confidence": round(min(1.0, 0.6 + edu_density * 0.1), 2)
    }


# ─────────────────────────────────────────────────────────────
# Main Analysis Pipeline
# ─────────────────────────────────────────────────────────────

def analyze_video_task(request_data: VideoAnalysisRequest):
    print(f"Starting Multimodal ML analysis for video: {request_data.video_url}")

    # Base rejection result structure
    rejection_result = {
        "teacher_id": request_data.teacher_id,
        "class_id": request_data.class_id,
        "video_url": request_data.video_url,
        "speaking_speed_wpm": 0.0,
        "filler_words_count": 0,
        "student_attention_score": 0.0,
        "explanation_quality_score": 0.0,
        "overall_quality_index": 0.0,
        "ai_feedback": {
            "summary": "",
            "whisper_transcript_snippet": "",
            "attention_notes": "Content rejected — not a teaching video."
        }
    }

    # Fallback result (only used if ML completely crashes)
    results = {
        "teacher_id": request_data.teacher_id,
        "class_id": request_data.class_id,
        "video_url": request_data.video_url,
        "speaking_speed_wpm": 130.0,
        "filler_words_count": 15,
        "student_attention_score": 85.0,
        "explanation_quality_score": 90.0,
        "overall_quality_index": 88.0,
        "ai_feedback": {
            "summary": "AI models failed to load. Using fallback data.",
            "whisper_transcript_snippet": "",
            "attention_notes": ""
        }
    }

    video_file = None

    try:
        import whisper
        import yt_dlp
        import ssl
        from feature_extractors import extract_visual_features, extract_audio_features
        from models.content_scorer import get_content_features
        from models.fusion_network import run_fusion_inference

        ssl._create_default_https_context = ssl._create_unverified_context

        print("Downloading video (single video only, no playlist)...")
        ydl_opts = {
            'format': 'best[ext=mp4]/best',
            'outtmpl': f'temp_video_{request_data.teacher_id}_%(id)s.%(ext)s',
            # ── Critical: prevent downloading entire playlists ──
            'noplaylist': True,
            'playlist_items': '1',
            # ── Safety limits ──
            'max_filesize': 500 * 1024 * 1024,  # 500 MB max
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request_data.video_url, download=True)
            # Handle cases where yt-dlp returns a playlist dict anyway
            if 'entries' in info:
                info = info['entries'][0]
            video_file = ydl.prepare_filename(info)

        video_title = info.get('title', '')
        duration_sec = info.get('duration', 60)
        print(f"Downloaded: '{video_title}' ({duration_sec}s)")

        print("Loading Whisper model (tiny)...")
        model = whisper.load_model("tiny")

        print("Transcribing audio...")
        result = model.transcribe(video_file)
        transcript = result["text"].strip()
        print(f"Transcript ({len(transcript.split())} words): {transcript[:120]}...")

        # ── CONTENT VALIDATION ── Run BEFORE expensive AI pipeline ──
        print("Validating educational content...")
        validation = validate_educational_content(transcript, video_title)
        print(f"Validation: {validation}")

        if not validation["is_valid"]:
            print(f"REJECTED: {validation['reason']}")
            rejection_result["ai_feedback"]["summary"] = (
                f"⚠️ NOT A TEACHING VIDEO\n\n"
                f"{validation['reason']}\n\n"
                f"What to upload:\n"
                f"- A recorded class or lecture\n"
                f"- A teaching session or tutorial\n"
                f"- A school or university lesson recording\n\n"
                f"Please submit a genuine teaching video for evaluation."
            )
            rejection_result["ai_feedback"]["validation_confidence"] = validation["confidence"]

            # Cleanup and push rejection to Laravel
            if video_file and os.path.exists(video_file):
                os.remove(video_file)
            try:
                requests.post(LARAVEL_API_URL, json=rejection_result)
                print("Rejection result pushed to Laravel.")
            except Exception as e:
                print(f"Failed to push rejection to Laravel: {e}")
            return

        # ── FULL AI PIPELINE (only runs if content is validated) ──

        # 1. VISUAL FEATURES (MediaPipe)
        print("Extracting Visual Features (MediaPipe)...")
        visual_features = extract_visual_features(video_file)

        # 2. AUDIO FEATURES (real pause analysis from Whisper segments)
        print("Extracting Audio Features...")
        whisper_segments = result.get("segments", [])
        audio_features = extract_audio_features(video_file, transcript, duration_sec, whisper_segments)

        # 3. CONTENT FEATURES (NLP)
        print("Extracting Content Features...")
        content_features = get_content_features(transcript)

        # 4. MULTIMODAL FUSION NETWORK
        print("Running PyTorch Multimodal Fusion Network...")
        fusion_results = run_fusion_inference(visual_features, audio_features, content_features)

        # Cleanup
        if video_file and os.path.exists(video_file):
            os.remove(video_file)

        # Build full timeline
        raw_segments = result.get("segments", [])
        timeline = []
        chunk_text = ""
        chunk_start = None
        chunk_end = None
        CHUNK_DURATION = 5.0

        for seg in raw_segments:
            seg_start = seg["start"]
            seg_end   = seg["end"]
            seg_text  = seg["text"].strip()
            if chunk_start is None:
                chunk_start = seg_start
            chunk_text += " " + seg_text
            chunk_end = seg_end
            if (chunk_end - chunk_start >= CHUNK_DURATION) or seg_text.endswith((".", "!", "?")):
                start_m = int(chunk_start // 60)
                start_s = int(chunk_start % 60)
                end_m   = int(chunk_end   // 60)
                end_s   = int(chunk_end   % 60)
                timeline.append({
                    "start": f"{start_m}:{start_s:02d}",
                    "end":   f"{end_m}:{end_s:02d}",
                    "text":  chunk_text.strip()
                })
                chunk_text = ""
                chunk_start = None
                chunk_end = None

        if chunk_text.strip() and chunk_start is not None:
            start_m = int(chunk_start // 60)
            start_s = int(chunk_start % 60)
            end_m   = int(chunk_end   // 60)
            end_s   = int(chunk_end   % 60)
            timeline.append({
                "start": f"{start_m}:{start_s:02d}",
                "end":   f"{end_m}:{end_s:02d}",
                "text":  chunk_text.strip()
            })

        results['timeline_breakdown'] = timeline
        results['speaking_speed_wpm'] = audio_features['wpm']
        results['filler_words_count'] = audio_features['filler_count']
        results['student_attention_score'] = fusion_results['engagement_score']
        results['explanation_quality_score'] = fusion_results['teaching_effectiveness_score']
        results['overall_quality_index'] = fusion_results['overall_teacher_score']

        strengths_text = "\n".join(["- " + s for s in fusion_results['coaching']['strengths']])
        weaknesses_text = "\n".join(["- " + w for w in fusion_results['coaching']['weaknesses']])
        rec_text = "\n".join(["- " + r for r in fusion_results['coaching']['recommendations']])
        explanations_text = "\n".join(["- " + e for e in fusion_results['explanations']])

        summary = (
            f"**Explainability Breakdown:**\n{explanations_text}\n\n"
            f"**Strengths:**\n{strengths_text}\n\n"
            f"**Areas for Improvement:**\n{weaknesses_text}\n\n"
            f"**Coaching Recommendations:**\n{rec_text}"
        )

        results['ai_feedback'] = {
            "summary": summary,
            "whisper_transcript_snippet": transcript,
            "attention_notes": "Multimodal Fusion Network executed successfully.",
            "multimodal_features": {
                "visual": visual_features,
                "audio": audio_features,
                "content": content_features
            }
        }

    except Exception as e:
        print(f"ML Processing failed, falling back to mocks. Error: {e}")
        import traceback
        traceback.print_exc()
        # Cleanup temp file if it exists
        if video_file and os.path.exists(video_file):
            try:
                os.remove(video_file)
            except Exception:
                pass

    try:
        print("Analysis complete. Pushing results to Laravel Backend...")
        response = requests.post(LARAVEL_API_URL, json=results)
        response.raise_for_status()
        print("Successfully pushed results.")
    except Exception as e:
        print(f"Failed to push results to Laravel: {e}")


@app.post("/analyze-video")
async def analyze_video(request: VideoAnalysisRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(analyze_video_task, request)
    return {"message": "Multimodal analysis queued successfully", "video_url": request.video_url}


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0-multimodal"}
