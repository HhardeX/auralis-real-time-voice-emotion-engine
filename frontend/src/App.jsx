import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AudioWaveform,
  BarChart3,
  Brain,
  CircleHelp,
  History,
  Mic,
  MicOff,
  Radio,
  Settings,
  Sparkles,
  Volume2,
  Waves,
  Zap,
} from "lucide-react";

import "./App.css";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const [transcript, setTranscript] = useState(
    "Your conversation will appear here..."
  );

  const [emotion, setEmotion] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setElapsed((value) => value + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isListening]);

  const toggleMicrophone = async () => {
    setMicError("");

    if (isListening) {
      setIsListening(false);

      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        setTranscript("Transcribing your voice...");
        setEmotion(null);

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          const formData = new FormData();

          formData.append(
            "audio",
            audioBlob,
            "auralis-recording.webm"
          );

          const response = await fetch(
            "http://127.0.0.1:8000/api/transcription",
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.detail || "Transcription failed"
            );
          }

          setTranscript(
            data.text || "No speech detected."
          );
          
          if (data.emotion) {
            setEmotion(data.emotion);
          }
          
          setAiResponse(
            data.ai_response ||
            "Auralis is processing your voice..."
          );
        } catch (error) {
          setMicError(
            `Transcription failed: ${error.message}`
          );

          setTranscript(
            "Could not transcribe this recording."
          );

          setEmotion(null);
        }
      };

      mediaRecorderRef.current = recorder;
      streamRef.current = stream;

      recorder.start();

      setElapsed(0);
      setEmotion(null);
      setAiResponse("");
      setTranscript("Listening for your voice...");
      setIsListening(true);
    } 
    catch (error) {
      setAiResponse("");
      setMicError(
        error.message ||
          "Microphone access was blocked. Please allow microphone permission."
      );
    }
  };
  const speakResponse = () => {
    if (!aiResponse) return;
  
    window.speechSynthesis.cancel();
  
    const utterance = new SpeechSynthesisUtterance(aiResponse);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
  
    window.speechSynthesis.speak(utterance);
  };
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const remainingSeconds = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  const emotionLabel =
    emotion?.label || "Awaiting voice";

  const emotionArousal =
    emotion?.arousal !== undefined
      ? Number(emotion.arousal).toFixed(2)
      : "—";

  const emotionValence =
    emotion?.valence !== undefined
      ? Number(emotion.valence).toFixed(2)
      : "—";

  const emotionConfidence =
    emotion?.confidence !== undefined
      ? Number(emotion.confidence).toFixed(2)
      : "—";

  return (
    <div className="auralis-app">

      {/* Ambient background */}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-mark">
            <Waves size={20} />
          </div>

          <div>
            <div className="brand-name">AURALIS</div>
            <div className="brand-subtitle">
              Emotion Engine
            </div>
          </div>
        </div>

        <nav className="navigation">

          <div className="nav-label">
            WORKSPACE
          </div>

          <button className="nav-item active">
            <AudioWaveform size={18} />
            <span>Voice Studio</span>
          </button>

          <button className="nav-item">
            <History size={18} />
            <span>Sessions</span>
          </button>

          <button className="nav-item">
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>

          <div className="nav-label nav-label-spaced">
            SYSTEM
          </div>

          <button className="nav-item">
            <Brain size={18} />
            <span>AI Models</span>
          </button>

          <button className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="system-card">

            <div className="system-status">
              <span className="status-dot" />
              System Online
            </div>

            <div className="system-meta">
              <span>Engine</span>
              <strong>Auralis v0.1</strong>
            </div>

          </div>

          <button className="help-button">
            <CircleHelp size={17} />
            Help & Documentation
          </button>

        </div>

      </aside>

      {/* Main */}
      <main className="main-content">

        {/* Top bar */}
        <header className="topbar">

          <div>

            <div className="eyebrow">
              <Radio size={14} />
              REAL-TIME VOICE WORKSPACE
            </div>

            <h1>Voice Studio</h1>

          </div>

          <div className="topbar-right">

            <div className="latency-pill">
              <Zap size={14} />
              <span>TTFT</span>
              <strong>-- ms</strong>
            </div>

            <div className="connection">
              <span className="connection-dot" />
              Connected
            </div>

            <div className="avatar">
              H
            </div>

          </div>

        </header>

        {/* Workspace */}
        <section className="workspace-grid">

          {/* Voice center */}
          <motion.section
            className="voice-card glass-card"
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
          >

            <div className="card-header">

              <div>
                <span className="section-kicker">
                  VOICE SESSION
                </span>

                <h2>Talk to Auralis</h2>
              </div>

              <div
                className={`session-badge ${
                  isListening ? "live" : ""
                }`}
              >
                <span />

                {isListening
                  ? "LIVE"
                  : "READY"}
              </div>

            </div>

            <div className="voice-stage">

              <AnimatePresence>

                {isListening && (
                  <>
                    <motion.div
                      className="pulse pulse-one"
                      initial={{
                        scale: 0.7,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1.25,
                        opacity: 0.35,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />

                    <motion.div
                      className="pulse pulse-two"
                      initial={{
                        scale: 0.8,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1.15,
                        opacity: 0.5,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />
                  </>
                )}

              </AnimatePresence>

              <motion.button
                className={`mic-button ${
                  isListening ? "recording" : ""
                }`}
                onClick={toggleMicrophone}
                whileHover={{
                  scale: 1.04,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                aria-label={
                  isListening
                    ? "Stop microphone"
                    : "Start microphone"
                }
              >
                {isListening ? (
                  <MicOff size={36} />
                ) : (
                  <Mic size={36} />
                )}
              </motion.button>

            </div>

            <div className="voice-state">

              <div className="voice-state-title">
                {isListening
                  ? "Listening..."
                  : "Ready to listen"}
              </div>

              <div className="voice-state-subtitle">
                {isListening
                  ? "Speak naturally. Auralis is analyzing your voice."
                  : "Press the microphone to start a real-time session."}
              </div>

            </div>

            {/* Waveform */}
            <div
              className={`waveform ${
                isListening ? "active" : ""
              }`}
            >
              {Array.from({
                length: 46,
              }).map((_, index) => (
                <motion.span
                  key={index}
                  animate={
                    isListening
                      ? {
                          height: [
                            `${8 + ((index * 7) % 18)}px`,
                            `${18 + ((index * 13) % 38)}px`,
                            `${8 + ((index * 5) % 22)}px`,
                          ],
                        }
                      : {
                          height: "8px",
                        }
                  }
                  transition={
                    isListening
                      ? {
                          duration:
                            0.8 +
                            (index % 5) *
                              0.12,
                          repeat: Infinity,
                          repeatType:
                            "mirror",
                          delay:
                            index * 0.015,
                        }
                      : {
                          duration: 0.2,
                        }
                  }
                />
              ))}
            </div>

            <div className="session-footer">

              <div className="timer">
                <Activity size={15} />
                {formatTime(elapsed)}
              </div>

              <div className="audio-quality">

                <span className="quality-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>

                48 kHz

              </div>

            </div>

            {micError && (
              <div className="error-message">
                {micError}
              </div>
            )}

          </motion.section>

          {/* Emotion */}
          <motion.section
            className="emotion-card glass-card"
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.08,
            }}
          >

            <div className="card-header compact">

              <div>

                <span className="section-kicker">
                  VOICE ANALYSIS
                </span>

                <h3>
                  Current Emotion
                </h3>

              </div>

              <Sparkles
                size={18}
                className="spark-icon"
              />

            </div>

            <div className="emotion-main">

              <div className="emotion-orb">

                <div className="emotion-orb-inner">
                  <span>
                    {emotion
                      ? "AI"
                      : "—"}
                  </span>
                </div>

              </div>

              <div className="emotion-label">
                {emotionLabel}
              </div>

              <div className="emotion-description">
                {emotion
                  ? `Detected using Auralis experimental emotion analysis.`
                  : "Start speaking to analyze emotional tone."}
              </div>

            </div>

            <div className="emotion-metrics">

              <Metric
                label="Arousal"
                value={emotionArousal}
              />

              <Metric
                label="Valence"
                value={emotionValence}
              />

              <Metric
                label="Confidence"
                value={emotionConfidence}
              />

            </div>

          </motion.section>

          {/* Transcript */}
          <motion.section
            className="transcript-card glass-card"
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.14,
            }}
          >

            <div className="card-header compact">

              <div>

                <span className="section-kicker">
                  SPEECH-TO-TEXT
                </span>

                <h3>
                  Live Transcript
                </h3>

              </div>

              <div className="model-tag">
                Whisper
              </div>

            </div>

            <div className="transcript-body">

              <p
                className={
                  isListening
                    ? "listening-text"
                    : ""
                }
              >
                {transcript}

                {isListening && (
                  <span className="cursor" />
                )}
              </p>

            </div>

            <div className="transcript-footer">

              <span>Language</span>
              <strong>Auto Detect</strong>

              <span className="divider" />

              <span>Mode</span>
              <strong>Continuous</strong>

            </div>

          </motion.section>

          {/* AI response */}
          <motion.section
            className="response-card glass-card"
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
            }}
          >

            <div className="card-header compact">

              <div>

                <span className="section-kicker">
                  CONTEXT ENGINE
                </span>

                <h3>
                  Auralis Response
                </h3>

              </div>

              <div className="model-tag">

                <span className="model-dot" />

                Qwen 2.5 VL

              </div>

            </div>

            <div className="response-body">
             <div className="ai-icon">
              <Brain size={20} />
            </div>

            <p>
              {aiResponse ||
                "Auralis will generate an emotion-aware response here after processing your speech and conversation context."}
            </p>
           </div>

            <div className="response-audio">

            <button
              className="audio-button"
              onClick={speakResponse}
              disabled={!aiResponse}
              title={aiResponse ? "Play Auralis response" : "No response available"}
            >
             <Volume2 size={17} />
            </button>

              <div className="mini-wave">

                {Array.from({
                  length: 25,
                }).map((_, index) => (
                  <span
                    key={index}
                    style={{
                      height: `${
                        8 +
                        ((index * 9) % 17)
                      }px`,
                    }}
                  />
                ))}

              </div>

              <span className="audio-status">
                TTS waiting
              </span>

            </div>

          </motion.section>

        </section>

        {/* Footer */}
        <footer className="status-footer">

          <div>
            <span className="footer-dot" />
            Auralis real-time pipeline
          </div>

          <div className="pipeline">

            <span>Microphone</span>
            <b>→</b>

            <span>VAD</span>
            <b>→</b>

            <span>Whisper</span>
            <b>→</b>

            <span>Emotion</span>
            <b>→</b>

            <span>LLM</span>
            <b>→</b>

            <span>TTS</span>

          </div>

          <span>
            v0.1.0
          </span>

        </footer>

      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

export default App;