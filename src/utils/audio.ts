/**
 * Web Audio API synthesizer for Irani Chai & Osmania Biscuit Rush
 * Generates tactile sound effects with zero latency and an ambient Hyderabadi café music loop.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public bgmEnabled: boolean = true;
  private bgmGainNode: GainNode | null = null;
  private isBgmActive: boolean = false;
  private bgmTimer: number | null = null;
  private droneNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // ==========================================
  // SOUND EFFECTS
  // ==========================================

  // 1. Regular Osmania biscuit catch crunch sound
  playCatchBiscuit() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Biscuit bite tone: short crunchy snap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.11);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

    // Textured crumb noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  // 2. Golden Osmania biscuit catch: royal shimmering arpeggio & time bonus chime
  playGoldenBiscuit() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Sitar / Santoor harmonic pentatonic arpeggio (D5, F#5, A5, D6, F#6)
    const freqs = [587.33, 739.99, 880.0, 1174.66, 1479.98];

    freqs.forEach((f, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.05 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.38);
    });
  }

  // 3. Serving chai: brass bell ring + scalding steam hiss + warm liquid pour
  playChaiServed() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Resonant counter service bell chime
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(987.77, now); // B5 bell
    bellGain.gain.setValueAtTime(0.4, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(now);
    bellOsc.stop(now + 0.72);

    // Harmonic bell overtone
    const bellOvertone = ctx.createOscillator();
    const bellOverGain = ctx.createGain();
    bellOvertone.type = 'sine';
    bellOvertone.frequency.setValueAtTime(1975.53, now); // B6 octave
    bellOverGain.gain.setValueAtTime(0.2, now);
    bellOverGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    bellOvertone.connect(bellOverGain);
    bellOverGain.connect(ctx.destination);
    bellOvertone.start(now);
    bellOvertone.stop(now + 0.42);

    // Steaming tea hiss
    const bufferSize = Math.floor(ctx.sampleRate * 0.28);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2800, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.29);
  }

  // 4. Game over sound: Nostalgic Hyderabadi café closing melody & gong
  playGameOver() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Melodic descent: D5, A4, F#4, D4
    const notes = [587.33, 440.0, 369.99, 293.66];

    notes.forEach((f, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.18);

      gain.gain.setValueAtTime(0.35, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.7);
    });

    // Deep closing brass gong
    const gong = ctx.createOscillator();
    const gongGain = ctx.createGain();
    gong.type = 'sine';
    gong.frequency.setValueAtTime(146.83, now + 0.5); // D3
    gongGain.gain.setValueAtTime(0.4, now + 0.5);
    gongGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    gong.connect(gongGain);
    gongGain.connect(ctx.destination);
    gong.start(now + 0.5);
    gong.stop(now + 1.85);
  }

  // Tap pour squirt
  playPourTap() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(560 + Math.random() * 90, now);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Penalty sound
  playPenalty() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Combo fanfare
  playComboUp(combo: number) {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 440 + Math.min(combo * 45, 400);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  // Clock tick
  playTick() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // ==========================================
  // HYDERABADI IRANI CAFÉ BACKGROUND MUSIC
  // ==========================================

  // Starts the subtle ambient Hyderabadi café music loop
  startBgm() {
    if (!this.bgmEnabled || this.isBgmActive) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.isBgmActive = true;

    // Master BGM gain
    if (!this.bgmGainNode) {
      this.bgmGainNode = ctx.createGain();
      this.bgmGainNode.gain.setValueAtTime(0.12, ctx.currentTime); // subtle ambient level
      this.bgmGainNode.connect(ctx.destination);
    } else {
      this.bgmGainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    }

    // 1. Tanpura / Santoor Drone Layer (Warm root drone on D3 & A3)
    const droneFreqs = [146.83, 220.0, 293.66]; // D3, A3, D4
    droneFreqs.forEach((freq, idx) => {
      if (!ctx || !this.bgmGainNode) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (idx === 1 ? 0.4 : -0.3), ctx.currentTime); // slight detune shimmer

      gain.gain.setValueAtTime(0.035 / (idx + 1), ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.bgmGainNode);
      osc.start();
      this.droneNodes.push({ osc, gain });
    });

    // 2. Continuous Ambient Café Loop (Tabla rhythm + Santoor melodies)
    // 8-beat cycle at ~78 BPM (approx 0.77s per beat)
    const beatDuration = 0.76;
    let step = 0;

    // Pentatonic café melody notes in Raag Bhupali / Kalyan (D, E, F#, A, B, D)
    const melodyNotes = [
      293.66, 329.63, 369.99, 440.0, 493.88, 
      587.33, 659.25, 739.99, 880.0
    ];

    // Melodic phrase patterns
    const patterns = [
      [0, -1, 2, 3, -1, 4, 3, 2],
      [3, 5, 4, 3, 2, -1, 3, 0],
      [2, 3, 5, 7, 5, 3, 2, 0],
      [4, 3, 2, 0, -1, 2, 0, -1],
    ];
    let patternIdx = 0;

    const scheduleNextBeat = () => {
      if (!this.isBgmActive || !ctx || !this.bgmGainNode) return;

      const now = ctx.currentTime;
      const currentPattern = patterns[patternIdx];
      const noteIdx = currentPattern[step % 8];

      // Play soft acoustic Santoor pluck if note is active
      if (noteIdx >= 0 && noteIdx < melodyNotes.length) {
        const freq = melodyNotes[noteIdx];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + beatDuration * 1.4);

        osc.connect(gain);
        gain.connect(this.bgmGainNode);
        osc.start(now);
        osc.stop(now + beatDuration * 1.5);
      }

      // Play soft Tabla / Matka acoustic percussion pulse
      // Beat 0 & 4: resonant bass "Ghe" (low sine sweep)
      if (step % 4 === 0) {
        const tablaBass = ctx.createOscillator();
        const tablaGain = ctx.createGain();
        tablaBass.type = 'sine';
        tablaBass.frequency.setValueAtTime(110, now);
        tablaBass.frequency.exponentialRampToValueAtTime(65, now + 0.2);

        tablaGain.gain.setValueAtTime(0.05, now);
        tablaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        tablaBass.connect(tablaGain);
        tablaGain.connect(this.bgmGainNode);
        tablaBass.start(now);
        tablaBass.stop(now + 0.25);
      }

      // Beat 2 & 6: crisp gentle rim "Tin" (light high tap)
      if (step % 2 === 1) {
        const rimOsc = ctx.createOscillator();
        const rimGain = ctx.createGain();
        rimOsc.type = 'triangle';
        rimOsc.frequency.setValueAtTime(740, now);

        rimGain.gain.setValueAtTime(0.02, now);
        rimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        rimOsc.connect(rimGain);
        rimGain.connect(this.bgmGainNode);
        rimOsc.start(now);
        rimOsc.stop(now + 0.09);
      }

      step++;
      if (step % 8 === 0) {
        patternIdx = (patternIdx + 1) % patterns.length;
      }

      this.bgmTimer = window.setTimeout(scheduleNextBeat, beatDuration * 1000);
    };

    scheduleNextBeat();
  }

  // Stops background music loop
  stopBgm() {
    this.isBgmActive = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.droneNodes.forEach(({ osc, gain }) => {
      try {
        if (this.ctx) {
          gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
          setTimeout(() => osc.stop(), 350);
        } else {
          osc.stop();
        }
      } catch {
        // Ignore already stopped
      }
    });
    this.droneNodes = [];
  }

  // Adjust BGM volume
  setBgmVolume(volume: number) {
    if (this.bgmGainNode && this.ctx) {
      this.bgmGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public get isBgmPlaying(): boolean {
    return this.isBgmActive;
  }
}

export const sounds = new SoundEngine();
