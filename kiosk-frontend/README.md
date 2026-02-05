# JARVIS: AI-Driven Autonomous Hotel Concierge
### A Zero-Trust, Voice-First Hospitality Management System

JARVIS is a next-generation hotel kiosk designed to eliminate reception bottlenecks through "Invisible Technology." It combines Computer Vision, LLM-driven voice orchestration, and a modular React frontend to provide a seamless guest experience.

## 🏗️ System Architecture
The project is built on a Decoupled Modular Architecture, allowing the "Brain" (AI Logic) to be upgraded independently of the "Body" (Kiosk UI).

### 1. The Interaction Layer (Frontend)
- **Wizard Pattern:** A linear, state-driven UI that reduces cognitive load for travelers.
- **LED Language:** Visual cues (Pulsing rings) that provide hardware-style feedback for voice interactions.
- **Information Snacking:** Integrated "Thinking States" that display Wi-Fi and hotel info to reduce perceived latency.

### 2. The Intelligence Layer (AI Orchestrator)
- **STT/TTS Pipeline:** Real-time speech processing using Groq (Llama 3.1) for low-latency responses.
- **Intent Mapping:** Converts natural speech into specific UI actions (e.g., "I want a room" → ROOM_SELECT state).

### 3. The Security Layer (Zero-Trust)
- **JWT Authorization:** Every request is signed with a JWT containing `hotel_id` and `role: KIOSK`.
- **Multi-Tenancy:** Ensures complete data isolation; Kiosks from Hotel A cannot access data from Hotel B.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 14, React, Axios, CSS3 (Custom Animations)
- **Backend:** Node.js, Express (with Postman Contract Testing)
- **AI/ML:** Groq API, OpenAI Whisper (STT), Google TTS
- **Tools:** Postman (Mock Servers), JWT.io (Security Validation)

---

## 🚀 Key UX Principles Implemented
- **The Service Recovery Paradox:** Built-in "Ambassador" triggers for technical failures to maintain guest trust.
- **Hick’s Law:** Minimalist views with 60px+ touch targets to simplify decision-making.
- **The Peak-End Rule:** Focused design on high-friction moments (ID Scanning & Payment) to ensure a positive final impression.

---

## 📂 Project Structure
```plaintext
kiosk-frontend/
├── components/
│   ├── actions/      # IdentityScanner, RoomSelector, PaymentBridge
│   ├── alerts/       # ServiceRecoveryAlert
│   ├── layout/       # KioskContainer, SessionHeader
│   └── views/        # AttractLoop, VoiceVisualizer, ThinkingState
├── services/         # VoiceEngine.js
└── app/
    └── page.js       # Main State Controller
```

---

## 🛠️ How to Run

1. **Clone the Repo:**
   ```bash
   git clone https://github.com/your-username/jarvis-kiosk
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Setup Environment:**
   Create a `.env.local` and add your `NEXT_PUBLIC_KIOSK_JWT` and `POSTMAN_MOCK_URL`.

4. **Launch:**
   ```bash
   npm run dev
   ```
