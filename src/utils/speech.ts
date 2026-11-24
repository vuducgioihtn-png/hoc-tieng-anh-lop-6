// Web Speech API wrapper for crisp English pronunciation + subtle Web Audio feedback sounds

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return cachedVoice;

  const preferred =
    voices.find((v) => v.lang === 'en-GB' && /google|natural|samantha|daniel|serena/i.test(v.name)) ||
    voices.find((v) => v.lang === 'en-US' && /google|natural|samantha|aria|jenny/i.test(v.name)) ||
    voices.find((v) => v.lang === 'en-GB') ||
    voices.find((v) => v.lang.startsWith('en-US')) ||
    voices.find((v) => v.lang.startsWith('en'));

  cachedVoice = preferred ?? null;
  return cachedVoice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    pickEnglishVoice();
  };
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speakEnglish(
  text: string,
  options?: {
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
  }
): void {
  if (!isSpeechSupported()) {
    options?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickEnglishVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-GB';
  }
  utterance.rate = options?.rate ?? 0.95;
  utterance.pitch = 1;

  utterance.onstart = () => options?.onStart?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = () => options?.onEnd?.();

  window.speechSynthesis.speak(utterance);
}

// Subtle Web Audio UI feedback sounds (no external audio assets needed)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playFeedbackSound(kind: 'correct' | 'wrong' | 'complete', enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const playTone = (freq: number, start: number, duration: number, type: OscillatorType, gainVal: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  if (kind === 'correct') {
    playTone(587.33, now, 0.14, 'sine', 0.12); // D5
    playTone(880, now + 0.09, 0.22, 'sine', 0.13); // A5
  } else if (kind === 'wrong') {
    playTone(260, now, 0.16, 'triangle', 0.1);
    playTone(210, now + 0.11, 0.2, 'triangle', 0.09);
  } else if (kind === 'complete') {
    playTone(523.25, now, 0.13, 'sine', 0.11); // C5
    playTone(659.25, now + 0.11, 0.13, 'sine', 0.11); // E5
    playTone(783.99, now + 0.22, 0.15, 'sine', 0.12); // G5
    playTone(1046.5, now + 0.34, 0.32, 'sine', 0.14); // C6
  }
}
