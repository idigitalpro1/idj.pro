/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AudioTrackInfo, ElementType, IDproiMixdownConfig, IDproiPreset } from '../types';

export const TRACK_COLORS = [
  '#ff25f6', // Pink / Magenta
  '#2af6de', // Cyan / Aqua
  '#ffdd28', // Yellow / Amber
  '#3dffab', // Mint / Green
  '#9900ff', // Violet / Purple
];

interface TrackAudioNodes {
  source: AudioBufferSourceNode | null;
  panner: StereoPannerNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  elementFilter: BiquadFilterNode;
  gain: GainNode;
  analyser: AnalyserNode;
}

export class MultiTrackEngine extends EventTarget {
  audioContext: AudioContext;
  private trackNodes: Map<string, TrackAudioNodes> = new Map();
  private masterGain: GainNode;
  private masterAnalyser: AnalyserNode;
  
  // iDproi Mixdown Mastering Chain Nodes
  private idproiInputGain: GainNode;
  private idproiLowPunch: BiquadFilterNode;
  private idproiHighAir: BiquadFilterNode;
  private idproiSaturator: WaveShaperNode;
  private idproiCompressor: DynamicsCompressorNode;
  private idproiLimiter: DynamicsCompressorNode;
  private idproiOutputGain: GainNode;
  private dryMasterGain: GainNode;
  private wetMasterGain: GainNode;

  isPlaying = false;
  currentTime = 0;
  totalDuration = 0;
  private startTime = 0;
  private pauseOffset = 0;
  private animationFrameId: number | null = null;
  public isLooping = true;

  idproiConfig: IDproiMixdownConfig = {
    enabled: true,
    preset: 'signature',
    intensity: 85,
    warmthDrive: 3.5,
    stereoWidth: 120,
    punchExciter: 80,
    limiterCeiling: -0.3,
  };

  constructor(existingContext?: AudioContext) {
    super();
    this.audioContext = existingContext || new (window.AudioContext || (window as any).webkitAudioContext)();

    // Master Bus
    this.masterGain = this.audioContext.createGain();
    this.masterAnalyser = this.audioContext.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // Dry / Wet Routing for iDproi Mixdown
    this.dryMasterGain = this.audioContext.createGain();
    this.wetMasterGain = this.audioContext.createGain();
    this.idproiInputGain = this.audioContext.createGain();

    // iDproi Mastering Nodes
    this.idproiLowPunch = this.audioContext.createBiquadFilter();
    this.idproiLowPunch.type = 'peaking';
    this.idproiLowPunch.frequency.value = 75;
    this.idproiLowPunch.Q.value = 1.2;
    this.idproiLowPunch.gain.value = 3.5;

    this.idproiHighAir = this.audioContext.createBiquadFilter();
    this.idproiHighAir.type = 'highshelf';
    this.idproiHighAir.frequency.value = 11500;
    this.idproiHighAir.gain.value = 4.0;

    this.idproiSaturator = this.audioContext.createWaveShaper();
    this.idproiSaturator.curve = this.makeDistortionCurve(15);
    this.idproiSaturator.oversample = '4x';

    this.idproiCompressor = this.audioContext.createDynamicsCompressor();
    this.idproiCompressor.threshold.value = -16;
    this.idproiCompressor.knee.value = 6;
    this.idproiCompressor.ratio.value = 3.2;
    this.idproiCompressor.attack.value = 0.015;
    this.idproiCompressor.release.value = 0.14;

    this.idproiLimiter = this.audioContext.createDynamicsCompressor();
    this.idproiLimiter.threshold.value = -0.5;
    this.idproiLimiter.knee.value = 0;
    this.idproiLimiter.ratio.value = 20;
    this.idproiLimiter.attack.value = 0.001;
    this.idproiLimiter.release.value = 0.05;

    this.idproiOutputGain = this.audioContext.createGain();
    this.idproiOutputGain.gain.value = 1.15;

    // Connect iDproi DSP chain:
    // idproiInput -> LowPunch -> HighAir -> Saturator -> Compressor -> Limiter -> idproiOutput -> wetMasterGain
    this.idproiInputGain.connect(this.idproiLowPunch);
    this.idproiLowPunch.connect(this.idproiHighAir);
    this.idproiHighAir.connect(this.idproiSaturator);
    this.idproiSaturator.connect(this.idproiCompressor);
    this.idproiCompressor.connect(this.idproiLimiter);
    this.idproiLimiter.connect(this.idproiOutputGain);
    this.idproiOutputGain.connect(this.wetMasterGain);

    // Master sum
    this.dryMasterGain.connect(this.masterGain);
    this.wetMasterGain.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.audioContext.destination);

    this.applyIDproiConfig(this.idproiConfig);
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 10;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      // Soft saturation curve with musical harmonic warmth
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public applyIDproiPreset(preset: IDproiPreset) {
    this.idproiConfig.preset = preset;
    const intensityNorm = this.idproiConfig.intensity / 100;

    switch (preset) {
      case 'signature':
        this.idproiLowPunch.frequency.value = 75;
        this.idproiLowPunch.gain.value = 3.5 * intensityNorm;
        this.idproiHighAir.frequency.value = 11500;
        this.idproiHighAir.gain.value = 4.2 * intensityNorm;
        this.idproiCompressor.threshold.value = -16;
        this.idproiCompressor.ratio.value = 3.2;
        this.idproiOutputGain.gain.value = 1.15;
        break;
      case 'club_punch':
        this.idproiLowPunch.frequency.value = 62;
        this.idproiLowPunch.gain.value = 6.5 * intensityNorm;
        this.idproiHighAir.frequency.value = 10000;
        this.idproiHighAir.gain.value = 3.0 * intensityNorm;
        this.idproiCompressor.threshold.value = -20;
        this.idproiCompressor.ratio.value = 4.5;
        this.idproiOutputGain.gain.value = 1.25;
        break;
      case 'radio_clarity':
        this.idproiLowPunch.frequency.value = 100;
        this.idproiLowPunch.gain.value = 1.8 * intensityNorm;
        this.idproiHighAir.frequency.value = 8500;
        this.idproiHighAir.gain.value = 5.5 * intensityNorm;
        this.idproiCompressor.threshold.value = -18;
        this.idproiCompressor.ratio.value = 2.8;
        this.idproiOutputGain.gain.value = 1.1;
        break;
      case 'tape_warmth':
        this.idproiLowPunch.frequency.value = 90;
        this.idproiLowPunch.gain.value = 4.0 * intensityNorm;
        this.idproiHighAir.frequency.value = 14000;
        this.idproiHighAir.gain.value = -1.5 * intensityNorm;
        this.idproiCompressor.threshold.value = -14;
        this.idproiCompressor.ratio.value = 2.2;
        this.idproiSaturator.curve = this.makeDistortionCurve(25);
        this.idproiOutputGain.gain.value = 1.05;
        break;
      case 'spatial_air':
        this.idproiLowPunch.frequency.value = 80;
        this.idproiLowPunch.gain.value = 2.0 * intensityNorm;
        this.idproiHighAir.frequency.value = 12500;
        this.idproiHighAir.gain.value = 6.8 * intensityNorm;
        this.idproiCompressor.threshold.value = -15;
        this.idproiCompressor.ratio.value = 2.5;
        this.idproiOutputGain.gain.value = 1.18;
        break;
      case 'bass_maximizer':
        this.idproiLowPunch.frequency.value = 55;
        this.idproiLowPunch.gain.value = 8.0 * intensityNorm;
        this.idproiHighAir.frequency.value = 10000;
        this.idproiHighAir.gain.value = 2.5 * intensityNorm;
        this.idproiCompressor.threshold.value = -22;
        this.idproiCompressor.ratio.value = 5.0;
        this.idproiOutputGain.gain.value = 1.3;
        break;
    }

    this.applyIDproiConfig(this.idproiConfig);
    this.dispatchEvent(new CustomEvent('idproi-updated', { detail: this.idproiConfig }));
  }

  public applyIDproiConfig(config: IDproiMixdownConfig) {
    this.idproiConfig = { ...config };
    const wetAmount = config.enabled ? (config.intensity / 100) : 0;
    const dryAmount = 1.0 - wetAmount * 0.7; // Keep consistent headroom

    const now = this.audioContext.currentTime;
    this.dryMasterGain.gain.setTargetAtTime(dryAmount, now, 0.03);
    this.wetMasterGain.gain.setTargetAtTime(wetAmount, now, 0.03);
  }

  public setMasterVolume(val: number) {
    const now = this.audioContext.currentTime;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(val, 2.0)), now, 0.03);
  }

  public registerTrack(track: AudioTrackInfo) {
    if (this.trackNodes.has(track.id)) {
      this.updateTrackParameters(track);
      return;
    }

    const panner = this.audioContext.createStereoPanner();
    panner.pan.value = track.pan;

    // 3-Band Parametric EQ
    const eqLow = this.audioContext.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 250;
    eqLow.gain.value = track.lowGain;

    const eqMid = this.audioContext.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1200;
    eqMid.Q.value = 1.0;
    eqMid.gain.value = track.midGain;

    const eqHigh = this.audioContext.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 4000;
    eqHigh.gain.value = track.highGain;

    // Element Shaping Filter
    const elementFilter = this.audioContext.createBiquadFilter();
    this.configureElementFilter(elementFilter, track.elementType, track.filterCutoff);

    const gain = this.audioContext.createGain();
    const isMuted = track.muted;
    gain.gain.value = isMuted ? 0 : track.volume;

    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 64;

    // Node graph: Panner -> EQLow -> EQMid -> EQHigh -> ElementFilter -> Gain -> Analyser -> (Dry & iDproi)
    panner.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(elementFilter);
    elementFilter.connect(gain);
    gain.connect(analyser);

    // Route to Dry Master & iDproi Processing Bus
    analyser.connect(this.dryMasterGain);
    analyser.connect(this.idproiInputGain);

    this.trackNodes.set(track.id, {
      source: null,
      panner,
      eqLow,
      eqMid,
      eqHigh,
      elementFilter,
      gain,
      analyser,
    });
  }

  public updateTrackParameters(track: AudioTrackInfo) {
    const nodes = this.trackNodes.get(track.id);
    if (!nodes) return;

    const now = this.audioContext.currentTime;
    nodes.panner.pan.setTargetAtTime(track.pan, now, 0.02);
    nodes.eqLow.gain.setTargetAtTime(track.lowGain, now, 0.02);
    nodes.eqMid.gain.setTargetAtTime(track.midGain, now, 0.02);
    nodes.eqHigh.gain.setTargetAtTime(track.highGain, now, 0.02);

    this.configureElementFilter(nodes.elementFilter, track.elementType, track.filterCutoff);

    const targetVolume = track.muted ? 0 : track.volume;
    nodes.gain.gain.setTargetAtTime(targetVolume, now, 0.02);
  }

  private configureElementFilter(node: BiquadFilterNode, elementType: ElementType, customCutoff: number) {
    switch (elementType) {
      case 'drums':
        node.type = 'lowpass';
        node.frequency.value = customCutoff || 8000;
        node.Q.value = 1.0;
        break;
      case 'bass':
        node.type = 'lowpass';
        node.frequency.value = customCutoff || 320;
        node.Q.value = 1.4;
        break;
      case 'melody':
        node.type = 'bandpass';
        node.frequency.value = customCutoff || 2200;
        node.Q.value = 0.8;
        break;
      case 'vocal':
        node.type = 'bandpass';
        node.frequency.value = customCutoff || 1800;
        node.Q.value = 0.6;
        break;
      case 'ambient':
        node.type = 'highpass';
        node.frequency.value = customCutoff || 800;
        node.Q.value = 0.7;
        break;
      case 'full':
      default:
        node.type = 'allpass';
        node.frequency.value = 1000;
        break;
    }
  }

  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  public playAll(tracks: AudioTrackInfo[], offsetSeconds = 0) {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopAllSources();

    let maxDuration = 0;
    tracks.forEach((t) => {
      if (t.audioBuffer && t.audioBuffer.duration > maxDuration) {
        maxDuration = t.audioBuffer.duration;
      }
    });
    this.totalDuration = maxDuration;

    if (maxDuration === 0) return;

    this.startTime = this.audioContext.currentTime - offsetSeconds;
    this.pauseOffset = offsetSeconds;

    tracks.forEach((track) => {
      if (!track.audioBuffer) return;
      this.registerTrack(track);
      const nodes = this.trackNodes.get(track.id);
      if (!nodes) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = track.audioBuffer;
      source.playbackRate.value = track.playbackRate || 1.0;
      source.loop = this.isLooping;
      source.connect(nodes.panner);

      // Start with offset modulo duration
      const trackOffset = offsetSeconds % track.audioBuffer.duration;
      source.start(0, trackOffset);
      nodes.source = source;
    });

    this.isPlaying = true;
    this.startProgressTracker();
    this.dispatchEvent(new CustomEvent('playback-state', { detail: { isPlaying: true } }));
  }

  public pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = (this.audioContext.currentTime - this.startTime) % (this.totalDuration || 1);
    this.stopAllSources();
    this.isPlaying = false;
    this.stopProgressTracker();
    this.dispatchEvent(new CustomEvent('playback-state', { detail: { isPlaying: false } }));
  }

  public stop() {
    this.pauseOffset = 0;
    this.currentTime = 0;
    this.stopAllSources();
    this.isPlaying = false;
    this.stopProgressTracker();
    this.dispatchEvent(new CustomEvent('playback-state', { detail: { isPlaying: false } }));
    this.dispatchEvent(new CustomEvent('time-updated', { detail: { time: 0 } }));
  }

  public seek(tracks: AudioTrackInfo[], seconds: number) {
    const target = Math.max(0, Math.min(seconds, this.totalDuration));
    this.currentTime = target;
    this.pauseOffset = target;
    if (this.isPlaying) {
      this.playAll(tracks, target);
    } else {
      this.dispatchEvent(new CustomEvent('time-updated', { detail: { time: target } }));
    }
  }

  private stopAllSources() {
    this.trackNodes.forEach((nodes) => {
      if (nodes.source) {
        try {
          nodes.source.stop();
          nodes.source.disconnect();
        } catch {
          // ignore already stopped sources
        }
        nodes.source = null;
      }
    });
  }

  private startProgressTracker() {
    this.stopProgressTracker();
    const updateLoop = () => {
      if (this.isPlaying && this.totalDuration > 0) {
        const elapsed = (this.audioContext.currentTime - this.startTime) % this.totalDuration;
        this.currentTime = elapsed;
        this.dispatchEvent(new CustomEvent('time-updated', { detail: { time: elapsed } }));
      }
      this.animationFrameId = requestAnimationFrame(updateLoop);
    };
    this.animationFrameId = requestAnimationFrame(updateLoop);
  }

  private stopProgressTracker() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getTrackAudioLevel(trackId: string): number {
    const nodes = this.trackNodes.get(trackId);
    if (!nodes || !this.isPlaying) return 0;
    const data = new Uint8Array(nodes.analyser.frequencyBinCount);
    nodes.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255);
  }

  public getMasterFrequencyData(dataArray: Uint8Array) {
    this.masterAnalyser.getByteFrequencyData(dataArray);
  }

  /**
   * Generates 5 synthesized studio stems (Drums, Bass, Leads, Chords, Vocal Synth)
   * for instant demo testing and mixing without requiring file uploads.
   */
  public generateDemoStems(): Promise<AudioBuffer[]> {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 12.0; // 12 seconds seamless loop (120 BPM, 6 bars)
    const nSamples = Math.floor(sampleRate * duration);
    const bpm = 120;
    const secondsPerBeat = 60 / bpm;

    const createEmptyBuffer = () => this.audioContext.createBuffer(2, nSamples, sampleRate);

    // 1. Drum Stem (Kick, Snare, Hihats)
    const drumBuffer = createEmptyBuffer();
    const drumL = drumBuffer.getChannelData(0);
    const drumR = drumBuffer.getChannelData(1);
    for (let i = 0; i < nSamples; i++) {
      const t = i / sampleRate;
      const beat = (t / secondsPerBeat) % 4;
      let sample = 0;

      // Kick on 0, 1, 2, 3
      const kickT = (t / secondsPerBeat) % 1;
      if (kickT < 0.18) {
        const freq = 130 * Math.exp(-kickT * 32);
        sample += Math.sin(2 * Math.PI * freq * kickT) * Math.exp(-kickT * 18) * 0.85;
      }

      // Snare on 1 & 3
      const snareT = (t / secondsPerBeat + 0.5) % 1;
      if ((beat >= 1 && beat < 2) || (beat >= 3 && beat < 4)) {
        const localT = (beat % 2 === 1) ? (beat - 1) * secondsPerBeat : (beat - 3) * secondsPerBeat;
        if (localT >= 0 && localT < 0.22) {
          const noise = (Math.random() * 2 - 1) * Math.exp(-localT * 22) * 0.5;
          const tone = Math.sin(2 * Math.PI * 180 * localT) * Math.exp(-localT * 28) * 0.4;
          sample += noise + tone;
        }
      }

      // Hi-Hats every 0.25 beats
      const hatT = (t / (secondsPerBeat * 0.25)) % 1;
      if (hatT < 0.05) {
        sample += (Math.random() * 2 - 1) * Math.exp(-hatT * 40) * 0.25;
      }

      drumL[i] = sample;
      drumR[i] = sample;
    }

    // 2. Sub-Bass Stem (808 / Rolling Synth Bass in C Minor)
    const bassBuffer = createEmptyBuffer();
    const bassL = bassBuffer.getChannelData(0);
    const bassR = bassBuffer.getChannelData(1);
    const notes = [65.41, 65.41, 77.78, 58.27]; // C2, C2, Eb2, Bb1
    for (let i = 0; i < nSamples; i++) {
      const t = i / sampleRate;
      const bar = Math.floor((t / secondsPerBeat) / 4) % 4;
      const noteFreq = notes[bar];
      const noteT = (t / secondsPerBeat) % 1;
      const env = Math.exp(-noteT * 2.2);
      const fundamental = Math.sin(2 * Math.PI * noteFreq * t);
      const harmonic = Math.sin(2 * Math.PI * noteFreq * 2 * t) * 0.3;
      const val = (fundamental + harmonic) * env * 0.7;
      bassL[i] = val;
      bassR[i] = val;
    }

    // 3. Synth Chords (Lush Pad / Electric Keys)
    const chordBuffer = createEmptyBuffer();
    const chordL = chordBuffer.getChannelData(0);
    const chordR = chordBuffer.getChannelData(1);
    const chordPitches = [
      [261.63, 311.13, 392.00, 466.16], // Cm7
      [233.08, 293.66, 349.23, 440.00], // Bb
      [207.65, 261.63, 311.13, 392.00], // Abmaj7
      [196.00, 246.94, 293.66, 392.00], // G7
    ];
    for (let i = 0; i < nSamples; i++) {
      const t = i / sampleRate;
      const bar = Math.floor((t / (secondsPerBeat * 4))) % 4;
      const chord = chordPitches[bar];
      let left = 0;
      let right = 0;
      const lfo = (Math.sin(2 * Math.PI * 1.5 * t) + 1) * 0.5;

      chord.forEach((freq, idx) => {
        const sawL = ((t * freq * 1.002) % 1) * 2 - 1;
        const sawR = ((t * freq * 0.998) % 1) * 2 - 1;
        left += sawL * (0.08 + idx * 0.01);
        right += sawR * (0.08 + idx * 0.01);
      });
      chordL[i] = left * (0.6 + lfo * 0.3);
      chordR[i] = right * (0.6 + (1 - lfo) * 0.3);
    }

    // 4. Arpeggiator / Pluck Melody
    const arpBuffer = createEmptyBuffer();
    const arpL = arpBuffer.getChannelData(0);
    const arpR = arpBuffer.getChannelData(1);
    const arpScale = [523.25, 622.25, 783.99, 932.33, 1046.50, 783.99, 622.25, 523.25];
    for (let i = 0; i < nSamples; i++) {
      const t = i / sampleRate;
      const step = Math.floor(t / (secondsPerBeat * 0.25)) % arpScale.length;
      const arpFreq = arpScale[step];
      const stepT = (t / (secondsPerBeat * 0.25)) % 1;
      const env = Math.exp(-stepT * 12);
      const val = Math.sin(2 * Math.PI * arpFreq * t) * env * 0.4;
      arpL[i] = val * (step % 2 === 0 ? 0.9 : 0.3);
      arpR[i] = val * (step % 2 === 1 ? 0.9 : 0.3);
    }

    // 5. Ambient Vocal Shimmer / FX Sweep
    const fxBuffer = createEmptyBuffer();
    const fxL = fxBuffer.getChannelData(0);
    const fxR = fxBuffer.getChannelData(1);
    for (let i = 0; i < nSamples; i++) {
      const t = i / sampleRate;
      const sweep = Math.sin(2 * Math.PI * 0.08 * t) * 400 + 1200;
      const formant1 = Math.sin(2 * Math.PI * sweep * t) * 0.2;
      const formant2 = Math.sin(2 * Math.PI * (sweep * 1.5) * t) * 0.15;
      const breath = (Math.random() * 2 - 1) * 0.05;
      const shimmer = (formant1 + formant2 + breath) * (0.4 + 0.4 * Math.sin(2 * Math.PI * 0.25 * t));
      fxL[i] = shimmer * Math.cos(t * 0.5);
      fxR[i] = shimmer * Math.sin(t * 0.5);
    }

    return Promise.resolve([drumBuffer, bassBuffer, chordBuffer, arpBuffer, fxBuffer]);
  }

  /**
   * Renders the current multi-track mix + iDproi mastering chain into an OfflineAudioContext
   * and creates a high-fidelity WAV file for download.
   */
  public async exportMixdownWav(tracks: AudioTrackInfo[]): Promise<Blob> {
    const activeTracks = tracks.filter((t) => t.audioBuffer && (!t.muted || t.solo));
    if (activeTracks.length === 0) {
      throw new Error('No active audio tracks available to export');
    }

    let maxDuration = 0;
    activeTracks.forEach((t) => {
      if (t.audioBuffer && t.audioBuffer.duration > maxDuration) {
        maxDuration = t.audioBuffer.duration;
      }
    });

    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * maxDuration), sampleRate);

    // Build Master bus on offline context
    const masterGain = offlineCtx.createGain();
    const dryGain = offlineCtx.createGain();
    const wetGain = offlineCtx.createGain();

    const wetAmount = this.idproiConfig.enabled ? this.idproiConfig.intensity / 100 : 0;
    dryGain.gain.value = 1.0 - wetAmount * 0.7;
    wetGain.gain.value = wetAmount;

    // iDproi mastering chain in offline context
    const lowPunch = offlineCtx.createBiquadFilter();
    lowPunch.type = 'peaking';
    lowPunch.frequency.value = this.idproiLowPunch.frequency.value;
    lowPunch.gain.value = this.idproiLowPunch.gain.value;

    const highAir = offlineCtx.createBiquadFilter();
    highAir.type = 'highshelf';
    highAir.frequency.value = this.idproiHighAir.frequency.value;
    highAir.gain.value = this.idproiHighAir.gain.value;

    const saturator = offlineCtx.createWaveShaper();
    saturator.curve = this.idproiSaturator.curve;

    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = this.idproiCompressor.threshold.value;
    compressor.ratio.value = this.idproiCompressor.ratio.value;

    const limiter = offlineCtx.createDynamicsCompressor();
    limiter.threshold.value = -0.3;
    limiter.ratio.value = 20;

    const outputGain = offlineCtx.createGain();
    outputGain.gain.value = this.idproiOutputGain.gain.value;

    lowPunch.connect(highAir);
    highAir.connect(saturator);
    saturator.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(outputGain);
    outputGain.connect(wetGain);

    dryGain.connect(masterGain);
    wetGain.connect(masterGain);
    masterGain.connect(offlineCtx.destination);

    // Wire each track
    activeTracks.forEach((track) => {
      if (!track.audioBuffer) return;
      const source = offlineCtx.createBufferSource();
      source.buffer = track.audioBuffer;
      source.playbackRate.value = track.playbackRate || 1.0;

      const panner = offlineCtx.createStereoPanner();
      panner.pan.value = track.pan;

      const eqL = offlineCtx.createBiquadFilter();
      eqL.type = 'lowshelf';
      eqL.frequency.value = 250;
      eqL.gain.value = track.lowGain;

      const eqM = offlineCtx.createBiquadFilter();
      eqM.type = 'peaking';
      eqM.frequency.value = 1200;
      eqM.gain.value = track.midGain;

      const eqH = offlineCtx.createBiquadFilter();
      eqH.type = 'highshelf';
      eqH.frequency.value = 4000;
      eqH.gain.value = track.highGain;

      const gain = offlineCtx.createGain();
      gain.gain.value = track.volume;

      source.connect(panner);
      panner.connect(eqL);
      eqL.connect(eqM);
      eqM.connect(eqH);
      eqH.connect(gain);

      gain.connect(dryGain);
      gain.connect(lowPunch);

      source.start(0);
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWavBlob(renderedBuffer);
  }

  private audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // FMT sub-chunk
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // subchunk1size (16 for PCM)
    setUint16(1); // 1 = PCM
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample

    // Data sub-chunk
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }
}
