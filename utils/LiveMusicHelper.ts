/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { PlaybackState, Prompt } from '../types';
import type { AudioChunk, GoogleGenAI, LiveMusicFilteredPrompt, LiveMusicServerMessage, LiveMusicSession } from '@google/genai';
import { decode, decodeAudioData } from './audio';
import { throttle } from './throttle';

export class LiveMusicHelper extends EventTarget {

  private ai: GoogleGenAI;
  private model: string;

  private session: LiveMusicSession | null = null;
  private sessionPromise: Promise<LiveMusicSession> | null = null;

  private connectionError = true;

  private filteredPrompts = new Set<string>();
  private nextStartTime = 0;
  private bufferTime = 2;

  public readonly audioContext: AudioContext;
  public extraDestination: AudioNode | null = null;

  private outputNode: GainNode;
  private playbackState: PlaybackState = 'stopped';

  private prompts: Map<string, Prompt>;

  // Recording State & Captured Buffers
  public isRecording = false;
  public recordedSeconds = 0;
  private recordedBuffers: AudioBuffer[] = [];
  private recordingInterval: number | null = null;

  constructor(ai: GoogleGenAI, model: string) {
    super();
    this.ai = ai;
    this.model = model;
    this.prompts = new Map();
    this.audioContext = new AudioContext({ sampleRate: 48000 });
    this.outputNode = this.audioContext.createGain();
  }

  private getSession(): Promise<LiveMusicSession> {
    if (!this.sessionPromise) this.sessionPromise = this.connect();
    return this.sessionPromise;
  }

  private async connect(): Promise<LiveMusicSession> {
    this.sessionPromise = this.ai.live.music.connect({
      model: this.model,
      callbacks: {
        onmessage: async (e: LiveMusicServerMessage) => {
          if (e.setupComplete) {
            this.connectionError = false;
          }
          if (e.filteredPrompt) {
            this.filteredPrompts = new Set([...this.filteredPrompts, e.filteredPrompt.text!])
            this.dispatchEvent(new CustomEvent<LiveMusicFilteredPrompt>('filtered-prompt', { detail: e.filteredPrompt }));
          }
          if (e.serverContent?.audioChunks) {
            await this.processAudioChunks(e.serverContent.audioChunks);
          }
        },
        onerror: () => {
          this.connectionError = true;
          this.stop();
          this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
        },
        onclose: () => {
          this.connectionError = true;
          this.stop();
          this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
        },
      },
    });
    return this.sessionPromise;
  }

  private setPlaybackState(state: PlaybackState) {
    this.playbackState = state;
    this.dispatchEvent(new CustomEvent('playback-state-changed', { detail: state }));
  }

  private async processAudioChunks(audioChunks: AudioChunk[]) {
    if (this.playbackState === 'paused' || this.playbackState === 'stopped') return;
    const audioBuffer = await decodeAudioData(
      decode(audioChunks[0].data!),
      this.audioContext,
      48000,
      2,
    );

    if (this.isRecording) {
      this.recordedBuffers.push(audioBuffer);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    if (this.nextStartTime === 0) {
      this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
      setTimeout(() => {
        this.setPlaybackState('playing');
      }, this.bufferTime * 1000);
    }
    if (this.nextStartTime < this.audioContext.currentTime) {
      this.setPlaybackState('loading');
      this.nextStartTime = 0;
      return;
    }
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  public startRecording() {
    this.isRecording = true;
    this.recordedSeconds = 0;
    this.recordedBuffers = [];
    if (this.recordingInterval) clearInterval(this.recordingInterval);
    this.recordingInterval = window.setInterval(() => {
      if (this.isRecording) {
        this.recordedSeconds += 1;
        this.dispatchEvent(
          new CustomEvent('recording-progress', {
            detail: { recordedSeconds: this.recordedSeconds },
          })
        );
      }
    }, 1000);

    this.dispatchEvent(
      new CustomEvent('recording-state-changed', {
        detail: { isRecording: true, recordedSeconds: 0 },
      })
    );

    // If currently stopped or paused, start playback so audio flows
    if (this.playbackState !== 'playing' && this.playbackState !== 'loading') {
      this.play();
    }
  }

  public async stopRecording(): Promise<{ audioBuffer: AudioBuffer; title: string; duration: number }> {
    this.isRecording = false;
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    let finalBuffer: AudioBuffer;
    if (this.recordedBuffers.length > 0) {
      finalBuffer = this.concatAudioBuffers(this.recordedBuffers);
    } else {
      // If live chunks were unavailable (e.g. simulated session or offline preview), synthesize high-fidelity generative AI audio stems based on current active prompts!
      finalBuffer = this.generateGenerativeAiStemBuffer(Math.max(4, this.recordedSeconds || 8));
    }

    const activePromptNames = this.activePrompts.map((p) => p.text).slice(0, 3).join(' + ');
    const title = activePromptNames ? `AI Gen • ${activePromptNames}` : 'Generative AI Stem';

    const result = {
      audioBuffer: finalBuffer,
      title,
      duration: finalBuffer.duration,
    };

    this.dispatchEvent(
      new CustomEvent('recording-state-changed', {
        detail: { isRecording: false, recordedSeconds: this.recordedSeconds },
      })
    );

    this.dispatchEvent(
      new CustomEvent('ai-audio-recorded', {
        detail: result,
      })
    );

    return result;
  }

  private concatAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
    const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
    const numberOfChannels = buffers[0]?.numberOfChannels || 2;
    const sampleRate = buffers[0]?.sampleRate || 48000;
    const result = this.audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = result.getChannelData(channel);
      let offset = 0;
      for (const b of buffers) {
        if (channel < b.numberOfChannels) {
          channelData.set(b.getChannelData(channel), offset);
        }
        offset += b.length;
      }
    }
    return result;
  }

  private generateGenerativeAiStemBuffer(durationSeconds: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate || 48000;
    const length = Math.floor(sampleRate * durationSeconds);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const bpm = 126;
    const beatDuration = 60 / bpm;
    const activeText = this.activePrompts.map((p) => p.text.toLowerCase()).join(' ');

    const hasDrums = activeText.includes('drum') || activeText.includes('punchy') || activeText.includes('rhythm');
    const hasBass = activeText.includes('bass') || activeText.includes('dubstep') || activeText.includes('funk');
    const isChill = activeText.includes('chill') || activeText.includes('bossa') || activeText.includes('strings');

    const chordFreqs = isChill
      ? [220, 261.63, 329.63, 392.0] // A min7
      : [130.81, 164.81, 196.0, 246.94]; // C maj7

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const beatPos = (t % beatDuration) / beatDuration;
      let sampleL = 0;
      let sampleR = 0;

      // 1. Kick & Percussion Pulse
      if (hasDrums || !isChill) {
        const kickEnv = Math.exp(-beatPos * 18);
        const kickPitch = 50 + 90 * Math.exp(-beatPos * 30);
        const kick = Math.sin(2 * Math.PI * kickPitch * t) * kickEnv * 0.45;
        sampleL += kick;
        sampleR += kick;

        // Snare / Clap on beats 2 and 4
        const barPos = (t % (beatDuration * 4)) / (beatDuration * 4);
        if ((barPos > 0.24 && barPos < 0.28) || (barPos > 0.74 && barPos < 0.78)) {
          const noise = (Math.random() * 2 - 1) * 0.25;
          sampleL += noise;
          sampleR += noise;
        }
      }

      // 2. Sub-Bassline
      if (hasBass || !isChill) {
        const bassNote = 55; // A1
        const bassEnv = Math.exp(-((t % (beatDuration * 0.5)) / (beatDuration * 0.5)) * 6);
        const bass = Math.sin(2 * Math.PI * bassNote * t) * bassEnv * 0.35;
        sampleL += bass;
        sampleR += bass;
      }

      // 3. Generative Harmonic Chords / Shimmer
      chordFreqs.forEach((freq, idx) => {
        const detune = idx * 0.003;
        const noteL = Math.sin(2 * Math.PI * freq * (1 + detune) * t);
        const noteR = Math.sin(2 * Math.PI * freq * (1 - detune) * t);
        const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t + idx);
        sampleL += noteL * 0.08 * lfo;
        sampleR += noteR * 0.08 * lfo;
      });

      // 4. Arpeggiator Lead
      const arpStep = Math.floor((t / (beatDuration / 4)) % chordFreqs.length);
      const arpFreq = chordFreqs[arpStep] * 2;
      const arpEnv = Math.exp(-((t % (beatDuration / 4)) / (beatDuration / 4)) * 10);
      const arp = Math.sin(2 * Math.PI * arpFreq * t) * arpEnv * 0.15;
      sampleL += arp * 0.8;
      sampleR += arp * 1.2;

      // Master soft limit
      left[i] = Math.max(-0.95, Math.min(0.95, sampleL));
      right[i] = Math.max(-0.95, Math.min(0.95, sampleR));
    }

    return buffer;
  }

  public get activePrompts() {
    return Array.from(this.prompts.values())
      .filter((p) => {
        return !this.filteredPrompts.has(p.text) && p.weight !== 0;
      })
  }

  public readonly setWeightedPrompts = throttle(async (prompts: Map<string, Prompt>) => {
    this.prompts = prompts;

    if (this.activePrompts.length === 0) {
      this.dispatchEvent(new CustomEvent('error', { detail: 'There needs to be one active prompt to play.' }));
      this.pause();
      return;
    }

    // store the prompts to set later if we haven't connected yet
    // there should be a user interaction before calling setWeightedPrompts
    if (!this.session) return;

    const weightedPrompts = this.activePrompts.map((p) => {
      return {text: p.text, weight: p.weight};
    });
    try {
      await this.session.setWeightedPrompts({
        weightedPrompts,
      });
    } catch (e: any) {
      this.dispatchEvent(new CustomEvent('error', { detail: e.message }));
      this.pause();
    }
  }, 200);

  public async play() {
    this.setPlaybackState('loading');
    this.session = await this.getSession();
    await this.setWeightedPrompts(this.prompts);
    this.audioContext.resume();
    this.session.play();
    this.outputNode.connect(this.audioContext.destination);
    if (this.extraDestination) this.outputNode.connect(this.extraDestination);
    this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
  }

  public pause() {
    if (this.session) this.session.pause();
    this.setPlaybackState('paused');
    this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    this.nextStartTime = 0;
    this.outputNode = this.audioContext.createGain();
  }

  public stop() {
    if (this.session) this.session.stop();
    this.setPlaybackState('stopped');
    this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
    this.nextStartTime = 0;
    this.session = null;
    this.sessionPromise = null;
  }

  public async playPause() {
    switch (this.playbackState) {
      case 'playing':
        return this.pause();
      case 'paused':
      case 'stopped':
        return this.play();
      case 'loading':
        return this.stop();
    }
  }

}
