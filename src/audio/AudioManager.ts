import { AUDIO_CONFIG } from '../config/AudioConfig';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Music Stem Gain Nodes for dynamic intensity
  private stemBaseGain: GainNode | null = null;
  private stemPercussionGain: GainNode | null = null;
  private stemChordGain: GainNode | null = null;
  private stemLeadGain: GainNode | null = null;

  private isSoundMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private isInitialized: boolean = false;

  // Rhythm Sequencer variables
  private isMusicPlaying: boolean = false;
  private tempoBpm = 118; // Classic vibrant Afrobeat tempo
  private currentStep = 0;
  private nextStepTime = 0;
  private scheduleTimer: number | null = null;
  private currentMultiplier = 1;

  constructor(initialSoundMuted = false, initialMusicMuted = false) {
    this.isSoundMuted = initialSoundMuted;
    this.isMusicMuted = initialMusicMuted;
  }

  public init(): void {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isSoundMuted ? 0 : 0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : 0.65, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Music Dynamic Stems
      this.stemBaseGain = this.ctx.createGain();
      this.stemBaseGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.stemBaseGain.connect(this.musicGain);

      this.stemPercussionGain = this.ctx.createGain();
      this.stemPercussionGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Active at 2x+
      this.stemPercussionGain.connect(this.musicGain);

      this.stemChordGain = this.ctx.createGain();
      this.stemChordGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Active at 5x+
      this.stemChordGain.connect(this.musicGain);

      this.stemLeadGain = this.ctx.createGain();
      this.stemLeadGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Active at 10x
      this.stemLeadGain.connect(this.musicGain);

      // Handle browser autoplay policy
      if (this.ctx.state === 'suspended') {
        const resume = () => {
          this.ctx?.resume();
          window.removeEventListener('pointerdown', resume);
          window.removeEventListener('keydown', resume);
        };
        window.addEventListener('pointerdown', resume, { once: true });
        window.addEventListener('keydown', resume, { once: true });
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('AudioContext initialization deferred:', err);
    }
  }

  // --- Volume Controls ---
  public setSoundMuted(muted: boolean): void {
    this.isSoundMuted = muted;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicMuted(muted: boolean): void {
    this.isMusicMuted = muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(muted ? 0 : 0.65, this.ctx.currentTime, 0.05);
    }
  }

  public toggleSound(): boolean {
    this.setSoundMuted(!this.isSoundMuted);
    return this.isSoundMuted;
  }

  public toggleMute(): boolean {
    return this.toggleSound();
  }

  public toggleMusic(): boolean {
    this.setMusicMuted(!this.isMusicMuted);
    return this.isMusicMuted;
  }

  public getSoundMuted(): boolean {
    return this.isSoundMuted;
  }

  public getMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  private ensureRunning(): boolean {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !!(this.ctx && this.sfxGain);
  }

  // --- Dynamic Music Stem System ---
  public startMusic(): void {
    if (!this.ensureRunning() || this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx!.currentTime + 0.05;
    this.scheduleLoop();
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  public setComboMultiplier(multiplier: number): void {
    if (!this.ctx) return;
    this.currentMultiplier = multiplier;

    const t = this.ctx.currentTime;
    const fadeDuration = 0.35; // Smooth crossfade

    // Stem 1: Base (Always present)
    if (this.stemBaseGain) {
      this.stemBaseGain.gain.setTargetAtTime(0.85, t, fadeDuration);
    }

    // Stem 2: Percussion Layer (Active at 2x - 3x)
    if (this.stemPercussionGain) {
      const target = multiplier >= 2 ? 0.75 : 0.0;
      this.stemPercussionGain.gain.setTargetAtTime(target, t, fadeDuration);
    }

    // Stem 3: Marimba / Organ Chords (Active at 5x)
    if (this.stemChordGain) {
      const target = multiplier >= 5 ? 0.7 : 0.0;
      this.stemChordGain.gain.setTargetAtTime(target, t, fadeDuration);
    }

    // Stem 4: High-Intensity Brass Motif (Active at 10x maximum combo)
    if (this.stemLeadGain) {
      const target = multiplier >= 10 ? 0.8 : 0.0;
      this.stemLeadGain.gain.setTargetAtTime(target, t, fadeDuration);
    }
  }

  private scheduleLoop = (): void => {
    if (!this.isMusicPlaying || !this.ctx) return;

    const secondsPer16th = 60 / this.tempoBpm / 4;
    const lookahead = 0.12;

    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      this.playStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += secondsPer16th;
      this.currentStep = (this.currentStep + 1) % 16;
    }

    this.scheduleTimer = window.setTimeout(this.scheduleLoop, 40);
  };

  private playStep(step: number, time: number): void {
    if (!this.ctx) return;

    // --- STEM 1: BASE GROOVE (Kick & Shaker) ---
    if (this.stemBaseGain) {
      // Afrobeat Kick drum on steps 0, 4, 8, 12 with syncopated step 14
      if (step === 0 || step === 4 || step === 8 || step === 12 || step === 14) {
        this.synthKick(time, this.stemBaseGain);
      }

      // Shaker / Shekere on all 16th steps with swing accents
      const accent = step % 4 === 2 ? 0.28 : 0.14;
      this.synthShaker(time, accent, this.stemBaseGain);
    }

    // --- STEM 2: PERCUSSION (Talking drum / Conga taps) ---
    if (this.stemPercussionGain && this.currentMultiplier >= 2) {
      // Syncopated Afrobeat conga pattern: steps 3, 6, 9, 11, 15
      if (step === 3 || step === 9) {
        this.synthConga(time, 280, 220, this.stemPercussionGain);
      } else if (step === 6 || step === 11 || step === 15) {
        this.synthConga(time, 360, 310, this.stemPercussionGain);
      }
    }

    // --- STEM 3: CHORD LAYER (Pentatonic Marimba/Organ Stabs) ---
    if (this.stemChordGain && this.currentMultiplier >= 5) {
      // Upbeat syncopated stabs on steps 2, 7, 10
      const chordNotes = [
        [220, 261.63, 329.63], // A minor
        [246.94, 293.66, 369.99], // B minor
        [261.63, 329.63, 392.00]  // C major
      ];

      if (step === 2) {
        this.synthChord(time, chordNotes[0], this.stemChordGain);
      } else if (step === 7) {
        this.synthChord(time, chordNotes[1], this.stemChordGain);
      } else if (step === 10) {
        this.synthChord(time, chordNotes[2], this.stemChordGain);
      }
    }

    // --- STEM 4: HIGH-INTENSITY LEAD (Maximum 10x Combo) ---
    if (this.stemLeadGain && this.currentMultiplier >= 10) {
      const leadNotes = [440, 523.25, 587.33, 659.25, 783.99]; // Pentatonic
      if (step === 0 || step === 3 || step === 6 || step === 8 || step === 12 || step === 14) {
        const note = leadNotes[(step * 2) % leadNotes.length];
        this.synthLeadNote(time, note, this.stemLeadGain);
      }
    }
  }

  private synthKick(time: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.09);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  private synthShaker(time: number, vol: number, dest: AudioNode): void {
    if (!this.ctx) return;
    // Fast highpass noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.04);
  }

  private synthConga(time: number, startFreq: number, endFreq: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.08);

    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.09);
  }

  private synthChord(time: number, freqs: number[], dest: AudioNode): void {
    if (!this.ctx) return;
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.16);
    });
  }

  private synthLeadNote(time: number, freq: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  // --- SOUND EFFECTS (SFX) ---
  public playLaneChange(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(AUDIO_CONFIG.FREQUENCIES.LANE_SWEEP_START, t);
    osc.frequency.exponentialRampToValueAtTime(AUDIO_CONFIG.FREQUENCIES.LANE_SWEEP_END, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playKoboPickup(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    [AUDIO_CONFIG.FREQUENCIES.KOBO_CHIME_1, AUDIO_CONFIG.FREQUENCIES.KOBO_CHIME_2].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);

      gain.gain.setValueAtTime(0.25, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.15);
    });
  }

  public playFuelPickup(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [
      AUDIO_CONFIG.FREQUENCIES.FUEL_CHIME_1,
      AUDIO_CONFIG.FREQUENCIES.FUEL_CHIME_2,
      AUDIO_CONFIG.FREQUENCIES.FUEL_CHIME_3
    ];

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.3, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.05 + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.14);
    });
  }

  public playCloseShave(multiplier: number): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const baseFreq = AUDIO_CONFIG.FREQUENCIES.CLOSE_SHAVE_BASE * (1 + (multiplier - 1) * 0.12);
    const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.22);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playCrash(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.3);
  }

  public playHorn(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(340, t);
    osc2.frequency.setValueAtTime(420, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.18);
    osc2.stop(t + 0.18);
  }

  public playButton(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(720, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playAchievementUnlock(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.25, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.28);
    });
  }

  public playBrakeSound(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Filtered noise skid chirp
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(650, t + 0.22);
    filter.Q.setValueAtTime(4.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.22);
  }

  public playLevelUp(): void {
    if (!this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Triumphant Nigerian afro-brass fanfare: F4 -> A4 -> C5 -> F5
    const fanfare = [349.23, 440.00, 523.25, 698.46];

    fanfare.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.3, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.005, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.35);
    });
  }
}
