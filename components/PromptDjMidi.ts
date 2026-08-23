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

    /* 2026 interface pass: one clear navigation hierarchy, quiet surfaces, and
       secondary tools available on demand instead of competing with the mixer. */
    :host {
      padding: 0 20px 68px;
      background: #080a0f;
    }

    #background {
      background:
        radial-gradient(circle at 15% -10%, rgba(42, 246, 222, 0.09), transparent 34%),
        radial-gradient(circle at 90% 0%, rgba(255, 37, 246, 0.07), transparent 28%),
        linear-gradient(180deg, #0b0d13 0%, #07080c 100%);
    }

    #top-nav-container {
      top: 10px;
      max-width: 1400px;
      margin: 10px auto 22px;
      padding: 10px 12px;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 16px;
      background: rgba(12, 14, 20, 0.92);
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.34);
    }

    .app-bar {
      display: flex;
      align-items: center;
      gap: 18px;
      min-height: 48px;
    }

    .brand-pill {
      padding: 7px 10px;
      border: none;
      background: transparent;
      box-shadow: none;
      flex-shrink: 0;
    }

    .brand-pill:hover {
      background: rgba(255, 255, 255, 0.05);
      box-shadow: none;
      transform: none;
    }

    .brand-logo-text {
      font-size: 1.2rem;
    }

    .brand-link-tag {
      background: rgba(42, 246, 222, 0.12);
      color: #2af6de;
    }

    .primary-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
    }

    .primary-nav .tab-btn {
      min-height: 38px;
      padding: 8px 13px;
      border: 1px solid transparent;
      background: transparent;
      color: rgba(255, 255, 255, 0.64);
      font-size: 0.8rem;
    }

    .primary-nav .tab-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }

    .primary-nav .tab-btn.active {
      background: rgba(42, 246, 222, 0.1);
      border-color: rgba(42, 246, 222, 0.4);
      color: #eafffc;
      box-shadow: none;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 7px;
      flex-shrink: 0;
    }

    .mobile-label {
      display: none;
    }

    .book-primary {
      border: 0;
      border-radius: 10px;
      padding: 9px 14px;
      min-height: 38px;
      background: #ffb703;
      color: #161006;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 900;
      cursor: pointer;
      white-space: nowrap;
    }

    .book-primary:hover {
      background: #ffc733;
    }

    details.menu {
      position: relative;
    }

    details.menu > summary {
      list-style: none;
      cursor: pointer;
    }

    details.menu > summary::-webkit-details-marker {
      display: none;
    }

    .menu-trigger {
      min-height: 38px;
      padding: 8px 11px;
      border-radius: 9px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.76);
      background: rgba(255, 255, 255, 0.04);
      font-size: 0.78rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    details[open] .menu-trigger,
    .menu-trigger:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.24);
      background: rgba(255, 255, 255, 0.08);
    }

    .menu-popover {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      z-index: 80;
      min-width: 250px;
      padding: 8px;
      display: grid;
      gap: 4px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      background: rgba(16, 18, 25, 0.98);
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
    }

    .menu-action {
      width: 100%;
      min-height: 39px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 9px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: rgba(255, 255, 255, 0.78);
      font: inherit;
      font-size: 0.78rem;
      font-weight: 750;
      text-align: left;
      cursor: pointer;
    }

    .menu-action:hover,
    .menu-action.active {
      color: #fff;
      background: rgba(42, 246, 222, 0.08);
    }

    .menu-divider {
      height: 1px;
      margin: 4px 3px;
      background: rgba(255, 255, 255, 0.08);
    }

    .menu-status {
      padding: 7px 10px;
      color: rgba(255, 255, 255, 0.52);
      font-size: 0.68rem;
      font-weight: 700;
    }

    .profile-btn {
      min-height: 38px;
      padding: 6px 9px;
      background: rgba(255, 255, 255, 0.04);
      box-shadow: none;
    }

    @media (max-width: 980px) {
      :host {
        padding-inline: 10px;
      }

      #top-nav-container {
        top: 6px;
        margin-top: 6px;
      }

      .app-bar {
        flex-wrap: wrap;
        gap: 8px;
      }

      .primary-nav {
        order: 3;
        width: 100%;
        overflow-x: auto;
        padding-top: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.07);
        scrollbar-width: none;
      }

      .nav-actions {
        margin-left: auto;
      }
    }

    @media (max-width: 620px) {
      :host {
        padding-bottom: 120px;
      }

      #top-nav-container {
        backdrop-filter: none;
      }

      .brand-by,
      .brand-link-tag,
      .profile-btn span,
      .book-primary .book-long {
        display: none;
      }

      .app-bar {
        gap: 5px;
      }

      .brand-pill {
        padding-inline: 4px;
      }

      .nav-actions {
        gap: 4px;
      }

      .book-primary {
        padding-inline: 11px;
      }

      .menu-popover {
        position: fixed;
        top: 72px;
        left: 10px;
        right: 10px;
        min-width: 0;
      }

      .primary-nav .tab-btn {
        min-width: 0;
        min-height: 44px;
        padding: 6px 3px;
        justify-content: center;
        font-size: 0.69rem;
      }

      .primary-nav .desktop-label {
        display: none;
      }

      .primary-nav .mobile-label {
        display: inline;
      }

      .primary-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
        width: auto;
        height: 58px;
        padding: 6px 8px;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 2px;
        overflow: visible;
        border-top: 1px solid rgba(255, 255, 255, 0.11);
        background: rgba(12, 14, 20, 0.97);
        backdrop-filter: blur(18px);
        box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.42);
      }

      .primary-nav .menu,
      .primary-nav .menu-trigger {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }

      .primary-nav .menu-trigger {
        min-height: 44px;
        justify-content: center;
        padding: 6px 3px;
        font-size: 0.69rem;
        border-color: transparent;
        background: transparent;
      }

      .primary-nav .menu-popover {
        top: auto;
        bottom: 66px;
        left: 10px;
        right: 10px;
      }
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

      <!-- Compact app shell: primary journeys first, specialist controls on demand. -->
      <div id="top-nav-container">
        <div class="app-bar">
          <a
            href="https://idpro.com"
            target="_blank"
            rel="noopener noreferrer"
            class="brand-pill"
            title="Visit idpro.com"
          >
            <span class="brand-logo-text">iDj.pro</span>
            <span class="brand-by">by idpro.com</span>
            <span class="brand-link-tag">LIVE</span>
          </a>

          <nav class="primary-nav" aria-label="Primary">
            <button
              class="tab-btn ${this.activeView === 'virtual_decks' ? 'active' : ''}"
              @click=${() => this.setView('virtual_decks')}
            >
              <span class="desktop-label">🎚️ Mix</span><span class="mobile-label">🎚️ Mix</span>
            </button>
            <button
              class="tab-btn ${this.activeView === 'audio_sources' ? 'active' : ''}"
              @click=${() => this.setView('audio_sources')}
            >
              <span class="desktop-label">♫ Music</span><span class="mobile-label">♫ Music</span>
            </button>
            <button
              class="tab-btn ${this.activeView === 'multitrack_mixer' ? 'active' : ''}"
              @click=${() => this.setView('multitrack_mixer')}
            >
              <span class="desktop-label">▦ 5-Track Studio</span><span class="mobile-label">▦ Studio</span>
            </button>
            <button
              class="tab-btn ${this.activeView === 'dj_lessons' ? 'active' : ''}"
              @click=${() => this.setView('dj_lessons')}
            >
              <span class="desktop-label">🎓 Lessons</span><span class="mobile-label">🎓 Learn</span>
            </button>

            <details class="menu">
              <summary class="menu-trigger">More <span aria-hidden="true">⌄</span></summary>
              <div class="menu-popover">
                <button
                  class="menu-action ${this.activeView === 'stems_ai' ? 'active' : ''}"
                  @click=${() => this.setView('stems_ai')}
                >
                  <span>◫</span><span>Stems & AI Engine</span>
                </button>
                <button
                  class="menu-action ${this.activeView === 'ai_prompts' ? 'active' : ''}"
                  @click=${() => this.setView('ai_prompts')}
                >
                  <span>⚡</span><span>AI Generative Deck</span>
                </button>
                <button
                  class="menu-action ${this.activeView === 'video_karaoke' ? 'active' : ''}"
                  @click=${() => this.setView('video_karaoke')}
                >
                  <span>▣</span><span>Video & Karaoke</span>
                </button>
                <button
                  class="menu-action ${this.activeView === 'hardware_hub' ? 'active' : ''}"
                  @click=${() => this.setView('hardware_hub')}
                >
                  <span>⌁</span><span>Hardware & MIDI</span>
                </button>
              </div>
            </details>
          </nav>

          <div class="nav-actions">
            <button class="book-primary" @click=${() => (this.isDjLessonsModalOpen = true)}>
              <span>Book</span><span class="book-long"> a lesson · $50</span>
            </button>

            <details class="menu">
              <summary class="menu-trigger" aria-label="Open tools">Tools <span aria-hidden="true">⌄</span></summary>
              <div class="menu-popover">
                <button class="menu-action" @click=${() => (this.isDriveModalOpen = true)}>
                  <span>☁</span><span>Drive crate</span>
                </button>
                <button class="menu-action" @click=${() => (this.isHistoryModalOpen = true)}>
                  <span>☷</span><span>Setlist & history</span>
                </button>
                <button
                  class="menu-action"
                  @click=${() => {
                    this.decalTargetDeck = 'A';
                    this.isDecalModalOpen = true;
                  }}
                >
                  <span>◉</span><span>Deck artwork</span>
                </button>
                <button class="menu-action" @click=${() => (this.isLatencyModalOpen = true)}>
                  <span>⏱</span><span>Latency calibration · ${this.latencyOffsetMs >= 0 ? `+${this.latencyOffsetMs}` : this.latencyOffsetMs}ms</span>
                </button>
                <button class="menu-action" @click=${() => this.manualSaveSessionCheckpoint()}>
                  <span>↓</span><span>Save checkpoint</span>
                </button>
                <button class="menu-action" @click=${() => this.runManualGcOrReset()}>
                  <span>${this.audioHealth?.state === 'suspended' ? '⚠' : '●'}</span>
                  <span>${this.audioHealth?.state === 'suspended' ? 'Resume audio engine' : 'Audio engine ready'}</span>
                </button>
                <div class="menu-divider"></div>
                <div class="menu-status">MIDI CONTROLLER</div>
                <midi-device-dropdown
                  .midiDispatcher=${this.midiDispatcher}
                  @error-message=${(e: CustomEvent<string>) =>
                    this.dispatchEvent(new CustomEvent('error', { detail: e.detail }))}
                ></midi-device-dropdown>
              </div>
            </details>

            <button
              class="profile-btn"
              @click=${() => (this.isProfileModalOpen = true)}
              title="Account and profile"
            >
              <img src="${p?.avatarUrl}" alt="" class="user-avatar-mini" />
              <span>${p?.djAlias || 'Guest DJ'}</span>
            </button>
          </div>
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
