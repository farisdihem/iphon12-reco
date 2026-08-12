/**
 * Real WebAudio DSP Synthesizer & Analyser for Low-Latency Audio Streaming Simulation
 */

export class LowLatencyAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private isPlayingTestTone = false;
  private isMicActive = false;

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive', sampleRate: 48000 });
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public startTestTone(freq = 440, volume = 0.1): void {
    const ctx = this.initContext();
    if (this.isPlayingTestTone) this.stopTestTone();

    this.oscillator = ctx.createOscillator();
    this.gainNode = ctx.createGain();

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    this.gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    this.oscillator.connect(this.gainNode);
    if (this.analyser) {
      this.gainNode.connect(this.analyser);
      this.analyser.connect(ctx.destination);
    } else {
      this.gainNode.connect(ctx.destination);
    }

    this.oscillator.start();
    this.isPlayingTestTone = true;
  }

  public stopTestTone(): void {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        console.warn('Oscillator stop error', e);
      }
      this.oscillator = null;
    }
    this.isPlayingTestTone = false;
  }

  public toggleTestTone(freq = 440): boolean {
    if (this.isPlayingTestTone) {
      this.stopTestTone();
      return false;
    } else {
      this.startTestTone(freq);
      return true;
    }
  }

  public async enableMicrophoneLoopback(): Promise<boolean> {
    try {
      const ctx = this.initContext();
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micSource = ctx.createMediaStreamSource(this.micStream);
      
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.8, ctx.currentTime);

      if (this.analyser) {
        this.micSource.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        // Note: we don't connect to ctx.destination by default to avoid acoustic feedback echo unless requested
      }
      this.isMicActive = true;
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable, using synth fallback', err);
      this.startTestTone(320, 0.05); // low volume fallback tone
      this.isMicActive = true;
      return false;
    }
  }

  public disableMicrophoneLoopback(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    this.stopTestTone();
    this.isMicActive = false;
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      // fill with simulated active waveform
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.sin(Date.now() / 100 + i) * 100 + 120);
      }
    }
  }

  public isToneActive(): boolean {
    return this.isPlayingTestTone;
  }

  public isMicOn(): boolean {
    return this.isMicActive;
  }
}

export const audioEngineInstance = new LowLatencyAudioEngine();
