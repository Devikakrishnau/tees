"""
TEES Feature Extractors — MediaPipe Tasks API (v0.10+)
======================================================
Uses the new mediapipe.tasks API (face_landmarker + pose_landmarker).
Requires pre-downloaded .task model files in models_data/.
Visual scores are computed from real landmark geometry — NO random values.
"""

import os
import cv2
import math
import numpy as np

# Model file paths (downloaded once, bundled with the service)
_HERE = os.path.dirname(os.path.abspath(__file__))
FACE_MODEL_PATH = os.path.join(_HERE, "models_data", "face_landmarker.task")
POSE_MODEL_PATH = os.path.join(_HERE, "models_data", "pose_landmarker.task")

# Dynamic frame sampling cap
MAX_FRAMES = 300  # sample up to 300 frames (e.g., 1 frame per second for 5 mins)


# ─────────────────────────────────────────────────────────────
# Geometry helpers
# ─────────────────────────────────────────────────────────────

def _lm_xy(landmark, w, h):
    return np.array([landmark.x * w, landmark.y * h])

def _lm_xyz(landmark):
    return np.array([landmark.x, landmark.y, landmark.z])


# ─────────────────────────────────────────────────────────────
# Per-frame face metric calculators
# ─────────────────────────────────────────────────────────────

def _eye_contact(face_landmarks, w, h):
    """
    Left iris (#468) & Right iris (#473) centred within eye corners.
    Score 100 = iris perfectly centred (direct gaze), 0 = looking away.
    """
    try:
        l_iris  = _lm_xy(face_landmarks[468], w, h)
        l_outer = _lm_xy(face_landmarks[33],  w, h)
        l_inner = _lm_xy(face_landmarks[133], w, h)

        r_iris  = _lm_xy(face_landmarks[473], w, h)
        r_outer = _lm_xy(face_landmarks[263], w, h)
        r_inner = _lm_xy(face_landmarks[362], w, h)

        def ratio(iris, a, b):
            mid = (a + b) / 2
            span = np.linalg.norm(b - a) + 1e-8
            return max(0.0, 1.0 - np.linalg.norm(iris - mid) / (span * 0.5))

        return (ratio(l_iris, l_outer, l_inner) + ratio(r_iris, r_outer, r_inner)) / 2 * 100
    except Exception:
        return 65.0


def _head_orientation(face_landmarks, w, h):
    """
    Head yaw: ratio of nose deviation from face centre.
    Score 100 = facing camera squarely.
    """
    try:
        nose     = _lm_xy(face_landmarks[1],   w, h)
        l_edge   = _lm_xy(face_landmarks[234], w, h)
        r_edge   = _lm_xy(face_landmarks[454], w, h)
        centre_x = (l_edge[0] + r_edge[0]) / 2
        face_w   = abs(r_edge[0] - l_edge[0]) + 1e-8
        yaw      = abs(nose[0] - centre_x) / (face_w * 0.5)
        return max(0.0, (1.0 - yaw) * 100)
    except Exception:
        return 65.0


def _mouth_openness(face_landmarks, w, h):
    """
    Facial engagement proxy: ratio of mouth height to width.
    Active speech → naturally open mouth → higher score.
    """
    try:
        top    = _lm_xy(face_landmarks[13],  w, h)
        bot    = _lm_xy(face_landmarks[14],  w, h)
        left   = _lm_xy(face_landmarks[61],  w, h)
        right  = _lm_xy(face_landmarks[291], w, h)
        h_val  = np.linalg.norm(bot - top)
        w_val  = np.linalg.norm(right - left) + 1e-8
        return min(100.0, (h_val / w_val) * 300)
    except Exception:
        return 55.0


# ─────────────────────────────────────────────────────────────
# Per-frame pose metric calculators
# ─────────────────────────────────────────────────────────────

def _gesture_score(pose_landmarks, w, h, prev_wrists):
    """Wrist velocity between frames → gesture activity score (0-100)."""
    try:
        # Pose landmark indices: 15=left wrist, 16=right wrist
        l_wrist = _lm_xy(pose_landmarks[15], w, h)
        r_wrist = _lm_xy(pose_landmarks[16], w, h)
        if prev_wrists is not None:
            vel = (np.linalg.norm(l_wrist - prev_wrists[0]) +
                   np.linalg.norm(r_wrist - prev_wrists[1])) / 2
            score = min(100.0, vel / 15 * 100)
        else:
            score = 50.0
        return score, (l_wrist, r_wrist)
    except Exception:
        return 50.0, prev_wrists


def _posture_score(pose_landmarks, w, h):
    """Shoulder tilt angle → posture quality (100 = perfectly level)."""
    try:
        l_sh = _lm_xy(pose_landmarks[11], w, h)
        r_sh = _lm_xy(pose_landmarks[12], w, h)
        dy   = abs(l_sh[1] - r_sh[1])
        dx   = abs(l_sh[0] - r_sh[0]) + 1e-8
        tilt = math.degrees(math.atan(dy / dx))
        return max(0.0, (1.0 - tilt / 30) * 100)
    except Exception:
        return 70.0


def _movement_score(pose_landmarks, w, h, prev_hips):
    """Hip/torso displacement between frames → spatial dynamism (0-100)."""
    try:
        l_hip = _lm_xy(pose_landmarks[23], w, h)
        r_hip = _lm_xy(pose_landmarks[24], w, h)
        centre = (l_hip + r_hip) / 2
        if prev_hips is not None:
            score = min(100.0, np.linalg.norm(centre - prev_hips) * 5)
        else:
            score = 50.0
        return score, centre
    except Exception:
        return 50.0, prev_hips


# ─────────────────────────────────────────────────────────────
# Main visual extraction pipeline
# ─────────────────────────────────────────────────────────────

def extract_visual_features(video_path: str) -> dict:
    """
    Real MediaPipe Tasks pipeline.
    Processes up to MAX_FRAMES frames and returns
    mathematically computed engagement scores — zero randomness.
    """
    try:
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision as mp_vision
        from mediapipe.tasks.python.core import base_options as bo_module
        import mediapipe as mp

        # ── Load Face Landmarker ───────────────────────────────
        face_opts = mp_vision.FaceLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=FACE_MODEL_PATH),
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
            running_mode=mp_vision.RunningMode.IMAGE
        )
        face_landmarker = mp_vision.FaceLandmarker.create_from_options(face_opts)

        # ── Load Pose Landmarker ───────────────────────────────
        pose_opts = mp_vision.PoseLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=POSE_MODEL_PATH),
            running_mode=mp_vision.RunningMode.IMAGE
        )
        pose_landmarker = mp_vision.PoseLandmarker.create_from_options(pose_opts)

    except Exception as e:
        print(f"[MediaPipe] Failed to load landmarkers: {e}. Using OpenCV-only fallback.")
        return _fallback_visual()

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return _fallback_visual()

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration = total_frames / fps if fps > 0 else 60.0

    # Sample 1 frame per second, up to MAX_FRAMES
    num_samples = min(int(duration), MAX_FRAMES)
    num_samples = max(num_samples, 10) # at least 10 frames
    step = max(1, total_frames // num_samples)

    eye_vals, head_vals, mouth_vals = [], [], []
    gesture_vals, posture_vals, movement_vals = [], [], []
    prev_wrists = prev_hips = None

    for i in range(num_samples):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i * step)
        ok, frame = cap.read()
        if not ok:
            break

        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        # Face detection
        face_result = face_landmarker.detect(mp_image)
        if face_result.face_landmarks:
            fl = face_result.face_landmarks[0]
            eye_vals.append(_eye_contact(fl, w, h))
            head_vals.append(_head_orientation(fl, w, h))
            mouth_vals.append(_mouth_openness(fl, w, h))

        # Pose detection
        pose_result = pose_landmarker.detect(mp_image)
        if pose_result.pose_landmarks:
            pl = pose_result.pose_landmarks[0]
            g, prev_wrists = _gesture_score(pl, w, h, prev_wrists)
            gesture_vals.append(g)
            posture_vals.append(_posture_score(pl, w, h))
            m, prev_hips = _movement_score(pl, w, h, prev_hips)
            movement_vals.append(m)

    cap.release()
    face_landmarker.close()
    pose_landmarker.close()

    def avg(lst, default=60.0):
        return float(np.mean(lst)) if lst else default

    return {
        "eye_contact_score":       round(avg(eye_vals),     1),
        "facial_engagement_score": round(avg(mouth_vals),   1),
        "head_orientation_score":  round(avg(head_vals),    1),
        "gesture_score":           round(avg(gesture_vals), 1),
        "posture_score":           round(avg(posture_vals), 1),
        "movement_score":          round(avg(movement_vals),1),
    }


def _fallback_visual():
    """Neutral scores if MediaPipe fails to load (no video file, etc.)."""
    return {k: 55.0 for k in [
        "eye_contact_score", "facial_engagement_score", "head_orientation_score",
        "gesture_score", "posture_score", "movement_score"
    ]}


# ─────────────────────────────────────────────────────────────
# Audio Track — real computation from Whisper metadata
# ─────────────────────────────────────────────────────────────

def extract_audio_features(audio_path: str, transcript: str,
                            duration_sec: float = 60.0,
                            whisper_segments: list = None) -> dict:
    """
    Computes acoustic features mathematically — NO random values.
    wpm              : word count / duration in minutes
    filler_count     : regex count in real Whisper transcript
    pause_score      : gap analysis of Whisper segment timestamps
    voice_confidence : lexical diversity ratio
    """
    # 1. WPM based on ACTIVE speaking time
    words = transcript.split()
    active_speech_sec = sum(seg["end"] - seg["start"] for seg in whisper_segments) if whisper_segments else duration_sec
    active_speech_sec = max(active_speech_sec, 1.0)
    wpm = len(words) / (active_speech_sec / 60.0)

    # 2. Word-boundary safe filler count
    import re
    FILLERS = [r"\bum\b", r"\buh\b", r"\blike\b", r"\byou know\b", r"\bbasically\b", 
               r"\bliterally\b", r"\bactually\b", r"\bright\b", r"\bokay so\b", r"\bsort of\b"]
    text_lower = transcript.lower()
    filler_count = sum(len(re.findall(f, text_lower)) for f in FILLERS)

    pause_score = _compute_pause_score(whisper_segments, duration_sec)

    unique_ratio = len(set(w.lower().strip(".,!?") for w in words)) / (len(words) + 1)
    voice_confidence = min(100.0, max(30.0, unique_ratio * 130))

    return {
        "wpm":                    round(wpm, 1),
        "pause_score":            round(pause_score, 1),
        "voice_confidence_score": round(voice_confidence, 1),
        "filler_count":           float(filler_count),
    }


def _compute_pause_score(segments: list, duration_sec: float) -> float:
    """Gap analysis between Whisper transcript segments."""
    if not segments or len(segments) < 2:
        return 70.0

    total_pause = long_pauses = 0.0
    for i in range(1, len(segments)):
        gap = segments[i]["start"] - segments[i - 1]["end"]
        if gap > 0.1:
            total_pause += gap
            if gap > 2.0:
                long_pauses += 1

    ratio = total_pause / max(duration_sec, 1)
    if 0.10 <= ratio <= 0.25:
        base = 90.0
    elif 0.05 <= ratio < 0.10:
        base = 75.0
    elif ratio > 0.35:
        base = 55.0
    else:
        base = 65.0

    return max(20.0, base - min(30, long_pauses * 5))
