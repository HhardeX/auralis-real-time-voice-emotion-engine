
import re

import av
import numpy as np


POSITIVE_WORDS = {
    "happy", "excited", "joy", "joyful", "love", "great",
    "good", "wonderful", "amazing", "excellent", "hope",
    "hopeful", "confident", "calm", "thankful", "thanks",
}

NEGATIVE_WORDS = {
    "sad", "angry", "hate", "bad", "terrible", "awful",
    "afraid", "fear", "scared", "worried", "anxious",
    "upset", "frustrated", "stress", "stressed", "pain",
}


def analyze_emotion(audio_path: str, transcript: str) -> dict:
    """Return an experimental, rule-based emotion estimate."""

    words = re.findall(r"[a-zA-Z']+", transcript.lower())
    positive = sum(word in POSITIVE_WORDS for word in words)
    negative = sum(word in NEGATIVE_WORDS for word in words)

    total = positive + negative
    valence = (
        round((positive - negative) / total, 2)
        if total
        else 0.0
    )

    rms_values = []

    try:
        with av.open(audio_path) as container:
            audio_stream = container.streams.audio[0]

            resampler = av.AudioResampler(
                format="fltp",
                layout="mono",
                rate=16000,
            )

            for frame in container.decode(audio_stream):
                for converted in resampler.resample(frame):
                    samples = converted.to_ndarray().astype(
                        np.float32
                    ).flatten()

                    if samples.size:
                        rms = float(
                            np.sqrt(np.mean(np.square(samples)))
                        )
                        rms_values.append(rms)

    except Exception:
        rms_values = []

    average_energy = (
        float(np.mean(rms_values)) if rms_values else 0.0
    )

    if average_energy >= 0.12:
        arousal = 0.8
    elif average_energy >= 0.04:
        arousal = 0.5
    else:
        arousal = 0.2

    if valence >= 0.25:
        label = "Positive"
    elif valence <= -0.25:
        label = "Negative"
    else:
        label = "Neutral"

    if label == "Positive" and arousal >= 0.5:
        label = "Happy / Excited"
    elif label == "Positive":
        label = "Calm / Positive"
    elif label == "Negative" and arousal >= 0.5:
        label = "Frustrated / Upset"
    elif label == "Negative":
        label = "Low / Negative"
    elif arousal >= 0.8:
        label = "High Energy"
    elif arousal <= 0.2:
        label = "Calm / Low Energy"

    return {
        "label": label,
        "arousal": round(arousal, 2),
        "valence": valence,
        "confidence": 0.3,
        "method": "experimental_heuristic",
    }