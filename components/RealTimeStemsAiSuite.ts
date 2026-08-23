/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DeckStemsState, DeckTrackState, OpusDeckId, TrackPhraseAnalysis } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('realtime-stems-ai-suite')
export class RealTimeStemsAiSuite extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      box-sizing: border-box;
      padding: 4px 8px 32px 8px;
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .suite-header {
      background: linear-gradient(90deg, rgba(255, 37, 246, 0.15), rgba(42, 246, 222, 0.15));
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 14px;
      padding: 14px 20px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .suite-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .suite-badge {
      font-size: 0.8125rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ff25f6, #2af6de);
      color: #000;
      padding: 5px 12px;
      border-radius: 6px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .suite-desc {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.75);
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
      margin-bottom: 24px;
    }

    @media (max-width: 960px) {
      .grid-container {
        grid-template-columns: 1fr;
      }
    }

    /* Deck Stem Card */
    .deck-stem-card {
      background: #14141f;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .deck-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 10px;
    }

    .deck-pill {
      font-size: 0.75rem;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 4px;
      background: #ff25f6;
      color: #000;
    }

    .deck-title-text {
      font-size: 0.875rem;
      font-weight: 800;
      color: #ffffff;
    }

    .deck-quick-punches {
      display: flex;
      gap: 6px;
    }

    .punch-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .punch-btn:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .punch-btn.active {
      background: #2af6de;
      color: #000;
      border-color: #2af6de;
      box-shadow: 0 0 10px rgba(42, 246, 222, 0.5);
    }

    /* 4-Stem Sliders Grid */
    .stems-fader-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .stem-column {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .stem-label-tag {
      font-size: 0.6875rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .vocal-color { color: #ff25f6; }
    .drums-color { color: #2af6de; }
    .bass-color { color: #ffb703; }
    .melody-color { color: #9d4edd; }

    .stem-slider-wrap {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stem-slider {
      appearance: slider-vertical;
      -webkit-appearance: slider-vertical;
      width: 28px;
      height: 110px;
      cursor: pointer;
    }

    .stem-controls-row {
      display: flex;
      gap: 4px;
      width: 100%;
      justify-content: center;
    }

    .btn-stem-act {
      font: inherit;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 3px 6px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-stem-act.muted {
      background: #ff4d4f;
      color: #fff;
      border-color: #ff4d4f;
    }

    .btn-stem-act.solo {
      background: #ffd166;
      color: #000;
      border-color: #ffd166;
      font-weight: 900;
    }

    .stem-fx-select {
      font: inherit;
      font-size: 0.625rem;
      background: #0f0f18;
      color: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      padding: 2px 4px;
      width: 100%;
      cursor: pointer;
    }

    /* AI Tools Section */
    .ai-tools-panel {
      background: #14141f;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ai-section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 10px;
    }

    .ai-section-title {
      font-size: 0.9375rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ai-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    @media (max-width: 1024px) {
      .ai-cards-grid {
        grid-template-columns: 1fr;
      }
    }

    .ai-tool-box {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ai-tool-box-title {
      font-size: 0.8125rem;
      font-weight: 800;
      color: #2af6de;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ai-tool-box-desc {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.65);
      line-height: 1.4;
    }

    .harmonic-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      padding: 5px 8px;
      border-radius: 6px;
      font-size: 0.6875rem;
    }

    .btn-ai-act {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      background: linear-gradient(135deg, #ff25f6, #9900ff);
      color: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-ai-act:hover {
      box-shadow: 0 0 14px rgba(255, 37, 246, 0.6);
      transform: translateY(-1px);
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;

  @state() private activeDecks: OpusDeckId[] = ['1', '2', '3', '4'];

  override connectedCallback() {
    super.connectedCallback();
    this.engine.addEventListener('stems-state-changed', () => this.requestUpdate());
    this.engine.addEventListener('deck-state-changed', () => this.requestUpdate());
  }

  private renderDeckStemPanel(deckId: OpusDeckId) {
    const deck = this.engine.deckStates[deckId];
    const stems = this.engine.getDeckStems(deckId) || {
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

    const trackTitle = deck?.loadedTrack ? `${deck.loadedTrack.title} • ${deck.loadedTrack.artist}` : 'Empty Deck';
    const bpm = deck?.loadedTrack?.bpm || 128;
    const key = deck?.loadedTrack?.key || '8A';

    return html`
      <div class="deck-stem-card">
        <div class="deck-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="deck-pill">DECK ${deckId}</span>
            <div>
              <div class="deck-title-text">${trackTitle}</div>
              <div style="font-size: 0.6875rem; color: rgba(255,255,255,0.6);">
                ${bpm} BPM • Key: <strong style="color: #2af6de;">${key}</strong>
              </div>
            </div>
          </div>

          <div class="deck-quick-punches">
            <button
              class="punch-btn ${stems.activeAcapella ? 'active' : ''}"
              @click=${() => this.engine.triggerInstantAcapella(deckId)}
              title="Instant Acapella: Solos vocal, removes drums, bass & melody"
            >
              🎤 Acapella
            </button>
            <button
              class="punch-btn ${stems.activeInstrumental ? 'active' : ''}"
              @click=${() => this.engine.triggerInstantInstrumental(deckId)}
              title="Instant Instrumental: Mutes vocals, keeps beat & instruments"
            >
              🥁 Inst
            </button>
            <button
              class="punch-btn"
              @click=${() => this.engine.resetStems(deckId)}
              title="Reset all stems to 100%"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        <div class="stems-fader-grid">
          <!-- 1. Vocal Stem -->
          <div class="stem-column">
            <span class="stem-label-tag vocal-color">🎤 Vocals</span>
            <div class="stem-slider-wrap">
              <input
                type="range"
                class="stem-slider"
                min="0"
                max="1.5"
                step="0.01"
                .value=${stems.vocalMuted ? '0' : stems.vocalVolume.toString()}
                @input=${(e: Event) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  this.engine.setDeckStemVolume(deckId, 'vocal', val);
                }}
              />
            </div>
            <div class="stem-controls-row">
              <button
                class="btn-stem-act ${stems.vocalMuted ? 'muted' : ''}"
                @click=${() => this.engine.toggleDeckStemMute(deckId, 'vocal')}
              >
                ${stems.vocalMuted ? 'MUTED' : 'MUTE'}
              </button>
              <button
                class="btn-stem-act ${stems.vocalSolo ? 'solo' : ''}"
                @click=${() => this.engine.toggleDeckStemSolo(deckId, 'vocal')}
              >
                SOLO
              </button>
            </div>
            <select
              class="stem-fx-select"
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.engine.setDeckStemFx(deckId, 'vocal', val);
              }}
            >
              <option value="none">No Stem FX</option>
              <option value="echo" ?selected=${stems.vocalFx === 'echo'}>Vocal Echo (1/2)</option>
              <option value="reverb" ?selected=${stems.vocalFx === 'reverb'}>Vocal Hall</option>
            </select>
          </div>

          <!-- 2. Drums Stem -->
          <div class="stem-column">
            <span class="stem-label-tag drums-color">🥁 Drums</span>
            <div class="stem-slider-wrap">
              <input
                type="range"
                class="stem-slider"
                min="0"
                max="1.5"
                step="0.01"
                .value=${stems.drumsMuted ? '0' : stems.drumsVolume.toString()}
                @input=${(e: Event) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  this.engine.setDeckStemVolume(deckId, 'drums', val);
                }}
              />
            </div>
            <div class="stem-controls-row">
              <button
                class="btn-stem-act ${stems.drumsMuted ? 'muted' : ''}"
                @click=${() => this.engine.toggleDeckStemMute(deckId, 'drums')}
              >
                ${stems.drumsMuted ? 'MUTED' : 'MUTE'}
              </button>
              <button
                class="btn-stem-act ${stems.drumsSolo ? 'solo' : ''}"
                @click=${() => this.engine.toggleDeckStemSolo(deckId, 'drums')}
              >
                SOLO
              </button>
            </div>
            <select
              class="stem-fx-select"
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.engine.setDeckStemFx(deckId, 'drums', val);
              }}
            >
              <option value="none">No Stem FX</option>
              <option value="filter" ?selected=${stems.drumsFx === 'filter'}>Drum Filter</option>
              <option value="roll" ?selected=${stems.drumsFx === 'roll'}>Drum Roll 1/4</option>
            </select>
          </div>

          <!-- 3. Bass Stem -->
          <div class="stem-column">
            <span class="stem-label-tag bass-color">🎸 Bass</span>
            <div class="stem-slider-wrap">
              <input
                type="range"
                class="stem-slider"
                min="0"
                max="1.5"
                step="0.01"
                .value=${stems.bassMuted ? '0' : stems.bassVolume.toString()}
                @input=${(e: Event) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  this.engine.setDeckStemVolume(deckId, 'bass', val);
                }}
              />
            </div>
            <div class="stem-controls-row">
              <button
                class="btn-stem-act ${stems.bassMuted ? 'muted' : ''}"
                @click=${() => this.engine.toggleDeckStemMute(deckId, 'bass')}
              >
                ${stems.bassMuted ? 'MUTED' : 'MUTE'}
              </button>
              <button
                class="btn-stem-act ${stems.bassSolo ? 'solo' : ''}"
                @click=${() => this.engine.toggleDeckStemSolo(deckId, 'bass')}
              >
                SOLO
              </button>
            </div>
            <select
              class="stem-fx-select"
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.engine.setDeckStemFx(deckId, 'bass', val);
              }}
            >
              <option value="none">No Stem FX</option>
              <option value="sub_boost" ?selected=${stems.bassFx === 'sub_boost'}>Sub Boost +6dB</option>
              <option value="ducking" ?selected=${stems.bassFx === 'ducking'}>Sidechain Duck</option>
            </select>
          </div>

          <!-- 4. Melody Stem -->
          <div class="stem-column">
            <span class="stem-label-tag melody-color">🎹 Melody</span>
            <div class="stem-slider-wrap">
              <input
                type="range"
                class="stem-slider"
                min="0"
                max="1.5"
                step="0.01"
                .value=${stems.melodyMuted ? '0' : stems.melodyVolume.toString()}
                @input=${(e: Event) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  this.engine.setDeckStemVolume(deckId, 'melody', val);
                }}
              />
            </div>
            <div class="stem-controls-row">
              <button
                class="btn-stem-act ${stems.melodyMuted ? 'muted' : ''}"
                @click=${() => this.engine.toggleDeckStemMute(deckId, 'melody')}
              >
                ${stems.melodyMuted ? 'MUTED' : 'MUTE'}
              </button>
              <button
                class="btn-stem-act ${stems.melodySolo ? 'solo' : ''}"
                @click=${() => this.engine.toggleDeckStemSolo(deckId, 'melody')}
              >
                SOLO
              </button>
            </div>
            <select
              class="stem-fx-select"
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.engine.setDeckStemFx(deckId, 'melody', val);
              }}
            >
              <option value="none">No Stem FX</option>
              <option value="flanger" ?selected=${stems.melodyFx === 'flanger'}>Flanger FX</option>
              <option value="space" ?selected=${stems.melodyFx === 'space'}>Space Shimmer</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    const deck1 = this.engine.deckStates['1'];
    const currentKey = deck1?.loadedTrack?.key || '8A';
    const harmonicMatches = this.engine.getHarmonicKeyRecommendations(currentKey);

    return html`
      <!-- Header -->
      <div class="suite-header">
        <div class="suite-title-group">
          <span class="suite-badge">Real-Time Stems & AI Engine</span>
          <div>
            <div style="font-size: 0.9375rem; font-weight: 900; color: #ffffff;">
              Neural 4-Way Stem Separation & AI Performance Suite
            </div>
            <div class="suite-desc">
              Live split Vocals, Drums, Bass, and Melody with instant Acapella/Instrumental punches, Stem FX, and AI harmonic transitions.
            </div>
          </div>
        </div>
      </div>

      <!-- 4 Decks Stems Matrix -->
      <div class="grid-container">
        ${this.renderDeckStemPanel('1')}
        ${this.renderDeckStemPanel('2')}
        ${this.renderDeckStemPanel('3')}
        ${this.renderDeckStemPanel('4')}
      </div>

      <!-- AI-Driven Performance Tools Suite -->
      <div class="ai-tools-panel">
        <div class="ai-section-head">
          <div class="ai-section-title">
            <span>⚡ AI Performance Tools & Harmonic Camelot Matcher</span>
          </div>
        </div>

        <div class="ai-cards-grid">
          <!-- 1. Harmonic Camelot Wheel Auto-Match -->
          <div class="ai-tool-box">
            <div class="ai-tool-box-title">
              <span>🎯 Camelot Harmonic Wheel</span>
            </div>
            <div class="ai-tool-box-desc">
              Current Deck 1 Root: <strong style="color: #ff25f6;">${currentKey}</strong>. Instant harmonic compatibility options for seamless key blending without dissonance:
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${harmonicMatches.map(
                (m) => html`
                  <div class="harmonic-item">
                    <span><strong style="color: #2af6de;">${m.key}</strong> • ${m.relation}</span>
                    <span style="color: #ffd166; font-weight: 800;">${m.energy}</span>
                  </div>
                `
              )}
            </div>
          </div>

          <!-- 2. AI Smart Auto-Transitions -->
          <div class="ai-tool-box">
            <div class="ai-tool-box-title">
              <span>🎚️ AI Smart Transitions</span>
            </div>
            <div class="ai-tool-box-desc">
              Execute neural phrase-aligned crossfade routines between Deck 1 and Deck 2 with automated stem isolating washouts.
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
              <button
                class="btn-ai-act"
                @click=${() => this.engine.triggerAiAutoTransition('1', '2', 'vocal_wash')}
              >
                <span>🎤</span> Trigger Vocal Washout to Deck 2
              </button>
              <button
                class="btn-ai-act"
                style="background: linear-gradient(135deg, #2af6de, #00b4d8); color: #000;"
                @click=${() => this.engine.triggerAiAutoTransition('1', '2', 'drop_swap')}
              >
                <span>🥁</span> Trigger Instant Bass Drop Swap
              </button>
              <button
                class="btn-ai-act"
                style="background: linear-gradient(135deg, #f4a261, #e76f51); color: #000;"
                @click=${() => this.engine.triggerAiAutoTransition('1', '2', 'filter_echo')}
              >
                <span>🌀</span> Trigger Filter Riser Climax
              </button>
            </div>
          </div>

          <!-- 3. Smart Phrase & Auto-Cue Detector -->
          <div class="ai-tool-box">
            <div class="ai-tool-box-title">
              <span>📊 AI Phrase & Cue Detection</span>
            </div>
            <div class="ai-tool-box-desc">
              Auto-computes 32-bar phrase boundaries, breakdown drops, and recommended mix-in/mix-out cue points.
            </div>
            <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; font-size: 0.6875rem; display: flex; flex-direction: column; gap: 6px;">
              <div><strong>Intro Phrase:</strong> 32 Beats (8 Bars) detected</div>
              <div><strong>Main Drop Time:</strong> 00:30.00 (Energy Peak: 8.9/10)</div>
              <div><strong>Breakdown:</strong> 01:45.00 • <strong>Outro Cue:</strong> 03:00.00</div>
              <div style="color: #3dffab; font-weight: 800; margin-top: 2px;">
                ✔ Vocal clash guard: Active (prevents simultaneous vocal overlap)
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
