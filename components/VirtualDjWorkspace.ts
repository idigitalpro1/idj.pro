/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { AudioHijackSession, OpusDeckId, OpusQuadPerformanceState, VirtualDeckState } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';
import './OpusQuadDeck';
import './OpusQuadMixer';
import './OpusQuadTouchDisplay';
import './OpusQuadZoneOutput';
import './VirtualDeck';

@customElement('virtual-dj-workspace')
export class VirtualDjWorkspace extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      box-sizing: border-box;
      padding: 0 8px 24px 8px;
    }

    /* Top Control & System Layout Mode Bar */
    .system-header-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(90deg, #181824 0%, #11111a 100%);
      border: 1px solid rgba(255, 185, 90, 0.3);
      border-radius: 14px;
      padding: 10px 16px;
      margin-bottom: 14px;
      gap: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .brand-system-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .opus-logo-badge {
      font-size: 0.8125rem;
      font-weight: 900;
      background: linear-gradient(135deg, #f4a261, #e76f51);
      color: #000;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 1px;
      box-shadow: 0 0 14px rgba(244, 162, 97, 0.4);
    }

    .opus-system-sub {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.75);
      font-weight: 600;
    }

    .layout-view-modes {
      display: flex;
      gap: 4px;
      background: rgba(0, 0, 0, 0.4);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .mode-toggle-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      border: none;
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .mode-toggle-btn.active {
      background: #f4a261;
      color: #000;
    }

    /* Audio Hijack Sapp Live Banner */
    .hijack-banner {
      background: linear-gradient(90deg, rgba(255, 37, 246, 0.12), rgba(42, 246, 222, 0.12));
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 10px 16px;
      margin-bottom: 14px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    }

    .hijack-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .hijack-badge {
      font-size: 0.6875rem;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 20px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .hijack-badge.active {
      background: #ff25f6;
      color: #fff;
      box-shadow: 0 0 16px rgba(255, 37, 246, 0.6);
      animation: pulse 1.5s infinite;
    }

    .hijack-badge.idle {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.75; transform: scale(0.98); }
    }

    .hijack-text {
      display: flex;
      flex-direction: column;
    }

    .hijack-title {
      font-size: 0.8125rem;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .hijack-sub {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.65);
    }

    .hijack-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hijack-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .btn-mic-hijack {
      background: #ff25f6;
      color: #000;
    }

    .btn-system-hijack {
      background: #2af6de;
      color: #000;
    }

    .btn-stop-hijack {
      background: #ff4d4f;
      color: #fff;
    }

    .route-select {
      font: inherit;
      font-size: 0.6875rem;
      background: #181822;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
    }

    /* Pioneer OPUS-QUAD Flagship Standalone Stage */
    .opus-quad-stage {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.3fr) minmax(0, 1.05fr);
      gap: 14px;
      align-items: start;
    }

    .opus-quad-stage > * {
      min-width: 0;
    }

    @media (max-width: 1180px) {
      .opus-quad-stage {
        grid-template-columns: 1fr;
      }
    }

    .center-touch-mixer-column {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* 4-Deck Quad Grid Layout View */
    .quad-grid-stage {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    @media (max-width: 900px) {
      .quad-grid-stage {
        grid-template-columns: 1fr;
      }
    }

    :host {
      padding: 0 0 24px;
    }

    .system-header-bar {
      padding: 9px 12px;
      margin-bottom: 10px;
      border-color: rgba(255, 255, 255, 0.08);
      border-radius: 11px;
      background: rgba(16, 18, 25, 0.78);
      box-shadow: none;
    }

    .opus-logo-badge {
      color: #f5c18b;
      background: rgba(244, 162, 97, 0.09);
      box-shadow: none;
    }

    .routing-drawer {
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.025);
    }

    .routing-summary {
      list-style: none;
      min-height: 40px;
      padding: 8px 12px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: rgba(255, 255, 255, 0.72);
      font-size: 0.76rem;
      font-weight: 800;
      cursor: pointer;
    }

    .routing-summary::-webkit-details-marker {
      display: none;
    }

    .routing-summary:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.035);
    }

    .routing-state {
      color: #2af6de;
      font-size: 0.68rem;
      font-weight: 800;
    }

    .routing-content {
      padding: 0 10px 10px;
    }

    .hijack-banner {
      margin-bottom: 0;
      box-shadow: none;
    }

    @media (max-width: 700px) {
      .opus-system-sub {
        display: none;
      }

      .system-header-bar,
      .layout-view-modes {
        width: 100%;
        box-sizing: border-box;
      }

      .layout-view-modes {
        overflow-x: auto;
      }

      .mode-toggle-btn {
        flex: 1;
        white-space: nowrap;
      }

      .hijack-actions {
        width: 100%;
        flex-wrap: wrap;
      }
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;

  @state() private opusState!: OpusQuadPerformanceState;
  @state() private hijackSession!: AudioHijackSession;

  override connectedCallback() {
    super.connectedCallback();
    this.opusState = this.engine.opusPerformanceState;
    this.hijackSession = this.engine.hijackSession;

    this.engine.addEventListener('opus-state-changed', (e: Event) => {
      const custom = e as CustomEvent<OpusQuadPerformanceState>;
      this.opusState = { ...custom.detail };
      this.requestUpdate();
    });

    this.engine.addEventListener('deck-state-changed', () => {
      this.requestUpdate();
    });

    this.engine.addEventListener('hijack-session-changed', (e: Event) => {
      const custom = e as CustomEvent<AudioHijackSession>;
      this.hijackSession = { ...custom.detail };
      this.requestUpdate();
    });
  }

  private async toggleMicHijack() {
    if (this.hijackSession?.isActive) {
      this.engine.stopAudioHijack();
    } else {
      try {
        await this.engine.startAudioHijack('microphone');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown audio error';
        this.dispatchEvent(new CustomEvent('toast', { detail: `Mic Ingest Error: ${message}`, bubbles: true, composed: true }));
      }
    }
  }

  private async toggleSystemHijack() {
    if (this.hijackSession?.isActive) {
      this.engine.stopAudioHijack();
    } else {
      try {
        await this.engine.startAudioHijack('system_tab');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown audio error';
        this.dispatchEvent(new CustomEvent('toast', { detail: `System Ingest Error: ${message}`, bubbles: true, composed: true }));
      }
    }
  }

  override render() {
    const s = this.opusState;
    if (!s) return html`<div>Initializing Pioneer OPUS-QUAD System...</div>`;

    const isHijackActive = this.hijackSession?.isActive ?? false;
    const activeLeft = s.activeLeftDeck || '1';
    const activeRight = s.activeRightDeck || '2';

    return html`
      <!-- Top System Bar & View Layout Switcher -->
      <div class="system-header-bar">
        <div class="brand-system-title">
          <span class="opus-logo-badge">OPUS-QUAD</span>
          <span class="opus-system-sub">
            Performance layout
          </span>
        </div>

        <div class="layout-view-modes">
          <button
            class="mode-toggle-btn ${s.viewMode === 'opus_quad_4deck' ? 'active' : ''}"
            @click=${() => {
              s.viewMode = 'opus_quad_4deck';
              this.requestUpdate();
            }}
          >
            Performance
          </button>
          <button
            class="mode-toggle-btn ${s.viewMode === '4deck_grid' ? 'active' : ''}"
            @click=${() => {
              s.viewMode = '4deck_grid';
              this.requestUpdate();
            }}
          >
            Four decks
          </button>
          <button
            class="mode-toggle-btn ${s.viewMode === 'classic_dual' ? 'active' : ''}"
            @click=${() => {
              s.viewMode = 'classic_dual';
              this.requestUpdate();
            }}
          >
            Two decks
          </button>
        </div>
      </div>

      <!-- Advanced venue routing stays available without blocking the decks. -->
      <details class="routing-drawer">
        <summary class="routing-summary">
          <span>Inputs & routing</span>
          <span class="routing-state">${isHijackActive ? '● LIVE INPUT' : 'Zone · mic · tab audio'} &nbsp;⌄</span>
        </summary>
        <div class="routing-content">
          <opus-quad-zone-output
            .engine=${this.engine}
            .zoneState=${s.zone}
          ></opus-quad-zone-output>

          <div class="hijack-banner" style="margin-top: 10px;">
        <div class="hijack-info">
          <span class="hijack-badge ${isHijackActive ? 'active' : 'idle'}">
            ${isHijackActive ? '🔴 LIVE INGEST' : '🎙️ AUDIO HIJACK SAPP'}
          </span>
          <div class="hijack-text">
            <span class="hijack-title">
              ${isHijackActive
                ? this.hijackSession.streamName
                : 'Direct Ingest Destination for External Audio Streams & Hijack Sapp'}
            </span>
            <span class="hijack-sub">
              Route Spotify, Apple Music, Mixcloud, Microphone, or Tab Audio directly into OPUS-QUAD Decks or Zone Output.
            </span>
          </div>
        </div>

        <div class="hijack-actions">
          <label style="font-size: 0.6875rem; color: rgba(255,255,255,0.7); font-weight: 700;">Route:</label>
          <select
            class="route-select"
            .value=${this.hijackSession?.routeToDeck || '1'}
            @change=${(e: Event) =>
              this.engine.setHijackRouting(
                (e.target as HTMLSelectElement).value as
                  | '1'
                  | '2'
                  | '3'
                  | '4'
                  | 'all'
                  | 'zone_output'
                  | 'direct_master'
              )}
          >
            <option value="1">Deck 1 (Channel 1)</option>
            <option value="2">Deck 2 (Channel 2)</option>
            <option value="3">Deck 3 (Channel 3)</option>
            <option value="4">Deck 4 (Channel 4)</option>
            <option value="zone_output">🏢 Direct to Zone Output</option>
            <option value="direct_master">🎚️ Direct Master DSP</option>
          </select>

          ${!isHijackActive
            ? html`
                <button
                  class="hijack-btn btn-mic-hijack"
                  @click=${this.toggleMicHijack}
                  title="Capture live microphone or hardware line-in"
                >
                  🎙️ Mic / Line
                </button>
                <button
                  class="hijack-btn btn-system-hijack"
                  @click=${this.toggleSystemHijack}
                  title="Capture system or browser tab stream (Audio Hijack Sapp destination)"
                >
                  📻 Tab / System Stream
                </button>
              `
            : html`
                <button
                  class="hijack-btn btn-stop-hijack"
                  @click=${() => this.engine.stopAudioHijack()}
                >
                  ⏹️ Stop Hijack
                </button>
              `}
        </div>
          </div>
        </div>
      </details>

      <!-- Main Performance Stages -->
      ${s.viewMode === 'opus_quad_4deck'
        ? html`
            <div class="opus-quad-stage">
              <!-- Left Performance Deck (Deck 1 / 3 Switchable) -->
              <opus-quad-deck
                .engine=${this.engine}
                deckId=${activeLeft}
                .deckState=${this.engine.deckStates[activeLeft]}
              ></opus-quad-deck>

              <!-- Center Stage: 10.1" Touch Display & 4-Channel Standalone Mixer -->
              <div class="center-touch-mixer-column">
                <opus-quad-touch-display
                  .engine=${this.engine}
                  .opusState=${s}
                ></opus-quad-touch-display>

                <opus-quad-mixer
                  .engine=${this.engine}
                ></opus-quad-mixer>
              </div>

              <!-- Right Performance Deck (Deck 2 / 4 Switchable) -->
              <opus-quad-deck
                .engine=${this.engine}
                deckId=${activeRight}
                .deckState=${this.engine.deckStates[activeRight]}
              ></opus-quad-deck>
            </div>
          `
        : s.viewMode === '4deck_grid'
        ? html`
            <div class="quad-grid-stage">
              ${(['1', '2', '3', '4'] as OpusDeckId[]).map(
                (dId) => html`
                  <opus-quad-deck
                    .engine=${this.engine}
                    deckId=${dId}
                    .deckState=${this.engine.deckStates[dId]}
                  ></opus-quad-deck>
                `
              )}
            </div>
            <div style="margin-top: 14px;">
              <opus-quad-mixer .engine=${this.engine}></opus-quad-mixer>
            </div>
          `
        : html`
            <!-- Classic Dual Deck View -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <opus-quad-deck
                .engine=${this.engine}
                deckId="1"
                .deckState=${this.engine.deckStates['1']}
              ></opus-quad-deck>
              <opus-quad-deck
                .engine=${this.engine}
                deckId="2"
                .deckState=${this.engine.deckStates['2']}
              ></opus-quad-deck>
            </div>
            <div style="margin-top: 14px;">
              <opus-quad-mixer .engine=${this.engine}></opus-quad-mixer>
            </div>
          `}
    `;
  }
}
