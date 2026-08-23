/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export interface Prompt {
  readonly promptId: string;
  text: string;
  weight: number;
  cc: number;
  color: string;
}

export interface ControlChange {
  channel: number;
  cc: number;
  value: number;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer?: string;
  state: 'disconnected' | 'connected' | string;
  connection: 'open' | 'closed' | 'pending' | string;
  type?: 'input' | 'output';
}

export interface MidiFeedbackMapping {
  enabled: boolean;
  activeOutputId: string | null;
  sendStemLevels: boolean;
  sendEqKills: boolean;
  sendTransportLeds: boolean;
  sendVuMeters: boolean;
}

export interface StemAutoGainSafeguardState {
  enabled: boolean;
  limiterActive: boolean;
  rmsAttenuationDb: number;
  peakHeadroomMarginDb: number;
  dynamicCompressorThresholdDb: number;
  preventedClipsCount: number;
}

export type PerformanceSlidingDrawer = 'none' | 'prompts' | 'midi' | 'ai_logs' | 'crate_browser';

export interface PerformanceModeConfig {
  isPerformanceMode: boolean;
  activeDrawer: PerformanceSlidingDrawer;
  isSplitScreenActive: boolean;
  splitDecks: ['1' | '3', '2' | '4'];
  isTabletOrientationNoticeDismissed: boolean;
}

export type MidiAccessStatus = 'unrequested' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'blocked_by_os';

export interface MidiPermissionDetails {
  status: MidiAccessStatus;
  canRequest: boolean;
  devicesFound: number;
  activeDeviceId: string | null;
  errorMessage?: string;
  remedyAction?: string;
  osPromptState?: 'prompt' | 'granted' | 'denied' | 'unsupported';
}

export type AudioDspMode = 'audioworklet' | 'web_audio_fallback';

export interface BufferPoolMetrics {
  totalPooledBuffers: number;
  totalPooledMemoryBytes: number;
  pooledAllocationsCount: number;
  recycledHitsCount: number;
  lastGcCycleTimestamp: number | null;
  gcCyclesCompleted: number;
}

export interface AudioEngineHealth {
  state: 'running' | 'suspended' | 'interrupted' | 'closed' | 'error';
  sampleRate: number;
  currentTime: number;
  dspMode: AudioDspMode;
  audioWorkletActive: boolean;
  lastSuspendedTime: number | null;
  autoResumeCount: number;
  hasCrashRecoveryActive: boolean;
  bufferPoolMetrics?: BufferPoolMetrics;
  midiLatencyOffsetMs?: number;
}

export interface LatencyCalibrationState {
  isActive: boolean;
  measuredOffsetMs: number;
  appliedOffsetMs: number;
  jitterVarianceMs: number;
  sampleCount: number;
  targetBpm: number;
  isCalibrating: boolean;
  history: number[];
}

export interface SerializedDeckSnapshot {
  deckId: OpusDeckId;
  loadedTrack: {
    id: string;
    title: string;
    artist: string;
    source: AudioSourceType;
    sourceUrl?: string;
    duration: number;
    bpm: number;
    key: string;
    artworkUrl?: string;
    genre?: string;
    isProceduralFallback?: boolean;
  } | null;
  currentTime: number;
  playbackRate: number;
  pitchRange: 6 | 10 | 16 | 100;
  keyShift: number;
  keyLock: boolean;
  tempoSync: boolean;
  volume: number;
  trim: number;
  lowEq: number;
  midEq: number;
  highEq: number;
  colorFxValue: number;
  filter: number;
  hotCues: (number | null)[];
  loopLength: number | null;
  isLooping: boolean;
  jogMode: 'vinyl' | 'cdj';
  padMode: PadMode;
  crossfaderAssign: 'A' | 'THRU' | 'B';
  cueHeadphones: boolean;
}

export interface SerializedDjSession {
  version: number;
  savedAt: number;
  decks: Record<OpusDeckId, SerializedDeckSnapshot>;
  deckStems: Record<OpusDeckId, DeckStemsState>;
  mixer: {
    crossfaderPosition: number;
    crossfaderCurve: 'linear' | 'scratch' | 'smooth' | 'cut';
    masterVolume: number;
    boothVolume: number;
    headphonesMix: number;
    headphonesLevel: number;
  };
  opusPerformanceState: OpusQuadPerformanceState;
  prompts: Prompt[];
  latencyOffsetMs: number;
  activeView: string;
}

export type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused';

export type ElementType = 'full' | 'drums' | 'bass' | 'melody' | 'vocal' | 'ambient';

export interface AudioTrackInfo {
  id: string;
  name: string;
  file?: File;
  audioBuffer: AudioBuffer | null;
  duration: number;
  volume: number; // 0.0 to 1.5
  pan: number; // -1.0 (Left) to +1.0 (Right)
  muted: boolean;
  solo: boolean;
  lowGain: number; // -24dB to +12dB
  midGain: number; // -24dB to +12dB
  highGain: number; // -24dB to +12dB
  elementType: ElementType;
  filterCutoff: number; // Hz (20 to 20000)
  playbackRate: number; // 0.5 to 2.0
  color: string;
  midiCcVolume?: number;
  midiCcPan?: number;
}

export type IDproiPreset = 'signature' | 'club_punch' | 'radio_clarity' | 'tape_warmth' | 'spatial_air' | 'bass_maximizer';

export interface IDproiMixdownConfig {
  enabled: boolean;
  preset: IDproiPreset;
  intensity: number; // 0 to 100%
  warmthDrive: number; // 0 to 10
  stereoWidth: number; // 0 to 200%
  punchExciter: number; // 0 to 100%
  limiterCeiling: number; // dB (-0.1 to -2.0)
}

// User Profile & Authentication Types
export interface CustomDecal {
  id: string;
  name: string;
  imageUrl: string;
  type: 'vinyl_label' | 'slipmat' | 'skin';
  isBuiltIn?: boolean;
  category?: string;
}

// Real-Time Stem Separation Types
export interface DeckStemsState {
  vocalVolume: number; // 0.0 to 1.5
  vocalMuted: boolean;
  vocalSolo: boolean;
  vocalFx: 'none' | 'echo' | 'reverb' | 'pitch_shift';

  drumsVolume: number;
  drumsMuted: boolean;
  drumsSolo: boolean;
  drumsFx: 'none' | 'filter' | 'roll' | 'crush';

  bassVolume: number;
  bassMuted: boolean;
  bassSolo: boolean;
  bassFx: 'none' | 'sub_boost' | 'ducking';

  melodyVolume: number;
  melodyMuted: boolean;
  melodySolo: boolean;
  melodyFx: 'none' | 'flanger' | 'space';

  activeAcapella: boolean;
  activeInstrumental: boolean;
}

// Video & Karaoke Mixing Types
export interface VideoVisualState {
  deckId: OpusDeckId;
  mode: 'track_video' | 'visualizer' | 'cdg_karaoke' | 'shader_synth';
  shaderPreset: 'cyber_neon' | 'audio_tunnel' | 'synthwave_grid' | 'spectrum_aurora' | 'liquid_plasma' | 'retro_vhs';
  videoUrl?: string;
  opacity: number; // 0 to 1.0
  speed: number;
  effect: 'none' | 'glitch' | 'strobe' | 'rgb_split' | 'kaleidoscope' | 'mirror';
}

export interface KaraokeLyricLine {
  time: number; // seconds
  text: string;
  duration: number;
}

export interface KaraokeState {
  enabled: boolean;
  songTitle: string;
  artist: string;
  currentLyricIndex: number;
  lyrics: KaraokeLyricLine[];
  keyShift: number; // -6 to +6 semitones
  vocalCutActive: boolean;
  guideMelody: boolean;
  nextSingerName: string;
  singerQueue: { name: string; song: string; keyOffset: number }[];
}

export interface VideoMixerMasterState {
  crossfaderPosition: number; // -1.0 to +1.0
  transitionEffect: 'dissolve' | 'wipe_left' | 'wipe_up' | 'additive' | 'glitch_cut' | 'luma_key' | 'motion_zoom';
  audioReactiveZoom: boolean;
  strobeOnBeat: boolean;
  overlayLogo: boolean;
  overlayText: string;
  isExternalWindowOpen: boolean;
}

// Hardware Compatibility & MIDI Controller Types
export type HardwareControllerPreset =
  | 'opus_quad'
  | 'cdj_3000_djm_a9'
  | 'ddj_flx10'
  | 'ddj_flx4'
  | 'ddj_rev7'
  | 'denon_prime4'
  | 'denon_sc6000'
  | 'rane_four'
  | 'traktor_s4mk3'
  | 'hercules_t7'
  | 'numark_mixstream'
  | 'custom_generic';

export interface HardwareProfile {
  id: HardwareControllerPreset;
  name: string;
  brand: string;
  workflow: 'club_flagship' | 'mobile_performer' | 'battle_scratch' | 'all_in_one_standalone' | 'custom_modular';
  channels: 2 | 4;
  motorizedPlatters: boolean;
  dedicatedStemButtons: boolean;
  displayScreens: boolean;
  description: string;
  jogWheelSensitivity: number;
  pitchFaderRange: 6 | 10 | 16 | 100;
  mappingNotes: string[];
}

// AI-Driven Performance Tools Types
export interface TrackPhraseAnalysis {
  introBars: number;
  dropTime: number;
  breakdownTime: number;
  outroTime: number;
  energyScore: number; // 1 to 10
  suggestedMixInCue: number;
  suggestedMixOutCue: number;
}

export interface AiPerformanceToolsState {
  autoCuePointsEnabled: boolean;
  smartEnergyTransitions: boolean;
  harmonicMatchMode: 'exact' | 'energy_plus_1' | 'energy_plus_2' | 'energy_drop' | 'relative' | 'fifth';
  stemAutoMashup: boolean;
  dynamicRiserFx: boolean;
  vocalClashDetector: boolean;
  detectedPhrases: Record<string, TrackPhraseAnalysis>;
}

export interface UserProfile {
  id: string;
  name: string;
  djAlias: string;
  email: string;
  avatarUrl: string;
  isGuest: boolean;
  bio: string;
  genre: string;
  socials: {
    spotify?: string;
    soundcloud?: string;
    instagram?: string;
    mixcloud?: string;
  };
  customDecals: CustomDecal[];
  createdAt: number;
}

// Virtual Decks & DJ Performance Types
export type DeckId = '1' | '2' | '3' | '4' | 'A' | 'B';
export type OpusDeckId = '1' | '2' | '3' | '4';
export type AudioSourceType =
  | 'spotify'
  | 'apple_music'
  | 'mixcloud'
  | 'beatport'
  | 'file'
  | 'google_drive'
  | 'hijack'
  | 'ai_gen'
  | 'cloud'
  | 'cloud_library'
  | 'usb_1'
  | 'usb_2'
  | 'usb_3'
  | 'usb_3_usbc'
  | 'bluetooth'
  | 'rekordbox'
  | 'serato';

export type BeatFxType = 'delay' | 'echo' | 'pingpong' | 'spiral' | 'reverb' | 'shimmer' | 'flanger' | 'phaser' | 'pitch' | 'slip_roll' | 'roll' | 'filter' | 'trans' | 'helix';
export type SoundColorFxType = 'space' | 'dub_echo' | 'sweep' | 'noise' | 'crush' | 'filter';
export type OpusMediaSource = 'usb_1' | 'usb_2' | 'usb_3_usbc' | 'bluetooth' | 'cloud' | 'google_drive' | 'rekordbox' | 'serato' | 'beatport' | 'hijack';
export type PadMode = 'hot_cue' | 'beat_loop' | 'beat_jump' | 'key_shift';

export interface DeckTrackState {
  id: string;
  title: string;
  artist: string;
  source: AudioSourceType;
  sourceUrl?: string;
  duration: number;
  bpm: number;
  key: string;
  audioBuffer: AudioBuffer | null;
  artworkUrl?: string;
  waveformPeaks?: number[];
  color?: string;
  genre?: string;
  rating?: number;
  album?: string;
  label?: string;
  remix?: string;
  catalogNumber?: string;
  energyRating?: number;
  isProceduralFallback?: boolean;
  remoteStemStatus?: 'ready' | 'loading' | 'fallback_procedural';
}

export interface VirtualDeckState {
  deckId: OpusDeckId;
  loadedTrack: DeckTrackState | null;
  isPlaying: boolean;
  isCueing: boolean;
  currentTime: number;
  playbackRate: number; // pitch offset: 0.92 to 1.08
  pitchRange: 6 | 10 | 16 | 100; // ±6%, ±10%, ±16%, WIDE
  tempoSync: boolean;
  keyLock: boolean;
  keyShift: number; // -12 to +12 semitones
  isMasterDeck: boolean;
  volume: number; // 0 to 1.5
  trim: number; // -12 to +12 dB
  lowEq: number; // -26 to +6 dB (isolator)
  midEq: number;
  highEq: number;
  colorFxValue: number; // -100 to +100
  colorFxParameter: number; // 0 to 100%
  filter: number; // -100 to +100
  activeDecal: CustomDecal;
  hotCues: (number | null)[];
  loopLength: number | null; // e.g. 0.25, 0.5, 1, 2, 4, 8, 16, 32 beats
  isLooping: boolean;
  isScratching: boolean;
  scratchPosition: number;
  jogMode: 'vinyl' | 'cdj';
  jogTension: 'light' | 'normal' | 'heavy';
  slipMode: boolean;
  slipPlaybackOffset?: number;
  padMode: PadMode;
  crossfaderAssign: 'A' | 'THRU' | 'B';
  cueHeadphones: boolean;
  inputSource: OpusMediaSource;
}

export interface OpusZoneState {
  enabled: boolean;
  source: '1' | '2' | '3' | '4' | 'master' | 'lounge_stream';
  volume: number; // 0.0 to 1.2
  eqLow: number; // -12 to +6 dB
  eqHigh: number; // -12 to +6 dB
  isPlaying: boolean;
  activeTrackName: string;
}

export interface OpusQuadBeatFxState {
  type: BeatFxType;
  active: boolean;
  channel: '1' | '2' | '3' | '4' | 'cross_a' | 'cross_b' | 'master' | 'mic';
  beatFraction: number; // 0.0625, 0.125, 0.25, 0.5, 0.75, 1, 2, 4, 8
  depth: number; // 0 to 100%
  timeMs: number;
  frequencyLow: boolean;
  frequencyMid: boolean;
  frequencyHigh: boolean;
}

export interface OpusQuadPerformanceState {
  activeLeftDeck: '1' | '3';
  activeRightDeck: '2' | '4';
  viewMode: 'opus_quad_4deck' | '4deck_grid' | 'classic_dual' | 'dual_deck_classic';
  touchScreenTab: 'deck_waveforms' | 'browser' | 'touch_fx' | 'beat_fx' | 'zone_matrix' | 'smooth_echo';
  selectedSoundColorFx: SoundColorFxType;
  beatFx: OpusQuadBeatFxState;
  touchXy: { x: number; y: number; active: boolean; hold: boolean };
  zone: OpusZoneState;
  smoothEchoActive: boolean;
  smoothEchoTriggerBeats: number;
  softwareMode: 'standalone' | 'rekordbox' | 'serato';
  waveformZoom: number;
}

// Audio Hijack & Live Ingest Types
export interface AudioHijackSession {
  isActive: boolean;
  sourceType: 'microphone' | 'system_tab' | 'url_stream';
  streamName: string;
  connectedAt: number | null;
  inputGain: number;
  noiseGate: boolean;
  monitoring: boolean;
  routeToDeck: '1' | '2' | '3' | '4' | 'A' | 'B' | 'all' | 'direct_master' | 'zone_output';
}

// History & Setlist Types
export interface TrackHistoryItem {
  id: string;
  timestamp: number;
  deck: '1' | '2' | '3' | '4' | 'A' | 'B' | 'mixer' | 'hijack' | 'ai' | 'zone';
  title: string;
  artist: string;
  source: AudioSourceType | string;
  bpm: number;
  key: string;
  duration: number;
  artworkUrl?: string;
  transitionTime?: number;
}

// Bottom Marquee / Streaming Slider Track
export interface StreamRecentTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  source: 'spotify' | 'apple_music' | 'mixcloud' | 'file' | 'ai_gen' | 'hijack';
  duration: string;
  bpm: number;
  key: string;
  coverArt: string;
  plays: number;
  audioUrl?: string;
  stemsAvailable?: boolean;
}

// DJ LOCKJAH Private Lessons & Schedule Reservation Types
export type DjLessonCurriculum =
  | 'club_mixing_fundamentals'
  | 'opus_quad_cdj_mastery'
  | 'stems_live_mashups'
  | 'turntablism_scratching'
  | 'open_format_crowd_reading'
  | 'sound_system_hardware';

export type DjLessonDelivery = 'direct_to_you_in_person' | 'online_studio_hd';

export type DjLessonPackage = '1_hour_private' | '2_hours_masterclass' | '4_weeks_intensive';

export interface DjLessonBooking {
  id: string;
  bookingRef: string;
  createdAt: number;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentCity: string;
  locationAddress?: string;
  curriculum: DjLessonCurriculum;
  delivery: DjLessonDelivery;
  packageType: DjLessonPackage;
  scheduledDate: string;
  scheduledTime: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  gearOwned: string;
  specialRequests?: string;
  totalFee: number;
  depositPaid: number; // $50 deposit
  remainingBalance: number;
  status: 'confirmed' | 'pending' | 'completed';
  instructor: 'DJ LOCKJAH (2025 Colorado DJ of the Year)';
}

// Top 10 Electronic Music Genres & Categories
export interface ElectronicGenreCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  typicalBpm: string;
  bpmNumber: number;
  harmonicKey: string;
  tagline: string;
  badgeColor: string;
  icon: string;
}

export const TOP_10_ELECTRONIC_GENRES: ElectronicGenreCategory[] = [
  {
    id: 'tech_house',
    name: 'Tech House',
    shortName: 'Tech House',
    description: 'The leading sales category on the platform, driven by rolling basslines and club tracks.',
    typicalBpm: '126–128 BPM',
    bpmNumber: 127,
    harmonicKey: '11B',
    tagline: 'Leading Sales Category • Rolling Basslines & Club Anthems',
    badgeColor: '#01ff70',
    icon: '🔥',
  },
  {
    id: 'house',
    name: 'House',
    shortName: 'House',
    description: 'Encompassing classic, vocal, and modern four-on-the-floor club sounds.',
    typicalBpm: '122–126 BPM',
    bpmNumber: 124,
    harmonicKey: '8A',
    tagline: 'Four-on-the-Floor Club Sounds • Classic & Vocal Grooves',
    badgeColor: '#f4a261',
    icon: '🏠',
  },
  {
    id: 'techno_peak',
    name: 'Techno (Peak Time / Driving)',
    shortName: 'Peak Techno',
    description: 'Fast-paced, high-energy mainstage and warehouse techno.',
    typicalBpm: '130–136 BPM',
    bpmNumber: 132,
    harmonicKey: '1A',
    tagline: 'Fast-Paced, High-Energy Mainstage & Warehouse Techno',
    badgeColor: '#ff4d4f',
    icon: '⚡',
  },
  {
    id: 'melodic_house_techno',
    name: 'Melodic House & Techno',
    shortName: 'Melodic Techno',
    description: 'Atmospheric synth leads, emotional breakdowns, and progressive structures.',
    typicalBpm: '123–126 BPM',
    bpmNumber: 125,
    harmonicKey: '8A',
    tagline: 'Atmospheric Synth Leads • Emotional Breakdowns & Progression',
    badgeColor: '#2af6de',
    icon: '🌌',
  },
  {
    id: 'drum_and_bass',
    name: 'Drum & Bass',
    shortName: 'D&B / Jungle',
    description: 'High-tempo (170–180 BPM) breakbeats, consistently holding a top spot across global sales.',
    typicalBpm: '170–180 BPM',
    bpmNumber: 174,
    harmonicKey: '4A',
    tagline: 'High-Tempo Breakbeats • Global Top-Selling Category',
    badgeColor: '#ff25f6',
    icon: '🥁',
  },
  {
    id: 'afro_house',
    name: 'Afro House',
    shortName: 'Afro House',
    description: 'Percussive rhythms, organic instrumentation, and deep vocal grooves.',
    typicalBpm: '120–124 BPM',
    bpmNumber: 122,
    harmonicKey: '6A',
    tagline: 'Percussive Rhythms • Organic Instrumentation & Deep Grooves',
    badgeColor: '#ffb703',
    icon: '🌍',
  },
  {
    id: 'deep_house',
    name: 'Deep House',
    shortName: 'Deep House',
    description: 'A classic staple known for lush chords, warm sub-bass, and relaxed tempos.',
    typicalBpm: '120–124 BPM',
    bpmNumber: 122,
    harmonicKey: '9B',
    tagline: 'Lush Chords • Warm Sub-Bass & Relaxed Tempos',
    badgeColor: '#9900ff',
    icon: '🍸',
  },
  {
    id: 'minimal_deep_tech',
    name: 'Minimal / Deep Tech',
    shortName: 'Minimal Tech',
    description: 'Stripped-back arrangements, subtle micro-grooves, and underground club appeal.',
    typicalBpm: '125–128 BPM',
    bpmNumber: 126,
    harmonicKey: '7A',
    tagline: 'Stripped-Back Arrangements • Subtle Micro-Grooves',
    badgeColor: '#3dffab',
    icon: '🔬',
  },
  {
    id: 'progressive_house',
    name: 'Progressive House',
    shortName: 'Prog House',
    description: 'Extended melodic journeys, driving basslines, and dramatic builds.',
    typicalBpm: '124–128 BPM',
    bpmNumber: 126,
    harmonicKey: '10B',
    tagline: 'Extended Melodic Journeys • Driving Bass & Dramatic Builds',
    badgeColor: '#00c3ff',
    icon: '🚀',
  },
  {
    id: 'indie_dance',
    name: 'Indie Dance',
    shortName: 'Indie Dance',
    description: 'Retro-infused synthwave, dark disco, and post-punk electronic crossover tracks.',
    typicalBpm: '118–124 BPM',
    bpmNumber: 120,
    harmonicKey: '11A',
    tagline: 'Retro Synthwave • Dark Disco & Post-Punk Crossover',
    badgeColor: '#ff66c4',
    icon: '🕶️',
  },
];

// Google Drive Music Library & Crate Types
export interface GoogleDriveAudioFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  sizeFormatted?: string;
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  iconLink?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  isFolder?: boolean;
}

export interface GoogleDriveState {
  isAuthenticated: boolean;
  isConnecting: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  files: GoogleDriveAudioFile[];
  currentFolderId: string | null;
  folderPath: { id: string; name: string }[];
  isLoadingFiles: boolean;
  searchQuery: string;
  selectedFileId: string | null;
  activeUploadProgress: number | null;
  activeDownloadFileId: string | null;
  error: string | null;
}



