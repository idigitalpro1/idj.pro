/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CustomDecal, OpusDeckId, PadMode, VirtualDeckState } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('opus-quad-deck')
export class OpusQuadDeck extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .opus-deck-housing {
      background: linear-gradient(175deg, #1f1f2a 0%, #151520 40%, #0d0d14 100%);
      border: 1px solid rgba(255, 185, 90, 0.25);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      overflow: hidden;
    }

    /* Sloping Top Plate Fan Accent */
    .fan-slope-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #d4a373 0%, #e76f51 50%, #f4a261 100%);
      opacity: 0.9;
    }

    /* Deck Switcher Top Bar */
    .deck-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      gap: 8px;
    }

    .deck-select-switch {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 0, 0, 0.5);
      padding: 3px 6px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .deck-id-btn {
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 900;
      padding: 4px 12px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      letter-spacing: 0.5px;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
    }

    .deck-id-btn.active-1 {
      background: #f4a261;
      color: #000;
      box-shadow: 0 0 12px rgba(244, 162, 97, 0.6);
    }

    .deck-id-btn.active-2 {
      background: #2af6de;
      color: #000;
      box-shadow: 0 0 12px rgba(42, 246, 222, 0.6);
    }

    .deck-id-btn.active-3 {
      background: #ff25f6;
      color: #000;
      box-shadow: 0 0 12px rgba(255, 37, 246, 0.6);
    }

    .deck-id-btn.active-4 {
      background: #3dffab;
      color: #000;
      box-shadow: 0 0 12px rgba(61, 255, 171, 0.6);
    }

    .source-badge {
      font-size: 0.6875rem;
      font-weight: 800;
      background: rgba(212, 163, 115, 0.15);
      border: 1px solid rgba(212, 163, 115, 0.4);
      color: #d4a373;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Track Metadata Card */
    .track-meta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      background: rgba(0, 0, 0, 0.35);
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .track-titles {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .track-title-text {
      font-size: 0.9375rem;
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .track-artist-text {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.65);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .track-stats-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .stat-chip {
      font-size: 0.6875rem;
      font-weight: 800;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 3px 6px;
      border-radius: 5px;
      color: #3dffab;
      font-family: monospace;
    }

    /* 3-Band Colored Waveform Bar */
    .waveform-display-bar {
      width: 100%;
      height: 32px;
      background: #09090e;
      border-radius: 6px;
      position: relative;
      cursor: pointer;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .waveform-3band-layer {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      transition: width 0.06s linear;
    }

    .waveform-3band-layer.deck-1-glow {
      background: linear-gradient(90deg, rgba(244, 162, 97, 0.3), rgba(244, 162, 97, 0.75));
    }
    .waveform-3band-layer.deck-2-glow {
      background: linear-gradient(90deg, rgba(42, 246, 222, 0.3), rgba(42, 246, 222, 0.75));
    }
    .waveform-3band-layer.deck-3-glow {
      background: linear-gradient(90deg, rgba(255, 37, 246, 0.3), rgba(255, 37, 246, 0.75));
    }
    .waveform-3band-layer.deck-4-glow {
      background: linear-gradient(90deg, rgba(61, 255, 171, 0.3), rgba(61, 255, 171, 0.75));
    }

    .waveform-cursor {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #ffffff;
      box-shadow: 0 0 10px #ffffff;
    }

    .waveform-time-label {
      position: absolute;
      right: 8px;
      top: 7px;
      font-size: 0.6875rem;
      font-family: monospace;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
      background: rgba(0, 0, 0, 0.6);
      padding: 1px 6px;
      border-radius: 4px;
    }

    /* Platter & Pitch Section Layout */
    .deck-center-stage {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: center;
      justify-items: center;
    }

    /* Opus Quad Authentic Platter */
    .jog-wheel-outer {
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, #242432 0%, #171720 70%, #0c0c12 100%);
      border-radius: 50%;
      position: relative;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.75), inset 0 2px 6px rgba(255, 255, 255, 0.15);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: grab;
      user-select: none;
      touch-action: none;
    }

    .jog-wheel-outer:active {
      cursor: grabbing;
    }

    /* Illuminated Jog Ring LED */
    .jog-led-ring {
      position: absolute;
      width: 228px;
      height: 228px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.1);
      box-sizing: border-box;
      pointer-events: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .jog-led-ring.ring-1 {
      border-color: #f4a261;
      box-shadow: 0 0 16px rgba(244, 162, 97, 0.6), inset 0 0 10px rgba(244, 162, 97, 0.3);
    }
    .jog-led-ring.ring-2 {
      border-color: #2af6de;
      box-shadow: 0 0 16px rgba(42, 246, 222, 0.6), inset 0 0 10px rgba(42, 246, 222, 0.3);
    }
    .jog-led-ring.ring-3 {
      border-color: #ff25f6;
      box-shadow: 0 0 16px rgba(255, 37, 246, 0.6), inset 0 0 10px rgba(255, 37, 246, 0.3);
    }
    .jog-led-ring.ring-4 {
      border-color: #3dffab;
      box-shadow: 0 0 16px rgba(61, 255, 171, 0.6), inset 0 0 10px rgba(61, 255, 171, 0.3);
    }

    .jog-platter-vinyl {
      width: 216px;
      height: 216px;
      border-radius: 50%;
      background: repeating-radial-gradient(
        circle,
        #121218,
        #121218 2px,
        #1d1d26 3px,
        #121218 4px
      );
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.9);
    }

    .jog-platter-vinyl.spinning {
      animation: jogSpin 1.8s linear infinite;
    }

    .jog-platter-vinyl.paused {
      animation-play-state: paused;
    }

    @keyframes jogSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* On-Jog Central Display */
    .on-jog-display {
      width: 108px;
      height: 108px;
      border-radius: 50%;
      background: #08080c;
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.9);
      z-index: 4;
      pointer-events: none;
    }

    .on-jog-decal-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.35;
    }

    .on-jog-text-bpm {
      font-size: 0.8125rem;
      font-weight: 900;
      color: #3dffab;
      font-family: monospace;
      z-index: 5;
    }

    .on-jog-text-key {
      font-size: 0.6875rem;
      font-weight: 800;
      color: #ffffff;
      z-index: 5;
    }

    .on-jog-needle {
      position: absolute;
      top: 6px;
      width: 3px;
      height: 16px;
      background: #ff25f6;
      border-radius: 2px;
      box-shadow: 0 0 6px #ff25f6;
    }

    /* Precision 100mm Pitch Fader Column */
    .pitch-tempo-strip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      background: rgba(0, 0, 0, 0.35);
      padding: 10px 10px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      width: 80px;
    }

    .pitch-fader-header {
      font-size: 0.625rem;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 1px;
    }

    .pitch-vertical-slider {
      writing-mode: vertical-lr;
      direction: rtl;
      height: 140px;
      width: 22px;
      cursor: pointer;
      accent-color: #f4a261;
    }

    .pitch-pct-text {
      font-size: 0.75rem;
      font-weight: 800;
      color: #f4a261;
      font-family: monospace;
    }

    .pitch-range-btn {
      font: inherit;
      font-size: 0.625rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
    }

    .master-tempo-btn {
      font: inherit;
      font-size: 0.625rem;
      font-weight: 900;
      padding: 3px 6px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s;
    }

    .master-tempo-btn.active {
      background: #ffdd28;
      color: #000;
      box-shadow: 0 0 8px rgba(255, 221, 40, 0.5);
    }
    .master-tempo-btn.inactive {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);
    }

    /* Auxiliary Deck Controls Row: Slip, Jog Tension, Key Sync */
    .aux-deck-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.3);
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .aux-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 5px;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.75);
      transition: all 0.15s;
    }

    .aux-btn.slip-active {
      background: #ff25f6;
      color: #000;
      box-shadow: 0 0 10px rgba(255, 37, 246, 0.6);
    }

    .aux-btn.sync-active {
      background: #3dffab;
      color: #000;
      box-shadow: 0 0 10px rgba(61, 255, 171, 0.5);
    }

    /* 8 Multi-Color Performance Pads & Mode Selectors */
    .pads-container {
      background: rgba(0, 0, 0, 0.4);
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pad-mode-bar {
      display: flex;
      justify-content: space-between;
      gap: 4px;
    }

    .pad-mode-btn {
      font: inherit;
      font-size: 0.625rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.6);
      border: none;
      padding: 3px 6px;
      border-radius: 4px;
      cursor: pointer;
      flex: 1;
      text-align: center;
      text-transform: uppercase;
    }

    .pad-mode-btn.active {
      background: #ffffff;
      color: #000000;
      font-weight: 900;
    }

    .pads-8-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .performance-pad {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      height: 36px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.12s;
    }

    .performance-pad.pad-set {
      background: linear-gradient(135deg, #f4a261, #e76f51);
      color: #000;
      border-color: #f4a261;
      box-shadow: 0 0 10px rgba(244, 162, 97, 0.5);
    }

    /* Tactile Heavy-Duty Play & Cue Buttons */
    .tactile-transport-bar {
      display: grid;
      grid-template-columns: 80px 80px 1fr auto;
      gap: 10px;
      align-items: center;
    }

    .circle-transport-btn {
      font: inherit;
      height: 48px;
      border-radius: 24px;
      cursor: pointer;
      font-weight: 900;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      transition: all 0.15s ease;
      user-select: none;
    }

    .btn-play-halo {
      background: #3dffab;
      color: #000000;
      box-shadow: 0 0 16px rgba(61, 255, 171, 0.5);
    }

    .btn-play-halo.playing {
      background: #ffdd28;
      color: #000000;
      box-shadow: 0 0 18px rgba(255, 221, 40, 0.6);
    }

    .btn-cue-halo {
      background: #ff6b22;
      color: #ffffff;
      box-shadow: 0 0 14px rgba(255, 107, 34, 0.5);
    }

    .decal-link-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .decal-link-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }

    /* iPad / Tablet Landscape & Touch Optimization (Min 44x44px Targets) */
    @media only screen and (min-width: 1024px) and (max-height: 1366px) and (orientation: landscape) {
      .opus-deck-housing {
        padding: 12px;
        gap: 10px;
      }
      .performance-pad {
        min-height: 44px;
        min-width: 44px;
      }
      .aux-btn {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .circle-transport-btn {
        min-height: 52px;
      }
      .pitch-range-btn, .master-tempo-btn {
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;
  @property({ type: String }) public deckId: OpusDeckId = '1';
  @property({ attribute: false }) public deckState!: VirtualDeckState;

  @state() private isDraggingJog = false;
  @state() private lastAngle = 0;

  private formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  private handleJogPointerDown(e: PointerEvent) {
    e.preventDefault();
    this.isDraggingJog = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const jog = this.shadowRoot?.querySelector('.jog-wheel-outer') as HTMLElement;
    if (jog) {
      const rect = jog.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.lastAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    }

    this.engine.startScratch(this.deckId);
  }

  private handleJogPointerMove(e: PointerEvent) {
    if (!this.isDraggingJog) return;

    const jog = this.shadowRoot?.querySelector('.jog-wheel-outer') as HTMLElement;
    if (!jog) return;

    const rect = jog.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    let delta = currentAngle - this.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    this.engine.updateScratch(this.deckId, delta);
    this.lastAngle = currentAngle;
  }

  private handleJogPointerUp(e: PointerEvent) {
    if (this.isDraggingJog) {
      this.isDraggingJog = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      this.engine.endScratch(this.deckId, this.deckState?.isPlaying ?? false);
    }
  }

  private handleSeekWaveform(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const duration = this.deckState?.loadedTrack?.duration || 180;
    this.engine.seekDeck(this.deckId, ratio * duration);
  }

  private switchDeckPair(targetId: OpusDeckId) {
    if (this.deckId === '1' || this.deckId === '3') {
      this.engine.opusPerformanceState.activeLeftDeck = targetId as '1' | '3';
    } else {
      this.engine.opusPerformanceState.activeRightDeck = targetId as '2' | '4';
    }
    this.dispatchEvent(
      new CustomEvent('deck-switch-requested', {
        detail: { deckId: targetId },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const s = this.deckState;
    if (!s) return html`<div>Loading Deck ${this.deckId}...</div>`;

    const track = s.loadedTrack;
    const duration = track ? track.duration : 180;
    const current = s.currentTime || 0;
    const progressPercent = Math.min(100, (current / duration) * 100);

    const pitchPercent = ((s.playbackRate - 1.0) * 100).toFixed(2);
    const effectiveBpm = track ? (track.bpm * s.playbackRate).toFixed(1) : '128.0';

    const isLeftDeck = this.deckId === '1' || this.deckId === '3';
    const otherDeckInPair: OpusDeckId = this.deckId === '1' ? '3' : this.deckId === '3' ? '1' : this.deckId === '2' ? '4' : '2';

    return html`
      <div class="opus-deck-housing">
        <div class="fan-slope-accent"></div>

        <!-- Deck Switch & Source Header -->
        <div class="deck-top-bar">
          <div class="deck-select-switch">
            <button
              class="deck-id-btn ${this.deckId === '1' ? 'active-1' : this.deckId === '2' ? 'active-2' : this.deckId === '3' ? 'active-3' : 'active-4'}"
              title="Active Deck"
            >
              DECK ${this.deckId}
            </button>
            <button
              class="deck-id-btn"
              @click=${() => this.switchDeckPair(otherDeckInPair)}
              title="Switch to Deck ${otherDeckInPair}"
            >
              DECK ${otherDeckInPair} ↷
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="source-badge">🔌 ${s.inputSource.replace('_', ' ')}</span>
            ${s.isMasterDeck ? html`<span class="source-badge" style="background: #ffdd28; color: #000; font-weight: 900;">MASTER</span>` : ''}
          </div>
        </div>

        <!-- Track Metadata Header -->
        <div class="track-meta-header">
          <div class="track-titles">
            <span class="track-title-text">${track ? track.title : 'No Track Loaded'}</span>
            <span class="track-artist-text">${track ? track.artist : 'Select track from Touch Screen'}</span>
          </div>

          <div class="track-stats-group">
            <div class="stat-chip" title="Harmonic Key">
              <span>🎹 ${track ? track.key : '8A'}</span>
            </div>
            <div class="stat-chip" title="Dynamic BPM">
              <span>⚡ ${effectiveBpm}</span>
            </div>
          </div>
        </div>

        <!-- 3-Band Colored Waveform Bar -->
        <div
          class="waveform-display-bar"
          @click=${this.handleSeekWaveform}
          title="Click to seek track position"
        >
          <div
            class="waveform-3band-layer deck-${this.deckId}-glow"
            style="width: ${progressPercent}%"
          ></div>
          <div
            class="waveform-cursor"
            style="left: ${progressPercent}%"
          ></div>
          <div class="waveform-time-label">
            ${this.formatTime(current)} / ${this.formatTime(duration)}
          </div>
        </div>

        <!-- Center Stage: Platter + Pitch Slider -->
        <div class="deck-center-stage">
          <!-- Jog Wheel Platter with On-Jog Display -->
          <div
            class="jog-wheel-outer"
            @pointerdown=${this.handleJogPointerDown}
            @pointermove=${this.handleJogPointerMove}
            @pointerup=${this.handleJogPointerUp}
            @pointercancel=${this.handleJogPointerUp}
            title="Pioneer Opus-Quad Jog Wheel: Drag to scratch or jog scrub"
          >
            <div class="jog-led-ring ring-${this.deckId}"></div>
            <div class="jog-platter-vinyl ${s.isPlaying && !this.isDraggingJog ? 'spinning' : 'paused'}"></div>

            <!-- Central On-Jog Screen -->
            <div class="on-jog-display">
              ${s.activeDecal?.imageUrl
                ? html`<img src="${s.activeDecal.imageUrl}" class="on-jog-decal-bg" alt="decal" />`
                : ''}
              <div class="on-jog-needle"></div>
              <span class="on-jog-text-bpm">${effectiveBpm}</span>
              <span class="on-jog-text-key">${track ? track.key : '8A'}</span>
              <span style="font-size: 0.5625rem; color: rgba(255,255,255,0.7); z-index: 5;">
                ${s.isLooping ? `LOOP ${s.loopLength}` : s.slipMode ? 'SLIP' : 'OPUS'}
              </span>
            </div>
          </div>

          <!-- Precision 100mm Pitch Tempo Slider -->
          <div class="pitch-tempo-strip">
            <span class="pitch-fader-header">TEMPO</span>
            <input
              type="range"
              class="pitch-vertical-slider"
              min="0.90"
              max="1.10"
              step="0.0005"
              .value=${String(s.playbackRate)}
              @input=${(e: Event) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.engine.setDeckPitch(this.deckId, val);
              }}
              title="Pitch Tempo Fader ±${s.pitchRange}%"
            />
            <span class="pitch-pct-text">${pitchPercent > '0' ? `+${pitchPercent}` : pitchPercent}%</span>
            <button
              class="master-tempo-btn ${s.keyLock ? 'active' : 'inactive'}"
              @click=${() => {
                s.keyLock = !s.keyLock;
                this.engine.setDeckPitch(this.deckId, s.playbackRate);
              }}
              title="Master Tempo (Key Lock)"
            >
              MASTER TEMPO
            </button>
            <button
              class="pitch-range-btn"
              @click=${() => {
                this.engine.setDeckPitch(this.deckId, 1.0);
              }}
              title="Reset pitch to 0.00%"
            >
              RESET 0%
            </button>
          </div>
        </div>

        <!-- Auxiliary Controls: Slip, Key Shift, Beat Sync -->
        <div class="aux-deck-controls">
          <button
            class="aux-btn ${s.slipMode ? 'slip-active' : ''}"
            @click=${() => this.engine.toggleSlipMode(this.deckId)}
            title="Slip Mode: Continue background playback during scratch/loop"
          >
            SLIP ${s.slipMode ? 'ON' : 'OFF'}
          </button>

          <button
            class="aux-btn"
            @click=${() => this.engine.setDeckKeyShift(this.deckId, s.keyShift - 1)}
            title="Key Shift Down 1 Semitone"
          >
            ♭ KEY
          </button>
          <span style="font-size: 0.6875rem; font-family: monospace; font-weight: 800;">
            ${s.keyShift > 0 ? `+${s.keyShift}` : s.keyShift}
          </span>
          <button
            class="aux-btn"
            @click=${() => this.engine.setDeckKeyShift(this.deckId, s.keyShift + 1)}
            title="Key Shift Up 1 Semitone"
          >
            KEY ♯
          </button>

          <button
            class="aux-btn ${s.tempoSync ? 'sync-active' : ''}"
            @click=${() => {
              const masterTarget: OpusDeckId = isLeftDeck ? '2' : '1';
              this.engine.syncTempo(masterTarget, this.deckId);
            }}
            title="Beat Sync to Master Deck"
          >
            BEAT SYNC
          </button>
        </div>

        <!-- 8 Multi-Color Performance Pads -->
        <div class="pads-container">
          <div class="pad-mode-bar">
            ${(['hot_cue', 'beat_loop', 'beat_jump', 'key_shift'] as PadMode[]).map(
              (mode) => html`
                <button
                  class="pad-mode-btn ${s.padMode === mode ? 'active' : ''}"
                  @click=${() => this.engine.setPadMode(this.deckId, mode)}
                >
                  ${mode.replace('_', ' ')}
                </button>
              `
            )}
          </div>

          <div class="pads-8-grid">
            ${[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
              if (s.padMode === 'hot_cue') {
                const cue = s.hotCues[idx];
                return html`
                  <button
                    class="performance-pad ${cue !== null ? 'pad-set' : ''}"
                    @click=${() => this.engine.triggerHotCue(this.deckId, idx)}
                    @contextmenu=${(e: MouseEvent) => {
                      e.preventDefault();
                      this.engine.clearHotCue(this.deckId, idx);
                    }}
                    title="${cue !== null ? `Jump Cue ${idx + 1} (${this.formatTime(cue)}) - Right Click Clear` : `Set Hot Cue ${idx + 1}`}"
                  >
                    ${idx + 1}
                  </button>
                `;
              } else if (s.padMode === 'beat_loop') {
                const loopLengths = [0.25, 0.5, 1, 2, 4, 8, 16, 32];
                const beats = loopLengths[idx];
                const isActive = s.isLooping && s.loopLength === beats;
                return html`
                  <button
                    class="performance-pad ${isActive ? 'pad-set' : ''}"
                    @click=${() => this.engine.toggleLoop(this.deckId, beats)}
                    title="${beats} Beat Loop"
                  >
                    ${beats < 1 ? `1/${1 / beats}` : beats}
                  </button>
                `;
              } else if (s.padMode === 'beat_jump') {
                const jumps = [-16, -8, -4, -1, 1, 4, 8, 16];
                const jump = jumps[idx];
                return html`
                  <button
                    class="performance-pad"
                    @click=${() => {
                      const beatSec = 60 / (track ? track.bpm : 128);
                      this.engine.seekDeck(this.deckId, s.currentTime + jump * beatSec);
                    }}
                    title="Jump ${jump > 0 ? `+${jump}` : jump} Beats"
                  >
                    ${jump > 0 ? `+${jump}` : jump}
                  </button>
                `;
              } else {
                // Key Shift
                const shifts = [-4, -3, -2, -1, 1, 2, 3, 4];
                const shift = shifts[idx];
                return html`
                  <button
                    class="performance-pad ${s.keyShift === shift ? 'pad-set' : ''}"
                    @click=${() => this.engine.setDeckKeyShift(this.deckId, shift)}
                    title="Shift Key ${shift > 0 ? `+${shift}` : shift} Semitones"
                  >
                    ${shift > 0 ? `+${shift}` : shift}
                  </button>
                `;
              }
            })}
          </div>
        </div>

        <!-- Tactile Transport Halo Buttons & Decals Studio Trigger -->
        <div class="tactile-transport-bar">
          <button
            class="circle-transport-btn btn-play-halo ${s.isPlaying ? 'playing' : ''}"
            @click=${() =>
              s.isPlaying ? this.engine.pauseDeck(this.deckId) : this.engine.playDeck(this.deckId)}
            title="Tactile Play/Pause button"
          >
            ${s.isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
          </button>

          <button
            class="circle-transport-btn btn-cue-halo"
            @click=${() => this.engine.cueDeck(this.deckId)}
            title="Cue button"
          >
            CUE
          </button>

          <button
            class="decal-link-btn"
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('open-decal-studio', {
                  detail: { deckId: this.deckId },
                  bubbles: true,
                  composed: true,
                })
              )}
            title="Customize vinyl slipmat and center decal artwork"
          >
            <span>🎨 Decal: ${s.activeDecal?.name?.split(' ')[0] || 'Default'}</span>
          </button>
        </div>
      </div>
    `;
  }
}
