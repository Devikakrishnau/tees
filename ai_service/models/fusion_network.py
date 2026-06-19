import torch
import torch.nn as nn
import numpy as np


class MultimodalFusionNetwork(nn.Module):
    def __init__(self, input_dim=15):
        super(MultimodalFusionNetwork, self).__init__()
        self.fc1 = nn.Linear(input_dim, 128)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(0.2)
        self.fc2 = nn.Linear(128, 64)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(0.2)
        self.fc3 = nn.Linear(64, 32)
        self.relu3 = nn.ReLU()
        self.communication_head = nn.Linear(32, 1)
        self.confidence_head = nn.Linear(32, 1)
        self.engagement_head = nn.Linear(32, 1)
        self.effectiveness_head = nn.Linear(32, 1)
        self.overall_head = nn.Linear(32, 1)

    def forward(self, x):
        x = self.relu1(self.fc1(x))
        x = self.dropout1(x)
        x = self.relu2(self.fc2(x))
        x = self.dropout2(x)
        x = self.relu3(self.fc3(x))
        return {
            "communication_score": self.communication_head(x),
            "confidence_score": self.confidence_head(x),
            "engagement_score": self.engagement_head(x),
            "teaching_effectiveness_score": self.effectiveness_head(x),
            "overall_teacher_score": self.overall_head(x),
        }


def analyze_explainability(feature_vector: list, feature_names: list) -> list:
    """
    Deterministic rule-based explainability from actual feature values.
    """
    explanations = []

    eye      = feature_vector[0]
    gesture  = feature_vector[3]
    wpm      = feature_vector[6]
    filler   = feature_vector[9]
    clarity  = feature_vector[10]
    structure = feature_vector[11]
    examples = feature_vector[12]

    if eye >= 80:
        explanations.append(f"Strong eye contact ({eye:.0f}/100) significantly boosted communication score.")
    elif eye < 60:
        explanations.append(f"Low eye contact ({eye:.0f}/100) reduced communication score.")

    if gesture >= 75:
        explanations.append(f"Good hand gestures ({gesture:.0f}/100) enhanced visual engagement.")
    elif gesture < 45:
        explanations.append(f"Minimal gesturing ({gesture:.0f}/100) reduced engagement score.")

    if filler > 10:
        explanations.append(f"High filler word count ({int(filler)} instances) penalised confidence score.")
    elif filler <= 3:
        explanations.append(f"Very few filler words ({int(filler)}) — clean, confident delivery.")

    if 110 <= wpm <= 150:
        explanations.append(f"Ideal speaking speed ({wpm:.0f} WPM) supported comprehension.")
    elif wpm > 160:
        explanations.append(f"Fast speaking speed ({wpm:.0f} WPM) may reduce comprehension.")
    elif wpm < 90:
        explanations.append(f"Slow speaking speed ({wpm:.0f} WPM) may lose student attention.")

    if clarity >= 80:
        explanations.append(f"Clear concept explanation ({clarity:.0f}/100) boosted teaching effectiveness.")
    elif clarity < 55:
        explanations.append(f"Low content clarity ({clarity:.0f}/100) reduced teaching effectiveness score.")

    if structure >= 75:
        explanations.append(f"Good lesson structure ({structure:.0f}/100) with clear intro and transitions.")
    else:
        explanations.append(f"Lesson structure ({structure:.0f}/100) could be improved with clear sections.")

    if examples < 50:
        explanations.append("Few real-world examples detected — adding examples improves student retention.")

    return explanations


def generate_recommendations(feature_vector: list) -> dict:
    """
    Deterministic coaching based on actual computed feature values.
    """
    strengths = []
    weaknesses = []
    recommendations = []

    eye      = feature_vector[0]
    posture  = feature_vector[4]
    wpm      = feature_vector[6]
    filler   = feature_vector[9]
    clarity  = feature_vector[10]
    structure = feature_vector[11]
    examples = feature_vector[12]
    coverage = feature_vector[13]
    voice    = feature_vector[8]

    # Strengths
    if eye >= 80:
        strengths.append("Excellent eye contact and visual presence")
    if clarity >= 80:
        strengths.append("Clear concept explanation")
    if structure >= 75:
        strengths.append("Well-structured lesson with good flow")
    if filler <= 3:
        strengths.append("Clean, filler-free delivery")
    if 110 <= wpm <= 150:
        strengths.append("Ideal speaking pace for student comprehension")
    if voice >= 70:
        strengths.append("Rich and varied vocabulary")

    # Weaknesses + Recommendations
    if eye < 65:
        weaknesses.append("Insufficient eye contact with audience")
        recommendations.append("Look directly at the camera lens during key points to build student connection.")

    if filler > 8:
        weaknesses.append(f"Excessive filler words ({int(filler)} detected)")
        recommendations.append("Replace 'um', 'uh', 'like' with deliberate pauses — silence is more powerful.")

    if wpm > 160:
        weaknesses.append(f"Speaking too fast ({wpm:.0f} WPM)")
        recommendations.append("Slow down to 120–140 WPM. Practice pausing after key concepts.")
    elif wpm < 90:
        weaknesses.append(f"Speaking too slowly ({wpm:.0f} WPM)")
        recommendations.append("Increase your speaking pace slightly to maintain student energy and attention.")

    if examples < 50:
        weaknesses.append("Lack of real-world application examples")
        recommendations.append("Add at least 2–3 concrete examples or analogies per major concept.")

    if structure < 60:
        weaknesses.append("Weak lesson structure")
        recommendations.append("Open with a clear agenda ('Today we will cover...'), use transitions, and summarise at the end.")

    if posture < 60:
        weaknesses.append("Poor posture alignment")
        recommendations.append("Stand straight with shoulders back — strong posture projects confidence.")

    if coverage < 55:
        weaknesses.append("Limited topic depth and vocabulary")
        recommendations.append("Expand your topic coverage with more diverse terminology and subtopics.")

    if not strengths:
        strengths.append("Consistent delivery throughout the session")
    if not weaknesses:
        weaknesses.append("Minor refinements possible in pacing")
        recommendations.append("Consider varying your tone and energy more dynamically across the lesson.")

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
    }


def run_fusion_inference(visual_features: dict, audio_features: dict, content_features: dict) -> dict:
    """
    Computes final scores via transparent weighted formulas — NO random values.
    """
    feature_names = [
        "eye_contact_score", "facial_engagement_score", "head_orientation_score",
        "gesture_score", "posture_score", "movement_score",
        "wpm", "pause_score", "voice_confidence_score", "filler_count",
        "clarity_score", "structure_score", "example_score", "coverage_score", "content_quality_score"
    ]

    v = visual_features
    a = audio_features
    c = content_features

    # Normalise WPM to 0-100
    wpm = a.get("wpm", 130)
    if 110 <= wpm <= 150:
        wpm_score = 100.0
    elif 90 <= wpm < 110 or 150 < wpm <= 170:
        wpm_score = 80.0
    elif 70 <= wpm < 90 or 170 < wpm <= 190:
        wpm_score = 60.0
    else:
        wpm_score = 40.0

    # Filler penalty (0 fillers = 100, 20+ = 20)
    filler_score = max(20.0, 100.0 - min(80, a.get("filler_count", 0) * 4))

    # Communication = eye contact + head orientation + clarity
    communication_score = (
        v.get("eye_contact_score", 60)       * 0.40 +
        v.get("head_orientation_score", 60)  * 0.20 +
        c.get("clarity_score", 60)           * 0.25 +
        v.get("facial_engagement_score", 60) * 0.15
    )

    # Confidence = voice + posture + filler-free delivery
    confidence_score = (
        a.get("voice_confidence_score", 60) * 0.40 +
        v.get("posture_score", 60)           * 0.30 +
        filler_score                          * 0.30
    )

    # Engagement = gesture + movement + face + pacing
    engagement_score = (
        v.get("gesture_score", 60)           * 0.35 +
        v.get("movement_score", 60)          * 0.25 +
        v.get("facial_engagement_score", 60) * 0.25 +
        a.get("pause_score", 60)             * 0.15
    )

    # Effectiveness = content quality + structure + examples + speed
    effectiveness_score = (
        c.get("content_quality_score", 60)  * 0.35 +
        c.get("structure_score", 60)        * 0.25 +
        c.get("example_score", 60)          * 0.20 +
        wpm_score                            * 0.20
    )

    # Overall = equal weight of all 4 dimensions
    overall_score = (
        communication_score  * 0.25 +
        confidence_score      * 0.25 +
        engagement_score      * 0.25 +
        effectiveness_score   * 0.25
    )

    input_vector = [
        v.get("eye_contact_score", 60),
        v.get("facial_engagement_score", 60),
        v.get("head_orientation_score", 60),
        v.get("gesture_score", 60),
        v.get("posture_score", 60),
        v.get("movement_score", 60),
        wpm, a.get("pause_score", 60),
        a.get("voice_confidence_score", 60),
        a.get("filler_count", 0),
        c.get("clarity_score", 60),
        c.get("structure_score", 60),
        c.get("example_score", 60),
        c.get("coverage_score", 60),
        c.get("content_quality_score", 60),
    ]

    def clamp(val):
        return float(np.clip(val, 0, 100))

    return {
        "communication_score":         clamp(communication_score),
        "confidence_score":             clamp(confidence_score),
        "engagement_score":             clamp(engagement_score),
        "teaching_effectiveness_score": clamp(effectiveness_score),
        "overall_teacher_score":        clamp(overall_score),
        "explanations": analyze_explainability(input_vector, feature_names),
        "coaching":     generate_recommendations(input_vector),
    }
