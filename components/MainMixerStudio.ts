/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { OpusDeckId, PlaybackState, Prompt } from '../types';
import type { MidiDispatcher } from '../utils/MidiDispatcher';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';
import './VirtualDjWorkspace';
import './PromptController';
import './PlayPauseButton';

export type MainStudioViewMode = 'full_studio' | 'mixer_focus' | 'ai_deck_focus';

/**
 * MainMixerStudio: Primary UI component displaying the 4-channel OPUS-QUAD mixer
 * interface at login, positioning it directly above the AI generative deck with
 * a mathematically organized layout that strictly prevents overlapping tools.
 */
@customElement('main-mixer-studio')
export class MainMixerStudio extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      box-sizing: border-box;
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .studio-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      box-sizing: border-box;
    }

    /* Top Studio Organization Toolbar */
    .studio-toolbar {
      background: linear-gradient(135deg, rgba(24, 24, 38, 0.95) 0%, rgba(16, 16, 26, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .studio-title-block {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .studio-badge {
      font-size: 0.75rem;
      font-weight: 900;
      background: linear-gradient(135deg, #f4a261, #e76f51);
      color: #000;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.8px;
      box-shadow: 0 0 14px rgba(244, 162, 97, 0.35);
    }

    .studio-heading {
      font-size: 1.1rem;
      font-weight: 900;
      letter-spacing: -0.3px;
      margin: 0;
      background: linear-gradient(135deg, #ffffff 60%, #f4a261 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .studio-subtext {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.65);
    }

    .view-mode-selector {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px;
      border-radius: 10px;
    }

    .mode-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      background: transparent;
      color: rgba(255, 255, 255, 0.65);
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .mode-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }

    .mode-btn.active {
      background: #f4a261;
      color: #000000;
      font-weight: 900;
      box-shadow: 0 2px 10px rgba(244, 162, 97, 0.3);
    }

    /* Lesson Promo Bar directly under toolbar */
    .lesson-strip {
      background: linear-gradient(90deg, rgba(255, 183, 3, 0.12) 0%, rgba(255, 37, 246, 0.08) 100%);
      border: 1px solid rgba(255, 183, 3, 0.35);
      border-radius: 12px;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .lesson-strip-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .lesson-tag {
      font-size: 0.6875rem;
      font-weight: 900;
      background: #ffb703;
      color: #000;
      padding: 3px 8px;
      border-radius: 12px;
    }

    .btn-lesson-quick {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ffb703 0%, #ff7b00 100%);
      color: #000;
      border: none;
      border-radius: 8px;
      padding: 6px 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      box-shadow: 0 2px 10px rgba(255, 183, 3, 0.35);
      text-transform: uppercase;
    }

    .btn-lesson-quick:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(255, 183, 3, 0.6);
    }

    /* Mixer Section (Top) */
    .mixer-section-wrapper {
      width: 100%;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header-pill {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 8px 14px;
    }

    .section-header-title {
      font-size: 0.875rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f4a261;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Visual Divider Between Mixer and AI Generative Deck */
    .section-divider {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 4px 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    }

    .divider-badge {
      font-size: 0.6875rem;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.6);
      background: #11111b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 3px 12px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.5px;
    }

    /* AI Generative Deck Section (Bottom) */
    .ai-deck-section-wrapper {
      background: linear-gradient(180deg, rgba(20, 20, 32, 0.95) 0%, rgba(12, 12, 20, 0.98) 100%);
      border: 1px solid rgba(42, 246, 222, 0.35);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(42, 246, 222, 0.08);
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-sizing: border-box;
    }

    .ai-deck-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 14px;
    }

    .ai-deck-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ai-icon-bubble {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2af6de 0%, #ff25f6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #000;
      font-weight: 900;
      box-shadow: 0 0 16px rgba(42, 246, 222, 0.4);
      flex-shrink: 0;
    }

    .ai-deck-title {
      font-size: 1.1rem;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: #ffffff;
      margin: 0;
    }

    .ai-deck-subtitle {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 2px;
    }

    /* AI Deck Recording & Deck Load Bar */
    .ai-toolbar-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 10px 14px;
    }

    .rec-status-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .rec-indicator {
      font-size: 0.6875rem;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .rec-indicator.recording {
      background: rgba(255, 77, 79, 0.2);
      border-color: #ff4d4f;
      color: #ff4d4f;
      animation: pulseGlow 1.5s infinite ease-in-out;
    }

    @keyframes pulseGlow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .ai-action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-rec {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 900;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .btn-rec-start {
      background: #ff4d4f;
      color: #ffffff;
      box-shadow: 0 2px 10px rgba(255, 77, 79, 0.4);
    }

    .btn-rec-start:hover {
      background: #ff7875;
      transform: translateY(-1px);
    }

    .btn-rec-stop {
      background: linear-gradient(135deg, #2af6de, #ff25f6);
      color: #000000;
      box-shadow: 0 2px 10px rgba(42, 246, 222, 0.4);
    }

    .deck-route-group {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 3px 6px;
      border-radius: 8px;
    }

    .btn-deck-route {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 900;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
      transition: all 0.12s;
    }

    .btn-deck-route:hover {
      background: #2af6de;
      color: #000;
      border-color: #2af6de;
    }

    /* Grid for AI Prompts - Clean, non-overlapping, fluid */
    .prompts-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      width: 100%;
      box-sizing: border-box;
    }

    @media (max-width: 1100px) {
      .prompts-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 650px) {
      .prompts-grid {
        grid-template-columns: 1fr;
      }
    }

    .play-pause-row {
      display: flex;
      justify-content: center;
      margin-top: 4px;
    }

    /* Tablet & Performance Mode Specific Styles */
    .performance-banner-badge {
      background: linear-gradient(135deg, #ff25f6, #2af6de);
      color: #000;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.6875rem;
      letter-spacing: 0.5px;
    }

    .btn-perf-toggle {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 900;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn-perf-toggle.active {
      background: linear-gradient(135deg, #ff25f6, #7928ca);
      border-color: #ff25f6;
      box-shadow: 0 0 14px rgba(255, 37, 246, 0.5);
    }

    @media only screen and (min-width: 1024px) and (max-height: 1366px) and (orientation: landscape) {
      .studio-container {
        gap: 12px;
      }
      .studio-toolbar {
        padding: 8px 14px;
      }
      .mode-btn {
        min-height: 44px;
      }
    }
  `;

  @property({ type: Object }) engine!: VirtualDjEngine;
  @property({ type: Object }) midiDispatcher!: MidiDispatcher;
  @property({ type: Object }) prompts: Map<string, Prompt> = new Map();
  @property({ type: String }) playbackState: PlaybackState = 'stopped';
  @property({ type: Boolean }) isAiRecording = false;
  @property({ type: Number }) aiRecordedSeconds = 0;

  @state() private studioViewMode: MainStudioViewMode = 'full_studio';

  private handlePromptChanged(e: CustomEvent<Prompt>) {
    this.dispatchEvent(new CustomEvent('prompt-changed', { detail: e.detail, bubbles: true, composed: true }));
  }

  private handleLoadToDeck(deckId: OpusDeckId) {
    this.dispatchEvent(new CustomEvent('load-ai-to-deck', { detail: { deckId }, bubbles: true, composed: true }));
  }

  private handlePlayPause() {
    this.dispatchEvent(new CustomEvent('play-pause', { bubbles: true, composed: true }));
  }

  private handleStartRecording() {
    this.dispatchEvent(new CustomEvent('start-ai-recording', { bubbles: true, composed: true }));
  }

  private handleStopRecording() {
    this.dispatchEvent(new CustomEvent('stop-ai-recording', { bubbles: true, composed: true }));
  }

  private openDjLessonsModal() {
    this.dispatchEvent(new CustomEvent('open-dj-lessons-modal', { bubbles: true, composed: true }));
  }

  private formatTime(secs: number) {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  }

  override render() {
    const showMixer = this.studioViewMode === 'full_studio' || this.studioViewMode === 'mixer_focus';
    const showAiDeck = this.studioViewMode === 'full_studio' || this.studioViewMode === 'ai_deck_focus';

    return html`
      <div class="studio-container">
        <!-- Studio Organization Toolbar with Layout Mode Selection -->
        <div class="studio-toolbar">
          <div class="studio-title-block">
            <span class="studio-badge">OPUS-QUAD + AI DECK</span>
            <div>
              <h1 class="studio-heading">Pioneer OPUS-QUAD Master Studio & AI Live Deck</h1>
              <div class="studio-subtext">
                4-Channel Standalone System positioned directly above Generative AI Prompt Engine
              </div>
            </div>
          </div>

          <div class="view-mode-selector">
            <button
              class="mode-btn ${this.studioViewMode === 'full_studio' ? 'active' : ''}"
              @click=${() => (this.studioViewMode = 'full_studio')}
              title="View both 4-channel mixer and AI generative deck"
            >
              <span>🎚️⚡</span>
              <span>Full Studio (Mixer + AI Deck)</span>
            </button>

            <button
              class="mode-btn ${this.studioViewMode === 'mixer_focus' ? 'active' : ''}"
              @click=${() => (this.studioViewMode = 'mixer_focus')}
              title="Focus view on 4-channel mixer & waveforms"
            >
              <span>🎛️</span>
              <span>Mixer Focus</span>
            </button>

            <button
              class="mode-btn ${this.studioViewMode === 'ai_deck_focus' ? 'active' : ''}"
              @click=${() => (this.studioViewMode = 'ai_deck_focus')}
              title="Focus view on generative AI live deck"
            >
              <span>⚡</span>
              <span>AI Deck Focus</span>
            </button>
          </div>
        </div>

        <!-- DJ LOCKJAH Quick Lesson Strip -->
        <div class="lesson-strip">
          <div class="lesson-strip-left">
            <span class="lesson-tag">🏆 2025 CO DJ OF THE YEAR</span>
            <span style="font-size: 0.8125rem; color: #ffffff; font-weight: 800;">
              Learn to DJ: Private Personal Lessons Direct to You by <strong>DJ LOCKJAH</strong>
            </span>
          </div>
          <button class="btn-lesson-quick" @click=${this.openDjLessonsModal}>
            <span>📅</span>
            <span>LJ Schedule • $50 Deposit</span>
          </button>
        </div>

        <!-- 1. Top Primary Zone: 4-Channel Virtual Mixer & Decks Interface -->
        ${showMixer
          ? html`
              <div class="mixer-section-wrapper">
                <div class="section-header-pill">
                  <div class="section-header-title">
                    <span>🎚️</span>
                    <span>1. Pioneer OPUS-QUAD 4-Channel Mixer & Dual Deck Engine</span>
                  </div>
                  <span style="font-size: 0.6875rem; color: rgba(255,255,255,0.6); font-weight: 800;">
                    STANDALONE 4-CHANNEL MIXER • ZONE 2 OUTPUT • SOUND COLOR FX
                  </span>
                </div>

                <virtual-dj-workspace
                  .engine=${this.engine}
                  @toast=${(e: CustomEvent<string>) =>
                    this.dispatchEvent(new CustomEvent('toast', { detail: e.detail, bubbles: true, composed: true }))}
                ></virtual-dj-workspace>
              </div>
            `
          : html``}

        <!-- Visual Flow Divider -->
        ${showMixer && showAiDeck
          ? html`
              <div class="section-divider">
                <div class="divider-line"></div>
                <div class="divider-badge">
                  <span>↓ DIRECT LIVE AUDIO & STEM STREAMING ↓</span>
                </div>
                <div class="divider-line"></div>
              </div>
            `
          : html``}

        <!-- 2. Bottom Secondary Zone: Initial AI Generative Deck & Prompt Controller -->
        ${showAiDeck
          ? html`
              <div class="ai-deck-section-wrapper">
                <!-- AI Deck Header -->
                <div class="ai-deck-header">
                  <div class="ai-deck-brand">
                    <div class="ai-icon-bubble">⚡</div>
                    <div>
                      <h2 class="ai-deck-title">2. Initial AI Generative Deck & Prompt Matrix</h2>
                      <div class="ai-deck-subtitle">
                        Multi-prompt generative audio synthesis • Route real-time stems directly into OPUS Decks 1–4
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="btn-lesson-quick" style="font-size: 0.6875rem; padding: 6px 12px;" @click=${this.openDjLessonsModal}>
                      <span>🎓</span>
                      <span>Book Lessons ($50 Dep)</span>
                    </button>
                  </div>
                </div>

                <!-- AI Deck Control Toolbar (Recording & Deck Routing) -->
                <div class="ai-toolbar-strip">
                  <div class="rec-status-group">
                    <div class="rec-indicator ${this.isAiRecording ? 'recording' : ''}">
                      <span>${this.isAiRecording ? '● RECORDING' : '○ STANDBY'}</span>
                      <span style="font-family: monospace; font-weight: 900;">
                        ${this.formatTime(this.aiRecordedSeconds)}
                      </span>
                    </div>

                    <span style="font-size: 0.75rem; color: rgba(255,255,255,0.7);">
                      ${this.isAiRecording
                        ? 'Capturing audio chunks • Ready to auto-import to 5-Track Mix Lab'
                        : 'Record live AI output and auto-import as stems into 5-track Mix Lab'}
                    </span>
                  </div>

                  <div class="ai-action-buttons">
                    ${!this.isAiRecording
                      ? html`
                          <button class="btn-rec btn-rec-start" @click=${this.handleStartRecording}>
                            <span>🔴</span>
                            <span>Record AI Deck</span>
                          </button>
                        `
                      : html`
                          <button class="btn-rec btn-rec-stop" @click=${this.handleStopRecording}>
                            <span>⚡</span>
                            <span>Stop & Auto-Import to Mix Lab</span>
                          </button>
                        `}

                    <div class="deck-route-group">
                      <span style="font-size: 0.625rem; font-weight: 900; color: rgba(255,255,255,0.6); padding: 0 4px;">
                        LOAD TO OPUS:
                      </span>
                      ${(['1', '2', '3', '4'] as const).map(
                        (dId) => html`
                          <button
                            class="btn-deck-route"
                            @click=${() => this.handleLoadToDeck(dId)}
                            title="Load current generative prompt audio to OPUS-QUAD Deck ${dId}"
                          >
                            Deck ${dId}
                          </button>
                        `
                      )}
                    </div>
                  </div>
                </div>

                <!-- 4x Prompt Matrix Cards -->
                <div class="prompts-grid">
                  ${[...this.prompts.values()].map(
                    (prompt) => html`
                      <prompt-controller
                        .promptId=${prompt.promptId}
                        .text=${prompt.text}
                        .weight=${prompt.weight}
                        .color=${prompt.color}
                        .cc=${prompt.cc}
                        .midiDispatcher=${this.midiDispatcher}
                        @prompt-changed=${this.handlePromptChanged}
                      ></prompt-controller>
                    `
                  )}
                </div>

                <!-- Global Play/Pause Trigger -->
                <div class="play-pause-row">
                  <play-pause-button
                    .playbackState=${this.playbackState}
                    @click=${this.handlePlayPause}
                  ></play-pause-button>
                </div>
              </div>
            `
          : html``}
      </div>
    `;
  }
}
