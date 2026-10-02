import json
import os
import tempfile
import urllib.request
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from faster_whisper import WhisperModel

from app.services.emotion import analyze_emotion


router = APIRouter(
    prefix="/api/transcription",
    tags=["Transcription"],
)


_model = None


def get_model():
    global _model

    if _model is None:
        _model = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8",
        )

    return _model


def generate_ai_response(
    transcript: str,
    emotion: dict,
) -> str:
    """
    Generate a conversational response using
    the locally running Ollama Qwen model.
    """

    if not transcript:
        return "I couldn't detect any speech. Please try speaking again."

    emotion_label = emotion.get(
        "label",
        "Unknown",
    )

    arousal = emotion.get(
        "arousal",
        0.0,
    )

    valence = emotion.get(
        "valence",
        0.0,
    )

    prompt = f"""
You are Auralis, a real-time voice-to-voice AI assistant.

Your task is to respond naturally to the user's speech while considering
their detected emotional state.

Detected emotional state:
- Emotion: {emotion_label}
- Arousal: {arousal}
- Valence: {valence}

User said:
"{transcript}"

Respond directly to the user.

Requirements:
- Be conversational and helpful.
- Keep the response concise.
- Consider the detected emotion when appropriate.
- Do not mention Qwen.
- Do not claim that you are a therapist.
- Do not invent facts about Auralis.
"""

    payload = json.dumps(
        {
            "model": "qwen2.5vl:3b",
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
            },
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        "http://127.0.0.1:11434/api/generate",
        data=payload,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=60,
        ) as response:

            result = json.loads(
                response.read().decode("utf-8")
            )

        ai_response = result.get(
            "response",
            "",
        ).strip()

        if ai_response:
            return ai_response

        return "I processed your speech, but couldn't generate a response."

    except Exception as exc:
        return f"AI response unavailable: {exc}"


@router.post("")
async def transcribe_audio(
    audio: UploadFile = File(...),
):
    if not audio.filename:
        raise HTTPException(
            status_code=400,
            detail="Audio file is required",
        )

    suffix = Path(
        audio.filename
    ).suffix or ".webm"

    temp_path = None

    try:
        content = await audio.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Audio file is empty",
            )

        with tempfile.NamedTemporaryFile(
            suffix=suffix,
            delete=False,
        ) as temp_file:

            temp_file.write(content)
            temp_path = temp_file.name

        # -----------------------------
        # WHISPER TRANSCRIPTION
        # -----------------------------

        model = get_model()

        segments, info = model.transcribe(
            temp_path,
            beam_size=1,
            vad_filter=True,
        )

        segment_list = [
            {
                "start": round(
                    segment.start,
                    2,
                ),
                "end": round(
                    segment.end,
                    2,
                ),
                "text": segment.text.strip(),
            }
            for segment in segments
        ]

        transcript_text = " ".join(
            segment["text"]
            for segment in segment_list
        ).strip()

        # -----------------------------
        # EMOTION ANALYSIS
        # -----------------------------

        try:
            emotion_result = analyze_emotion(
                temp_path,
                transcript_text,
            )

        except Exception as emotion_error:

            emotion_result = {
                "label": "Unavailable",
                "arousal": 0.0,
                "valence": 0.0,
                "confidence": 0.0,
                "method": "error",
                "error": str(
                    emotion_error
                ),
            }

        # -----------------------------
        # QWEN / OLLAMA RESPONSE
        # -----------------------------

        ai_response = generate_ai_response(
            transcript_text,
            emotion_result,
        )

        # -----------------------------
        # FINAL API RESPONSE
        # -----------------------------

        return {
            "text": transcript_text,
            "language": info.language,
            "language_probability": round(
                info.language_probability,
                3,
            ),
            "segments": segment_list,
            "emotion": emotion_result,
            "ai_response": ai_response,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(exc)}",
        ) from exc

    finally:

        if (
            temp_path
            and os.path.exists(temp_path)
        ):
            os.unlink(temp_path)

        await audio.close()