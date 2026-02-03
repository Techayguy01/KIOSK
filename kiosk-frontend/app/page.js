"use client";
import { useState, useRef, useEffect } from "react"; // <--- ADD useEffect
import axios from "axios";

const API_URL = "https://48289860-f153-4a6d-9d9c-21537b8cfee7.mock.pstmn.io/api/v1/voice"; 

export default function KioskPage() {
  const [status, setStatus] = useState("IDLE");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // NEW: Reference to the audio player so we can stop it if needed
  const audioPlayerRef = useRef(null);

  // --- NEW: AUTO-PLAY AUDIO WHEN RESPONSE ARRIVES ---
  useEffect(() => {
    if (status === "RESPONSE" && aiResponse?.audio_url) {
      playAudio(aiResponse.audio_url);
    }
  }, [status, aiResponse]);

  const playAudio = (url) => {
    // 1. If audio is already playing, stop it first to avoid overlap
    if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
    }

    console.log("🔊 Playing Audio:", url);
    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    
    // 2. Start playing and capture the "Promise"
    const playPromise = audio.play();

    // 3. robust error handling
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Audio started successfully
        })
        .catch((error) => {
          if (error.name === "NotAllowedError") {
             console.error("❌ Autoplay blocked! User must tap the screen first.");
          } else {
             // This ignores the "interrupted" error
             console.log("⚠️ Playback interrupted (User skipped or reset).");
          }
        });
    }
  };
  // ---------------------------------------------------

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus("LISTENING");

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start();
      setTimeout(() => stopSession(), 4000); // Still manual/timer for now

    } catch (err) {
      console.error("Mic Error:", err);
      setStatus("ERROR");
    }
  };

  const stopSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setStatus("PROCESSING");
    try {
      console.log("🎤 Uploading...");
      const response = await axios.post(API_URL, {
        session_id: "demo_session",
        audio_metadata: `Blob size: ${audioBlob.size}` 
      });

      setTranscript(response.data.data.transcript);
      setAiResponse(response.data.data);
      // The useEffect above will catch this state change and play audio!
      setStatus("RESPONSE");
      
    } catch (error) {
      console.error("API Error", error);
      setStatus("ERROR");
    }
  };

  const resetKiosk = () => {
    // Stop audio if it's still playing
    if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
    }
    setStatus("IDLE");
    setTranscript("");
    setAiResponse(null);
  };

  return (
    <main style={styles.container}>
      <div style={styles.header}><p>Status: <strong>{status}</strong></p></div>

      {status === "IDLE" && <IdleView onStart={startSession} />}
      
      {status === "LISTENING" && (
        <div style={styles.center}>
            <h1 className="pulse">🔴 Listening...</h1>
            <div style={styles.wave}></div> {/* Placeholder for animation */}
            <button onClick={stopSession} style={{...styles.button, background: 'red', color: 'white'}}>
                Stop Speaking
            </button>
        </div>
      )}

      {status === "PROCESSING" && <ProcessingView />}
      
      {status === "RESPONSE" && aiResponse && <ResponseView data={aiResponse} onReset={resetKiosk} />}
      
      {status === "ERROR" && <ErrorView onReset={resetKiosk} />}
    </main>
  );
}

// --- SUB-COMPONENTS ---
function IdleView({ onStart }) {
  return (
    <div style={styles.center}>
      <h1>👋 Hello!</h1>
      <p>Tap to start checking in</p>
      <button onClick={onStart} style={styles.bigButton}>Start</button>
    </div>
  );
}

function ProcessingView() {
  return (
    <div style={styles.center}>
      <h1>🧠 Thinking...</h1>
    </div>
  );
}

function ResponseView({ data, onReset }) {
  return (
    <div style={styles.center}>
      <p style={{color: "#666"}}>You said: "{data.transcript}"</p>
      <h1>🤖 {data.text_response}</h1>
      
      {data.ui_action === "show_keypad" && (
        <div style={styles.card}>
            <input type="text" placeholder="Booking ID..." style={styles.input} />
        </div>
      )}
      <button onClick={onReset} style={styles.button}>Start Over</button>
    </div>
  );
}

function ErrorView({ onReset }) {
    return (
        <div style={styles.center}>
            <h2>❌ Connection Failed</h2>
            <button onClick={onReset}>Retry</button>
        </div>
    );
}

// --- STYLES ---
const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column", background: "#f4f4f9", fontFamily: "Arial, sans-serif" },
  header: { padding: "15px", background: "#222", color: "#fff", fontSize: "0.9rem" },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", textAlign: "center" },
  bigButton: { padding: "20px 50px", fontSize: "1.5rem", background: "#0070f3", color: "white", border: "none", borderRadius: "50px", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,112,243,0.3)" },
  button: { padding: "10px 25px", fontSize: "1rem", background: "#333", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "20px" },
  card: { padding: "20px", background: "white", borderRadius: "10px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" },
  input: { padding: "10px", fontSize: "1.2rem", border: "1px solid #ddd", borderRadius: "5px", width: "200px" },
  wave: { width: "50px", height: "50px", background: "red", borderRadius: "50%", animation: "pulse 1s infinite" }
};