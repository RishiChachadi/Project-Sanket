// Autonomous Procedural VHF/UHF Tactical Radio Synthesizer
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Procedurally generate tactical radio squelch static burst
function playRadioSquelch(durationMs = 90, volume = 0.18) {
  try {
    const ctx = getAudioContext();
    const bufferSize = Math.floor((ctx.sampleRate * durationMs) / 1000);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // White noise with exponential decay to simulate radio unkeying
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.7));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Tactical VHF Radio Bandpass Filter (cuts below 400Hz and above 3200Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1750;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (err) {
    console.warn('Tactical audio DSP error:', err);
  }
}

// Procedurally generate authentic Motorola/MDT "Roger Beep" (dual-frequency pip)
function playRogerBeep() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1209, now); // Standard DTMF / alert high tone

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1477, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.04);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.12);
  } catch (err) {
    console.warn('Roger beep synthesis error:', err);
  }
}

interface DispatchOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

export function broadcastTacticalRadio(calloutText: string, options?: DispatchOptions) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Cancel any ongoing broadcast to prevent overlapping voices
  window.speechSynthesis.cancel();

  // 1. Initial PTT Radio Squelch burst
  playRadioSquelch(110, 0.22);

  // 2. Synthesize Military/First-Responder CAD Voice
  const utterance = new SpeechSynthesisUtterance(calloutText);
  utterance.rate = 1.05; // Urgent dispatch cadence
  utterance.pitch = 0.95; // Authoritative lower frequency

  // Select an English voice with authority (prefer UK/US English or Google Natural)
  const voices = window.speechSynthesis.getVoices();
  const militaryVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google UK'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (militaryVoice) {
    utterance.voice = militaryVoice;
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    // 3. Radio Roger Beep followed by closing static squelch tail
    playRogerBeep();
    setTimeout(() => {
      playRadioSquelch(140, 0.20);
      options?.onEnd?.();
    }, 120);
  };

  utterance.onerror = () => {
    options?.onEnd?.();
  };

  // Trigger speech synthesis after brief 150ms PTT keying delay
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 140);
}
