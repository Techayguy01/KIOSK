"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import hark from "hark";
import { motion, AnimatePresence } from "framer-motion"; // High-end animations
import { KioskContainer, SessionHeader } from "@/components/layout";
import AttractLoop from "@/components/views/AttractLoop";
import VoiceVisualizer from "@/components/views/VoiceVisualizer";
import ThinkingState from "@/components/views/ThinkingState";
import IdentityScanner from "@/components/actions/IdentityScanner";
import RoomSelector from "@/components/actions/RoomSelector";
import PaymentBridge from "@/components/actions/PaymentBridge";
import { ServiceRecoveryAlert } from "@/components/alerts";

// --- CONFIGURATION ---
const API_URL = process.env.NEXT_PUBLIC_POSTMAN_MOCK_URL || "https://b41c3686-d6ec-4214-82737570ab68.mock.pstmn.io/api/v1/voice";
const KIOSK_JWT = process.env.NEXT_PUBLIC_KIOSK_JWT;

export default function KioskPage() {
  // 1. STATE MANAGEMENT
  const [uiState, setUiState] = useState("IDLE"); // IDLE | LISTENING | THINKING | SCAN_ID | ROOM_SELECT | PAYMENT | RESPONSE | ERROR
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // 2. REFS
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechEventsRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // 3. AUTO-PLAY AUDIO EFFECT
  useEffect(() => {
    if (aiResponse?.audio_url && (uiState === "SCAN_ID" || uiState === "ROOM_SELECT" || uiState === "PAYMENT" || uiState === "RESPONSE")) {
      playAudio(aiResponse.audio_url);
    }
  }, [uiState, aiResponse]);

  // 4. AUDIO PLAYBACK LOGIC
  const playAudio = (url) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    console.log("🔊 Playing Audio:", url);
    const audio = new Audio(url);
    audioPlayerRef.current = audio;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Audio started successfully
        })
        .catch((error) => {
          if (error.name === "NotAllowedError") {
            console.error("❌ Autoplay blocked! User must tap screen first.");
          } else {
            console.log("⚠️ Playback interrupted or failed.");
          }
        });
    }
  };

  // 5. START LISTENING SESSION (Mic + VAD)
  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setUiState("LISTENING");

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        console.log("🛑 Recorder stopped. Processing audio...");
        if (speechEventsRef.current) speechEventsRef.current.stop();
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start();

      const speechEvents = hark(stream, { threshold: -45, interval: 100 });
      speechEventsRef.current = speechEvents;

      console.log("👂 VAD Active: Waiting for speech...");

      speechEvents.on('stopped_speaking', () => {
        console.log("🤐 Silence detected. Stopping session automatically.");
        stopSession();
      });

    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone access was denied. Please enable it in your browser settings to use Jarvis.");
      } else {
        console.error("Mic Error:", err);
        alert("An error occurred accessing the microphone.");
      }
      setUiState("ERROR");
      setErrorMessage("Microphone access failed. Please ask staff for assistance.");
    }
  };

  // 6. STOP LISTENING
  const stopSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // 7. API UPLOAD
  const sendAudioToBackend = async (audioBlob) => {
    setUiState("THINKING");

    try {
      console.log(`📤 Uploading ${audioBlob.size} bytes...`);
      const response = await axios.post(API_URL, {
        session_id: "demo_session",
        audio_metadata: `Blob size: ${audioBlob.size}`
      });

      setTranscript(response.data.data.transcript);
      setAiResponse(response.data.data);

      setUiState("SCAN_ID");

    } catch (error) {
      console.error("API Error", error);
      setUiState("ERROR");
      setErrorMessage("Unable to process your request. Please try again.");
    }
  };

  // 8. PAYMENT HANDLER
  const handlePayment = async (paymentData = "demo_token") => {
    try {
      console.log("💳 Processing simulated payment...");

      // throw new Error("Payment Declined"); // UNCOMMENT TO TEST NEGATIVE PATH

      await new Promise(resolve => setTimeout(resolve, 2000));

      setUiState("SUCCESS");
      alert("Check-in Complete! Enjoy your stay.");
      resetKiosk();

    } catch (error) {
      console.error("Payment failed:", error);
      setUiState("ERROR");
      setErrorMessage("Your card was declined by the bank. Please try another method or speak to our staff.");
    }
  };

  // 9. RESET KIOSK
  const resetKiosk = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setUiState("IDLE");
    setTranscript("");
    setAiResponse(null);
    setErrorMessage("");
  };

  // 10. RENDER UI
  return (
    <div className="flex-1 flex items-center justify-center p-10 h-screen bg-black text-white relative overflow-hidden">

      {/* Enterprise Noise Texture */}
      <div className="kiosk-noise"></div>

      {/* ERROR OVERLAY */}
      {uiState === "ERROR" && (
        <ServiceRecoveryAlert
          message={errorMessage || "We are having trouble connecting to the network."}
          onRetry={uiState === "ERROR" && errorMessage.includes("card") ? () => setUiState("PAYMENT") : resetKiosk}
        />
      )}

      {/* ANIMATED COMPONENT SWITCHER */}
      <AnimatePresence mode="wait">
        <motion.div
          key={uiState} // Triggers animation on state change
          initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-center z-10"
        >
          {/* Step 1: Voice/Thinking */}
          {uiState === "IDLE" && <AttractLoop onStart={startSession} />}
          {uiState === "LISTENING" && <VoiceVisualizer onStop={stopSession} />}
          {uiState === "THINKING" && <ThinkingState />}

          {/* Step 2: The Identity Scanner */}
          {uiState === "SCAN_ID" && (
            <div className="flex flex-col items-center gap-8 w-full">
              {aiResponse?.text_response && (
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-semibold text-blue-400 text-center"
                >
                  🤖 {aiResponse.text_response}
                </motion.h2>
              )}
              <IdentityScanner onComplete={() => setUiState("ROOM_SELECT")} />
            </div>
          )}

          {/* Step 3: Room Selection */}
          {uiState === "ROOM_SELECT" && (
            <div className="flex flex-col items-center w-full">
              <h2 className="text-white mb-6 text-xl">Select Your Preferred Room</h2>
              <RoomSelector
                rooms={aiResponse?.available_rooms || []}
                onSelect={(room) => {
                  console.log("Room Selected:", room);
                  setUiState("PAYMENT");
                }}
              />
            </div>
          )}

          {/* Step 4: Payment */}
          {uiState === "PAYMENT" && (
            <PaymentBridge onFinish={() => handlePayment()} />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}