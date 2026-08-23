/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CustomDecal, VirtualDeckState } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('virtual-deck')
export class VirtualDeck extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .deck-container {
      background: linear-gradient(180deg, #181822 0%, #101016 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      overflow: hidden;
    }

    .deck-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .deck-badge-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .deck-badge {
      font-size: 0.875rem;
      font-weight: 900;
      padding: 4px 12px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .deck-badge.deck-A {
      background: #ff25f6;
      color: #000;
      box-shadow: 0 0 14px rgba(255, 37, 246, 0.5);
    }

    .deck-badge.deck-B {
      background: #2af6de;
      color: #000;
      box-shadow: 0 0 14px rgba(42, 246, 222, 0.5);
    }

    .track-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
      max-width: 260px;
    }

    .track-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .track-artist {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .deck-bpm-key {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-pill {
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 8px;
      border-radius: 6px;
      color: #3dffab;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Turntable Platter Layout */
    .deck-main-section {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      align-items: center;
    }

    @media (max-width: 768px) {
      .deck-main-section {
        grid-template-columns: 1fr;
      }
    }

    .platter-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    .turntable-body {
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, #252532 0%, #121218 80%);
      border-radius: 50%;
      position: relative;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), inset 0 2px 8px rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: grab;
      user-select: none;
      touch-action: none;
    }

    .turntable-body:active {
      cursor: grabbing;
    }

    .vinyl-grooves {
      width: 236px;
      height: 236px;
      border-radius: 50%;
      background: repeating-radial-gradient(
        circle,
        #15151c,
        #15151c 2px,
        #21212b 3px,
        #15151c 4px
      );
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.9);
      transition: transform 0.05s linear;
    }

    .vinyl-grooves.spinning {
      animation: vinylSpin 1.8s linear infinite;
    }

    .vinyl-grooves.paused {
      animation-play-state: paused;
    }

    @keyframes vinylSpin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .vinyl-center-decal {
      width: 104px;
      height: 104px;
      border-radius: 50%;
      overflow: hidden;
      position: relative;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.8), inset 0 0 6px rgba(0, 0, 0, 0.6);
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .vinyl-center-decal img,
    .vinyl-center-decal svg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .center-spindle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e6e6e6 0%, #666 100%);
      position: absolute;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
      border: 1px solid #ffffff;
      z-index: 5;
    }

    .tonearm {
      position: absolute;
      top: -6px;
      right: 6px;
      width: 60px;
      height: 120px;
      pointer-events: none;
      transition: transform 0.4s ease;
      transform-origin: 50px 10px;
    }

    .tonearm.playing {
      transform: rotate(18deg);
    }

    .tonearm.stopped {
      transform: rotate(-10deg);
    }

    /* Pitch Control Column */
    .pitch-fader-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .pitch-label {
      font-size: 0.6875rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 1px;
    }

    .pitch-slider-vertical {
      writing-mode: vertical-lr;
      direction: rtl;
      height: 140px;
      width: 24px;
      cursor: pointer;
      accent-color: #2af6de;
    }

    .pitch-value {
      font-size: 0.75rem;
      font-weight: 700;
      color: #2af6de;
      font-family: monospace;
    }

    .sync-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      background: rgba(61, 255, 171, 0.15);
      color: #3dffab;
      border: 1px solid rgba(61, 255, 171, 0.4);
      padding: 4px 8px;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sync-btn:hover {
      background: #3dffab;
      color: #000;
    }

    /* Transport and Cue Grid */
    .transport-bar {
      display: grid;
      grid-template-columns: auto auto 1fr auto;
      gap: 10px;
      align-items: center;
    }

    .transport-btn {
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 800;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      border: none;
      user-select: none;
    }

    .play-btn {
      background: #3dffab;
      color: #000000;
      box-shadow: 0 0 14px rgba(61, 255, 171, 0.4);
    }

    .play-btn.playing {
      background: #ffdd28;
      color: #000;
      box-shadow: 0 0 14px rgba(255, 221, 40, 0.5);
    }

    .cue-btn {
      background: #ff6b22;
      color: #fff;
      box-shadow: 0 0 12px rgba(255, 107, 34, 0.4);
    }

    .decal-picker-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .decal-picker-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
    }

    /* Hot Cues & Loops */
    .cues-and-loops {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: rgba(0, 0, 0, 0.25);
      padding: 10px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .section-subhead {
      font-size: 0.6875rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }

    .hot-cue-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .cue-pad {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.6);
      padding: 6px 0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .cue-pad.set {
      background: #9900ff;
      color: #fff;
      border-color: #ff25f6;
      box-shadow: 0 0 10px rgba(153, 0, 255, 0.5);
    }

    .loop-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .loop-pad {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.6);
      padding: 6px 0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .loop-pad.active {
      background: #ffdd28;
      color: #000;
      border-color: #ffdd28;
      box-shadow: 0 0 10px rgba(255, 221, 40, 0.5);
    }

    /* EQ and Filter Knobs strip */
    .eq-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      padding: 10px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .knob-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .knob-label {
      font-size: 0.6875rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.6);
    }

    .knob-slider {
      width: 100%;
      accent-color: #ff25f6;
      cursor: pointer;
    }

    .knob-value {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.8);
      font-family: monospace;
    }

    /* Waveform Progress Bar */
    .waveform-bar-container {
      width: 100%;
      height: 28px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      position: relative;
      cursor: pointer;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .waveform-fill {
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      transition: width 0.08s linear;
    }

    .deck-A-fill {
      background: linear-gradient(90deg, rgba(255, 37, 246, 0.4), rgba(255, 37, 246, 0.8));
    }

    .deck-B-fill {
      background: linear-gradient(90deg, rgba(42, 246, 222, 0.4), rgba(42, 246, 222, 0.8));
    }

    .waveform-playhead {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #ffffff;
      box-shadow: 0 0 8px #ffffff;
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;
  @property({ type: String }) public deckId: 'A' | 'B' = 'A';
  @property({ attribute: false }) public deckState!: VirtualDeckState;

  @state() private isDraggingPlatter = false;
  @state() private lastAngle = 0;

  private formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  private handlePlatterPointerDown(e: PointerEvent) {
    e.preventDefault();
    this.isDraggingPlatter = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const platter = this.shadowRoot?.querySelector('.turntable-body') as HTMLElement;
    if (platter) {
      const rect = platter.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.lastAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    }

    this.engine.startScratch(this.deckId);
  }

  private handlePlatterPointerMove(e: PointerEvent) {
    if (!this.isDraggingPlatter) return;

    const platter = this.shadowRoot?.querySelector('.turntable-body') as HTMLElement;
    if (!platter) return;

    const rect = platter.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    let delta = currentAngle - this.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    this.engine.updateScratch(this.deckId, delta);
    this.lastAngle = currentAngle;
  }

  private handlePlatterPointerUp(e: PointerEvent) {
    if (this.isDraggingPlatter) {
      this.isDraggingPlatter = false;
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

  override render() {
    const s = this.deckState;
    if (!s) return html`<div>Loading deck...</div>`;

    const track = s.loadedTrack;
    const duration = track ? track.duration : 180;
    const current = s.currentTime || 0;
    const progressPercent = Math.min(100, (current / duration) * 100);

    const pitchPercent = ((s.playbackRate - 1.0) * 100).toFixed(1);
    const effectiveBpm = track ? (track.bpm * s.playbackRate).toFixed(1) : '128.0';

    return html`
      <div class="deck-container">
        <!-- Header -->
        <div class="deck-header">
          <div class="deck-badge-group">
            <span class="deck-badge deck-${this.deckId}">Deck ${this.deckId}</span>
            <div class="track-meta">
              <span class="track-title">${track ? track.title : 'No Track Loaded'}</span>
              <span class="track-artist">${track ? track.artist : 'Select or Hijack Audio'}</span>
            </div>
          </div>

          <div class="deck-bpm-key">
            <div class="stat-pill" title="Track Key">
              <span>🎹 ${track ? track.key : '8A'}</span>
            </div>
            <div class="stat-pill" title="Dynamic Master Tempo">
              <span>⚡ ${effectiveBpm} BPM</span>
            </div>
            <button
              class="sync-btn"
              @click=${() => this.engine.syncTempo(this.deckId === 'A' ? 'B' : 'A', this.deckId)}
              title="Sync tempo to opposing deck"
            >
              SYNC
            </button>
          </div>
        </div>

        <!-- Waveform Progress -->
        <div
          class="waveform-bar-container"
          @click=${this.handleSeekWaveform}
          title="Click to seek position"
        >
          <div
            class="waveform-fill deck-${this.deckId}-fill"
            style="width: ${progressPercent}%"
          ></div>
          <div
            class="waveform-playhead"
            style="left: ${progressPercent}%"
          ></div>
          <div
            style="position: absolute; right: 8px; top: 6px; font-size: 0.6875rem; font-family: monospace; color: rgba(255,255,255,0.7);"
          >
            ${this.formatTime(current)} / ${this.formatTime(duration)}
          </div>
        </div>

        <!-- Platter and Pitch Slider -->
        <div class="deck-main-section">
          <div class="platter-wrapper">
            <div
              class="turntable-body"
              @pointerdown=${this.handlePlatterPointerDown}
              @pointermove=${this.handlePlatterPointerMove}
              @pointerup=${this.handlePlatterPointerUp}
              @pointercancel=${this.handlePlatterPointerUp}
              title="Drag platter to scratch or jog scrub"
            >
              <div
                class="vinyl-grooves ${s.isPlaying && !this.isDraggingPlatter ? 'spinning' : 'paused'}"
              >
                <!-- Center Custom Decal Artwork -->
                <div class="vinyl-center-decal" title="Active Vinyl Center Decal">
                  ${s.activeDecal.imageUrl.startsWith('data:image/svg')
                    ? html`<img src="${s.activeDecal.imageUrl}" alt="${s.activeDecal.name}" />`
                    : html`<img src="${s.activeDecal.imageUrl}" alt="${s.activeDecal.name}" />`}
                </div>
                <div class="center-spindle"></div>
              </div>

              <!-- Tonearm Indicator -->
              <svg
                class="tonearm ${s.isPlaying ? 'playing' : 'stopped'}"
                viewBox="0 0 60 120"
              >
                <circle cx="50" cy="10" r="8" fill="#555" stroke="#999" stroke-width="2" />
                <path d="M50 10 L25 70 L28 110" stroke="#bbb" stroke-width="4" fill="none" />
                <rect x="22" y="104" width="12" height="14" rx="2" fill="#ff25f6" />
              </svg>
            </div>
          </div>

          <!-- Pitch Fader -->
          <div class="pitch-fader-column">
            <span class="pitch-label">PITCH</span>
            <input
              type="range"
              class="pitch-slider-vertical"
              min="0.92"
              max="1.08"
              step="0.001"
              .value=${String(s.playbackRate)}
              @input=${(e: Event) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.engine.setDeckPitch(this.deckId, val);
              }}
              title="Adjust pitch rate ±8%"
            />
            <span class="pitch-value">${pitchPercent > '0' ? `+${pitchPercent}` : pitchPercent}%</span>
            <button
              class="sync-btn"
              style="padding: 2px 6px; font-size: 0.625rem;"
              @click=${() => this.engine.setDeckPitch(this.deckId, 1.0)}
              title="Reset Pitch to 0%"
            >
              RESET
            </button>
          </div>
        </div>

        <!-- Transport Controls -->
        <div class="transport-bar">
          <button
            class="transport-btn play-btn ${s.isPlaying ? 'playing' : ''}"
            @click=${() =>
              s.isPlaying ? this.engine.pauseDeck(this.deckId) : this.engine.playDeck(this.deckId)}
          >
            ${s.isPlaying
              ? html`<svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> PAUSE`
              : html`<svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> PLAY`}
          </button>

          <button class="transport-btn cue-btn" @click=${() => this.engine.cueDeck(this.deckId)}>
            CUE
          </button>

          <button
            class="decal-picker-btn"
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('open-decal-studio', {
                  detail: { deckId: this.deckId },
                  bubbles: true,
                  composed: true,
                })
              )}
            title="Upload and apply custom vinyl decals / slipmats"
          >
            <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span>Art Decal: ${s.activeDecal.name.split(' ')[0]}</span>
          </button>
        </div>

        <!-- Hot Cues & Beat Loops -->
        <div class="cues-and-loops">
          <div>
            <div class="section-subhead">HOT CUES</div>
            <div class="hot-cue-grid">
              ${[0, 1, 2, 3].map((idx) => {
                const cue = s.hotCues[idx];
                return html`
                  <button
                    class="cue-pad ${cue !== null ? 'set' : ''}"
                    @click=${() => this.engine.triggerHotCue(this.deckId, idx)}
                    @contextmenu=${(e: MouseEvent) => {
                      e.preventDefault();
                      this.engine.clearHotCue(this.deckId, idx);
                    }}
                    title="${cue !== null ? `Jump to Cue ${idx + 1} (${this.formatTime(cue)}) - Right Click to Clear` : `Set Cue ${idx + 1}`}"
                  >
                    C${idx + 1}
                  </button>
                `;
              })}
            </div>
          </div>

          <div>
            <div class="section-subhead">AUTO LOOP</div>
            <div class="loop-grid">
              ${[0.5, 1, 2, 4].map((beats) => {
                const isActive = s.isLooping && s.loopLength === beats;
                return html`
                  <button
                    class="loop-pad ${isActive ? 'active' : ''}"
                    @click=${() => this.engine.toggleLoop(this.deckId, beats)}
                    title="${beats} Beat Loop"
                  >
                    ${beats < 1 ? '½' : beats}
                  </button>
                `;
              })}
            </div>
          </div>
        </div>

        <!-- 3-Band Isolator EQ & Filter Sweep -->
        <div class="eq-strip">
          <div class="knob-cell">
            <span class="knob-label">HIGH</span>
            <input
              type="range"
              class="knob-slider"
              min="-24"
              max="6"
              step="0.5"
              .value=${String(s.highEq)}
              @input=${(e: Event) =>
                this.engine.setDeckEq(
                  this.deckId,
                  'high',
                  parseFloat((e.target as HTMLInputElement).value)
                )}
            />
            <span class="knob-value">${s.highEq > 0 ? `+${s.highEq}` : s.highEq}dB</span>
          </div>

          <div class="knob-cell">
            <span class="knob-label">MID</span>
            <input
              type="range"
              class="knob-slider"
              min="-24"
              max="6"
              step="0.5"
              .value=${String(s.midEq)}
              @input=${(e: Event) =>
                this.engine.setDeckEq(
                  this.deckId,
                  'mid',
                  parseFloat((e.target as HTMLInputElement).value)
                )}
            />
            <span class="knob-value">${s.midEq > 0 ? `+${s.midEq}` : s.midEq}dB</span>
          </div>

          <div class="knob-cell">
            <span class="knob-label">LOW</span>
            <input
              type="range"
              class="knob-slider"
              min="-24"
              max="6"
              step="0.5"
              .value=${String(s.lowEq)}
              @input=${(e: Event) =>
                this.engine.setDeckEq(
                  this.deckId,
                  'low',
                  parseFloat((e.target as HTMLInputElement).value)
                )}
            />
            <span class="knob-value">${s.lowEq > 0 ? `+${s.lowEq}` : s.lowEq}dB</span>
          </div>

          <div class="knob-cell">
            <span class="knob-label">FILTER</span>
            <input
              type="range"
              class="knob-slider"
              min="-100"
              max="100"
              step="1"
              .value=${String(s.filter)}
              @input=${(e: Event) =>
                this.engine.setDeckFilter(
                  this.deckId,
                  parseFloat((e.target as HTMLInputElement).value)
                )}
            />
            <span class="knob-value" style="color: ${s.filter !== 0 ? '#ffdd28' : 'inherit'}">
              ${s.filter === 0 ? 'FLAT' : s.filter < 0 ? `LP ${s.filter}` : `HP +${s.filter}`}
            </span>
          </div>
        </div>
      </div>
    `;
  }
}
