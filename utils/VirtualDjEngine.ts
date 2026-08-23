/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  AiPerformanceToolsState,
  AudioDspMode,
  AudioEngineHealth,
  AudioHijackSession,
  AudioSourceType,
  BeatFxType,
  BufferPoolMetrics,
  CustomDecal,
  DeckStemsState,
  DeckTrackState,
  HardwareControllerPreset,
  HardwareProfile,
  KaraokeState,
  OpusDeckId,
  OpusMediaSource,
  OpusQuadBeatFxState,
  OpusQuadPerformanceState,
  OpusZoneState,
  PadMode,
  Prompt,
  SerializedDeckSnapshot,
  SerializedDjSession,
  SoundColorFxType,
  StemAutoGainSafeguardState,
  TrackPhraseAnalysis,
  VideoMixerMasterState,
  VideoVisualState,
  VirtualDeckState,
} from '../types';
import { AudioBufferPool } from './AudioBufferPool';
import { BUILTIN_DECALS } from './AuthService';
import { SessionStorageService } from './SessionStorageService';
import { TrackHistoryService } from './TrackHistoryService';

// Procedural audio is a repeating preview, not a full decoded song. Keeping it
// short avoids blocking the browser's main thread and allocating hundreds of MB.
const PROCEDURAL_LOOP_SECONDS = 12;

const STEM_WORKLET_CODE = `
class IdproStemProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'vocalGain', defaultValue: 1.0, minValue: 0.0, maxValue: 2.0 },
      { name: 'drumsGain', defaultValue: 1.0, minValue: 0.0, maxValue: 2.0 },
      { name: 'bassGain', defaultValue: 1.0, minValue: 0.0, maxValue: 2.0 },
      { name: 'melodyGain', defaultValue: 1.0, minValue: 0.0, maxValue: 2.0 },
      { name: 'vocalMute', defaultValue: 0.0, minValue: 0.0, maxValue: 1.0 },
      { name: 'drumsMute', defaultValue: 0.0, minValue: 0.0, maxValue: 1.0 },
      { name: 'bassMute', defaultValue: 0.0, minValue: 0.0, maxValue: 1.0 },
      { name: 'melodyMute', defaultValue: 0.0, minValue: 0.0, maxValue: 1.0 },
    ];
  }

  constructor() {
    super();
    this.s1_bass_L = 0; this.s2_bass_L = 0;
    this.s1_bass_R = 0; this.s2_bass_R = 0;
    this.s1_mid_L = 0; this.s2_mid_L = 0;
    this.s1_mid_R = 0; this.s2_mid_R = 0;
    this.s1_high_L = 0; this.s2_high_L = 0;
    this.s1_high_R = 0; this.s2_high_R = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0] || !output || !output[0]) return true;

    const numChannels = Math.min(input.length, output.length);
    const numSamples = input[0].length;

    const vocalGain = parameters.vocalGain[0] ?? 1.0;
    const drumsGain = parameters.drumsGain[0] ?? 1.0;
    const bassGain = parameters.bassGain[0] ?? 1.0;
    const melodyGain = parameters.melodyGain[0] ?? 1.0;

    const vMute = (parameters.vocalMute[0] ?? 0) > 0.5;
    const dMute = (parameters.drumsMute[0] ?? 0) > 0.5;
    const bMute = (parameters.bassMute[0] ?? 0) > 0.5;
    const mMute = (parameters.melodyMute[0] ?? 0) > 0.5;

    const gV = vMute ? 0 : vocalGain;
    const gD = dMute ? 0 : drumsGain;
    const gB = bMute ? 0 : bassGain;
    const gM = mMute ? 0 : melodyGain;

    const fBass = 0.035;
    const fMid = 0.16;
    const fHigh = 0.38;

    for (let c = 0; c < numChannels; c++) {
      const inCh = input[c];
      const outCh = output[c];

      for (let i = 0; i < numSamples; i++) {
        const x = inCh[i];
        
        const lp_bass = c === 0 
          ? (this.s2_bass_L += fBass * (this.s1_bass_L += fBass * (x - this.s2_bass_L - this.s1_bass_L * 0.7)))
          : (this.s2_bass_R += fBass * (this.s1_bass_R += fBass * (x - this.s2_bass_R - this.s1_bass_R * 0.7)));
        
        const hp_high = c === 0 
          ? (x - (this.s2_high_L += fHigh * (this.s1_high_L += fHigh * (x - this.s2_high_L - this.s1_high_L * 0.7))))
          : (x - (this.s2_high_R += fHigh * (this.s1_high_R += fHigh * (x - this.s2_high_R - this.s1_high_R * 0.7))));

        const bp_mid = c === 0 
          ? (this.s1_mid_L += fMid * (x - this.s2_mid_L - this.s1_mid_L * 0.85))
          : (this.s1_mid_R += fMid * (x - this.s2_mid_R - this.s1_mid_R * 0.85));
        
        if (c === 0) this.s2_mid_L += fMid * this.s1_mid_L;
        else this.s2_mid_R += fMid * this.s1_mid_R;

        const drums = (x - lp_bass - bp_mid) * 0.85 + lp_bass * 0.25;
        const melody = hp_high * 0.85 + bp_mid * 0.25;
        const vocal = bp_mid * 1.15;
        const bass = lp_bass * 1.1;

        outCh[i] = (bass * gB) + (drums * gD) + (vocal * gV) + (melody * gM);
      }
    }

    return true;
  }
}

registerProcessor('idpro-stem-processor', IdproStemProcessor);
`;

interface DeckStemNodes {
  // Drums (transients & rhythm: 60-250Hz punch + high clicks)
  drumsFilter: BiquadFilterNode;
  drumsGain: GainNode;

  // Bass (sub & bass: 20-220Hz lowpass)
  bassFilter: BiquadFilterNode;
  bassGain: GainNode;

  // Vocal (mid formant 300Hz-3800Hz center isolate)
  vocalFilter: BiquadFilterNode;
  vocalGain: GainNode;
  vocalEchoDelay: DelayNode;
  vocalEchoGain: GainNode;

  // Melody / Instruments (mid-high & stereo side harmonics)
  melodyFilter: BiquadFilterNode;
  melodyGain: GainNode;

  // Stems Summing
  stemsSum: GainNode;
}

interface DeckAudioNodes {
  source: AudioBufferSourceNode | null;
  trim: GainNode;
  stems: DeckStemNodes;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  colorFilter: BiquadFilterNode;
  channelVolume: GainNode;
  crossfadeAssignGain: GainNode;
  analyser: AnalyserNode;
}

export const HARDWARE_PROFILES: HardwareProfile[] = [
  {
    id: 'opus_quad',
    name: 'Pioneer OPUS-QUAD',
    brand: 'Pioneer DJ / AlphaTheta',
    workflow: 'all_in_one_standalone',
    channels: 4,
    motorizedPlatters: false,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: 'Flagship 4-channel standalone system with fan-shaped sloping top plate, 10.1" capacitive touch display, and multi-room Zone output.',
    jogWheelSensitivity: 1.0,
    pitchFaderRange: 10,
    mappingNotes: ['Full 4-channel fader matrix', '10.1" Touchscreen XY Pad & Browser', 'Multi-room Zone Output', 'Sound Color FX + 14 Beat FX'],
  },
  {
    id: 'cdj_3000_djm_a9',
    name: 'Pioneer CDJ-3000 & DJM-A9',
    brand: 'Pioneer DJ / AlphaTheta',
    workflow: 'club_flagship',
    channels: 4,
    motorizedPlatters: false,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: 'The global club standard nexus setup with 9" high-resolution displays, MPU processing, Sound Color FX, and Center Lock crossfader.',
    jogWheelSensitivity: 1.0,
    pitchFaderRange: 10,
    mappingNotes: ['Pro DJ LINK Ethernet routing', 'Touch Cue & Touch Preview', 'Dual Headphone Cueing Engine', '32-bit D/A conversion'],
  },
  {
    id: 'ddj_flx10',
    name: 'Pioneer DDJ-FLX10',
    brand: 'Pioneer DJ',
    workflow: 'club_flagship',
    channels: 4,
    motorizedPlatters: false,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: '4-channel performance controller with dedicated hardware Track Separation buttons (Vocal, Drums, Inst), On-Jog Display, and Mix Point Link.',
    jogWheelSensitivity: 1.1,
    pitchFaderRange: 10,
    mappingNotes: ['Dedicated STEM ISO & STEM FX hardware buttons', 'Part ISO 3-band knobs', 'On-Jog multi-color ring indicators', 'DMX lighting output'],
  },
  {
    id: 'rane_four',
    name: 'RANE FOUR (Advanced Stems)',
    brand: 'RANE DJ',
    workflow: 'battle_scratch',
    channels: 4,
    motorizedPlatters: false,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: 'Built-for-Stems 4-channel mixer with dedicated Stem Split, Stem Level EQ, 8.5" jog wheels with center screens, and MAG FOUR faders.',
    jogWheelSensitivity: 1.2,
    pitchFaderRange: 10,
    mappingNotes: ['Hardware Stem Split buttons', 'OLED performance pad displays', 'Dual FX aluminum paddle triggers', 'MAG FOUR contactless crossfader'],
  },
  {
    id: 'denon_prime4',
    name: 'Denon DJ Prime 4+',
    brand: 'Denon DJ / inMusic',
    workflow: 'all_in_one_standalone',
    channels: 4,
    motorizedPlatters: false,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: '4-deck standalone DJ system with 10" multi-gesture HD touchscreen, built-in Amazon Music & Beatport streaming, and Zone Out.',
    jogWheelSensitivity: 1.0,
    pitchFaderRange: 10,
    mappingNotes: ['10" multi-gesture HD touch display', 'Engine DJ Stems beta support', 'Dual-zone audio output matrix', 'SATA drive bay storage'],
  },
  {
    id: 'traktor_s4mk3',
    name: 'Traktor Kontrol S4 MK3',
    brand: 'Native Instruments',
    workflow: 'mobile_performer',
    channels: 4,
    motorizedPlatters: true,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: '4-channel controller with Haptic Drive motorized jog wheels with haptic feedback, Carbon Protect faders, and high-res color displays.',
    jogWheelSensitivity: 1.0,
    pitchFaderRange: 10,
    mappingNotes: ['Haptic Drive motorized jog wheels', 'RGB cue point pad matrix', 'High-res stem & loop display', 'Mixer FX rotary selectors'],
  },
  {
    id: 'ddj_rev7',
    name: 'Pioneer DDJ-REV7',
    brand: 'Pioneer DJ',
    workflow: 'battle_scratch',
    channels: 2,
    motorizedPlatters: true,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: '2-channel battle controller with 7-inch motorized VINYLIZED platters, On-Jog displays, instant scratch samples, and MAGVEL FADER PRO.',
    jogWheelSensitivity: 1.4,
    pitchFaderRange: 100,
    mappingNotes: ['7" motorized platters with real slipmats', 'Battle-style horizontal pitch sliders', 'Instant Scratch sample banks', 'MAGVEL Fader Pro'],
  },
  {
    id: 'hercules_t7',
    name: 'Hercules DJControl Inpulse T7',
    brand: 'Hercules DJ',
    workflow: 'mobile_performer',
    channels: 2,
    motorizedPlatters: true,
    dedicatedStemButtons: true,
    displayScreens: false,
    description: 'Motorized 2-deck controller for vinyl lovers and mobile performers with dedicated Stems buttons, beatmatch guides, and 3.9" pitch faders.',
    jogWheelSensitivity: 1.0,
    pitchFaderRange: 10,
    mappingNotes: ['Motorized 33⅓ RPM vinyl platters', 'Direct Stem separation buttons', 'Built-in audio interface', 'Beatmatch light guides'],
  },
  {
    id: 'numark_mixstream',
    name: 'Numark Mixstream Pro+',
    brand: 'Numark DJ',
    workflow: 'all_in_one_standalone',
    channels: 2,
    motorizedPlatters: false,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: 'Standalone streaming DJ controller with built-in monitor speakers, WiFi streaming, Engine DJ OS, and smart lighting control.',
    jogWheelSensitivity: 1.0,
    pitchFaderRange: 10,
    mappingNotes: ['Built-in stereo monitor speakers', '7" capacitive multi-touch screen', 'Direct WiFi Amazon & Beatport streaming', 'Smart lighting control'],
  },
  {
    id: 'custom_generic',
    name: 'Custom / Universal MIDI Controller',
    brand: 'Universal MIDI Learn',
    workflow: 'custom_modular',
    channels: 4,
    motorizedPlatters: false,
    dedicatedStemButtons: true,
    displayScreens: true,
    description: 'Universal MIDI mapping engine with interactive MIDI Learn, custom CC assignment, jog wheel sensitivity calibration, and SysEx support.',
    jogWheelSensitivity: 1.0,
    pitchFaderRange: 10,
    mappingNotes: ['Interactive MIDI Learn engine', 'Custom CC/Note map assigner', 'Jog wheel curve calibration', 'Preset export/import'],
  },
];

export class VirtualDjEngine extends EventTarget {
  public audioContext: AudioContext;

  // 4 Channel Deck Audio Nodes
  private deckNodes: Record<OpusDeckId, DeckAudioNodes>;

  // Master bus
  private masterGain: GainNode;
  private masterAnalyser: AnalyserNode;

  // Zone Output Bus (Pioneer OPUS-QUAD Dedicated Multi-Room Audio)
  private zoneGain: GainNode;
  private zoneEqLow: BiquadFilterNode;
  private zoneEqHigh: BiquadFilterNode;
  private zoneAnalyser: AnalyserNode;
  private zoneAmbientSource: AudioBufferSourceNode | null = null;

  // Beat FX Audio Nodes
  private fxSendGain: GainNode;
  private fxReturnGain: GainNode;
  private fxDelayNode: DelayNode;
  private fxFeedbackGain: GainNode;
  private fxFilterNode: BiquadFilterNode;
  private fxConvolverNode: ConvolverNode;

  // Auto-Gain & Limiting Safeguards State
  public autoGainSafeguard: StemAutoGainSafeguardState = {
    enabled: true,
    limiterActive: false,
    rmsAttenuationDb: 0,
    peakHeadroomMarginDb: 2.5,
    dynamicCompressorThresholdDb: -0.5,
    preventedClipsCount: 0,
  };

  // Master brickwall limiter node
  private masterLimiter: DynamicsCompressorNode;

  // Crossfader: -1.0 (Full A) to +1.0 (Full B)
  public crossfaderPosition = 0;
  public crossfaderCurve: 'smooth' | 'linear' | 'scratch' | 'cut' = 'smooth';
  public masterVolume = 0.95;
  public boothVolume = 0.8;
  public headphonesMix = 0.5;
  public headphonesLevel = 0.8;

  // 4 Deck States
  public deckStates: Record<OpusDeckId, VirtualDeckState>;

  // Real-Time Stems State for 4 Decks
  public deckStemsStates: Record<OpusDeckId, DeckStemsState>;

  // Video & Karaoke Visual States
  public videoVisualStates: Record<OpusDeckId, VideoVisualState>;
  public videoMasterState: VideoMixerMasterState;
  public karaokeState: KaraokeState;

  // Active Hardware Controller Profile
  public activeHardwareProfile: HardwareProfile = HARDWARE_PROFILES[0];

  // AI-Driven Performance Tools State
  public aiPerformanceState: AiPerformanceToolsState;

  // Scratching, Playback Timing & Slip Mode
  private deckPlayOffsets: Record<OpusDeckId, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
  private deckStartTimes: Record<OpusDeckId, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
  private slipStartTimes: Record<OpusDeckId, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
  private scratchOffsets: Record<OpusDeckId, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };

  // Opus Quad Performance System State
  public opusPerformanceState: OpusQuadPerformanceState;

  // Audio Hijack Session
  public hijackSession: AudioHijackSession = {
    isActive: false,
    sourceType: 'microphone',
    streamName: 'Live Mic / Line-in Hijack',
    connectedAt: null,
    inputGain: 1.0,
    noiseGate: true,
    monitoring: true,
    routeToDeck: '1',
  };

  private hijackMediaStream: MediaStream | null = null;
  private hijackStreamSource: MediaStreamAudioSourceNode | null = null;
  private hijackGainNode: GainNode;
  private hijackAnalyserNode: AnalyserNode;

  private animationFrameId: number | null = null;

  // Audio Engine Health, AudioWorklet & Crash-Recovery States
  public audioDspMode: AudioDspMode = 'web_audio_fallback';
  public hasAudioWorkletLoaded = false;
  public autoResumeCount = 0;
  public lastSuspendedTime: number | null = null;
  public hasCrashRecoveryActive = true;

  constructor(existingContext?: AudioContext) {
    super();
    this.audioContext =
      existingContext ||
      new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    this.setupCrashRecoveryListeners();
    this.initAudioWorklet();

    // 1. Master Output Bus with Brickwall Limiter Safeguard
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.95;

    // Brickwall peak limiter (-0.5 dBFS threshold, 20:1 ratio, 3ms attack)
    this.masterLimiter = this.audioContext.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -0.5;
    this.masterLimiter.knee.value = 0.0;
    this.masterLimiter.ratio.value = 20.0;
    this.masterLimiter.attack.value = 0.003;
    this.masterLimiter.release.value = 0.05;

    this.masterAnalyser = this.audioContext.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.audioContext.destination);

    // 2. Zone Output Bus (Multi-room venue audio separate from master)
    this.zoneGain = this.audioContext.createGain();
    this.zoneGain.gain.value = 0.85;

    this.zoneEqLow = this.audioContext.createBiquadFilter();
    this.zoneEqLow.type = 'lowshelf';
    this.zoneEqLow.frequency.value = 300;
    this.zoneEqLow.gain.value = 0;

    this.zoneEqHigh = this.audioContext.createBiquadFilter();
    this.zoneEqHigh.type = 'highshelf';
    this.zoneEqHigh.frequency.value = 3500;
    this.zoneEqHigh.gain.value = 0;

    this.zoneAnalyser = this.audioContext.createAnalyser();
    this.zoneAnalyser.fftSize = 256;

    this.zoneGain.connect(this.zoneEqLow);
    this.zoneEqLow.connect(this.zoneEqHigh);
    this.zoneEqHigh.connect(this.zoneAnalyser);
    this.zoneAnalyser.connect(this.audioContext.destination);

    // 3. Beat FX Processor Nodes
    this.fxSendGain = this.audioContext.createGain();
    this.fxReturnGain = this.audioContext.createGain();
    this.fxDelayNode = this.audioContext.createDelay(4.0);
    this.fxDelayNode.delayTime.value = 0.25; // 1/2 beat at 120bpm
    this.fxFeedbackGain = this.audioContext.createGain();
    this.fxFeedbackGain.gain.value = 0.45;
    this.fxFilterNode = this.audioContext.createBiquadFilter();
    this.fxFilterNode.type = 'bandpass';
    this.fxFilterNode.frequency.value = 1800;
    this.fxConvolverNode = this.audioContext.createConvolver();
    this.initReverbImpulse();

    // Wire FX Loop
    this.fxSendGain.connect(this.fxDelayNode);
    this.fxDelayNode.connect(this.fxFilterNode);
    this.fxFilterNode.connect(this.fxFeedbackGain);
    this.fxFeedbackGain.connect(this.fxDelayNode);
    this.fxFilterNode.connect(this.fxReturnGain);
    this.fxReturnGain.connect(this.masterGain);

    // 4. Audio Hijack Nodes
    this.hijackGainNode = this.audioContext.createGain();
    this.hijackAnalyserNode = this.audioContext.createAnalyser();
    this.hijackAnalyserNode.fftSize = 256;
    this.hijackGainNode.connect(this.hijackAnalyserNode);

    // 5. Initialize 4 Deck Nodes (Channels 1, 2, 3, 4) with Real-Time Stem Filters
    this.deckNodes = {
      '1': this.createDeckAudioNodes('1'),
      '2': this.createDeckAudioNodes('2'),
      '3': this.createDeckAudioNodes('3'),
      '4': this.createDeckAudioNodes('4'),
    };

    // 6. Initialize 4 Deck Performance States
    this.deckStates = {
      '1': this.createInitialDeckState('1', BUILTIN_DECALS[0], 'A'),
      '2': this.createInitialDeckState('2', BUILTIN_DECALS[1], 'B'),
      '3': this.createInitialDeckState('3', BUILTIN_DECALS[2] || BUILTIN_DECALS[0], 'A'),
      '4': this.createInitialDeckState('4', BUILTIN_DECALS[3] || BUILTIN_DECALS[1], 'B'),
    };

    // 7. Initialize Real-Time Stems States for Decks 1-4
    this.deckStemsStates = {
      '1': this.createInitialStemState(),
      '2': this.createInitialStemState(),
      '3': this.createInitialStemState(),
      '4': this.createInitialStemState(),
    };

    // 8. Initialize Video & Karaoke States
    this.videoVisualStates = {
      '1': { deckId: '1', mode: 'shader_synth', shaderPreset: 'cyber_neon', opacity: 1.0, speed: 1.0, effect: 'none' },
      '2': { deckId: '2', mode: 'shader_synth', shaderPreset: 'synthwave_grid', opacity: 1.0, speed: 1.0, effect: 'none' },
      '3': { deckId: '3', mode: 'shader_synth', shaderPreset: 'audio_tunnel', opacity: 1.0, speed: 1.0, effect: 'none' },
      '4': { deckId: '4', mode: 'shader_synth', shaderPreset: 'spectrum_aurora', opacity: 1.0, speed: 1.0, effect: 'none' },
    };

    this.videoMasterState = {
      crossfaderPosition: 0,
      transitionEffect: 'dissolve',
      audioReactiveZoom: true,
      strobeOnBeat: false,
      overlayLogo: true,
      overlayText: 'iDj.pro Live Video & Karaoke Hub',
      isExternalWindowOpen: false,
    };

    this.karaokeState = {
      enabled: false,
      songTitle: 'Bohemian Rhapsody (Karaoke VIP)',
      artist: 'Queen / idpro.com Remaster',
      currentLyricIndex: 0,
      lyrics: [
        { time: 0, text: '♪ Is this the real life? Is this just fantasy? ♪', duration: 7 },
        { time: 7.5, text: '♪ Caught in a land-slide, no escape from reality... ♪', duration: 8 },
        { time: 16, text: '♪ Open your eyes, look up to the skies and seeee... ♪', duration: 9 },
        { time: 25.5, text: "♪ I'm just a poor boy, I need no sympathy... ♪", duration: 7.5 },
        { time: 33.5, text: '♪ Because I’m easy come, easy go, little high, little low ♪', duration: 9 },
        { time: 43, text: '♪ Any way the wind blows doesn’t really matter to me... to me... ♪', duration: 12 },
      ],
      keyShift: 0,
      vocalCutActive: false,
      guideMelody: true,
      nextSingerName: 'DJ Jordan (Table 4)',
      singerQueue: [
        { name: 'Sarah M.', song: 'Blinding Lights - The Weeknd', keyOffset: 0 },
        { name: 'Marcus K.', song: "Don't Stop Believin' - Journey", keyOffset: -2 },
        { name: 'Elena R.', song: 'Levitating - Dua Lipa', keyOffset: 1 },
      ],
    };

    // 9. Initialize AI Performance State
    this.aiPerformanceState = {
      autoCuePointsEnabled: true,
      smartEnergyTransitions: true,
      harmonicMatchMode: 'energy_plus_1',
      stemAutoMashup: true,
      dynamicRiserFx: true,
      vocalClashDetector: true,
      detectedPhrases: {},
    };

    // 10. Initialize Opus Quad Overall State
    this.opusPerformanceState = {
      activeLeftDeck: '1',
      activeRightDeck: '2',
      viewMode: 'opus_quad_4deck',
      touchScreenTab: 'deck_waveforms',
      selectedSoundColorFx: 'filter',
      beatFx: {
        type: 'echo',
        active: false,
        channel: 'master',
        beatFraction: 0.5,
        depth: 0.5,
        timeMs: 250,
        frequencyLow: true,
        frequencyMid: true,
        frequencyHigh: true,
      },
      touchXy: { x: 0.5, y: 0.5, active: false, hold: false },
      zone: {
        enabled: true,
        source: '3',
        volume: 0.85,
        eqLow: 0,
        eqHigh: 0,
        isPlaying: false,
        activeTrackName: 'Lounge / Room 2 Ambient Mix',
      },
      smoothEchoActive: false,
      smoothEchoTriggerBeats: 1,
      softwareMode: 'standalone',
      waveformZoom: 1.0,
    };

    this.updateCrossfader(0);
    this.startPlaybackLoop();
    this.seedDefaultTracks();
  }

  private createInitialStemState(): DeckStemsState {
    return {
      vocalVolume: 1.0,
      vocalMuted: false,
      vocalSolo: false,
      vocalFx: 'none',

      drumsVolume: 1.0,
      drumsMuted: false,
      drumsSolo: false,
      drumsFx: 'none',

      bassVolume: 1.0,
      bassMuted: false,
      bassSolo: false,
      bassFx: 'none',

      melodyVolume: 1.0,
      melodyMuted: false,
      melodySolo: false,
      melodyFx: 'none',

      activeAcapella: false,
      activeInstrumental: false,
    };
  }

  private createDeckAudioNodes(deckId: OpusDeckId): DeckAudioNodes {
    const trim = this.audioContext.createGain();
    trim.gain.value = 1.0;

    // --- REAL-TIME 4-STEM CROSSOVER SEPARATION FILTER NETWORK ---
    // 1. Drums: punchy transients & rhythm
    const drumsFilter = this.audioContext.createBiquadFilter();
    drumsFilter.type = 'peaking';
    drumsFilter.frequency.value = 120;
    drumsFilter.Q.value = 1.4;
    drumsFilter.gain.value = 3.0;

    const drumsGain = this.audioContext.createGain();
    drumsGain.gain.value = 1.0;

    // 2. Bass: sub-bass 20-220Hz lowpass
    const bassFilter = this.audioContext.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 230;
    bassFilter.Q.value = 1.0;

    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 1.0;

    // 3. Vocals: mid-frequency vocal formants & center presence (300Hz - 3800Hz)
    const vocalFilter = this.audioContext.createBiquadFilter();
    vocalFilter.type = 'bandpass';
    vocalFilter.frequency.value = 1500;
    vocalFilter.Q.value = 0.85;

    const vocalGain = this.audioContext.createGain();
    vocalGain.gain.value = 1.0;

    // Vocal Echo FX node
    const vocalEchoDelay = this.audioContext.createDelay(1.0);
    vocalEchoDelay.delayTime.value = 0.35;
    const vocalEchoGain = this.audioContext.createGain();
    vocalEchoGain.gain.value = 0.0;

    // 4. Melody / Instruments: high-mid & stereo side harmonics
    const melodyFilter = this.audioContext.createBiquadFilter();
    melodyFilter.type = 'highpass';
    melodyFilter.frequency.value = 2400;
    melodyFilter.Q.value = 0.9;

    const melodyGain = this.audioContext.createGain();
    melodyGain.gain.value = 1.0;

    // Stems Summing Bus
    const stemsSum = this.audioContext.createGain();
    stemsSum.gain.value = 1.0;

    // Connect Stem Branch: Trim -> (Drums, Bass, Vocal, Melody) -> Stem Gains -> StemsSum
    trim.connect(drumsFilter);
    drumsFilter.connect(drumsGain);
    drumsGain.connect(stemsSum);

    trim.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(stemsSum);

    trim.connect(vocalFilter);
    vocalFilter.connect(vocalGain);
    vocalGain.connect(stemsSum);

    vocalFilter.connect(vocalEchoDelay);
    vocalEchoDelay.connect(vocalEchoGain);
    vocalEchoGain.connect(stemsSum);

    trim.connect(melodyFilter);
    melodyFilter.connect(melodyGain);
    melodyGain.connect(stemsSum);

    // 3-Band Isolator EQ (Total kill -26dB to +6dB)
    const eqLow = this.audioContext.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 250;
    eqLow.gain.value = 0;

    const eqMid = this.audioContext.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1050;
    eqMid.Q.value = 1.0;
    eqMid.gain.value = 0;

    const eqHigh = this.audioContext.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 3800;
    eqHigh.gain.value = 0;

    // Sound Color FX filter
    const colorFilter = this.audioContext.createBiquadFilter();
    colorFilter.type = 'allpass';
    colorFilter.frequency.value = 1000;

    // Channel Volume Fader
    const channelVolume = this.audioContext.createGain();
    channelVolume.gain.value = 1.0;

    // Crossfade Assign Gain
    const crossfadeAssignGain = this.audioContext.createGain();
    crossfadeAssignGain.gain.value = 1.0;

    // VU Analyser
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.7;

    // Signal Chain:
    // StemsSum -> LowEQ -> MidEQ -> HighEQ -> ColorFilter -> ChannelVolume -> CrossfadeAssignGain -> Analyser -> MasterGain & Zone
    stemsSum.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(colorFilter);
    colorFilter.connect(channelVolume);
    channelVolume.connect(crossfadeAssignGain);
    crossfadeAssignGain.connect(analyser);
    analyser.connect(this.masterGain);

    const stems: DeckStemNodes = {
      drumsFilter,
      drumsGain,
      bassFilter,
      bassGain,
      vocalFilter,
      vocalGain,
      vocalEchoDelay,
      vocalEchoGain,
      melodyFilter,
      melodyGain,
      stemsSum,
    };

    return {
      source: null,
      trim,
      stems,
      eqLow,
      eqMid,
      eqHigh,
      colorFilter,
      channelVolume,
      crossfadeAssignGain,
      analyser,
    };
  }

  // Backward compatibility getters for Deck A and Deck B
  public get deckAState(): VirtualDeckState {
    return this.deckStates['1'];
  }
  public get deckBState(): VirtualDeckState {
    return this.deckStates['2'];
  }

  // --- REAL-TIME STEM SEPARATION CONTROLS ---
  public getDeckStems(deckId: OpusDeckId | 'A' | 'B'): DeckStemsState {
    const id = this.normalizeDeckId(deckId);
    return this.deckStemsStates[id];
  }

  public setDeckStemVolume(
    deckId: OpusDeckId | 'A' | 'B',
    stem: 'vocal' | 'drums' | 'bass' | 'melody',
    volume: number
  ) {
    const id = this.normalizeDeckId(deckId);
    const stems = this.deckStemsStates[id];
    const nodes = this.deckNodes[id].stems;
    const clamped = Math.max(0, Math.min(1.5, volume));
    const now = this.audioContext.currentTime;

    switch (stem) {
      case 'vocal':
        stems.vocalVolume = clamped;
        if (!stems.vocalMuted) {
          nodes.vocalGain.gain.setTargetAtTime(clamped, now, 0.03);
        }
        break;
      case 'drums':
        stems.drumsVolume = clamped;
        if (!stems.drumsMuted) {
          nodes.drumsGain.gain.setTargetAtTime(clamped, now, 0.03);
        }
        break;
      case 'bass':
        stems.bassVolume = clamped;
        if (!stems.bassMuted) {
          nodes.bassGain.gain.setTargetAtTime(clamped, now, 0.03);
        }
        break;
      case 'melody':
        stems.melodyVolume = clamped;
        if (!stems.melodyMuted) {
          nodes.melodyGain.gain.setTargetAtTime(clamped, now, 0.03);
        }
        break;
    }

    this.dispatchEvent(new CustomEvent('stems-state-changed', { detail: { deckId: id, stems } }));
  }

  public toggleDeckStemMute(
    deckId: OpusDeckId | 'A' | 'B',
    stem: 'vocal' | 'drums' | 'bass' | 'melody'
  ) {
    const id = this.normalizeDeckId(deckId);
    const stems = this.deckStemsStates[id];
    const nodes = this.deckNodes[id].stems;
    const now = this.audioContext.currentTime;

    switch (stem) {
      case 'vocal':
        stems.vocalMuted = !stems.vocalMuted;
        nodes.vocalGain.gain.setTargetAtTime(stems.vocalMuted ? 0 : stems.vocalVolume, now, 0.02);
        break;
      case 'drums':
        stems.drumsMuted = !stems.drumsMuted;
        nodes.drumsGain.gain.setTargetAtTime(stems.drumsMuted ? 0 : stems.drumsVolume, now, 0.02);
        break;
      case 'bass':
        stems.bassMuted = !stems.bassMuted;
        nodes.bassGain.gain.setTargetAtTime(stems.bassMuted ? 0 : stems.bassVolume, now, 0.02);
        break;
      case 'melody':
        stems.melodyMuted = !stems.melodyMuted;
        nodes.melodyGain.gain.setTargetAtTime(stems.melodyMuted ? 0 : stems.melodyVolume, now, 0.02);
        break;
    }

    this.dispatchEvent(new CustomEvent('stems-state-changed', { detail: { deckId: id, stems } }));
  }

  public toggleDeckStemSolo(
    deckId: OpusDeckId | 'A' | 'B',
    stem: 'vocal' | 'drums' | 'bass' | 'melody'
  ) {
    const id = this.normalizeDeckId(deckId);
    const stems = this.deckStemsStates[id];
    const nodes = this.deckNodes[id].stems;
    const now = this.audioContext.currentTime;

    const isCurrentSolo = stems[`${stem}Solo` as keyof DeckStemsState];

    if (isCurrentSolo) {
      // Unsolo: restore all
      stems.vocalSolo = false;
      stems.drumsSolo = false;
      stems.bassSolo = false;
      stems.melodySolo = false;
      nodes.vocalGain.gain.setTargetAtTime(stems.vocalMuted ? 0 : stems.vocalVolume, now, 0.03);
      nodes.drumsGain.gain.setTargetAtTime(stems.drumsMuted ? 0 : stems.drumsVolume, now, 0.03);
      nodes.bassGain.gain.setTargetAtTime(stems.bassMuted ? 0 : stems.bassVolume, now, 0.03);
      nodes.melodyGain.gain.setTargetAtTime(stems.melodyMuted ? 0 : stems.melodyVolume, now, 0.03);
    } else {
      // Solo this stem: mute others
      stems.vocalSolo = stem === 'vocal';
      stems.drumsSolo = stem === 'drums';
      stems.bassSolo = stem === 'bass';
      stems.melodySolo = stem === 'melody';

      nodes.vocalGain.gain.setTargetAtTime(stem === 'vocal' ? stems.vocalVolume : 0, now, 0.03);
      nodes.drumsGain.gain.setTargetAtTime(stem === 'drums' ? stems.drumsVolume : 0, now, 0.03);
      nodes.bassGain.gain.setTargetAtTime(stem === 'bass' ? stems.bassVolume : 0, now, 0.03);
      nodes.melodyGain.gain.setTargetAtTime(stem === 'melody' ? stems.melodyVolume : 0, now, 0.03);
    }

    this.dispatchEvent(new CustomEvent('stems-state-changed', { detail: { deckId: id, stems } }));
  }

  public triggerInstantAcapella(deckId: OpusDeckId | 'A' | 'B') {
    const id = this.normalizeDeckId(deckId);
    const stems = this.deckStemsStates[id];
    const nodes = this.deckNodes[id].stems;
    const now = this.audioContext.currentTime;

    stems.activeAcapella = !stems.activeAcapella;
    stems.activeInstrumental = false;

    if (stems.activeAcapella) {
      // Solo vocal, mute drums, bass, melody
      nodes.vocalGain.gain.setTargetAtTime(1.2, now, 0.03);
      nodes.drumsGain.gain.setTargetAtTime(0, now, 0.03);
      nodes.bassGain.gain.setTargetAtTime(0, now, 0.03);
      nodes.melodyGain.gain.setTargetAtTime(0.2, now, 0.03);
    } else {
      // Reset
      this.resetStems(id);
    }

    this.dispatchEvent(new CustomEvent('stems-state-changed', { detail: { deckId: id, stems } }));
  }

  public triggerInstantInstrumental(deckId: OpusDeckId | 'A' | 'B') {
    const id = this.normalizeDeckId(deckId);
    const stems = this.deckStemsStates[id];
    const nodes = this.deckNodes[id].stems;
    const now = this.audioContext.currentTime;

    stems.activeInstrumental = !stems.activeInstrumental;
    stems.activeAcapella = false;

    if (stems.activeInstrumental) {
      // Mute vocal, keep drums, bass, melody
      nodes.vocalGain.gain.setTargetAtTime(0, now, 0.03);
      nodes.drumsGain.gain.setTargetAtTime(1.0, now, 0.03);
      nodes.bassGain.gain.setTargetAtTime(1.0, now, 0.03);
      nodes.melodyGain.gain.setTargetAtTime(1.0, now, 0.03);
    } else {
      // Reset
      this.resetStems(id);
    }

    this.dispatchEvent(new CustomEvent('stems-state-changed', { detail: { deckId: id, stems } }));
  }

  public resetStems(deckId: OpusDeckId | 'A' | 'B') {
    const id = this.normalizeDeckId(deckId);
    const stems = this.deckStemsStates[id];
    const nodes = this.deckNodes[id].stems;
    const now = this.audioContext.currentTime;

    stems.vocalVolume = 1.0;
    stems.vocalMuted = false;
    stems.vocalSolo = false;
    stems.drumsVolume = 1.0;
    stems.drumsMuted = false;
    stems.drumsSolo = false;
    stems.bassVolume = 1.0;
    stems.bassMuted = false;
    stems.bassSolo = false;
    stems.melodyVolume = 1.0;
    stems.melodyMuted = false;
    stems.melodySolo = false;
    stems.activeAcapella = false;
    stems.activeInstrumental = false;

    nodes.vocalGain.gain.setTargetAtTime(1.0, now, 0.03);
    nodes.drumsGain.gain.setTargetAtTime(1.0, now, 0.03);
    nodes.bassGain.gain.setTargetAtTime(1.0, now, 0.03);
    nodes.melodyGain.gain.setTargetAtTime(1.0, now, 0.03);
    nodes.vocalEchoGain.gain.setTargetAtTime(0.0, now, 0.03);

    this.dispatchEvent(new CustomEvent('stems-state-changed', { detail: { deckId: id, stems } }));
  }

  public setDeckStemFx(
    deckId: OpusDeckId | 'A' | 'B',
    stem: 'vocal' | 'drums' | 'bass' | 'melody',
    fxType: string
  ) {
    const id = this.normalizeDeckId(deckId);
    const stems = this.deckStemsStates[id];
    const nodes = this.deckNodes[id].stems;
    const now = this.audioContext.currentTime;

    if (stem === 'vocal') {
      stems.vocalFx = fxType as any;
      if (fxType === 'echo') {
        nodes.vocalEchoGain.gain.setTargetAtTime(0.4, now, 0.04);
      } else {
        nodes.vocalEchoGain.gain.setTargetAtTime(0.0, now, 0.04);
      }
    } else if (stem === 'drums') {
      stems.drumsFx = fxType as any;
      if (fxType === 'filter') {
        nodes.drumsFilter.frequency.setTargetAtTime(600, now, 0.04);
      } else {
        nodes.drumsFilter.frequency.setTargetAtTime(120, now, 0.04);
      }
    } else if (stem === 'bass') {
      stems.bassFx = fxType as any;
      if (fxType === 'sub_boost') {
        nodes.bassFilter.gain.setTargetAtTime(6.0, now, 0.04);
      } else {
        nodes.bassFilter.gain.setTargetAtTime(0.0, now, 0.04);
      }
    } else if (stem === 'melody') {
      stems.melodyFx = fxType as any;
    }

    this.dispatchEvent(new CustomEvent('stems-state-changed', { detail: { deckId: id, stems } }));
  }

  // --- VIDEO & KARAOKE ENGINE CONTROLS ---
  public setVideoDeckState(deckId: OpusDeckId, partial: Partial<VideoVisualState>) {
    this.videoVisualStates[deckId] = { ...this.videoVisualStates[deckId], ...partial };
    this.dispatchEvent(new CustomEvent('video-state-changed', { detail: { deckId, state: this.videoVisualStates[deckId] } }));
  }

  public setVideoCrossfader(pos: number) {
    this.videoMasterState.crossfaderPosition = Math.max(-1, Math.min(1, pos));
    this.dispatchEvent(new CustomEvent('video-master-changed', { detail: this.videoMasterState }));
  }

  public setVideoTransitionEffect(effect: VideoMixerMasterState['transitionEffect']) {
    this.videoMasterState.transitionEffect = effect;
    this.dispatchEvent(new CustomEvent('video-master-changed', { detail: this.videoMasterState }));
  }

  public setKaraokeKeyShift(shift: number) {
    this.karaokeState.keyShift = Math.max(-6, Math.min(6, shift));
    // Apply pitch shift to currently loaded track on Deck 1 / active deck
    this.setDeckKeyShift('1', this.karaokeState.keyShift);
    this.dispatchEvent(new CustomEvent('karaoke-state-changed', { detail: this.karaokeState }));
  }

  public toggleKaraokeVocalCut() {
    this.karaokeState.vocalCutActive = !this.karaokeState.vocalCutActive;
    if (this.karaokeState.vocalCutActive) {
      this.toggleDeckStemMute('1', 'vocal');
    } else {
      this.setDeckStemVolume('1', 'vocal', 1.0);
    }
    this.dispatchEvent(new CustomEvent('karaoke-state-changed', { detail: this.karaokeState }));
  }

  // --- HARDWARE CONTROLLER PROFILE SWITCHER ---
  public setHardwareProfile(profileId: HardwareControllerPreset) {
    const profile = HARDWARE_PROFILES.find((p) => p.id === profileId);
    if (profile) {
      this.activeHardwareProfile = profile;
      this.dispatchEvent(new CustomEvent('hardware-profile-changed', { detail: profile }));
    }
  }

  // --- AI-DRIVEN PERFORMANCE TOOLS ---
  public analyzeTrackPhrase(track: DeckTrackState): TrackPhraseAnalysis {
    const bpm = track.bpm || 128;
    const dur = track.duration || 210;
    const barSec = (60 / bpm) * 4;

    const analysis: TrackPhraseAnalysis = {
      introBars: 8, // 32 beats
      dropTime: Math.min(dur * 0.25, 32 * (60 / bpm)),
      breakdownTime: dur * 0.5,
      outroTime: Math.max(0, dur - 32 * (60 / bpm)),
      energyScore: track.energyRating || (bpm > 140 ? 9 : bpm > 126 ? 8 : 7),
      suggestedMixInCue: 0,
      suggestedMixOutCue: Math.max(0, dur - 64 * (60 / bpm)),
    };

    this.aiPerformanceState.detectedPhrases[track.id] = analysis;
    return analysis;
  }

  public getHarmonicKeyRecommendations(currentKey: string): { key: string; relation: string; energy: string }[] {
    const camelotKeys: Record<string, { plus1: string; minus1: string; relative: string; fifth: string }> = {
      '8A': { plus1: '9A', minus1: '7A', relative: '8B', fifth: '3A' },
      '8B': { plus1: '9B', minus1: '7B', relative: '8A', fifth: '3B' },
      '9A': { plus1: '10A', minus1: '8A', relative: '9B', fifth: '4A' },
      '9B': { plus1: '10B', minus1: '8B', relative: '9A', fifth: '4B' },
      '11B': { plus1: '12B', minus1: '10B', relative: '11A', fifth: '6B' },
      '4A': { plus1: '5A', minus1: '3A', relative: '4B', fifth: '11A' },
      '1A': { plus1: '2A', minus1: '12A', relative: '1B', fifth: '8A' },
      '6A': { plus1: '7A', minus1: '5A', relative: '6B', fifth: '1A' },
    };

    const match = camelotKeys[currentKey] || { plus1: '9A', minus1: '7A', relative: '8B', fifth: '3A' };
    return [
      { key: currentKey, relation: 'Perfect Match (Harmonic Root)', energy: 'Equal Energy' },
      { key: match.plus1, relation: 'Energy Boost (+1 Step)', energy: '+1 Boost' },
      { key: match.relative, relation: 'Relative Major/Minor (Mood Flip)', energy: 'Deep Harmonic' },
      { key: match.minus1, relation: 'Energy Chill (-1 Step)', energy: '-1 Smooth Drop' },
      { key: match.fifth, relation: 'Diagonal Jump / Modulation', energy: '+2 Peak Lift' },
    ];
  }

  public triggerAiAutoTransition(
    fromDeck: OpusDeckId,
    toDeck: OpusDeckId,
    style: 'drop_swap' | 'vocal_wash' | 'filter_echo' | 'riser_climax' = 'filter_echo'
  ) {
    const from = this.deckStates[fromDeck];
    const to = this.deckStates[toDeck];
    const now = this.audioContext.currentTime;

    // Start target deck if not playing
    if (!to.isPlaying) {
      this.playDeck(toDeck);
    }

    if (style === 'vocal_wash') {
      // Isolate vocal on fromDeck and echo washout, drop beat on toDeck
      this.triggerInstantAcapella(fromDeck);
      this.setDeckStemFx(fromDeck, 'vocal', 'echo');
      setTimeout(() => {
        this.updateCrossfader(to.crossfaderAssign === 'B' ? 1.0 : -1.0);
        this.stopDeck(fromDeck);
      }, 4000);
    } else if (style === 'drop_swap') {
      // Immediate bass cut on fromDeck, unmute bass on toDeck
      this.toggleDeckStemMute(fromDeck, 'bass');
      this.updateCrossfader(to.crossfaderAssign === 'B' ? 1.0 : -1.0);
    } else {
      // Filter echo sweep
      this.setDeckFilter(fromDeck, 70);
      this.toggleBeatFx(true);
      setTimeout(() => {
        this.updateCrossfader(to.crossfaderAssign === 'B' ? 1.0 : -1.0);
        this.setDeckFilter(fromDeck, 0);
        this.toggleBeatFx(false);
      }, 3000);
    }

    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `⚡ AI Smart Transition (${style.replace('_', ' ').toUpperCase()}) executed from D${fromDeck} to D${toDeck}!`,
        bubbles: true,
        composed: true,
      })
    );
  }

  // --- AUTO-GAIN & RMS LIMITING SAFEGUARDS ---
  public toggleAutoGainSafeguard(enabled?: boolean) {
    this.autoGainSafeguard.enabled = enabled !== undefined ? enabled : !this.autoGainSafeguard.enabled;
    const now = this.audioContext.currentTime;
    if (!this.autoGainSafeguard.enabled) {
      this.masterLimiter.threshold.setTargetAtTime(0.0, now, 0.02);
      this.masterLimiter.ratio.setTargetAtTime(1.0, now, 0.02);
    } else {
      this.masterLimiter.threshold.setTargetAtTime(-0.5, now, 0.02);
      this.masterLimiter.ratio.setTargetAtTime(20.0, now, 0.02);
    }
    this.dispatchEvent(new CustomEvent('autogain-safeguard-changed', { detail: this.autoGainSafeguard }));
  }

  public setAutoGainHeadroom(marginDb: number) {
    this.autoGainSafeguard.peakHeadroomMarginDb = Math.max(0.5, Math.min(6.0, marginDb));
    const thresholdDb = -Math.abs(this.autoGainSafeguard.peakHeadroomMarginDb);
    this.autoGainSafeguard.dynamicCompressorThresholdDb = thresholdDb;
    if (this.autoGainSafeguard.enabled) {
      this.masterLimiter.threshold.setTargetAtTime(thresholdDb, this.audioContext.currentTime, 0.02);
    }
    this.dispatchEvent(new CustomEvent('autogain-safeguard-changed', { detail: this.autoGainSafeguard }));
  }

  private createInitialDeckState(
    deckId: OpusDeckId,
    defaultDecal: CustomDecal,
    crossfaderAssign: 'A' | 'THRU' | 'B'
  ): VirtualDeckState {
    return {
      deckId,
      loadedTrack: null,
      isPlaying: false,
      isCueing: false,
      currentTime: 0,
      playbackRate: 1.0,
      pitchRange: 10,
      tempoSync: false,
      keyLock: true,
      keyShift: 0,
      isMasterDeck: deckId === '1',
      volume: 1.0,
      trim: 0,
      lowEq: 0,
      midEq: 0,
      highEq: 0,
      colorFxValue: 0,
      colorFxParameter: 50,
      filter: 0,
      activeDecal: defaultDecal,
      hotCues: [null, null, null, null, null, null, null, null],
      loopLength: null,
      isLooping: false,
      isScratching: false,
      scratchPosition: 0,
      jogMode: 'vinyl',
      jogTension: 'normal',
      slipMode: false,
      padMode: 'hot_cue',
      crossfaderAssign,
      cueHeadphones: deckId === '1' || deckId === '2',
      inputSource: deckId === '1' || deckId === '2' ? 'usb_1' : 'usb_2',
    };
  }

  private initReverbImpulse() {
    const length = this.audioContext.sampleRate * 2.0;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    const impL = impulse.getChannelData(0);
    const impR = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (this.audioContext.sampleRate * 0.4));
      impL[i] = (Math.random() * 2 - 1) * decay;
      impR[i] = (Math.random() * 2 - 1) * decay;
    }
    this.fxConvolverNode.buffer = impulse;
  }

  /** Initialize AudioWorklet module for real-time stem separation with seamless fallback */
  private async initAudioWorklet() {
    if (typeof window === 'undefined' || !this.audioContext.audioWorklet) {
      this.audioDspMode = 'web_audio_fallback';
      this.hasAudioWorkletLoaded = false;
      this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
      return;
    }

    try {
      const blob = new Blob([STEM_WORKLET_CODE], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(blobUrl);
      URL.revokeObjectURL(blobUrl);

      this.audioDspMode = 'audioworklet';
      this.hasAudioWorkletLoaded = true;
      this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
    } catch {
      // Clean fallback to native Web Audio graph without user disruption
      this.audioDspMode = 'web_audio_fallback';
      this.hasAudioWorkletLoaded = false;
      this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
    }
  }

  /** Attach crash-recovery safety listeners to audio context */
  private setupCrashRecoveryListeners() {
    if (!this.audioContext) return;

    this.audioContext.onstatechange = () => {
      if (this.audioContext.state === 'suspended') {
        this.lastSuspendedTime = Date.now();
      }
      this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
    };

    // Auto-resume on first user gesture anywhere on window
    const autoResumeHandler = async () => {
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          this.autoResumeCount++;
          this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
        } catch {
          // ignore
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', autoResumeHandler, { passive: true });
      window.addEventListener('touchstart', autoResumeHandler, { passive: true });
      window.addEventListener('touchend', autoResumeHandler, { passive: true });
      window.addEventListener('keydown', autoResumeHandler, { passive: true });
      window.addEventListener('focus', autoResumeHandler, { passive: true });
    }
  }

  /** Get comprehensive audio engine health status for UI diagnosis */
  public getAudioEngineHealth(): AudioEngineHealth {
    return {
      state: (this.audioContext.state as any) || 'running',
      sampleRate: this.audioContext.sampleRate || 44100,
      currentTime: this.audioContext.currentTime || 0,
      dspMode: this.audioDspMode,
      audioWorkletActive: this.audioDspMode === 'audioworklet',
      lastSuspendedTime: this.lastSuspendedTime,
      autoResumeCount: this.autoResumeCount,
      hasCrashRecoveryActive: this.hasCrashRecoveryActive,
      bufferPoolMetrics: AudioBufferPool.getInstance().getMetrics(),
    };
  }

  /**
   * Explicit Memory Cleanup & Garbage Collection Cycle:
   * Frees stale stem decomposition buffers, recycles arrays, and flushes orphaned nodes.
   */
  public runGarbageCollectionCycle(): BufferPoolMetrics {
    // 1. Recycle and prune idle pool arrays
    const metrics = AudioBufferPool.getInstance().runGarbageCollection();

    // 2. Clear any disconnected or orphaned audio sources across all 4 decks
    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((deckId) => {
      const state = this.deckStates[deckId];
      const nodes = this.deckNodes[deckId];
      if (!state.isPlaying && nodes.source) {
        try {
          nodes.source.disconnect();
        } catch {
          // ignore
        }
        nodes.source = null;
      }
    });

    this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `🧹 Memory GC Cycle Complete (${metrics.totalPooledBuffers} buffers pooled, ${(metrics.totalPooledMemoryBytes / 1024).toFixed(1)} KB reserved).`,
        bubbles: true,
        composed: true,
      })
    );

    return metrics;
  }

  /**
   * Deep Purge Memory Pool: releases all cached float buffers immediately.
   */
  public purgeMemoryPool(): BufferPoolMetrics {
    AudioBufferPool.getInstance().purgeAll();
    const metrics = AudioBufferPool.getInstance().getMetrics();
    this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
    return metrics;
  }

  /**
   * Generates a high-precision, low-latency audio metronome tick for Latency Calibration.
   */
  public playCalibrationClick(time = this.audioContext.currentTime) {
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, time);
      osc.frequency.exponentialRampToValueAtTime(300, time + 0.025);

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.03);
    } catch {
      // Audio context might be suspended
    }
  }

  /**
   * Serializes the entire active DJ performance session for persistent checkpointing.
   */
  public exportSessionSnapshot(
    prompts: Prompt[] = [],
    latencyOffsetMs = 0,
    activeView = 'virtual_decks'
  ): SerializedDjSession {
    const serializedDecks = {} as Record<OpusDeckId, SerializedDeckSnapshot>;

    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((id) => {
      const state = this.deckStates[id];
      serializedDecks[id] = {
        deckId: id,
        loadedTrack: state.loadedTrack
          ? {
              id: state.loadedTrack.id,
              title: state.loadedTrack.title,
              artist: state.loadedTrack.artist,
              source: state.loadedTrack.source,
              sourceUrl: state.loadedTrack.sourceUrl,
              duration: state.loadedTrack.duration,
              bpm: state.loadedTrack.bpm,
              key: state.loadedTrack.key,
              artworkUrl: state.loadedTrack.artworkUrl,
              genre: state.loadedTrack.genre,
              isProceduralFallback: state.loadedTrack.isProceduralFallback,
            }
          : null,
        currentTime: state.currentTime,
        playbackRate: state.playbackRate,
        pitchRange: state.pitchRange,
        keyShift: state.keyShift,
        keyLock: state.keyLock,
        tempoSync: state.tempoSync,
        volume: state.volume,
        trim: state.trim,
        lowEq: state.lowEq,
        midEq: state.midEq,
        highEq: state.highEq,
        colorFxValue: state.colorFxValue,
        filter: state.filter,
        hotCues: [...state.hotCues],
        loopLength: state.loopLength,
        isLooping: state.isLooping,
        jogMode: state.jogMode,
        padMode: state.padMode,
        crossfaderAssign: state.crossfaderAssign,
        cueHeadphones: state.cueHeadphones,
      };
    });

    return {
      version: 2,
      savedAt: Date.now(),
      decks: serializedDecks,
      deckStems: JSON.parse(JSON.stringify(this.deckStemsStates)),
      mixer: {
        crossfaderPosition: this.crossfaderPosition,
        crossfaderCurve: this.crossfaderCurve,
        masterVolume: this.masterVolume,
        boothVolume: this.boothVolume,
        headphonesMix: this.headphonesMix,
        headphonesLevel: this.headphonesLevel,
      },
      opusPerformanceState: JSON.parse(JSON.stringify(this.opusPerformanceState)),
      prompts: JSON.parse(JSON.stringify(prompts)),
      latencyOffsetMs,
      activeView,
    };
  }

  /**
   * Save active session state to persistent local checkpoint.
   */
  public saveSessionCheckpoint(prompts: Prompt[] = [], latencyOffsetMs = 0, activeView = 'virtual_decks') {
    const snapshot = this.exportSessionSnapshot(prompts, latencyOffsetMs, activeView);
    SessionStorageService.getInstance().saveSessionDebounced(snapshot);
  }

  /**
   * Restores an active session snapshot without dropping or interrupting Web Audio buffers.
   */
  public async restoreFromSessionSnapshot(snapshot: SerializedDjSession): Promise<boolean> {
    try {
      await this.resumeContext();

      // 1. Restore Decks
      for (const deckId of ['1', '2', '3', '4'] as OpusDeckId[]) {
        const deckSnap = snapshot.decks[deckId];
        if (!deckSnap) continue;

        const state = this.deckStates[deckId];
        state.playbackRate = deckSnap.playbackRate ?? 1.0;
        state.pitchRange = deckSnap.pitchRange ?? 10;
        state.keyShift = deckSnap.keyShift ?? 0;
        state.keyLock = deckSnap.keyLock ?? false;
        state.tempoSync = deckSnap.tempoSync ?? false;
        state.hotCues = deckSnap.hotCues ? [...deckSnap.hotCues] : [null, null, null, null, null, null, null, null];
        state.loopLength = deckSnap.loopLength;
        state.isLooping = deckSnap.isLooping ?? false;
        state.jogMode = deckSnap.jogMode ?? 'vinyl';
        state.padMode = deckSnap.padMode ?? 'hot_cue';
        state.crossfaderAssign = deckSnap.crossfaderAssign ?? 'THRU';
        state.cueHeadphones = deckSnap.cueHeadphones ?? false;

        // Restore Mix Levels & EQs
        this.setDeckVolume(deckId, deckSnap.volume ?? 0.85);
        this.setDeckTrim(deckId, deckSnap.trim ?? 0);
        this.setDeckEq(deckId, 'low', deckSnap.lowEq ?? 0);
        this.setDeckEq(deckId, 'mid', deckSnap.midEq ?? 0);
        this.setDeckEq(deckId, 'high', deckSnap.highEq ?? 0);
        this.setDeckColorFx(deckId, deckSnap.colorFxValue ?? 0);

        // If track metadata was saved, load procedural or remote buffer
        if (deckSnap.loadedTrack) {
          const trackMeta = deckSnap.loadedTrack;
          const trackState: DeckTrackState = {
            id: trackMeta.id,
            title: trackMeta.title,
            artist: trackMeta.artist,
            source: trackMeta.source,
            sourceUrl: trackMeta.sourceUrl,
            duration: trackMeta.duration || 180,
            bpm: trackMeta.bpm || 128,
            key: trackMeta.key || '8A',
            artworkUrl: trackMeta.artworkUrl,
            genre: trackMeta.genre,
            isProceduralFallback: trackMeta.isProceduralFallback,
            audioBuffer: null,
          };
          await this.loadTrackToDeck(deckId, trackState);
          if (deckSnap.currentTime > 0) {
            this.seekDeck(deckId, deckSnap.currentTime);
          }
        }
      }

      // 2. Restore Stems
      if (snapshot.deckStems) {
        (['1', '2', '3', '4'] as OpusDeckId[]).forEach((deckId) => {
          const stems = snapshot.deckStems[deckId];
          if (stems) {
            this.setDeckStemVolume(deckId, 'vocal', stems.vocalVolume);
            this.setDeckStemVolume(deckId, 'drums', stems.drumsVolume);
            this.setDeckStemVolume(deckId, 'bass', stems.bassVolume);
            this.setDeckStemVolume(deckId, 'melody', stems.melodyVolume);
            if (stems.vocalMuted) this.toggleDeckStemMute(deckId, 'vocal');
            if (stems.drumsMuted) this.toggleDeckStemMute(deckId, 'drums');
            if (stems.bassMuted) this.toggleDeckStemMute(deckId, 'bass');
            if (stems.melodyMuted) this.toggleDeckStemMute(deckId, 'melody');
          }
        });
      }

      // 3. Restore Mixer Master
      if (snapshot.mixer) {
        this.updateCrossfader(snapshot.mixer.crossfaderPosition ?? 0.5);
        this.setCrossfaderCurve(snapshot.mixer.crossfaderCurve ?? 'linear');
        this.setMasterVolume(snapshot.mixer.masterVolume ?? 0.95);
        this.setBoothVolume(snapshot.mixer.boothVolume ?? 0.8);
      }

      // 4. Restore Opus Quad Performance State
      if (snapshot.opusPerformanceState) {
        this.opusPerformanceState = {
          ...this.opusPerformanceState,
          ...snapshot.opusPerformanceState,
        };
        this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
      }

      this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: '✨ Session Checkpoint Restored: 4 Decks, Stems & EQ recovered.',
          bubbles: true,
          composed: true,
        })
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempt automatic session checkpoint restore on application startup.
   */
  public async attemptAutoSessionRestore(): Promise<SerializedDjSession | null> {
    const saved = SessionStorageService.getInstance().loadSession();
    if (saved) {
      const ok = await this.restoreFromSessionSnapshot(saved);
      if (ok) return saved;
    }
    return null;
  }

  /**
   * Emergency Audio Recovery & Master Reset:
   * Safely reconnects audio nodes and resumes audio without losing current mix or playback cues.
   */
  public async emergencyAudioResetAndResume(): Promise<boolean> {
    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Ensure Master & Zone bus gains are restored
      this.masterGain.gain.setValueAtTime(0.95, this.audioContext.currentTime);
      this.zoneGain.gain.setValueAtTime(0.85, this.audioContext.currentTime);

      // Re-apply crossfader
      this.updateCrossfader(this.crossfaderPosition);

      // Re-apply trims and stem gains for all 4 decks
      (['1', '2', '3', '4'] as OpusDeckId[]).forEach((deckId) => {
        const state = this.deckStates[deckId];
        this.setDeckVolume(deckId, state.volume);
        this.setDeckTrim(deckId, state.trim);
        this.setDeckEq(deckId, 'low', state.lowEq);
        this.setDeckEq(deckId, 'mid', state.midEq);
        this.setDeckEq(deckId, 'high', state.highEq);
        this.resetStems(deckId);
      });

      this.autoResumeCount++;
      this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
      this.dispatchEvent(
        new CustomEvent('audio-recovered', {
          detail: {
            message: 'Audio Context and Mixer DSP Graph successfully recovered and calibrated.',
            state: this.audioContext.state,
          },
        })
      );
      return true;
    } catch (err: any) {
      this.dispatchEvent(
        new CustomEvent('audio-error', {
          detail: { message: err?.message || 'Emergency audio reset encountered an issue.' },
        })
      );
      return false;
    }
  }

  public async resumeContext() {
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        this.autoResumeCount++;
        this.dispatchEvent(new CustomEvent('audio-health-changed', { detail: this.getAudioEngineHealth() }));
      } catch {
        // ignore
      }
    }
  }

  /**
   * Load remote HTTPS track with bulletproof CORS & offline fallback synthesis.
   * If remote fetching or decoding fails, procedural stem audio is seamlessly synthesized.
   */
  public async loadRemoteAudioTrackWithFallback(
    deckId: OpusDeckId | 'A' | 'B',
    url: string,
    metadata: { title: string; artist: string; bpm: number; duration: number; source: AudioSourceType; artworkUrl?: string; genre?: string }
  ) {
    const targetDeckId = this.normalizeDeckId(deckId);
    let buffer: AudioBuffer | null = null;
    let isFallback = false;

    if (url && url.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(url, { mode: 'cors', signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          buffer = await this.audioContext.decodeAudioData(arrayBuf);
        } else {
          isFallback = true;
        }
      } catch {
        // Remote CORS or network failure -> Fallback to procedural synthesis
        isFallback = true;
      }
    } else {
      isFallback = true;
    }

    const track: DeckTrackState = {
      id: `remote-${Date.now()}`,
      title: metadata.title,
      artist: metadata.artist,
      source: metadata.source,
      sourceUrl: url,
      duration: metadata.duration || (buffer ? buffer.duration : 180),
      bpm: metadata.bpm || 128,
      key: '8A (Am)',
      audioBuffer: buffer,
      artworkUrl: metadata.artworkUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80',
      genre: metadata.genre || 'Electronic',
      isProceduralFallback: isFallback,
      remoteStemStatus: isFallback ? 'fallback_procedural' : 'ready',
    };

    await this.loadTrackToDeck(targetDeckId, track);

    if (isFallback) {
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `⚡ Procedural Stem Audio synthesized for [${metadata.title}] (Safe Offline/CORS Fallback).`,
          bubbles: true,
          composed: true,
        })
      );
    }

    return track;
  }

  // --- Track Loading ---
  public async loadTrackToDeck(deckId: OpusDeckId | 'A' | 'B', track: DeckTrackState) {
    await this.resumeContext();
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];

    this.stopDeck(targetDeckId);

    state.loadedTrack = track;
    state.currentTime = 0;
    this.deckPlayOffsets[targetDeckId] = 0;

    TrackHistoryService.getInstance().logTrack(track, targetDeckId);

    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  public setDeckDecal(deckId: OpusDeckId | 'A' | 'B', decal: CustomDecal) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.activeDecal = decal;
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  // --- Playback Controls ---
  public playDeck(deckId: OpusDeckId | 'A' | 'B') {
    this.resumeContext();
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    const nodes = this.deckNodes[targetDeckId];

    if (!state.loadedTrack) return;
    if (state.isPlaying) return;

    // Synthesize fallback audio only after an explicit play gesture. Demo and
    // metadata-only tracks therefore do no expensive PCM work during startup.
    if (!state.loadedTrack.audioBuffer) {
      state.loadedTrack.audioBuffer = this.generateProceduralTrackAudio(state.loadedTrack);
    }

    const buffer = state.loadedTrack.audioBuffer;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Apply pitch + keyShift
    const pitchMultiplier = Math.pow(2, state.keyShift / 12);
    source.playbackRate.value = state.playbackRate * (state.keyLock ? 1.0 : pitchMultiplier);
    const isProceduralPreview = buffer.duration < state.loadedTrack.duration;
    source.loop = state.isLooping || isProceduralPreview;

    if (state.isLooping && state.loopLength) {
      const beatSec = 60 / (state.loadedTrack.bpm * state.playbackRate);
      const loopDuration = state.loopLength * beatSec;
      source.loopStart = state.currentTime;
      source.loopEnd = Math.min(buffer.duration, state.currentTime + loopDuration);
    }

    source.connect(nodes.trim);

    const offset = this.deckPlayOffsets[targetDeckId] % buffer.duration;
    source.start(0, offset);

    nodes.source = source;
    state.isPlaying = true;
    this.deckStartTimes[targetDeckId] = this.audioContext.currentTime - offset / state.playbackRate;
    this.slipStartTimes[targetDeckId] = this.audioContext.currentTime - offset / state.playbackRate;

    source.onended = () => {
      if (nodes.source === source && !source.loop && !state.isScratching) {
        state.isPlaying = false;
        this.deckPlayOffsets[targetDeckId] = 0;
        state.currentTime = 0;
        this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
      }
    };

    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public pauseDeck(deckId: OpusDeckId | 'A' | 'B') {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    const nodes = this.deckNodes[targetDeckId];

    if (!state.isPlaying) return;

    if (nodes.source) {
      try {
        nodes.source.stop();
        nodes.source.disconnect();
      } catch {
        // ignore
      }
      nodes.source = null;
    }

    state.isPlaying = false;
    this.deckPlayOffsets[targetDeckId] = state.currentTime;

    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public stopDeck(deckId: OpusDeckId | 'A' | 'B') {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    const nodes = this.deckNodes[targetDeckId];

    if (nodes.source) {
      try {
        nodes.source.stop();
        nodes.source.disconnect();
      } catch {
        // ignore
      }
      nodes.source = null;
    }

    state.isPlaying = false;
    state.currentTime = 0;
    this.deckPlayOffsets[targetDeckId] = 0;

    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public cueDeck(deckId: OpusDeckId | 'A' | 'B') {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    if (state.isPlaying) {
      this.pauseDeck(targetDeckId);
      this.seekDeck(targetDeckId, 0);
    } else {
      this.seekDeck(targetDeckId, 0);
      this.playDeck(targetDeckId);
    }
  }

  public seekDeck(deckId: OpusDeckId | 'A' | 'B', timeSec: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    if (!state.loadedTrack || !state.loadedTrack.audioBuffer) return;

    const maxDuration = state.loadedTrack.audioBuffer.duration;
    const clampedTime = Math.max(0, Math.min(maxDuration, timeSec));
    const wasPlaying = state.isPlaying;

    if (wasPlaying) {
      this.pauseDeck(targetDeckId);
      this.deckPlayOffsets[targetDeckId] = clampedTime;
      state.currentTime = clampedTime;
      this.playDeck(targetDeckId);
    } else {
      this.deckPlayOffsets[targetDeckId] = clampedTime;
      state.currentTime = clampedTime;
      this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
    }
  }

  // --- Pitch, Tempo & Key Shift ---
  public setDeckPitch(deckId: OpusDeckId | 'A' | 'B', rate: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.playbackRate = Math.max(0.5, Math.min(2.0, rate));

    const nodes = this.deckNodes[targetDeckId];
    if (nodes.source) {
      const pitchMultiplier = Math.pow(2, state.keyShift / 12);
      nodes.source.playbackRate.setValueAtTime(
        state.playbackRate * (state.keyLock ? 1.0 : pitchMultiplier),
        this.audioContext.currentTime
      );
    }
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public setDeckKeyShift(deckId: OpusDeckId | 'A' | 'B', semitones: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.keyShift = Math.max(-12, Math.min(12, semitones));
    this.setDeckPitch(targetDeckId, state.playbackRate);
  }

  public syncTempo(sourceDeckId: OpusDeckId | 'A' | 'B', targetDeckId: OpusDeckId | 'A' | 'B') {
    const srcId = this.normalizeDeckId(sourceDeckId);
    const tgtId = this.normalizeDeckId(targetDeckId);
    const srcState = this.deckStates[srcId];
    const tgtState = this.deckStates[tgtId];

    if (!srcState.loadedTrack || !tgtState.loadedTrack) return;

    const srcBpm = srcState.loadedTrack.bpm * srcState.playbackRate;
    const tgtBaseBpm = tgtState.loadedTrack.bpm;
    const newRate = srcBpm / tgtBaseBpm;

    this.setDeckPitch(tgtId, newRate);
    tgtState.tempoSync = true;
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: tgtId, state: tgtState } }));
  }

  public setMasterDeck(deckId: OpusDeckId) {
    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((id) => {
      this.deckStates[id].isMasterDeck = id === deckId;
    });
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  // --- Hot Cues & Loops & Pad Modes ---
  public triggerHotCue(deckId: OpusDeckId | 'A' | 'B', cueIndex: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    if (cueIndex < 0 || cueIndex > 7) return;

    const cueTime = state.hotCues[cueIndex];
    if (cueTime !== null && cueTime !== undefined) {
      this.seekDeck(targetDeckId, cueTime);
      if (!state.isPlaying) this.playDeck(targetDeckId);
    } else {
      state.hotCues[cueIndex] = state.currentTime;
      this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
    }
  }

  public clearHotCue(deckId: OpusDeckId | 'A' | 'B', cueIndex: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.hotCues[cueIndex] = null;
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public toggleLoop(deckId: OpusDeckId | 'A' | 'B', beats: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    if (state.isLooping && state.loopLength === beats) {
      state.isLooping = false;
      state.loopLength = null;
    } else {
      state.isLooping = true;
      state.loopLength = beats;
    }

    if (state.isPlaying) {
      const curTime = state.currentTime;
      this.pauseDeck(targetDeckId);
      this.seekDeck(targetDeckId, curTime);
      this.playDeck(targetDeckId);
    } else {
      this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
    }
  }

  public setPadMode(deckId: OpusDeckId | 'A' | 'B', mode: PadMode) {
    const targetDeckId = this.normalizeDeckId(deckId);
    this.deckStates[targetDeckId].padMode = mode;
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state: this.deckStates[targetDeckId] } }));
  }

  public toggleSlipMode(deckId: OpusDeckId | 'A' | 'B') {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.slipMode = !state.slipMode;
    if (state.slipMode && state.isPlaying) {
      this.slipStartTimes[targetDeckId] = this.audioContext.currentTime - state.currentTime / state.playbackRate;
    }
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  // --- Jog Wheel & Scratching ---
  public startScratch(deckId: OpusDeckId | 'A' | 'B') {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.isScratching = true;
    this.scratchOffsets[targetDeckId] = state.currentTime;
  }

  public updateScratch(deckId: OpusDeckId | 'A' | 'B', deltaAngle: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    if (!state.loadedTrack || !state.loadedTrack.audioBuffer) return;

    const timeDelta = (deltaAngle / 360) * (state.jogTension === 'light' ? 2.4 : state.jogTension === 'heavy' ? 1.2 : 1.8);
    const newPos = Math.max(0, Math.min(state.loadedTrack.duration, state.currentTime + timeDelta));
    state.currentTime = newPos;
    this.deckPlayOffsets[targetDeckId] = newPos;

    this.triggerScratchSlice(targetDeckId, newPos, deltaAngle);
  }

  public endScratch(deckId: OpusDeckId | 'A' | 'B', shouldPlay = true) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.isScratching = false;

    if (state.slipMode && state.loadedTrack) {
      // Return seamlessly to uninterrupted track position in slip mode
      const now = this.audioContext.currentTime;
      const elapsed = (now - this.slipStartTimes[targetDeckId]) * state.playbackRate;
      const slipTargetTime = elapsed % state.loadedTrack.duration;
      this.seekDeck(targetDeckId, slipTargetTime);
      if (shouldPlay) this.playDeck(targetDeckId);
      return;
    }

    if (shouldPlay && state.isPlaying) {
      this.seekDeck(targetDeckId, state.currentTime);
      this.playDeck(targetDeckId);
    }
  }

  private triggerScratchSlice(deckId: OpusDeckId, pos: number, delta: number) {
    const state = this.deckStates[deckId];
    if (!state.loadedTrack || !state.loadedTrack.audioBuffer) return;

    try {
      const nodes = this.deckNodes[deckId];
      const sliceSource = this.audioContext.createBufferSource();
      sliceSource.buffer = state.loadedTrack.audioBuffer;
      const pitchVar = Math.max(0.2, Math.min(3.0, Math.abs(delta) / 10));
      sliceSource.playbackRate.value = pitchVar;

      const sliceGain = this.audioContext.createGain();
      sliceGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      sliceGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);

      sliceSource.connect(sliceGain);
      sliceGain.connect(nodes.trim);

      sliceSource.start(0, pos, 0.08);
    } catch {
      // ignore
    }
  }

  // --- Mixer Controls: EQs, Sound Color FX, Trims & Volumes ---
  public setDeckTrim(deckId: OpusDeckId | 'A' | 'B', trimDb: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.trim = Math.max(-12, Math.min(12, trimDb));
    const gainValue = Math.pow(10, state.trim / 20);
    this.deckNodes[targetDeckId].trim.gain.setValueAtTime(gainValue, this.audioContext.currentTime);
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public setDeckVolume(deckId: OpusDeckId | 'A' | 'B', vol: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.volume = Math.max(0, Math.min(1.5, vol));
    const nodes = this.deckNodes[targetDeckId];
    nodes.channelVolume.gain.setValueAtTime(state.volume, this.audioContext.currentTime);

    // Smooth Echo trigger on channel fader fast cut
    if (this.opusPerformanceState.smoothEchoActive && vol < 0.05 && state.isPlaying) {
      this.triggerSmoothEcho(targetDeckId);
    }

    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public setDeckEq(deckId: OpusDeckId | 'A' | 'B', band: 'low' | 'mid' | 'high', gainDb: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    const clamped = Math.max(-26, Math.min(6, gainDb));
    const nodes = this.deckNodes[targetDeckId];

    if (band === 'low') {
      state.lowEq = clamped;
      nodes.eqLow.gain.setValueAtTime(clamped, this.audioContext.currentTime);
    } else if (band === 'mid') {
      state.midEq = clamped;
      nodes.eqMid.gain.setValueAtTime(clamped, this.audioContext.currentTime);
    } else if (band === 'high') {
      state.highEq = clamped;
      nodes.eqHigh.gain.setValueAtTime(clamped, this.audioContext.currentTime);
    }

    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public setSoundColorFxType(fx: SoundColorFxType) {
    this.opusPerformanceState.selectedSoundColorFx = fx;
    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((id) => {
      this.applySoundColorFx(id);
    });
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  public setDeckColorFx(deckId: OpusDeckId | 'A' | 'B', val: number) {
    const targetDeckId = this.normalizeDeckId(deckId);
    const state = this.deckStates[targetDeckId];
    state.colorFxValue = Math.max(-100, Math.min(100, val));
    this.applySoundColorFx(targetDeckId);
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId: targetDeckId, state } }));
  }

  public setDeckFilter(deckId: OpusDeckId | 'A' | 'B', val: number) {
    // Alias for Sound Color FX filter knob
    this.setDeckColorFx(deckId, val);
  }

  private applySoundColorFx(deckId: OpusDeckId) {
    const state = this.deckStates[deckId];
    const nodes = this.deckNodes[deckId];
    const val = state.colorFxValue;
    const fxType = this.opusPerformanceState.selectedSoundColorFx;
    const t = this.audioContext.currentTime;

    if (val === 0) {
      nodes.colorFilter.type = 'allpass';
      nodes.colorFilter.frequency.setValueAtTime(1000, t);
      return;
    }

    if (fxType === 'filter' || fxType === 'sweep') {
      if (val < 0) {
        // Low pass filter
        nodes.colorFilter.type = 'lowpass';
        const freq = 20000 * Math.pow(1 + val / 100, 2);
        nodes.colorFilter.frequency.setValueAtTime(Math.max(80, freq), t);
        nodes.colorFilter.Q.setValueAtTime(fxType === 'sweep' ? 3.5 : 1.8, t);
      } else {
        // High pass filter
        nodes.colorFilter.type = 'highpass';
        const freq = 20 + 4000 * Math.pow(val / 100, 2);
        nodes.colorFilter.frequency.setValueAtTime(freq, t);
        nodes.colorFilter.Q.setValueAtTime(fxType === 'sweep' ? 3.5 : 1.8, t);
      }
    } else if (fxType === 'dub_echo' || fxType === 'space') {
      // Reverb / Echo resonance band
      nodes.colorFilter.type = 'peaking';
      nodes.colorFilter.frequency.setValueAtTime(Math.abs(val) * 35 + 200, t);
      nodes.colorFilter.gain.setValueAtTime(Math.abs(val) * 0.12, t);
    } else if (fxType === 'crush' || fxType === 'noise') {
      // High sizzle / crush
      nodes.colorFilter.type = 'bandpass';
      nodes.colorFilter.frequency.setValueAtTime(Math.abs(val) * 50 + 400, t);
      nodes.colorFilter.Q.setValueAtTime(2.5, t);
    }
  }

  // --- Beat FX Processor ---
  public setBeatFxType(type: BeatFxType) {
    this.opusPerformanceState.beatFx.type = type;
    this.updateBeatFxParameters();
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  public setBeatFxBeatFraction(fraction: number) {
    this.opusPerformanceState.beatFx.beatFraction = fraction;
    this.updateBeatFxParameters();
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  public setBeatFxDepth(depth: number) {
    this.opusPerformanceState.beatFx.depth = Math.max(0, Math.min(1, depth));
    this.fxReturnGain.gain.setValueAtTime(this.opusPerformanceState.beatFx.depth * 0.9, this.audioContext.currentTime);
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  public toggleBeatFx(forceActive?: boolean) {
    if (forceActive !== undefined) {
      this.opusPerformanceState.beatFx.active = forceActive;
    } else {
      this.opusPerformanceState.beatFx.active = !this.opusPerformanceState.beatFx.active;
    }
    const active = this.opusPerformanceState.beatFx.active;
    this.fxSendGain.gain.setValueAtTime(active ? 1.0 : 0.0, this.audioContext.currentTime);
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  private updateBeatFxParameters() {
    const masterDeck = Object.values(this.deckStates).find((d) => d.isMasterDeck && d.isPlaying) || this.deckStates['1'];
    const bpm = masterDeck?.loadedTrack?.bpm ? masterDeck.loadedTrack.bpm * masterDeck.playbackRate : 128;
    const beatSec = 60 / bpm;
    const delaySec = Math.max(0.01, Math.min(3.5, beatSec * this.opusPerformanceState.beatFx.beatFraction));
    this.opusPerformanceState.beatFx.timeMs = Math.round(delaySec * 1000);

    this.fxDelayNode.delayTime.setValueAtTime(delaySec, this.audioContext.currentTime);
  }

  // --- XY-Pad Touch FX Modulation ---
  public setTouchXy(x: number, y: number, active: boolean) {
    this.opusPerformanceState.touchXy.x = Math.max(0, Math.min(1, x));
    this.opusPerformanceState.touchXy.y = Math.max(0, Math.min(1, y));
    this.opusPerformanceState.touchXy.active = active;

    if (active) {
      const activeLeft = this.opusPerformanceState.activeLeftDeck;
      const filterVal = (x - 0.5) * 200; // -100 to +100
      this.setDeckColorFx(activeLeft, filterVal);
      this.setBeatFxDepth(y);
    }
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  // --- Smooth Echo Trigger ---
  public triggerSmoothEcho(deckId: OpusDeckId) {
    const nodes = this.deckNodes[deckId];
    try {
      nodes.channelVolume.connect(this.fxSendGain);
      this.fxSendGain.gain.setValueAtTime(1.0, this.audioContext.currentTime);
      this.fxSendGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2.5);
    } catch {
      // ignore
    }
  }

  // --- Crossfader Routing & Assignment ---
  public setCrossfaderAssign(deckId: OpusDeckId, assign: 'A' | 'THRU' | 'B') {
    this.deckStates[deckId].crossfaderAssign = assign;
    this.updateCrossfader(this.crossfaderPosition);
    this.dispatchEvent(new CustomEvent('deck-state-changed', { detail: { deckId, state: this.deckStates[deckId] } }));
  }

  public updateCrossfader(pos: number) {
    this.crossfaderPosition = Math.max(-1.0, Math.min(1.0, pos));
    const normalized = (this.crossfaderPosition + 1) / 2; // 0.0 (A) to 1.0 (B)

    let gainA = 1.0;
    let gainB = 1.0;

    if (this.crossfaderCurve === 'smooth') {
      gainA = Math.cos(normalized * 0.5 * Math.PI);
      gainB = Math.sin(normalized * 0.5 * Math.PI);
    } else if (this.crossfaderCurve === 'linear') {
      gainA = Math.max(0, 1.0 - normalized);
      gainB = Math.max(0, normalized);
    } else if (this.crossfaderCurve === 'scratch') {
      gainA = normalized > 0.9 ? Math.max(0, (1 - normalized) * 10) : 1.0;
      gainB = normalized < 0.1 ? Math.max(0, normalized * 10) : 1.0;
    }

    const t = this.audioContext.currentTime;

    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((id) => {
      const state = this.deckStates[id];
      const nodes = this.deckNodes[id];
      let finalGain = 1.0;

      if (state.crossfaderAssign === 'A') {
        finalGain = gainA;
      } else if (state.crossfaderAssign === 'B') {
        finalGain = gainB;
      } else {
        finalGain = 1.0; // THRU
      }

      nodes.crossfadeAssignGain.gain.setValueAtTime(finalGain, t);
    });

    this.dispatchEvent(new CustomEvent('crossfader-changed', { detail: this.crossfaderPosition }));
  }

  public setCrossfaderCurve(curve: 'smooth' | 'linear' | 'scratch' | 'cut') {
    this.crossfaderCurve = curve;
    this.updateCrossfader(this.crossfaderPosition);
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1.5, vol));
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
  }

  public setBoothVolume(vol: number) {
    this.boothVolume = Math.max(0, Math.min(1.5, vol));
  }

  public setHeadphonesMix(mix: number) {
    this.headphonesMix = Math.max(0, Math.min(1.0, mix));
  }

  public setHeadphonesLevel(level: number) {
    this.headphonesLevel = Math.max(0, Math.min(1.5, level));
  }

  // --- Pioneer OPUS-QUAD Versatile Zone Output (Multi-Room Venue Audio) ---
  public setZoneSource(source: '1' | '2' | '3' | '4' | 'master' | 'lounge_stream') {
    this.opusPerformanceState.zone.source = source;
    this.applyZoneRouting();
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  public setZoneVolume(vol: number) {
    this.opusPerformanceState.zone.volume = Math.max(0, Math.min(1.5, vol));
    this.zoneGain.gain.setValueAtTime(this.opusPerformanceState.zone.volume, this.audioContext.currentTime);
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  public setZoneEq(band: 'low' | 'high', valDb: number) {
    if (band === 'low') {
      this.opusPerformanceState.zone.eqLow = valDb;
      this.zoneEqLow.gain.setValueAtTime(valDb, this.audioContext.currentTime);
    } else {
      this.opusPerformanceState.zone.eqHigh = valDb;
      this.zoneEqHigh.gain.setValueAtTime(valDb, this.audioContext.currentTime);
    }
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  public toggleZonePlayback() {
    this.opusPerformanceState.zone.isPlaying = !this.opusPerformanceState.zone.isPlaying;
    this.applyZoneRouting();
    this.dispatchEvent(new CustomEvent('opus-state-changed', { detail: this.opusPerformanceState }));
  }

  private applyZoneRouting() {
    const src = this.opusPerformanceState.zone.source;
    if (!this.opusPerformanceState.zone.isPlaying) {
      if (this.zoneAmbientSource) {
        try {
          this.zoneAmbientSource.stop();
        } catch {
          // ignore
        }
        this.zoneAmbientSource = null;
      }
      return;
    }

    if (src === 'lounge_stream') {
      if (!this.zoneAmbientSource) {
        const ambientBuf = this.generateLoungeAmbientBuffer();
        const s = this.audioContext.createBufferSource();
        s.buffer = ambientBuf;
        s.loop = true;
        s.connect(this.zoneGain);
        s.start(0);
        this.zoneAmbientSource = s;
      }
    } else if (src === 'master') {
      this.masterGain.connect(this.zoneGain);
    } else {
      const deckNodes = this.deckNodes[src as OpusDeckId];
      if (deckNodes) {
        deckNodes.channelVolume.connect(this.zoneGain);
      }
    }
  }

  // --- Audio Hijack Live Sapp Destination ---
  public async startAudioHijack(sourceType: 'microphone' | 'system_tab' = 'microphone') {
    await this.resumeContext();
    try {
      if (this.hijackMediaStream) {
        this.stopAudioHijack();
      }

      let stream: MediaStream;
      if (sourceType === 'system_tab' && navigator.mediaDevices.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      }

      this.hijackMediaStream = stream;
      this.hijackStreamSource = this.audioContext.createMediaStreamSource(stream);
      this.hijackStreamSource.connect(this.hijackGainNode);

      this.applyHijackRouting();

      this.hijackSession = {
        isActive: true,
        sourceType,
        streamName: sourceType === 'system_tab' ? 'System / Tab Audio Hijack' : 'Live Mic / Hardware Input',
        connectedAt: Date.now(),
        inputGain: 1.0,
        noiseGate: true,
        monitoring: true,
        routeToDeck: this.hijackSession.routeToDeck || '1',
      };

      const hijackTrack: DeckTrackState = {
        id: `hijack-live-${Date.now()}`,
        title: `🔴 Live Audio Hijack (${sourceType === 'system_tab' ? 'System Stream' : 'Mic/Line'})`,
        artist: 'iDj.pro Audio Ingest Sapp',
        source: 'hijack',
        duration: 9999,
        bpm: 128,
        key: 'Live',
        audioBuffer: null,
        artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
      };

      const target = this.hijackSession.routeToDeck;
      if (target === '1' || target === 'A' || target === 'all') {
        this.deckStates['1'].loadedTrack = hijackTrack;
        this.deckStates['1'].isPlaying = true;
      }
      if (target === '2' || target === 'B' || target === 'all') {
        this.deckStates['2'].loadedTrack = hijackTrack;
        this.deckStates['2'].isPlaying = true;
      }

      TrackHistoryService.getInstance().logTrack(hijackTrack, 'hijack');
      this.dispatchEvent(new CustomEvent('hijack-session-changed', { detail: this.hijackSession }));
      return true;
    } catch (err) {
      console.warn('Audio hijack capture error:', err);
      this.stopAudioHijack();
      throw err;
    }
  }

  public stopAudioHijack() {
    if (this.hijackMediaStream) {
      this.hijackMediaStream.getTracks().forEach((t) => t.stop());
      this.hijackMediaStream = null;
    }
    if (this.hijackStreamSource) {
      try {
        this.hijackStreamSource.disconnect();
      } catch {
        // ignore
      }
      this.hijackStreamSource = null;
    }

    this.hijackSession = {
      ...this.hijackSession,
      isActive: false,
      connectedAt: null,
    };

    this.dispatchEvent(new CustomEvent('hijack-session-changed', { detail: this.hijackSession }));
  }

  public setHijackRouting(route: AudioHijackSession['routeToDeck']) {
    this.hijackSession.routeToDeck = route;
    this.applyHijackRouting();
    this.dispatchEvent(new CustomEvent('hijack-session-changed', { detail: this.hijackSession }));
  }

  private applyHijackRouting() {
    if (!this.hijackGainNode) return;
    try {
      this.hijackGainNode.disconnect();
      this.hijackGainNode.connect(this.hijackAnalyserNode);

      const route = this.hijackSession.routeToDeck;
      if (route === '1' || route === 'A') {
        this.hijackGainNode.connect(this.deckNodes['1'].trim);
      } else if (route === '2' || route === 'B') {
        this.hijackGainNode.connect(this.deckNodes['2'].trim);
      } else if (route === '3') {
        this.hijackGainNode.connect(this.deckNodes['3'].trim);
      } else if (route === '4') {
        this.hijackGainNode.connect(this.deckNodes['4'].trim);
      } else if (route === 'zone_output') {
        this.hijackGainNode.connect(this.zoneGain);
      } else {
        this.hijackGainNode.connect(this.masterGain);
      }
    } catch {
      // ignore
    }
  }

  // --- Analyser Meters ---
  public getDeckLevel(deckId: OpusDeckId | 'A' | 'B'): number {
    const targetDeckId = this.normalizeDeckId(deckId);
    const analyser = this.deckNodes[targetDeckId].analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255);
  }

  public getMasterLevel(): number {
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255);
  }

  public getZoneLevel(): number {
    const data = new Uint8Array(this.zoneAnalyser.frequencyBinCount);
    this.zoneAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255);
  }

  private normalizeDeckId(id: OpusDeckId | 'A' | 'B'): OpusDeckId {
    if (id === 'A') return '1';
    if (id === 'B') return '2';
    return id;
  }

  // --- Realtime Playback Animation Loop ---
  private startPlaybackLoop() {
    const update = () => {
      (['1', '2', '3', '4'] as OpusDeckId[]).forEach((deckId) => {
        const state = this.deckStates[deckId];

        if (state.isPlaying && !state.isScratching && state.loadedTrack && state.loadedTrack.audioBuffer) {
          const now = this.audioContext.currentTime;
          const elapsed = (now - this.deckStartTimes[deckId]) * state.playbackRate;
          const totalDur = state.loadedTrack.audioBuffer.duration;

          if (state.isLooping && state.loopLength) {
            const beatSec = 60 / (state.loadedTrack.bpm * state.playbackRate);
            const loopDur = state.loopLength * beatSec;
            const loopStart = this.deckPlayOffsets[deckId] % totalDur;
            const loopPos = loopStart + (elapsed % loopDur);
            state.currentTime = loopPos % totalDur;
          } else if (this.deckNodes[deckId].source?.loop) {
            state.currentTime = (this.deckPlayOffsets[deckId] + elapsed) % totalDur;
          } else {
            state.currentTime = Math.min(totalDur, this.deckPlayOffsets[deckId] + elapsed);
          }
        }
      });

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  // --- Seed Initial Default Opus Quad Demo Tracks ---
  private seedDefaultTracks() {
    const demoTracks: DeckTrackState[] = [
      {
        id: 'opus-demo-1',
        title: 'Sunset Horizon (Opus Festival Mix)',
        artist: 'iDj.pro All-Star Residents',
        source: 'usb_1',
        duration: 210,
        bpm: 126,
        key: '8A (Am)',
        audioBuffer: null,
        artworkUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80',
        genre: 'Melodic House',
      },
      {
        id: 'opus-demo-2',
        title: 'Tokyo Neon Cyber Drive',
        artist: 'DJ Digital Pro • Rekordbox Prime',
        source: 'usb_2',
        duration: 195,
        bpm: 128,
        key: '11B (A)',
        audioBuffer: null,
        artworkUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=150&auto=format&fit=crop&q=80',
        genre: 'Tech Trance',
      },
      {
        id: 'opus-demo-3',
        title: 'Deep Velvet (Zone Lounge VIP)',
        artist: 'Café Del Mar Collective',
        source: 'cloud',
        duration: 240,
        bpm: 118,
        key: '5A (Cm)',
        audioBuffer: null,
        artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
        genre: 'Organic Lounge',
      },
      {
        id: 'opus-demo-4',
        title: 'Subterranean Groove (4-Deck Stems)',
        artist: 'Serato DJ Pro Masters',
        source: 'usb_3_usbc',
        duration: 180,
        bpm: 130,
        key: '9A (Em)',
        audioBuffer: null,
        artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
        genre: 'Peak Tech House',
      },
    ];

    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((deckId, index) => {
      this.deckStates[deckId].loadedTrack = demoTracks[index];
      this.deckStates[deckId].currentTime = 0;
      this.deckPlayOffsets[deckId] = 0;
    });
  }

  // --- Procedural High-Quality Demo Track Audio Generator ---
  public synthesizeElectronicTrackAudio(
    bpm: number = 128,
    duration: number = 180,
    source: string = 'beatport'
  ): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const dur = Math.min(PROCEDURAL_LOOP_SECONDS, Math.max(4, duration));
    const numFrames = Math.floor(sampleRate * dur);
    const buffer = this.audioContext.createBuffer(2, numFrames, sampleRate);
    const chL = buffer.getChannelData(0);
    const chR = buffer.getChannelData(1);

    const bps = bpm / 60;
    const beatSamples = sampleRate / bps;

    // Source sound palette variations
    const isDnB = bpm > 160;
    const isTech = bpm >= 124 && bpm <= 135;

    for (let i = 0; i < numFrames; i++) {
      const time = i / sampleRate;
      const beatProgress = (i % beatSamples) / beatSamples;
      const isKick = isDnB
        ? (beatProgress < 0.1 || ((i + beatSamples * 0.75) % beatSamples) / beatSamples < 0.1)
        : beatProgress < 0.14;

      // 1. Kick Drum
      let kick = 0;
      if (isKick) {
        const kickEnv = Math.exp(-beatProgress * 26);
        const kickFreq = 150 * Math.exp(-beatProgress * 24) + 40;
        kick = Math.sin(2 * Math.PI * kickFreq * time) * kickEnv * 0.78;
      }

      // 2. Sub & Bassline
      const bassNote = Math.floor(time * bps * 2) % 8;
      const bassFreqs = isDnB ? [43.65, 43.65, 51.9, 43.65] : [55, 55, 65.4, 55, 73.4, 55, 65.4, 82.4];
      const bFreq = bassFreqs[bassNote % bassFreqs.length];
      const bassEnv = Math.exp(-((i % (beatSamples / 2)) / (beatSamples / 2)) * 5.5);
      const bass = (Math.sin(2 * Math.PI * bFreq * time) + 0.3 * Math.sin(4 * Math.PI * bFreq * time)) * bassEnv * 0.44;

      // 3. Hi-Hats
      const offbeatProgress = ((i + beatSamples / 2) % beatSamples) / beatSamples;
      let hihat = 0;
      if (offbeatProgress < 0.12) {
        const noise = Math.random() * 2 - 1;
        hihat = noise * Math.exp(-offbeatProgress * 36) * 0.28;
      }

      // 4. Synth Arp / Stabs
      const chordNotes = isTech ? [220, 261.63, 329.63, 392.0] : [261.63, 329.63, 392.0, 523.25];
      const arpIdx = Math.floor(time * bps * 4) % chordNotes.length;
      const arpFreq = chordNotes[arpIdx];
      const arpEnv = Math.exp(-((i % (beatSamples / 4)) / (beatSamples / 4)) * 7.5);
      const arp = Math.sin(2 * Math.PI * arpFreq * time) * arpEnv * 0.22;

      chL[i] = Math.max(-0.98, Math.min(0.98, kick + bass + hihat * 0.9 + arp * 0.7));
      chR[i] = Math.max(-0.98, Math.min(0.98, kick + bass + hihat * 1.1 + arp * 1.2));
    }

    return buffer;
  }

  private generateProceduralTrackAudio(track: DeckTrackState): AudioBuffer {
    return this.synthesizeElectronicTrackAudio(track.bpm || 128, PROCEDURAL_LOOP_SECONDS, track.source);
  }

  // --- Procedural Lounge Ambient Buffer for Zone Output ---
  private generateLoungeAmbientBuffer(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 120;
    const numFrames = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, numFrames, sampleRate);
    const chL = buffer.getChannelData(0);
    const chR = buffer.getChannelData(1);

    const bps = 110 / 60;
    const beatSamples = sampleRate / bps;

    for (let i = 0; i < numFrames; i++) {
      const time = i / sampleRate;
      const beatProgress = (i % beatSamples) / beatSamples;

      // Soft warm kick
      let kick = 0;
      if (beatProgress < 0.1) {
        kick = Math.sin(2 * Math.PI * 65 * time) * Math.exp(-beatProgress * 15) * 0.4;
      }

      // Ambient Lush Rhodes chords
      const chord = Math.sin(2 * Math.PI * 220 * time) * 0.15 + Math.sin(2 * Math.PI * 330 * time) * 0.12;

      chL[i] = kick + chord * 0.8;
      chR[i] = kick + chord * 1.2;
    }

    return buffer;
  }
}
