/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { BeatFxType, DeckTrackState, OpusDeckId, OpusQuadPerformanceState, SoundColorFxType } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('opus-quad-touch-display')
export class OpusQuadTouchDisplay extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .touchscreen-frame {
      background: linear-gradient(180deg, #101018 0%, #08080d 100%);
      border: 2px solid #282838;
      border-radius: 16px;
      padding: 12px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
    }

    /* Screen Top Status Bar */
    .screen-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.6875rem;
    }

    .screen-brand-label {
      font-weight: 900;
      letter-spacing: 1px;
      color: #f4a261;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .screen-tab-nav {
      display: flex;
      gap: 4px;
      background: rgba(0, 0, 0, 0.4);
      padding: 3px;
      border-radius: 8px;
    }

    .screen-tab-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      border: none;
      padding: 4px 10px;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .screen-tab-btn.active {
      background: #f4a261;
      color: #000000;
    }

    @media (max-width: 520px) {
      .screen-status-bar {
        align-items: stretch;
        flex-direction: column;
        gap: 8px;
      }

      .screen-tab-nav {
        width: 100%;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .screen-tab-btn {
        min-width: 0;
        padding: 6px 2px;
        font-size: 0.6rem;
        white-space: normal;
      }
    }

    .screen-main-viewport {
      min-height: 230px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
    }

    /* Tab 1: 4-Deck Waveforms View */
    .deck-waveforms-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }

    .waveform-lane {
      background: rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      padding: 6px 8px;
      display: grid;
      grid-template-columns: 75px 1fr 68px 65px;
      gap: 8px;
      align-items: center;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .stem-dots-group {
      display: flex;
      gap: 3px;
      align-items: center;
      justify-content: center;
    }

    .stem-dot {
      font-size: 0.5625rem;
      font-weight: 900;
      width: 13px;
      height: 13px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
    }

    .stem-dot.vocal { background: #ff25f6; }
    .stem-dot.drums { background: #2af6de; }
    .stem-dot.bass { background: #ffb703; }
    .stem-dot.melody { background: #9d4edd; }
    .stem-dot.muted {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.3);
      text-decoration: line-through;
    }

    .deck-tag-mini {
      font-size: 0.6875rem;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 4px;
      text-align: center;
    }

    .tag-1 { background: #f4a261; color: #000; }
    .tag-2 { background: #2af6de; color: #000; }
    .tag-3 { background: #ff25f6; color: #000; }
    .tag-4 { background: #3dffab; color: #000; }

    .lane-bars {
      height: 24px;
      background: #050508;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .lane-progress {
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }

    /* Tab 2: Track Browser with Touch Preview & Camelot Matching */
    .browser-view-container {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 10px;
      height: 230px;
    }

    .source-tree {
      background: rgba(0, 0, 0, 0.4);
      border-radius: 8px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .source-item {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 6px 8px;
      border-radius: 5px;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .source-item.selected {
      background: rgba(244, 162, 97, 0.2);
      color: #f4a261;
      border: 1px solid rgba(244, 162, 97, 0.4);
    }

    .track-list-table {
      background: rgba(0, 0, 0, 0.4);
      border-radius: 8px;
      padding: 6px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .track-row {
      display: grid;
      grid-template-columns: 28px 1fr 50px 50px 100px;
      gap: 6px;
      align-items: center;
      padding: 6px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.03);
      cursor: pointer;
      font-size: 0.6875rem;
      transition: all 0.12s;
    }

    .track-row:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .load-buttons-group {
      display: flex;
      gap: 2px;
    }

    .load-btn {
      font: inherit;
      font-size: 0.5625rem;
      font-weight: 900;
      padding: 2px 4px;
      border-radius: 3px;
      cursor: pointer;
      border: none;
    }

    /* Tab 3: XY-Pad Touch FX */
    .xy-pad-container {
      width: 100%;
      height: 230px;
      background: radial-gradient(circle at center, #1b1b26 0%, #0d0d14 100%);
      border-radius: 10px;
      position: relative;
      border: 1px solid rgba(255, 185, 90, 0.3);
      cursor: crosshair;
      user-select: none;
      touch-action: none;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .xy-grid-lines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 25px 25px;
      pointer-events: none;
    }

    .xy-crosshair-node {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #f4a261;
      position: absolute;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 16px #f4a261;
      pointer-events: none;
    }

    .xy-axes-labels {
      position: absolute;
      bottom: 6px;
      left: 10px;
      font-size: 0.625rem;
      color: rgba(255, 255, 255, 0.5);
      pointer-events: none;
    }

    /* Tab 4: Beat FX Rack */
    .beat-fx-rack {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      height: 230px;
    }

    .beat-fractions-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .fraction-btn {
      font: inherit;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 5px 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
    }

    .fraction-btn.active {
      background: #ff25f6;
      color: #000;
      border-color: #ff25f6;
      box-shadow: 0 0 10px rgba(255, 37, 246, 0.5);
    }

    /* Smart Rotary Selector at Bottom */
    .rotary-selector-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.6);
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      gap: 10px;
    }

    .rotary-knob-visual {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: radial-gradient(circle, #333 0%, #151515 80%);
      border: 2px solid #f4a261;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 0.6875rem;
      color: #f4a261;
      cursor: pointer;
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;
  @property({ attribute: false }) public opusState!: OpusQuadPerformanceState;

  @state() private activeMediaSource = 'all';

  private handleXyPointerDown(e: PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.updateXyFromPointer(e);
  }

  private handleXyPointerMove(e: PointerEvent) {
    if (e.buttons > 0) {
      this.updateXyFromPointer(e);
    }
  }

  private handleXyPointerUp(e: PointerEvent) {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (!this.opusState.touchXy.hold) {
      this.engine.setTouchXy(0.5, 0.5, false);
    }
  }

  private updateXyFromPointer(e: PointerEvent) {
    const pad = this.shadowRoot?.querySelector('.xy-pad-container') as HTMLElement;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    this.engine.setTouchXy(x, y, true);
  }

  override render() {
    const s = this.opusState;
    if (!s) return html`<div>Loading Touch Display...</div>`;

    const libraryTracks: DeckTrackState[] = [
      {
        id: 'bp-touch-1',
        title: 'Metro (Extended Club Mix)',
        artist: 'Kevin de Vries & Mau P',
        bpm: 126,
        key: '8A',
        genre: 'Melodic Techno',
        duration: 352,
        source: 'beatport',
        audioBuffer: null,
      },
      {
        id: 'bp-touch-2',
        title: 'Rhyme Dust (VIP Extended)',
        artist: 'MK & Dom Dolla',
        bpm: 128,
        key: '11B',
        genre: 'Tech House',
        duration: 330,
        source: 'beatport',
        audioBuffer: null,
      },
      {
        id: 'track-lib-1',
        title: 'Sunset Horizon (Opus Festival Mix)',
        artist: 'iDj.pro All-Star Residents',
        bpm: 126,
        key: '8A',
        genre: 'Melodic House',
        duration: 210,
        source: 'usb_1',
        audioBuffer: null,
      },
      {
        id: 'track-lib-2',
        title: 'Tokyo Neon Cyber Drive',
        artist: 'DJ Digital Pro',
        bpm: 128,
        key: '11B',
        genre: 'Tech Trance',
        duration: 195,
        source: 'usb_2',
        audioBuffer: null,
      },
      {
        id: 'track-lib-3',
        title: 'Deep Velvet (Zone Lounge VIP)',
        artist: 'Café Del Mar Collective',
        bpm: 118,
        key: '5A',
        genre: 'Organic Lounge',
        duration: 240,
        source: 'cloud',
        audioBuffer: null,
      },
      {
        id: 'track-lib-4',
        title: 'Subterranean Groove (4-Deck Stems)',
        artist: 'Serato DJ Pro Masters',
        bpm: 130,
        key: '9A',
        genre: 'Peak Tech House',
        duration: 180,
        source: 'usb_3',
        audioBuffer: null,
      },
      {
        id: 'track-lib-5',
        title: 'Cyberfunk Odyssey (Rekordbox Link)',
        artist: 'idpro.com Sound Lab',
        bpm: 124,
        key: '8A',
        genre: 'Electro Disco',
        duration: 220,
        source: 'usb_1',
        audioBuffer: null,
      },
    ];

    return html`
      <div class="touchscreen-frame">
        <!-- Status Bar -->
        <div class="screen-status-bar">
          <div class="screen-brand-label">
            <span>✨ OPUS-QUAD 10.1" TOUCH SCREEN</span>
            <span style="background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; color: #fff;">
              ${s.softwareMode.toUpperCase()}
            </span>
          </div>

          <!-- Touch Tabs -->
          <div class="screen-tab-nav">
            <button
              class="screen-tab-btn ${s.touchScreenTab === 'deck_waveforms' ? 'active' : ''}"
              @click=${() => {
                s.touchScreenTab = 'deck_waveforms';
                this.requestUpdate();
              }}
            >
              Waveforms
            </button>
            <button
              class="screen-tab-btn ${s.touchScreenTab === 'browser' ? 'active' : ''}"
              @click=${() => {
                s.touchScreenTab = 'browser';
                this.requestUpdate();
              }}
            >
              Browse Library
            </button>
            <button
              class="screen-tab-btn ${s.touchScreenTab === 'touch_fx' ? 'active' : ''}"
              @click=${() => {
                s.touchScreenTab = 'touch_fx';
                this.requestUpdate();
              }}
            >
              XY Touch FX
            </button>
            <button
              class="screen-tab-btn ${s.touchScreenTab === 'beat_fx' ? 'active' : ''}"
              @click=${() => {
                s.touchScreenTab = 'beat_fx';
                this.requestUpdate();
              }}
            >
              Beat FX Rack
            </button>
          </div>
        </div>

        <!-- Main Viewport -->
        <div class="screen-main-viewport">
          ${s.touchScreenTab === 'deck_waveforms'
            ? html`
                <div class="deck-waveforms-container">
                  ${(['1', '2', '3', '4'] as OpusDeckId[]).map((id) => {
                    const deck = this.engine.deckStates[id];
                    const stems = this.engine.getDeckStems(id);
                    const dur = deck.loadedTrack?.duration || 180;
                    const pct = Math.min(100, (deck.currentTime / dur) * 100);
                    return html`
                      <div class="waveform-lane">
                        <span class="deck-tag-mini tag-${id}">DECK ${id}</span>
                        <div class="lane-bars">
                          <div
                            class="lane-progress tag-${id}"
                            style="width: ${pct}%; opacity: 0.8;"
                          ></div>
                          <span style="position: absolute; left: 8px; top: 4px; font-size: 0.625rem; font-weight: 700; color: #fff; z-index: 2;">
                            ${deck.loadedTrack ? deck.loadedTrack.title : 'Empty Deck'}
                          </span>
                        </div>
                        <div class="stem-dots-group" title="Deck ${id} Stems: Vocal, Drums, Bass, Synth">
                          <span class="stem-dot vocal ${stems.vocalMuted ? 'muted' : ''}">V</span>
                          <span class="stem-dot drums ${stems.drumsMuted ? 'muted' : ''}">D</span>
                          <span class="stem-dot bass ${stems.bassMuted ? 'muted' : ''}">B</span>
                          <span class="stem-dot melody ${stems.melodyMuted ? 'muted' : ''}">S</span>
                        </div>
                        <span style="font-size: 0.625rem; font-family: monospace; color: #3dffab; text-align: right;">
                          ${deck.loadedTrack ? (deck.loadedTrack.bpm * deck.playbackRate).toFixed(1) : '128.0'}
                        </span>
                      </div>
                    `;
                  })}
                </div>
              `
            : s.touchScreenTab === 'browser'
            ? html`
                <div class="browser-view-container">
                  <div class="source-tree">
                    <div class="source-item selected">📁 All Media Tracks</div>
                    <div class="source-item" style="color: #01ff70; font-weight: 800;">🎧 Beatport Streaming LINK</div>
                    <div class="source-item">💾 USB-1 (Top Drive)</div>
                    <div class="source-item">💾 USB-2 (Drive B)</div>
                    <div class="source-item">⚡ USB-C / PC Link</div>
                    <div class="source-item">☁️ CloudDirectPlay</div>
                    <div class="source-item">🔴 Audio Hijack Sapp</div>
                  </div>

                  <div class="track-list-table">
                    ${libraryTracks.map(
                      (t) => html`
                        <div class="track-row">
                          <span style="font-weight: 900; color: #f4a261;">▶</span>
                          <span style="font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${t.title}
                          </span>
                          <span style="color: #3dffab; font-family: monospace;">${t.bpm}</span>
                          <span style="color: #fff; font-family: monospace;">${t.key}</span>
                          <div class="load-buttons-group">
                            ${(['1', '2', '3', '4'] as OpusDeckId[]).map(
                              (dId) => html`
                                <button
                                  class="load-btn tag-${dId}"
                                  @click=${() => this.engine.loadTrackToDeck(dId, t)}
                                  title="Load to Deck ${dId}"
                                >
                                  L${dId}
                                </button>
                              `
                            )}
                          </div>
                        </div>
                      `
                    )}
                  </div>
                </div>
              `
            : s.touchScreenTab === 'touch_fx'
            ? html`
                <div
                  class="xy-pad-container"
                  @pointerdown=${this.handleXyPointerDown}
                  @pointermove=${this.handleXyPointerMove}
                  @pointerup=${this.handleXyPointerUp}
                  @pointercancel=${this.handleXyPointerUp}
                >
                  <div class="xy-grid-lines"></div>
                  <div
                    class="xy-crosshair-node"
                    style="left: ${s.touchXy.x * 100}%; top: ${(1 - s.touchXy.y) * 100}%;"
                  ></div>
                  <div class="xy-axes-labels">
                    <span>X: Sound Color Filter Sweep ⟷ Y: Beat FX Depth & Modulation</span>
                  </div>
                </div>
              `
            : html`
                <div class="beat-fx-rack">
                  <div>
                    <div style="font-size: 0.6875rem; font-weight: 800; color: rgba(255,255,255,0.7); margin-bottom: 6px;">
                      PIONEER BEAT FRACTIONS
                    </div>
                    <div class="beat-fractions-bar">
                      ${([0.0625, 0.125, 0.25, 0.5, 0.75, 1, 2, 4, 8] as number[]).map(
                        (f) => html`
                          <button
                            class="fraction-btn ${s.beatFx.beatFraction === f ? 'active' : ''}"
                            @click=${() => this.engine.setBeatFxBeatFraction(f)}
                          >
                            ${f < 1 ? `1/${1 / f}` : f}
                          </button>
                        `
                      )}
                    </div>
                  </div>

                  <div>
                    <div style="font-size: 0.6875rem; font-weight: 800; color: rgba(255,255,255,0.7); margin-bottom: 6px;">
                      FX ENGINE: ${s.beatFx.type.toUpperCase()} (${s.beatFx.timeMs} ms)
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <button
                        style="font: inherit; font-size: 0.75rem; font-weight: 900; background: ${s.beatFx.active ? '#3dffab' : 'rgba(255,255,255,0.1)'}; color: #000; padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer;"
                        @click=${() => this.engine.toggleBeatFx()}
                      >
                        ${s.beatFx.active ? '⚡ BEAT FX ON' : 'BEAT FX OFF'}
                      </button>
                    </div>
                  </div>
                </div>
              `}
        </div>

        <!-- Smart Rotary Selector Controller Bar -->
        <div class="rotary-selector-row">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="rotary-knob-visual" title="Opus-Quad Smart Rotary Dial">
              🔘
            </div>
            <span style="font-size: 0.6875rem; font-weight: 800; color: #ffffff;">
              Smart Rotary Encoder: 4-Way Push & Click Navigation
            </span>
          </div>

          <div style="display: flex; gap: 6px;">
            <button
              class="screen-tab-btn"
              style="background: rgba(255,255,255,0.1);"
              @click=${() => {
                s.touchScreenTab = 'browser';
                this.requestUpdate();
              }}
            >
              Back
            </button>
            <button
              class="screen-tab-btn"
              style="background: rgba(255,255,255,0.1);"
              @click=${() => {
                s.touchScreenTab = 'deck_waveforms';
                this.requestUpdate();
              }}
            >
              Tag List
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
