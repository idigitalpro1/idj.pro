/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { throttle } from '../utils/throttle';

import './PromptController';
import './PlayPauseButton';
import './MidiVisualizer';
import './MidiDeviceDropdown';
import './MultiTrackMixer';
import './VirtualDjWorkspace';
import './AudioSourcesHub';
import './RealTimeStemsAiSuite';
import './VideoKaraokeMixer';
import './HardwareCompatibilityHub';
import './UserProfileModal';
import './CustomDecalModal';
import './TrackHistoryModal';
import './RecentTracksSlider';
import './DjLessonsBookingModal';
import './DjLockjahLessonsSection';
import './MainMixerStudio';
import './LatencyCalibrationModal';
import './GoogleDriveBrowserModal';

import type { AudioEngineHealth, MidiAccessStatus, MidiDeviceInfo, OpusDeckId, PlaybackState, Prompt, UserProfile } from '../types';
import { MidiDispatcher } from '../utils/MidiDispatcher';
import { VirtualDjEngine } from '../utils/VirtualDjEngine';
import { AuthService } from '../utils/AuthService';

type ActiveViewMode =
  | 'virtual_decks'
  | 'dj_lessons'
  | 'stems_ai'
  | 'video_karaoke'
  | 'audio_sources'
  | 'multitrack_mixer'
  | 'hardware_hub'
  | 'ai_prompts';

/** The complete iDj.pro by idpro.com Suite. */
@customElement('prompt-dj-midi')
export class PromptDjMidi extends LitElement {
  static override styles = css`
    :host {
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
      position: relative;
      padding: 0 12px 90px 12px;
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #background {
      will-change: background-image;
      position: fixed;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      z-index: -1;
      background: #0a0a12;
    }

    /* Fixed Sticky Non-Overlapping Top Navigation Container */
    #top-nav-container {
      position: sticky;
      top: 0;
      width: 100%;
      max-width: 1440px;
      z-index: 50;
      background: rgba(10, 10, 18, 0.94);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 10px 12px 8px 12px;
      margin-bottom: 18px;
      box-sizing: border-box;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    }

    .nav-main-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .nav-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .brand-pill {
      background: rgba(18, 18, 26, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .brand-pill:hover {
      border-color: #ff25f6;
      box-shadow: 0 0 16px rgba(255, 37, 246, 0.4);
      transform: translateY(-1px);
    }
    .brand-logo-text {
      font-size: 1.05rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ff25f6, #2af6de);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 0.5px;
    }
    .brand-by {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .brand-link-tag {
      font-size: 0.5625rem;
      background: #ff25f6;
      color: #000;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 900;
      text-transform: uppercase;
    }

    /* Sub Navigation Tabs Bar */
    .view-switcher-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding-top: 8px;
      scrollbar-width: thin;
    }

    .tab-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.75);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .tab-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }
    .tab-btn.active {
      background: linear-gradient(135deg, rgba(255, 37, 246, 0.25), rgba(42, 246, 222, 0.25));
      border-color: #2af6de;
      color: #ffffff;
      box-shadow: 0 0 12px rgba(42, 246, 222, 0.3);
    }
    .badge-pink {
      font-size: 0.5625rem;
      background: linear-gradient(135deg, #ff25f6, #9900ff);
      color: #fff;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 900;
    }
    .badge-cyan {
      font-size: 0.5625rem;
      background: #2af6de;
      color: #000;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 900;
    }
    .badge-orange {
      font-size: 0.5625rem;
      background: #ffb703;
      color: #000;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 900;
    }
    .badge-gold {
      font-size: 0.5625rem;
      background: linear-gradient(135deg, #ffb703, #ffdd28);
      color: #000;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 900;
    }

    .btn-lessons-pill {
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.25), rgba(255, 77, 79, 0.2));
      border: 1px solid #ffb703;
      border-radius: 8px;
      padding: 5px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: #ffffff;
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      transition: all 0.15s;
      box-shadow: 0 0 12px rgba(255, 183, 3, 0.3);
    }
    .btn-lessons-pill:hover {
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.4), rgba(255, 77, 79, 0.35));
      box-shadow: 0 0 20px rgba(255, 183, 3, 0.6);
      transform: translateY(-1px);
    }

    .btn-drive-pill {
      background: linear-gradient(135deg, rgba(66, 133, 244, 0.2), rgba(52, 168, 83, 0.15));
      border: 1px solid rgba(66, 133, 244, 0.5);
      border-radius: 8px;
      padding: 5px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: #ffffff;
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      transition: all 0.15s;
      box-shadow: 0 0 12px rgba(66, 133, 244, 0.25);
    }
    .btn-drive-pill:hover {
      background: linear-gradient(135deg, rgba(66, 133, 244, 0.35), rgba(52, 168, 83, 0.25));
      box-shadow: 0 0 20px rgba(66, 133, 244, 0.5);
      transform: translateY(-1px);
    }

    .audio-health-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 0.6875rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      transition: all 0.15s;
    }
    .audio-health-badge:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }
    .audio-health-badge.worklet {
      border-color: rgba(61, 255, 171, 0.4);
      color: #3dffab;
    }
    .audio-health-badge.suspended {
      border-color: rgba(255, 77, 79, 0.5);
      color: #ff4d4f;
      background: rgba(255, 77, 79, 0.1);
      animation: pulseAlert 1.5s infinite alternate;
    }
    @keyframes pulseAlert {
      from { box-shadow: 0 0 4px rgba(255, 77, 79, 0.2); }
      to { box-shadow: 0 0 14px rgba(255, 77, 79, 0.6); }
    }

    /* Promo Banner for DJ LOCKJAH Private Lessons */
    .dj-lessons-banner {
      width: 100%;
      background: linear-gradient(90deg, rgba(24, 18, 30, 0.95), rgba(30, 22, 16, 0.95));
      border: 1px solid rgba(255, 183, 3, 0.4);
      border-radius: 14px;
      padding: 12px 18px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .banner-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .banner-avatar-icon {
      font-size: 1.5rem;
      background: rgba(255, 183, 3, 0.15);
      border: 1px solid #ffb703;
      border-radius: 50%;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .banner-title {
      font-size: 0.875rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .banner-sub {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 2px;
    }
    .btn-lj-schedule {
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ffb703 0%, #ff7b00 100%);
      color: #000000;
      border: none;
      border-radius: 8px;
      padding: 9px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
      box-shadow: 0 4px 14px rgba(255, 183, 3, 0.4);
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-lj-schedule:hover {
      box-shadow: 0 6px 22px rgba(255, 183, 3, 0.75);
      transform: translateY(-1px);
      color: #000;
    }

    /* Integrated AI Generative Deck Container directly below Mixer */
    .integrated-ai-deck-section {
      width: 100%;
      margin-top: 24px;
      padding: 20px 16px;
      background: rgba(14, 14, 22, 0.85);
      border: 1px solid rgba(255, 37, 246, 0.25);
      border-radius: 18px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
    }
    .integrated-ai-header {
      width: 100%;
      max-width: 900px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 10px;
    }
    .integrated-ai-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .integrated-ai-title {
      font-size: 0.9375rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ff25f6, #2af6de);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .integrated-ai-sub {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .profile-btn {
      background: rgba(18, 18, 26, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 8px;
      padding: 4px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #ffffff;
      font: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      transition: all 0.15s;
    }
    .profile-btn:hover {
      border-color: #2af6de;
      box-shadow: 0 0 12px rgba(42, 246, 222, 0.4);
    }
    .user-avatar-mini {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #000;
      border: 1px solid #ff25f6;
    }
    .action-icon-btn {
      background: rgba(18, 18, 26, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: #ffffff;
      font: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      transition: all 0.15s;
    }
    .action-icon-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: #ff25f6;
    }
    #grid {
      width: 80vmin;
      height: 80vmin;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2.5vmin;
      margin-top: 2vmin;
      margin-bottom: 4vmin;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    prompt-controller {
      width: 100%;
    }
    play-pause-button {
      position: relative;
      width: 15vmin;
    }
    .view-content-wrapper {
      width: 100%;
      max-width: 1440px;
      animation: fadeIn 0.2s ease-out;
      margin: 0 auto;
    }

    /* AI Deck Recording & Import Control Bar */
    .ai-record-toolbar {
      width: 100%;
      max-width: 900px;
      margin: 0 auto 16px auto;
      background: linear-gradient(90deg, rgba(24, 18, 36, 0.95), rgba(18, 24, 38, 0.95));
      border: 1px solid rgba(255, 37, 246, 0.35);
      border-radius: 14px;
      padding: 12px 18px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .ai-record-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rec-pulse-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6875rem;
      font-weight: 900;
      letter-spacing: 1px;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
    }

    .rec-pulse-indicator.active {
      background: #ff4d4f;
      color: #ffffff;
      box-shadow: 0 0 16px rgba(255, 77, 79, 0.7);
      animation: pulseRecord 1.2s infinite;
    }

    @keyframes pulseRecord {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(0.97); }
    }

    .rec-timer {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800;
    }

    .ai-record-title {
      font-size: 0.8125rem;
      font-weight: 800;
      color: #ffffff;
    }

    .ai-record-sub {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .ai-record-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-rec-action {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 7px 14px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .btn-start-rec {
      background: linear-gradient(135deg, #ff4d4f, #ff25f6);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(255, 77, 79, 0.4);
    }

    .btn-start-rec:hover {
      box-shadow: 0 6px 20px rgba(255, 77, 79, 0.6);
      transform: translateY(-1px);
    }

    .btn-stop-import {
      background: linear-gradient(135deg, #3dffab, #2af6de);
      color: #000000;
      font-weight: 900;
      box-shadow: 0 4px 14px rgba(61, 255, 171, 0.4);
    }

    .btn-stop-import:hover {
      box-shadow: 0 6px 20px rgba(61, 255, 171, 0.6);
      transform: translateY(-1px);
    }

    .btn-deck-load-mini {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 5px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-deck-load-mini:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `;

  private prompts: Map<string, Prompt>;
  private midiDispatcher: MidiDispatcher;
  private virtualDjEngine: VirtualDjEngine;
  private authService = AuthService.getInstance();

  @property({ type: Boolean }) private showMidi = true;
  @property({ type: String }) public playbackState: PlaybackState = 'stopped';
  @property({ type: Boolean }) public isAiRecording = false;
  @property({ type: Number }) public aiRecordedSeconds = 0;
  @property({ attribute: false }) public liveMusicHelper?: any;
  @state() public audioLevel = 0;
  @property({ type: String }) public activeView: ActiveViewMode = 'virtual_decks';
  @state() private midiInputIds: string[] = [];
  @state() private activeMidiInputId: string | null = null;
  @state() private midiStatus: MidiAccessStatus = 'unrequested';
  @state() private midiDevices: MidiDeviceInfo[] = [];
  @state() private userProfile!: UserProfile;
  @state() private audioHealth: AudioEngineHealth | null = null;
  @state() private latencyOffsetMs = 0;

  // Modal States
  @state() private isProfileModalOpen = false;
  @state() private isDecalModalOpen = false;
  @state() private isHistoryModalOpen = false;
  @state() private isDjLessonsModalOpen = false;
  @state() private isLatencyModalOpen = false;
  @state() private isDriveModalOpen = false;
  @state() private decalTargetDeck: 'A' | 'B' = 'A';

  @property({ type: Object })
  private filteredPrompts = new Set<string>();

  constructor(
    initialPrompts: Map<string, Prompt>,
  ) {
    super();
    this.prompts = initialPrompts;
    this.midiDispatcher = new MidiDispatcher();
    this.virtualDjEngine = new VirtualDjEngine();
    this.userProfile = this.authService.getProfile();
    this.latencyOffsetMs = this.midiDispatcher.getLatencyOffsetMs();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setupMidiListeners();
    this.setupAudioEngineListeners();
    this.audioHealth = this.virtualDjEngine.getAudioEngineHealth();
    this.latencyOffsetMs = this.midiDispatcher.getLatencyOffsetMs();

    this.midiDispatcher.addEventListener('latency-changed', ((e: CustomEvent<{ latencyOffsetMs: number }>) => {
      this.latencyOffsetMs = e.detail.latencyOffsetMs;
      this.triggerAutoSaveCheckpoint();
      this.requestUpdate();
    }) as EventListener);

    this.authService.addEventListener('profile-changed', () => {
      this.userProfile = this.authService.getProfile();
      this.requestUpdate();
    });
    this.authService.addEventListener('auth-state-changed', () => {
      this.userProfile = this.authService.getProfile();
      this.requestUpdate();
    });

    this.addEventListener('open-decal-studio', ((e: CustomEvent<{ deckId: 'A' | 'B' }>) => {
      this.decalTargetDeck = e.detail?.deckId || 'A';
      this.isDecalModalOpen = true;
    }) as EventListener);

    this.addEventListener('open-dj-lessons-modal', (() => {
      this.isDjLessonsModalOpen = true;
    }) as EventListener);

    this.addEventListener('open-latency-modal', (() => {
      this.isLatencyModalOpen = true;
    }) as EventListener);

    this.addEventListener('open-drive-modal', (() => {
      this.isDriveModalOpen = true;
    }) as EventListener);

    this.addEventListener('close-drive-modal', (() => {
      this.isDriveModalOpen = false;
    }) as EventListener);

    // Auto-restore checkpointed session on app startup
    this.autoRestoreSession();
  }

  private async autoRestoreSession() {
    const restored = await this.virtualDjEngine.attemptAutoSessionRestore();
    if (restored) {
      if (restored.prompts && Array.isArray(restored.prompts)) {
        restored.prompts.forEach((p) => {
          if (this.prompts.has(p.promptId)) {
            const existing = this.prompts.get(p.promptId)!;
            existing.weight = p.weight;
            existing.cc = p.cc;
          }
        });
      }
      if (restored.latencyOffsetMs !== undefined) {
        this.midiDispatcher.setLatencyOffsetMs(restored.latencyOffsetMs);
        this.latencyOffsetMs = restored.latencyOffsetMs;
      }
      if (restored.activeView) {
        this.activeView = restored.activeView as ActiveViewMode;
      }
      this.requestUpdate();
    }
  }

  private triggerAutoSaveCheckpoint() {
    this.virtualDjEngine.saveSessionCheckpoint(
      [...this.prompts.values()],
      this.midiDispatcher.getLatencyOffsetMs(),
      this.activeView
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.teardownMidiListeners();
    this.teardownAudioEngineListeners();
  }

  private setupAudioEngineListeners() {
    this.virtualDjEngine.addEventListener('audio-health-changed', this.handleAudioHealthChanged as EventListener);
    this.virtualDjEngine.addEventListener('audio-recovered', this.handleAudioRecovered as EventListener);
    this.virtualDjEngine.addEventListener('audio-error', this.handleAudioError as EventListener);
  }

  private teardownAudioEngineListeners() {
    this.virtualDjEngine.removeEventListener('audio-health-changed', this.handleAudioHealthChanged as EventListener);
    this.virtualDjEngine.removeEventListener('audio-recovered', this.handleAudioRecovered as EventListener);
    this.virtualDjEngine.removeEventListener('audio-error', this.handleAudioError as EventListener);
  }

  private handleAudioHealthChanged = (e: CustomEvent<AudioEngineHealth>) => {
    this.audioHealth = e.detail;
    this.requestUpdate();
  };

  private handleAudioRecovered = (e: CustomEvent<{ message: string }>) => {
    this.dispatchEvent(new CustomEvent('error', { detail: `🛡️ ${e.detail.message}` }));
  };

  private handleAudioError = (e: CustomEvent<{ message: string }>) => {
    this.dispatchEvent(new CustomEvent('error', { detail: `⚠️ ${e.detail.message}` }));
  };

  private async triggerEmergencyAudioReset() {
    const success = await this.virtualDjEngine.emergencyAudioResetAndResume();
    if (success) {
      this.audioHealth = this.virtualDjEngine.getAudioEngineHealth();
      this.requestUpdate();
    }
  }

  private runManualGcOrReset() {
    if (this.audioHealth?.state === 'suspended') {
      this.triggerEmergencyAudioReset();
    } else {
      const metrics = this.virtualDjEngine.runGarbageCollectionCycle();
      this.audioHealth = this.virtualDjEngine.getAudioEngineHealth();
      this.requestUpdate();
    }
  }

  private manualSaveSessionCheckpoint() {
    this.virtualDjEngine.saveSessionCheckpoint(
      [...this.prompts.values()],
      this.midiDispatcher.getLatencyOffsetMs(),
      this.activeView
    );
    this.dispatchEvent(
      new CustomEvent('error', {
        detail: '💾 Session Checkpoint Saved! 4 Decks, Stems, EQ & Genre Weights stored securely.',
      })
    );
  }

  private setupMidiListeners() {
    this.midiDispatcher.addEventListener('devices-changed', this.handleDevicesChanged as EventListener);
    this.midiDispatcher.addEventListener('status-changed', this.handleStatusChanged as EventListener);
    this.midiDispatcher.addEventListener('active-device-changed', this.handleActiveDeviceChanged as EventListener);
  }

  private teardownMidiListeners() {
    this.midiDispatcher.removeEventListener('devices-changed', this.handleDevicesChanged as EventListener);
    this.midiDispatcher.removeEventListener('status-changed', this.handleStatusChanged as EventListener);
    this.midiDispatcher.removeEventListener('active-device-changed', this.handleActiveDeviceChanged as EventListener);
  }

  private handleDevicesChanged = (e: CustomEvent<{ devices: MidiDeviceInfo[]; inputIds: string[]; activeMidiInputId: string | null }>) => {
    this.midiDevices = e.detail.devices;
    this.midiInputIds = e.detail.inputIds;
    this.activeMidiInputId = e.detail.activeMidiInputId;
    this.requestUpdate();
  };

  private handleStatusChanged = (e: CustomEvent<{ status: MidiAccessStatus }>) => {
    this.midiStatus = e.detail.status;
    this.requestUpdate();
  };

  private handleActiveDeviceChanged = (e: CustomEvent<{ activeMidiInputId: string | null }>) => {
    this.activeMidiInputId = e.detail.activeMidiInputId;
    this.requestUpdate();
  };

  private handlePromptChanged(e: CustomEvent<Prompt>) {
    const { promptId, text, weight, cc } = e.detail;
    const prompt = this.prompts.get(promptId);

    if (!prompt) {
      console.error('prompt not found', promptId);
      return;
    }

    prompt.text = text;
    prompt.weight = weight;
    prompt.cc = cc;

    const newPrompts = new Map(this.prompts);
    newPrompts.set(promptId, prompt);

    this.prompts = newPrompts;
    this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('prompts-changed', { detail: this.prompts }),
    );
  }

  private async loadCurrentAiToDeck(deckId: OpusDeckId) {
    try {
      const activeText =
        [...this.prompts.values()]
          .filter((p) => p.weight > 0)
          .map((p) => p.text)
          .slice(0, 2)
          .join(' + ') || 'Generative AI Stems';

      const audioBuffer = this.virtualDjEngine.synthesizeElectronicTrackAudio(126, 180, 'ai_gen');

      this.virtualDjEngine.loadTrackToDeck(deckId, {
        id: `ai-gen-${Date.now()}`,
        title: `AI Gen • ${activeText}`,
        artist: 'iDj.pro Generative Studio',
        bpm: 126,
        key: '8A',
        genre: 'Generative AI Live',
        duration: 180,
        source: 'ai_gen',
        audioBuffer,
      });

      this.dispatchEvent(
        new CustomEvent('error', {
          detail: `⚡ Loaded Live AI Output to OPUS-QUAD Deck ${deckId}!`,
        })
      );
      this.activeView = 'virtual_decks';
    } catch (err: any) {
      this.dispatchEvent(
        new CustomEvent('error', { detail: `Could not load to deck: ${err?.message}` })
      );
    }
  }

  /** Generates radial gradients for each prompt based on weight and color. */
  private readonly makeBackground = throttle(
    () => {
      const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

      const MAX_WEIGHT = 0.5;
      const MAX_ALPHA = 0.6;

      const bg: string[] = [];

      [...this.prompts.values()].forEach((p, i) => {
        const alphaPct = clamp01(p.weight / MAX_WEIGHT) * MAX_ALPHA;
        const alpha = Math.round(alphaPct * 0xff)
          .toString(16)
          .padStart(2, '0');

        const stop = p.weight / 2;
        const x = (i % 4) / 3;
        const y = Math.floor(i / 4) / 3;
        const s = `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${p.color}${alpha} 0px, ${p.color}00 ${stop * 100}%)`;

        bg.push(s);
      });

      return bg.join(', ');
    },
    30,
  );

  private playPause() {
    this.dispatchEvent(new CustomEvent('play-pause'));
  }

  public addFilteredPrompt(prompt: string) {
    this.filteredPrompts = new Set([...this.filteredPrompts, prompt]);
  }

  private setView(view: ActiveViewMode) {
    this.activeView = view;
  }

  override render() {
    const bg = styleMap({
      backgroundImage: this.makeBackground(),
    });

    const p = this.userProfile || this.authService.getProfile();

    return html`
      <div id="background" style=${bg}></div>

      <!-- Top Header Navigation & Branding with Live Link to idpro.com -->
      <div id="top-nav-container">
        <!-- Row 1: Brand, User Profile, Global Tools, MIDI Dropdown -->
        <div class="nav-main-row">
          <!-- Left: Brand & Live Link -->
          <div class="nav-group">
            <a
              href="https://idpro.com"
              target="_blank"
              rel="noopener noreferrer"
              class="brand-pill"
              title="Visit idpro.com • Official Digital Pro Site (also idpropro.com)"
            >
              <span class="brand-logo-text">iDj.pro</span>
              <span class="brand-by">by idpro.com</span>
              <span class="brand-link-tag">LIVE ↗</span>
            </a>
          </div>

          <!-- Right: Actions, History, Decals, DJ Lessons, Profile & MIDI -->
          <div class="nav-group">
            <!-- Learn to DJ with DJ LOCKJAH Button -->
            <button
              class="btn-lessons-pill"
              @click=${() => (this.isDjLessonsModalOpen = true)}
              title="Private Personal DJ Lessons Direct to You by DJ LOCKJAH (2025 Colorado DJ of the Year)"
            >
              <span>🏆 Learn to DJ</span>
              <span class="badge-gold">LJ SCHEDULE</span>
            </button>

            <!-- History & Share Modal Trigger -->
            <button
              class="action-icon-btn"
              @click=${() => (this.isHistoryModalOpen = true)}
              title="Track History, Setlists & Session Share"
            >
              <span>📜 Setlist & Share</span>
            </button>

            <!-- Custom Decals Studio Trigger -->
            <button
              class="action-icon-btn"
              @click=${() => {
                this.decalTargetDeck = 'A';
                this.isDecalModalOpen = true;
              }}
              title="Upload and manage custom vinyl decals and slipmats"
            >
              <span>🎨 Art Decals</span>
            </button>

            <!-- Google Drive Cloud Crate Trigger -->
            <button
              class="btn-drive-pill"
              @click=${() => (this.isDriveModalOpen = true)}
              title="Google Drive Cloud Music Crate & Track Management"
            >
              <svg style="width: 14px; height: 14px;" viewBox="0 0 87.3 78">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span>Drive Crate</span>
            </button>

            <!-- User Profile & Google Login Trigger -->
            <button
              class="profile-btn"
              @click=${() => (this.isProfileModalOpen = true)}
              title="Account & Profile Creation (Google Login or Guest)"
            >
              <img src="${p?.avatarUrl}" alt="${p?.djAlias}" class="user-avatar-mini" />
              <span>${p?.djAlias || 'Guest DJ'}</span>
            </button>

            <!-- Audio Engine Health & Memory GC Badge -->
            <button
              class="audio-health-badge ${this.audioHealth?.dspMode === 'audioworklet' ? 'worklet' : ''} ${this.audioHealth?.state === 'suspended' ? 'suspended' : ''}"
              @click=${() => this.runManualGcOrReset()}
              title="DSP Engine: ${this.audioHealth?.dspMode === 'audioworklet' ? 'AudioWorklet Low Latency Thread' : 'Web Audio'}. Pooled Memory: ${((this.audioHealth?.bufferPoolMetrics?.totalPooledMemoryBytes || 0) / 1024).toFixed(0)} KB. Click to run memory garbage collection or reset audio."
            >
              <span>${this.audioHealth?.state === 'suspended' ? '⚠️ Audio Paused' : this.audioHealth?.dspMode === 'audioworklet' ? '⚡ Worklet DSP' : '🎛️ Audio Ready'}</span>
              ${this.audioHealth?.bufferPoolMetrics
                ? html`<span style="font-size: 0.625rem; opacity: 0.8; font-family: 'JetBrains Mono', monospace;">• ${((this.audioHealth.bufferPoolMetrics.totalPooledMemoryBytes || 0) / 1024).toFixed(0)}KB</span>`
                : ''}
            </button>

            <!-- Latency Calibration Trigger Button -->
            <button
              class="btn-top-util"
              @click=${() => (this.isLatencyModalOpen = true)}
              title="Calibrate Audio-to-MIDI roundtrip buffer latency and hardware jitter"
            >
              <span>⏱️ Sync ${this.latencyOffsetMs >= 0 ? `+${this.latencyOffsetMs}` : this.latencyOffsetMs}ms</span>
            </button>

            <!-- Session Checkpoint Save / Clear -->
            <button
              class="btn-top-util"
              @click=${() => this.manualSaveSessionCheckpoint()}
              title="Save active DJ session checkpoint (restores loaded tracks, loops, stems, and EQ)"
            >
              <span>💾 Checkpoint</span>
            </button>

            <!-- Dedicated MIDI Device Dropdown -->
            <midi-device-dropdown
              .midiDispatcher=${this.midiDispatcher}
              @error-message=${(e: CustomEvent<string>) =>
                this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
            ></midi-device-dropdown>
          </div>
        </div>

        <!-- Row 2: Responsive Horizontal Tools & Suite Selector -->
        <div class="view-switcher-bar">
          <button
            class="tab-btn ${this.activeView === 'virtual_decks' ? 'active' : ''}"
            @click=${() => this.setView('virtual_decks')}
            title="Pioneer OPUS-QUAD 4-Channel Standalone System with Multi-Room Zone Output & AI Generative Deck"
          >
            <span>🎚️ Virtual Decks & AI Deck</span>
          </button>

          <button
            class="tab-btn ${this.activeView === 'dj_lessons' ? 'active' : ''}"
            @click=${() => this.setView('dj_lessons')}
            title="Learn to DJ: Private Personal DJ Lessons Direct to You by DJ LOCKJAH (2025 Colorado DJ of the Year)"
          >
            <span>🎓 Learn to DJ</span>
            <span class="badge-gold">DJ LOCKJAH • $50 DEP</span>
          </button>

          <button
            class="tab-btn ${this.activeView === 'stems_ai' ? 'active' : ''}"
            @click=${() => this.setView('stems_ai')}
            title="Real-Time 4-Way Stem Separation (Vocals, Drums, Bass, Melody) & AI Performance Suite"
          >
            <span>🎤 Stems & AI Engine</span>
            <span class="badge-pink">NEURAL</span>
          </button>

          <button
            class="tab-btn ${this.activeView === 'video_karaoke' ? 'active' : ''}"
            @click=${() => this.setView('video_karaoke')}
            title="Synchronized Video Decks, Shaders, Master Video Crossfader & Live CDG Karaoke"
          >
            <span>🎬 Video & Karaoke</span>
            <span class="badge-cyan">60 FPS</span>
          </button>

          <button
            class="tab-btn ${this.activeView === 'audio_sources' ? 'active' : ''}"
            @click=${() => this.setView('audio_sources')}
            title="Beatport, Spotify, Apple Music, Mixcloud & Audio Hijack Ingest"
          >
            <span>📻 Audio Sources & Beatport</span>
          </button>

          <button
            class="tab-btn ${this.activeView === 'multitrack_mixer' ? 'active' : ''}"
            @click=${() => this.setView('multitrack_mixer')}
            title="5-Track Studio Mixer with iDproi.com Mixdown"
          >
            <span>🎛️ 5-Track Mixer</span>
            <span class="badge-pink">iDproi.com</span>
          </button>

          <button
            class="tab-btn ${this.activeView === 'hardware_hub' ? 'active' : ''}"
            @click=${() => this.setView('hardware_hub')}
            title="Extensive Hardware Controller Presets & Interactive MIDI Learn"
          >
            <span>🔌 Hardware Hub</span>
            <span class="badge-orange">PRESETS</span>
          </button>

          <button
            class="tab-btn ${this.activeView === 'ai_prompts' ? 'active' : ''}"
            @click=${() => this.setView('ai_prompts')}
            title="AI Prompt DJ Generative Live Deck"
          >
            <span>⚡ AI Generative Deck</span>
          </button>
        </div>
      </div>

      <!-- Main Content Based on Selected Tab -->
      <div class="view-content-wrapper">
        ${this.activeView === 'virtual_decks'
          ? html`
              <main-mixer-studio
                .engine=${this.virtualDjEngine}
                .midiDispatcher=${this.midiDispatcher}
                .prompts=${this.prompts}
                .playbackState=${this.playbackState}
                .isAiRecording=${this.isAiRecording}
                .aiRecordedSeconds=${this.aiRecordedSeconds}
                @prompt-changed=${(e: CustomEvent<Prompt>) => this.handlePromptChanged(e)}
                @load-ai-to-deck=${(e: CustomEvent<{ deckId: OpusDeckId }>) =>
                  this.loadCurrentAiToDeck(e.detail.deckId)}
                @play-pause=${() => this.playPause()}
                @start-ai-recording=${() =>
                  this.dispatchEvent(new CustomEvent('start-ai-recording'))}
                @stop-ai-recording=${() =>
                  this.dispatchEvent(new CustomEvent('stop-ai-recording'))}
                @toast=${(e: CustomEvent<string>) =>
                  this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
              ></main-mixer-studio>
            `
          : this.activeView === 'dj_lessons'
          ? html`
              <dj-lockjah-lessons-section
                @toast=${(e: CustomEvent<string>) =>
                  this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
              ></dj-lockjah-lessons-section>
            `
          : this.activeView === 'stems_ai'
          ? html`
              <realtime-stems-ai-suite
                .engine=${this.virtualDjEngine}
                @toast=${(e: CustomEvent<string>) =>
                  this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
              ></realtime-stems-ai-suite>
            `
          : this.activeView === 'video_karaoke'
          ? html`
              <video-karaoke-mixer
                .engine=${this.virtualDjEngine}
                @toast=${(e: CustomEvent<string>) =>
                  this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
              ></video-karaoke-mixer>
            `
          : this.activeView === 'audio_sources'
          ? html`
              <audio-sources-hub
                .engine=${this.virtualDjEngine}
                @toast=${(e: CustomEvent<string>) =>
                  this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
              ></audio-sources-hub>
            `
          : this.activeView === 'multitrack_mixer'
          ? html`
              <div style="width: 100%; display: flex; justify-content: center;">
                <multi-track-mixer
                  .midiDispatcher=${this.midiDispatcher}
                  @toast=${(e: CustomEvent<string>) =>
                    this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
                ></multi-track-mixer>
              </div>
            `
          : this.activeView === 'hardware_hub'
          ? html`
              <hardware-compatibility-hub
                .engine=${this.virtualDjEngine}
                .midiDispatcher=${this.midiDispatcher}
                @toast=${(e: CustomEvent<string>) =>
                  this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
              ></hardware-compatibility-hub>
            `
          : html`
              <!-- Generative AI Deck Record & Mix Lab Auto-Import Bar -->
              <div class="ai-record-toolbar">
                <div class="ai-record-left">
                  <div class="rec-pulse-indicator ${this.isAiRecording ? 'active' : ''}">
                    <span>${this.isAiRecording ? '● REC' : '○ STANDBY'}</span>
                    <span class="rec-timer">
                      ${Math.floor(this.aiRecordedSeconds / 60)
                        .toString()
                        .padStart(2, '0')}:${(this.aiRecordedSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <div class="ai-record-title">Generative AI Live Audio Deck</div>
                    <div class="ai-record-sub">
                      ${this.isAiRecording
                        ? 'Capturing live AI output chunks • Ready to auto-import into Mix Lab'
                        : 'Record generative audio output and auto-import as stems into 5-track Mix Lab'}
                    </div>
                  </div>
                </div>

                <div class="ai-record-actions">
                  ${!this.isAiRecording
                    ? html`
                        <button
                          class="btn-rec-action btn-start-rec"
                          @click=${() => this.dispatchEvent(new CustomEvent('start-ai-recording'))}
                        >
                          <span>🔴</span> Record AI Deck
                        </button>
                      `
                    : html`
                        <button
                          class="btn-rec-action btn-stop-import"
                          @click=${() => this.dispatchEvent(new CustomEvent('stop-ai-recording'))}
                        >
                          <span>⚡</span> Stop & Auto-Import to Mix Lab
                        </button>
                      `}

                  <div style="display: flex; align-items: center; gap: 4px; border-left: 1px solid rgba(255,255,255,0.15); padding-left: 8px;">
                    <span style="font-size: 0.625rem; color: rgba(255,255,255,0.5); font-weight: 800;">OPUS DECK:</span>
                    ${(['1', '2', '3', '4'] as const).map(
                      (dId) => html`
                        <button
                          class="btn-deck-load-mini"
                          @click=${() => this.loadCurrentAiToDeck(dId)}
                          title="Capture & Load AI Output directly to OPUS-QUAD Deck ${dId}"
                        >
                          D${dId}
                        </button>
                      `
                    )}
                  </div>
                </div>
              </div>

              <div id="grid">${this.renderPrompts()}</div>
              <play-pause-button
                .playbackState=${this.playbackState}
                @click=${this.playPause}
              ></play-pause-button>
            `}
      </div>

      <!-- Streaming Recently Generated / Played Tracks Slider along Bottom -->
      <recent-tracks-slider
        .engine=${this.virtualDjEngine}
        @toast=${(e: CustomEvent<string>) =>
          this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
      ></recent-tracks-slider>

      <!-- Modals -->
      <user-profile-modal
        .isOpen=${this.isProfileModalOpen}
        @close-profile-modal=${() => (this.isProfileModalOpen = false)}
        @toast=${(e: CustomEvent<string>) =>
          this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
      ></user-profile-modal>

      <custom-decal-modal
        .isOpen=${this.isDecalModalOpen}
        .targetDeckId=${this.decalTargetDeck}
        .engine=${this.virtualDjEngine}
        @close-decal-modal=${() => (this.isDecalModalOpen = false)}
        @toast=${(e: CustomEvent<string>) =>
          this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
      ></custom-decal-modal>

      <track-history-modal
        .isOpen=${this.isHistoryModalOpen}
        @close-history-modal=${() => (this.isHistoryModalOpen = false)}
        @toast=${(e: CustomEvent<string>) =>
          this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
      ></track-history-modal>

      <dj-lessons-booking-modal
        .isOpen=${this.isDjLessonsModalOpen}
        @close-dj-lessons-modal=${() => (this.isDjLessonsModalOpen = false)}
        @toast=${(e: CustomEvent<string>) =>
          this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
      ></dj-lessons-booking-modal>

      <latency-calibration-modal
        .isOpen=${this.isLatencyModalOpen}
        .midiDispatcher=${this.midiDispatcher}
        .engine=${this.virtualDjEngine}
        @close-latency-modal=${() => (this.isLatencyModalOpen = false)}
      ></latency-calibration-modal>

      <google-drive-browser-modal
        .isOpen=${this.isDriveModalOpen}
        .engine=${this.virtualDjEngine}
        @close-drive-modal=${() => (this.isDriveModalOpen = false)}
        @toast=${(e: CustomEvent<string>) =>
          this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
      ></google-drive-browser-modal>

      <midi-visualizer .midiDispatcher=${this.midiDispatcher}></midi-visualizer>
    `;
  }

  private renderPrompts() {
    return [...this.prompts.values()].map((prompt) => {
      return html`<prompt-controller
        promptId=${prompt.promptId}
        ?filtered=${this.filteredPrompts.has(prompt.text)}
        cc=${prompt.cc}
        text=${prompt.text}
        weight=${prompt.weight}
        color=${prompt.color}
        .midiDispatcher=${this.midiDispatcher}
        .showCC=${this.showMidi}
        audioLevel=${this.audioLevel}
        @prompt-changed=${this.handlePromptChanged}>
      </prompt-controller>`;
    });
  }
}

