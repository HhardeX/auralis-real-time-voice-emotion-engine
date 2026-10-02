# Auralis — Real-Time Voice-to-Voice Emotion Engine

> A real-time voice interaction system combining speech recognition, experimental emotion analysis, local LLM response generation, and voice playback through a cinematic web interface.

## Overview

**Auralis** is a voice-first AI application designed around a low-latency voice interaction pipeline.

The current implementation captures speech from the browser, sends the recorded audio to a Python/FastAPI backend, transcribes it using Faster-Whisper, analyzes the audio/transcript using an experimental heuristic emotion engine, generates an emotion-aware response using a locally running Ollama Qwen model, and returns the result to the React frontend.

The project is being developed toward a more complete real-time voice-to-voice architecture involving streaming audio, stronger emotion recognition, VAD, WebRTC, and dedicated neural TTS.

## Current Status

### Currently Implemented

- React/Vite cinematic voice dashboard
- Browser microphone capture using `MediaRecorder`
- FastAPI backend
- Faster-Whisper speech-to-text
- Experimental heuristic emotion analysis
- Ollama + Qwen 2.5 VL local response generation
- Emotion-aware prompting
- API response integration
- Browser Speech Synthesis playback
- Git/GitHub development workflow

### Planned

- Wav2Vec2-based learned emotion recognition
- Silero VAD
- Llama 3 / vLLM integration
- XTTSv2 or Bark neural TTS
- WebRTC / aiortc streaming
- True low-latency audio streaming
- Interruption / barge-in handling
- Continuous streaming transcription

---

## Problem Statement

Traditional voice assistants commonly use a sequential pipeline:

```text
Speech → STT → LLM → TTS → Audio
```

This sequential architecture can introduce noticeable latency and can lose important paralinguistic information such as emotional tone, arousal, speaking intensity, and conversational context.

Auralis is being developed to explore a more natural voice-to-voice architecture where speech recognition, emotion information, language reasoning, and audio generation can eventually operate as a low-latency streaming pipeline.

---

## System Architecture

The current system is divided into four primary layers:

```text
┌─────────────────────────────────────────────────────────────┐
│                    AURALIS FRONTEND                         │
│                  React + Vite Dashboard                     │
│                                                             │
│  Microphone → Recording → Waveform → Transcript → Response │
└────────────────────────────┬────────────────────────────────┘
                             │
                        HTTP / REST
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    AURALIS BACKEND                          │
│                       FastAPI                               │
│                                                             │
│  Audio Upload → Transcription → Emotion → LLM Response     │
└──────────────┬─────────────────┬────────────────────────────┘
               │                 │
               ▼                 ▼
      ┌────────────────┐  ┌─────────────────┐
      │ Faster-Whisper │  │ Emotion Engine  │
      │      STT       │  │    Heuristic    │
      └────────────────┘  └────────┬────────┘
                                   │
                                   ▼
                           ┌─────────────────┐
                           │ Ollama + Qwen   │
                           │     2.5 VL      │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │ AI Response     │
                           └────────┬────────┘
                                    │
                                    ▼
                           Browser Speech
                           Synthesis / TTS
```

### End-to-End Data Flow

The current implemented pipeline works as follows:

```text
User
  │
  │ Speaks into microphone
  ▼
React Frontend
  │
  │ MediaRecorder
  ▼
Audio Blob
  │
  │ HTTP multipart upload
  ▼
FastAPI Backend
  │
  ▼
Temporary Audio File
  │
  ▼
Faster-Whisper
  │
  ▼
Transcript + Language
  │
  ▼
Experimental Emotion Engine
  │
  ├── Emotion Label
  ├── Arousal
  ├── Valence
  └── Confidence
  │
  ▼
Ollama
  │
  ▼
Qwen 2.5 VL
  │
  │ Emotion-aware prompt
  ▼
Auralis AI Response
  │
  ▼
FastAPI JSON Response
  │
  ▼
React Frontend
  │
  ├── Live Transcript
  ├── Emotion Panel
  ├── Arousal
  ├── Valence
  ├── Confidence
  └── Auralis Response
  │
  ▼
Browser Speech Synthesis
  │
  ▼
Voice Output
```

---

## Processing Steps

### Step 1 — Voice Capture

The user grants microphone permission and starts recording from the React frontend.

The browser uses the `MediaRecorder` API to capture the user's voice.

### Step 2 — Audio Upload

When recording stops, the frontend creates an audio Blob and sends it to:

```text
POST /api/transcription
```

The request uses `multipart/form-data`.

### Step 3 — Speech Recognition

The FastAPI backend temporarily stores the uploaded audio and processes it using Faster-Whisper.

Current configuration:

| Setting | Value |
|---|---|
| Model | Base |
| Device | CPU |
| Compute Type | INT8 |
| VAD Filter | Enabled |

Faster-Whisper returns:

- Transcribed text
- Detected language
- Language probability
- Timestamped segments

### Step 4 — Emotion Analysis

The transcript and temporary audio file are passed to the experimental emotion service.

The current service estimates:

- Emotion
- Arousal
- Valence
- Confidence

> **Important:** The current implementation is heuristic and should be treated as a prototype rather than a clinically or scientifically validated emotion classifier.

### Step 5 — LLM Response Generation

The detected emotion information and transcript are included in a structured prompt.

The backend sends the prompt to the locally running Ollama server.

Current model:

```text
qwen2.5vl:3b
```

The model generates a concise conversational response while being instructed to consider the detected emotional state.

### Step 6 — Frontend Response

The backend returns a structured JSON response containing:

- Transcript
- Language
- Language Probability
- Segments
- Emotion
- Arousal
- Valence
- Confidence
- AI Response

The React frontend updates the dashboard with the returned information.

### Step 7 — Voice Playback

The generated response can be played using the browser's Speech Synthesis API.

This provides the current voice-output demonstration while dedicated neural TTS is still planned.

---

## Repository Structure

```text
auralis-real-time-voice-emotion-engine/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sessions.py
│   │   │   └── transcription.py
│   │   │
│   │   ├── services/
│   │   │   └── emotion.py
│   │   │
│   │   └── main.py
│   │
│   ├── .venv/
│   ├── .mlvenv/
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── ...
│
├── .gitignore
├── README.md
└── ...
```

> Local Python environments such as `.venv/` and `.mlvenv/` are development environments and should not be committed.

### Important Directories

| Directory | Purpose |
|---|---|
| `backend/` | Python/FastAPI backend and ML processing pipeline |
| `backend/app/api/` | API route modules |
| `backend/app/services/` | Reusable backend processing services |
| `frontend/` | React/Vite application |
| `frontend/src/` | Primary frontend source code |

---

## Backend File Documentation

### `backend/app/main.py`

This is the entry point for the FastAPI application.

Responsibilities:

- Creating the FastAPI application
- Configuring CORS
- Registering API routers
- Providing the root endpoint
- Providing the health endpoint

Start command:

```bash
uvicorn app.main:app --reload
```

### `backend/app/api/sessions.py`

Provides session-related API functionality.

A session represents an interaction context between the frontend and backend.

### `backend/app/api/transcription.py`

This is currently the most important backend module. It connects the major components of the Auralis pipeline.

Responsibilities:

```text
Audio Upload
     ↓
Temporary File
     ↓
Faster-Whisper
     ↓
Transcript
     ↓
Emotion Analysis
     ↓
Ollama / Qwen
     ↓
AI Response
     ↓
JSON Response
```

Main endpoint:

```text
POST /api/transcription
```

Processing sequence:

1. Validate uploaded audio.
2. Read audio bytes.
3. Create temporary file.
4. Load Faster-Whisper model.
5. Transcribe audio.
6. Build transcript text.
7. Analyze emotion.
8. Generate AI response.
9. Return structured JSON.
10. Delete temporary audio file.

### `backend/app/services/emotion.py`

Contains the current emotion analysis service.

The current implementation is intentionally experimental.

It does **not** use a trained Wav2Vec2 or transformer-based emotion classifier.

The service currently returns:

```text
label
arousal
valence
confidence
method
```

The architecture keeps this logic separate from the transcription endpoint so that a trained model can replace it later without redesigning the complete API.

---

## Frontend File Documentation

### `frontend/src/App.jsx`

Main React application component.

It manages:

- UI state
- Microphone recording
- MediaRecorder lifecycle
- Audio upload
- Backend communication
- Transcript state
- Emotion state
- AI response state
- Browser Speech Synthesis
- Dashboard interactions

Main voice workflow:

```text
Start Recording
      ↓
MediaRecorder
      ↓
Stop Recording
      ↓
Create Audio Blob
      ↓
Upload to Backend
      ↓
Receive JSON
      ↓
Update UI
```

### `frontend/src/App.css`

Contains the primary visual design system for the Auralis dashboard.

It controls:

- Dashboard layout
- Sidebar
- Top navigation
- Voice stage
- Microphone button
- Waveform
- Emotion panel
- Transcript panel
- AI response panel
- Footer pipeline
- Responsive layout

### `frontend/src/index.css`

Contains global styling and browser-level defaults.

It defines:

- Root dimensions
- Page background
- Global box sizing
- Button/font inheritance
- Link defaults

---

## API Reference

### `GET /`

Backend root endpoint.

```text
GET http://127.0.0.1:8000/
```

### `GET /health`

Used to check whether the backend is running.

```text
GET http://127.0.0.1:8000/health
```

### `POST /api/sessions`

Creates a new session.

```text
POST http://127.0.0.1:8000/api/sessions
```

### `POST /api/transcription`

Processes an uploaded voice recording.

Request:

```text
POST /api/transcription
Content-Type: multipart/form-data

audio=<recorded audio file>
```

Example response:

```json
{
  "text": "I am very excited about this project.",
  "language": "en",
  "language_probability": 0.98,
  "segments": [
    {
      "start": 0.0,
      "end": 2.7,
      "text": "I am very excited about this project."
    }
  ],
  "emotion": {
    "label": "Happy",
    "arousal": 0.5,
    "valence": 1.0,
    "confidence": 0.3,
    "method": "experimental_heuristic"
  },
  "ai_response": "That sounds exciting. What part of the project are you working on?"
}
```

The exact output depends on the user's audio and the local model response.

---

## Local Development Setup

### Prerequisites

- Windows with PowerShell
- Python 3.11
- Node.js and npm
- Ollama
- Git
- A microphone

### 1. Clone Repository

```powershell
git clone https://github.com/HhardeX/auralis-real-time-voice-emotion-engine.git
cd auralis-real-time-voice-emotion-engine
```

### 2. Backend Environment

```powershell
cd backend
.\.mlvenv\Scripts\Activate.ps1
```

Verify:

```powershell
python --version
```

Expected:

```text
Python 3.11.x
```

Install required packages if needed:

```powershell
pip install fastapi uvicorn[standard] python-multipart faster-whisper av numpy
```

### 3. Verify Faster-Whisper

```powershell
python -c "from faster_whisper import WhisperModel; print('Faster-Whisper is available')"
```

The first actual transcription may download/load the selected Whisper model.

### 4. Configure Ollama

Verify:

```powershell
ollama --version
```

Pull the current model:

```powershell
ollama pull qwen2.5vl:3b
```

Verify:

```powershell
ollama list
```

Test:

```powershell
ollama run qwen2.5vl:3b "Reply in one short sentence: What is Auralis?"
```

### 5. Start Backend

From `backend/` with `.mlvenv` active:

```powershell
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### 6. Start Frontend

Open a second terminal:

```powershell
cd H:\PROJECTS\auralis-real-time-voice-emotion-engine\frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Complete Startup Procedure

### Terminal 1 — Ollama

Make sure Ollama is available:

```powershell
ollama list
```

Confirm that `qwen2.5vl:3b` is installed.

### Terminal 2 — Backend

```powershell
cd H:\PROJECTS\auralis-real-time-voice-emotion-engine\backend
.\.mlvenv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

### Terminal 3 — Frontend

```powershell
cd H:\PROJECTS\auralis-real-time-voice-emotion-engine\frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## How to Use the Application

1. Open the frontend.
2. Allow microphone access.
3. Press the microphone/record button.
4. Speak normally.
5. Stop recording.
6. Wait for backend processing.
7. Review the transcript.
8. Review detected emotion.
9. Review arousal and valence.
10. Read the Auralis response.
11. Press the audio button to hear the response.

---

## Ollama Integration

The backend communicates with Ollama through its local generation API.

Current endpoint:

```text
http://127.0.0.1:11434/api/generate
```

Current model:

```text
qwen2.5vl:3b
```

The backend sends a structured prompt containing the detected emotional information.

Conceptually:

```text
System Instructions
       +
Emotion
       +
Arousal
       +
Valence
       +
User Transcript
       ↓
Qwen
       ↓
Auralis Response
```

The model is instructed to:

- Respond conversationally.
- Consider emotional state.
- Keep responses concise.
- Avoid claiming to be a therapist.
- Avoid mentioning internal model details unnecessarily.

---

## Emotion System

### Current Implementation

The current emotion system is:

```text
Experimental Heuristic
```

It should be treated as a prototype component.

It provides an initial interface for the future learned emotion model.

### Planned Implementation

The future emotion architecture may use:

```text
Audio
  ↓
Wav2Vec2
  ↓
Emotion Embedding
  ↓
Arousal / Valence
  ↓
Emotion State
```

The final implementation can then use both acoustic and linguistic features.

---

## Speech Recognition

Auralis currently uses **Faster-Whisper**.

Current configuration:

| Property | Value |
|---|---|
| Model | Base |
| Runtime | CPU |
| Compute | INT8 |
| VAD | Enabled |

Faster-Whisper produces timestamped segments.

Example:

```json
{
  "start": 0.0,
  "end": 2.5,
  "text": "Hello, this is Auralis."
}
```

These segments are combined to produce the final transcript sent to the emotion and LLM layers.

---

## TTS

### Current

The current implementation uses the browser Web Speech API:

```javascript
window.speechSynthesis
```

This allows the project to demonstrate the complete:

```text
Voice Input
    ↓
STT
    ↓
Emotion
    ↓
LLM
    ↓
Voice Output
```

workflow without requiring a dedicated neural TTS model.

### Future

The target implementation is:

```text
LLM Response
    ↓
Neural TTS
    ↓
Audio Chunks
    ↓
Streaming Output
```

Potential technologies:

- XTTSv2
- Bark

---

## Real-Time Streaming Roadmap

The current implementation processes complete recordings.

The target architecture will process audio continuously.

Instead of:

```text
Record
  ↓
Stop
  ↓
Upload
  ↓
Process
  ↓
Respond
```

the target architecture is:

```text
Microphone
  ↓
Audio Chunks
  ↓
VAD
  ↓
Streaming STT
  ↓
Emotion
  ↓
LLM
  ↓
Streaming TTS
  ↓
Audio Output
```

This is intended to reduce perceived conversational latency.

---

## WebRTC Roadmap

The planned transport layer is based around WebRTC/aiortc.

Target:

```text
Browser
  │
  │ WebRTC
  ▼
Python Gateway
  │
  ├── Audio
  ├── VAD
  ├── STT
  └── TTS
```

> WebRTC is not part of the current completed implementation.

---

## Performance Metrics

Auralis is intended to be evaluated using:

| Metric | Purpose |
|---|---|
| STT Latency | Time required to obtain transcription |
| TTFT | Time to first LLM token |
| TTS Startup | Time until speech begins |
| End-to-End Latency | Voice input to voice output |
| VAD Latency | Speech/silence detection delay |
| Streaming Latency | Audio chunk processing delay |
| Barge-In Latency | Time to react to interruption |

The current version should be considered a foundation for these measurements rather than a finished low-latency streaming implementation.

---

## Current Limitations

- Audio is processed after recording rather than continuously streamed.
- The emotion engine is heuristic rather than a trained neural model.
- Browser Speech Synthesis is used instead of neural TTS.
- WebRTC is not yet implemented.
- UDP audio streaming is not yet implemented.
- Silero VAD is not yet integrated.
- Llama 3/vLLM is not the current runtime.
- CPU inference can introduce noticeable latency.
- Whisper quality depends on microphone quality and background noise.
- Continuous interruption handling is not yet implemented.

---

## Roadmap

### Phase 1 — Foundation

- [x] React dashboard
- [x] Microphone capture
- [x] FastAPI backend
- [x] Faster-Whisper integration
- [x] Experimental emotion engine
- [x] Ollama integration
- [x] Qwen response generation
- [x] Browser voice playback

### Phase 2 — Voice Intelligence

- [ ] Silero VAD
- [ ] Better silence detection
- [ ] Wav2Vec2 emotion recognition
- [ ] Improved continuous transcription
- [ ] Conversation context

### Phase 3 — Streaming AI

- [ ] Streaming LLM
- [ ] TTFT optimization
- [ ] Streaming neural TTS
- [ ] XTTSv2/Bark
- [ ] Audio chunking

### Phase 4 — Real-Time Transport

- [ ] WebRTC
- [ ] aiortc gateway
- [ ] UDP/audio streaming
- [ ] Client-side buffering
- [ ] Barge-in
- [ ] Interruption handling

### Phase 5 — Production

- [ ] Automated tests
- [ ] Structured logging
- [ ] Latency monitoring
- [ ] Configuration management
- [ ] Deployment configuration
- [ ] Security hardening
- [ ] Production monitoring

---

## Troubleshooting

### Backend Does Not Start

Check Python:

```powershell
python --version
```

Make sure the `.mlvenv` environment is activated.

Check FastAPI:

```powershell
python -c "import fastapi; print('FastAPI OK')"
```

### Faster-Whisper Import Error

Activate the ML environment:

```powershell
.\.mlvenv\Scripts\Activate.ps1
```

Test:

```powershell
python -c "from faster_whisper import WhisperModel; print('Whisper OK')"
```

### Ollama Error

Check:

```powershell
ollama list
```

Make sure:

```text
qwen2.5vl:3b
```

is installed.

### Microphone Not Working

Check:

- Browser microphone permission
- Windows microphone permission
- Correct microphone device
- Browser console
- Frontend status
- Backend status

### Frontend Cannot Connect to Backend

Verify backend:

```text
http://127.0.0.1:8000
```

Verify frontend:

```text
http://localhost:5173
```

If a CORS error appears, check the FastAPI CORS configuration.

---

## Development Workflow

Auralis should be developed through real, incremental changes.

Recommended workflow:

```text
Select a feature
      ↓
Implement
      ↓
Run the application
      ↓
Test the feature
      ↓
Check git diff
      ↓
Check git status
      ↓
Commit meaningful work
      ↓
Push to GitHub
```

Example:

```powershell
git status
git add .
git commit -m "feat: implement feature"
git push origin main
```

> Do not create empty, artificial, or backdated commits. Each commit should represent actual development, documentation, testing, or maintenance work.

---

## Development Environment

The current project uses two Python environments:

| Environment | Purpose |
|---|---|
| `.venv` | General Python/backend environment |
| `.mlvenv` | Python 3.11 environment used for ML dependencies such as Faster-Whisper |

The ML environment should be used when running the current transcription pipeline.

---

## Important Git Ignore Rules

Generated environments and large ML artifacts should not be committed.

The repository ignores:

```text
.venv/
.mlvenv/
venv/
env/
node_modules/
dist/
*.wav
*.mp3
*.flac
*.pt
*.pth
*.onnx
```

This prevents local environments and large model/audio files from being pushed to GitHub.

---

## Testing Checklist

Before considering a voice pipeline change complete:

### Backend

- [ ] Backend starts successfully
- [ ] `/health` responds
- [ ] Whisper loads
- [ ] Audio upload works
- [ ] Transcription works
- [ ] Emotion service works
- [ ] Ollama responds
- [ ] API returns valid JSON
- [ ] Temporary files are removed

### Frontend

- [ ] Vite starts
- [ ] Dashboard renders
- [ ] Microphone permission works
- [ ] Recording works
- [ ] Audio upload works
- [ ] Transcript appears
- [ ] Emotion appears
- [ ] AI response appears
- [ ] TTS playback works

### Integration

- [ ] Frontend can reach backend
- [ ] Backend can reach Ollama
- [ ] Complete voice pipeline works end-to-end

---

## Project Goals

The long-term objective of Auralis is to build a voice interaction engine capable of:

- Continuous speech understanding
- Emotion-aware interaction
- Conversational context
- Natural AI responses
- Expressive voice generation
- Real-time audio streaming
- Natural interruption handling
- Low end-to-end latency

---

## Project Status

| Component | Status |
|---|---|
| React Dashboard | Implemented |
| Microphone Capture | Implemented |
| FastAPI Backend | Implemented |
| Faster-Whisper STT | Implemented |
| Experimental Emotion Engine | Implemented |
| Ollama Integration | Implemented |
| Qwen 2.5 VL | Implemented |
| Browser TTS | Implemented |
| Wav2Vec2 Emotion Model | Planned |
| Silero VAD | Planned |
| Neural TTS | Planned |
| WebRTC | Planned |
| Low-Latency Streaming | Planned |
| Barge-In Handling | Planned |

---

## Project Information

### Project Name

**Auralis — Real-Time Voice-to-Voice Emotion Engine**

### Domain

**Generative Audio & Low-Latency Streaming**

### Core Technologies

#### Frontend

- React
- Vite
- JavaScript
- MediaRecorder API
- Web Speech API
- CSS

#### Backend

- Python
- FastAPI
- Uvicorn
- REST API

#### Speech Recognition

- Faster-Whisper
- Whisper Base
- CPU INT8 inference

#### Emotion Analysis

- Experimental heuristic emotion engine
- Arousal
- Valence
- Confidence

#### LLM

- Ollama
- Qwen 2.5 VL 3B

#### Planned AI/Audio Technologies

- Wav2Vec2
- Silero VAD
- Llama 3
- vLLM
- XTTSv2
- Bark
- WebRTC
- aiortc

---

## About Auralis

Auralis is designed as a modular voice intelligence system rather than a simple speech-to-text application.

The architecture separates:

```text
Voice Capture
      ↓
Speech Recognition
      ↓
Emotion Understanding
      ↓
Language Reasoning
      ↓
Voice Generation
      ↓
Real-Time Transport
```

This modular design allows individual components to be improved or replaced without redesigning the entire application.

For example, the current heuristic emotion service can later be replaced with a trained Wav2Vec2-based model while keeping the transcription and API architecture largely unchanged.

Similarly, browser Speech Synthesis can later be replaced by a neural TTS engine capable of producing expressive audio chunks for streaming playback.

---

## Future Architecture

The intended long-term architecture is:

```text
                   ┌──────────────────────┐
                   │      Browser         │
                   │                      │
                   │ Microphone + UI      │
                   └──────────┬───────────┘
                              │
                           WebRTC
                              │
                              ▼
                   ┌──────────────────────┐
                   │   Audio Gateway      │
                   │      aiortc          │
                   └──────────┬───────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
             Silero        Whisper       Emotion
               VAD           STT           Model
                │             │             │
                └─────────────┼─────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │   Context Engine     │
                   │   Llama / vLLM       │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │     Neural TTS       │
                   │    XTTSv2 / Bark     │
                   └──────────┬───────────┘
                              │
                         Audio Chunks
                              │
                              ▼
                   ┌──────────────────────┐
                   │   Browser Output     │
                   └──────────────────────┘
```

The future architecture is intended to support continuous processing rather than waiting for an entire recording to finish.

---

## Security and Privacy Considerations

The current LLM integration runs through a locally installed Ollama server.

The current architecture therefore does not require sending the transcript to a hosted LLM API for response generation.

However, users should still consider:

- Microphone permissions
- Local audio handling
- Temporary audio files
- Model-generated content
- API endpoint exposure
- Future WebRTC security
- Authentication for production deployments
- HTTPS/TLS for deployed systems
- Secure configuration management

> The current project is a development prototype and should not be treated as a production-secure voice service.

---

## License

License information should be added when a formal project license is selected.

---

## Author

**Hardev Chudasama**

GitHub:  
https://github.com/HhardeX

Project Repository:  
https://github.com/HhardeX/auralis-real-time-voice-emotion-engine

---

## Acknowledgements

Auralis builds upon open-source technologies and research projects including:

- Faster-Whisper
- Whisper
- Ollama
- Qwen
- React
- Vite
- FastAPI
- Web Speech API
- Wav2Vec2
- Silero VAD
- WebRTC
- aiortc
- XTTSv2
- Bark

Some technologies above are part of the current implementation, while others are planned for future development.

---

## Final Project Vision

Auralis aims to evolve from a prototype voice interaction dashboard into a real-time voice intelligence engine capable of understanding not only **what a person says**, but also information related to **how they say it**.

The long-term vision combines:

```text
Speech
  +
Emotion
  +
Context
  +
Language Reasoning
  +
Expressive Voice
  +
Low-Latency Streaming
        ↓
Unified Voice-to-Voice Interaction
```

```text
                 AURALIS
                    │
          ┌─────────┼─────────┐
          │         │         │
        Voice     Emotion   Context
          │         │         │
          └─────────┼─────────┘
                    │
              Intelligence
                    │
             Natural Response
                    │
             Expressive Voice
                    │
          Real-Time Interaction
```

**Auralis is currently under active development.**
