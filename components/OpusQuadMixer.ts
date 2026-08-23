/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DeckStemsState, OpusDeckId, SoundColorFxType } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('opus-quad-mixer')
export class OpusQuadMixer extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .mixer-chassis {
      background: linear-gradient(180deg, #181824 0%, #101018 50%, #0a0a0f 100%);
      border: 1px solid rgba(255, 185, 90, 0.25);
      border-radius: 18px;
      padding: 14px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
    }

    /* Sound Color FX Selector Bar */
    .color-fx-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.4);
      padding: 6px 10px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      gap: 6px;
      flex-wrap: wrap;
    }

    .color-fx-title {
      font-size: 0.625rem;
      font-weight: 900;
      color: #f4a261;
      letter-spacing: 1px;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .color-fx-grid {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .color-fx-btn {
      font: inherit;
      font-size: 0.625rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 3px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.12s;
    }

    .color-fx-btn.active {
      background: #f4a261;
      color: #000000;
      box-shadow: 0 0 10px rgba(244, 162, 97, 0.5);
      border-color: #f4a261;
    }

    /* Dedicated Stems Master Control Bar */
    .stems-master-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(90deg, rgba(255, 37, 246, 0.12) 0%, rgba(42, 246, 222, 0.12) 100%);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      padding: 6px 12px;
      gap: 8px;
      flex-wrap: wrap;
    }

    .stems-master-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6875rem;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #ffffff;
    }

    .stems-master-badge {
      font-size: 0.5625rem;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 4px;
      background: linear-gradient(135deg, #ff25f6, #2af6de);
      color: #000;
      text-transform: uppercase;
    }

    .stems-master-actions {
      display: flex;
      gap: 4px;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn-stems-global {
      font: inherit;
      font-size: 0.5625rem;
      font-weight: 800;
      padding: 3px 7px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      transition: all 0.12s;
      white-space: nowrap;
    }

    .btn-stems-global:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
    }

    /* 4 Channel Strips Grid: CH 3, CH 1, CH 2, CH 4 (Pioneer OPUS-QUAD Standard) */
    .channels-4-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: rgba(0, 0, 0, 0.35);
      padding: 10px 8px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    @media (max-width: 768px) {
      .channels-4-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .channel-strip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.025);
      padding: 8px 4px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-sizing: border-box;
      min-width: 0;
    }

    .ch-label-badge {
      font-size: 0.6875rem;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 4px;
      width: calc(100% - 10px);
      text-align: center;
      box-sizing: border-box;
      letter-spacing: 0.5px;
    }

    .ch-badge-1 { background: #f4a261; color: #000; }
    .ch-badge-2 { background: #2af6de; color: #000; }
    .ch-badge-3 { background: #ff25f6; color: #000; }
    .ch-badge-4 { background: #3dffab; color: #000; }

    .knob-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: 1px;
    }

    .knob-caption {
      font-size: 0.5625rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.5px;
    }

    .knob-input-mini {
      width: 85%;
      accent-color: #f4a261;
      cursor: pointer;
    }

    .knob-readout {
      font-size: 0.5625rem;
      font-family: monospace;
      color: rgba(255, 255, 255, 0.75);
    }

    /* Dedicated Stems Section in Channel Strip */
    .channel-stems-block {
      width: 94%;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 6px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      box-sizing: border-box;
      margin: 2px 0;
    }

    .channel-stems-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0 2px;
      font-size: 0.5625rem;
      font-weight: 900;
      letter-spacing: 0.5px;
    }

    .stems-tag-label {
      color: #2af6de;
      text-transform: uppercase;
    }

    .stems-iso-btn-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      width: 100%;
    }

    .btn-stem-iso {
      font: inherit;
      font-size: 0.5625rem;
      font-weight: 900;
      padding: 4px 2px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      transition: all 0.12s ease;
      text-transform: uppercase;
    }

    /* Vocal Stem Button */
    .btn-stem-iso.stem-vocal.active {
      background: rgba(255, 37, 246, 0.25);
      border-color: #ff25f6;
      color: #ff25f6;
      box-shadow: 0 0 8px rgba(255, 37, 246, 0.4);
    }
    .btn-stem-iso.stem-vocal.muted {
      background: rgba(255, 77, 79, 0.2);
      border-color: #ff4d4f;
      color: #ff7875;
      text-decoration: line-through;
      opacity: 0.6;
    }

    /* Drums Stem Button */
    .btn-stem-iso.stem-drums.active {
      background: rgba(42, 246, 222, 0.25);
      border-color: #2af6de;
      color: #2af6de;
      box-shadow: 0 0 8px rgba(42, 246, 222, 0.4);
    }
    .btn-stem-iso.stem-drums.muted {
      background: rgba(255, 77, 79, 0.2);
      border-color: #ff4d4f;
      color: #ff7875;
      text-decoration: line-through;
      opacity: 0.6;
    }

    /* Bass Stem Button */
    .btn-stem-iso.stem-bass.active {
      background: rgba(255, 183, 3, 0.25);
      border-color: #ffb703;
      color: #ffb703;
      box-shadow: 0 0 8px rgba(255, 183, 3, 0.4);
    }
    .btn-stem-iso.stem-bass.muted {
      background: rgba(255, 77, 79, 0.2);
      border-color: #ff4d4f;
      color: #ff7875;
      text-decoration: line-through;
      opacity: 0.6;
    }

    /* Melody/Synth Stem Button */
    .btn-stem-iso.stem-melody.active {
      background: rgba(157, 78, 221, 0.25);
      border-color: #9d4edd;
      color: #c77dff;
      box-shadow: 0 0 8px rgba(157, 78, 221, 0.4);
    }
    .btn-stem-iso.stem-melody.muted {
      background: rgba(255, 77, 79, 0.2);
      border-color: #ff4d4f;
      color: #ff7875;
      text-decoration: line-through;
      opacity: 0.6;
    }

    .btn-stem-iso.solo {
      background: #ffd166 !important;
      color: #000000 !important;
      border-color: #ffd166 !important;
      font-weight: 900 !important;
      box-shadow: 0 0 10px rgba(255, 209, 102, 0.6) !important;
      text-decoration: none !important;
      opacity: 1 !important;
    }

    /* Stem Quick Punches: Acapella / Instrumental */
    .stems-quick-row {
      display: flex;
      gap: 3px;
      width: 100%;
    }

    .btn-stem-punch {
      flex: 1;
      font: inherit;
      font-size: 0.5rem;
      font-weight: 900;
      padding: 3px 2px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.75);
      cursor: pointer;
      transition: all 0.12s;
      text-align: center;
    }

    .btn-stem-punch:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .btn-stem-punch.acapella-active {
      background: #ff25f6;
      color: #000000;
      border-color: #ff25f6;
      box-shadow: 0 0 8px rgba(255, 37, 246, 0.5);
    }

    .btn-stem-punch.inst-active {
      background: #2af6de;
      color: #000000;
      border-color: #2af6de;
      box-shadow: 0 0 8px rgba(42, 246, 222, 0.5);
    }

    /* Headphone CUE & Mute/Solo */
    .cue-headphone-btn {
      font: inherit;
      font-size: 0.625rem;
      font-weight: 900;
      padding: 3px 0;
      width: 85%;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.12s;
    }

    .cue-headphone-btn.active {
      background: #2af6de;
      color: #000;
      border-color: #2af6de;
      box-shadow: 0 0 10px rgba(42, 246, 222, 0.5);
    }

    /* Standardized 100mm Virtual Fader Stage with Peak Meter */
    .fader-stage-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin: 4px 0;
    }

    .fader-decibel-scale {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100px;
      font-size: 0.4375rem;
      font-family: monospace;
      color: rgba(255, 255, 255, 0.45);
      line-height: 1;
      text-align: right;
      padding-right: 2px;
      user-select: none;
    }

    .channel-fader-vert {
      writing-mode: vertical-lr;
      direction: rtl;
      height: 100px;
      width: 20px;
      cursor: pointer;
      accent-color: #ffffff;
      margin: 0;
    }

    .channel-vu-meter {
      display: flex;
      flex-direction: column-reverse;
      gap: 1px;
      width: 6px;
      height: 100px;
      background: #08080d;
      border-radius: 3px;
      padding: 1px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-sizing: border-box;
    }

    .vu-segment {
      flex: 1;
      width: 100%;
      border-radius: 1px;
      background: rgba(255, 255, 255, 0.05);
      transition: background-color 0.05s ease;
    }

    .vu-segment.active.green {
      background: #3dffab;
      box-shadow: 0 0 4px #3dffab;
    }

    .vu-segment.active.yellow {
      background: #ffdd28;
      box-shadow: 0 0 4px #ffdd28;
    }

    .vu-segment.active.red {
      background: #ff4d4f;
      box-shadow: 0 0 6px #ff4d4f;
    }

    .fader-readout-db {
      font-size: 0.5625rem;
      font-family: monospace;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 800;
    }

    .cf-assign-row {
      display: flex;
      gap: 2px;
      width: 90%;
      justify-content: center;
    }

    .cf-assign-btn {
      font: inherit;
      font-size: 0.5rem;
      font-weight: 800;
      padding: 2px 4px;
      border-radius: 3px;
      border: none;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
    }

    .cf-assign-btn.active {
      background: #ffffff;
      color: #000;
    }

    /* Master Section & Crossfader Bottom Bar */
    .mixer-bottom-stage {
      display: grid;
      grid-template-columns: 1fr 200px;
      gap: 12px;
      align-items: center;
    }

    @media (max-width: 768px) {
      .mixer-bottom-stage {
        grid-template-columns: 1fr;
      }
    }

    .crossfader-chassis {
      background: rgba(0, 0, 0, 0.5);
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .cf-slider-horiz {
      width: 100%;
      cursor: pointer;
      accent-color: #f4a261;
    }

    .master-stereo-meters {
      background: rgba(0, 0, 0, 0.5);
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .vu-master-bar {
      height: 8px;
      background: #050508;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .vu-master-fill {
      height: 100%;
      background: linear-gradient(90deg, #3dffab 60%, #ffdd28 85%, #ff4d4f 100%);
      transition: width 0.05s linear;
    }

    /* iPad / Tablet Landscape & Touch Target Optimizations (44x44px min hit targets) */
    @media only screen and (min-width: 1024px) and (max-height: 1366px) and (orientation: landscape) {
      .opus-mixer-chassis {
        padding: 12px 10px;
        gap: 10px;
      }
      .channels-4-grid {
        gap: 6px;
        padding: 8px 6px;
      }
      .btn-stem-iso {
        min-height: 44px;
        font-size: 0.625rem;
      }
      .cue-headphone-btn {
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .btn-stem-punch {
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .channel-fader-vert {
        height: 120px;
        width: 28px;
      }
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;

  @state() private masterLevel = 0;
  @state() private deckLevels: Record<OpusDeckId, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };

  private timer: number | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.timer = window.setInterval(() => {
      this.masterLevel = Math.min(100, Math.round(this.engine.getMasterLevel() * 180));
      this.deckLevels = {
        '1': Math.min(100, Math.round(this.engine.getDeckLevel('1') * 200)),
        '2': Math.min(100, Math.round(this.engine.getDeckLevel('2') * 200)),
        '3': Math.min(100, Math.round(this.engine.getDeckLevel('3') * 200)),
        '4': Math.min(100, Math.round(this.engine.getDeckLevel('4') * 200)),
      };
      this.requestUpdate();
    }, 50);

    this.engine.addEventListener('stems-state-changed', () => this.requestUpdate());
    this.engine.addEventListener('deck-state-changed', () => this.requestUpdate());
    this.engine.addEventListener('opus-state-changed', () => this.requestUpdate());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.timer) clearInterval(this.timer);
  }

  // --- Stems Helper Functions ---
  private formatVolumeToDb(volume: number): string {
    if (volume <= 0.001) return '-∞ dB';
    const db = 20 * Math.log10(volume);
    if (db > 0) return `+${db.toFixed(1)} dB`;
    return `${db.toFixed(1)} dB`;
  }

  private resetAllStems() {
    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((dId) => {
      this.engine.setDeckStemVolume(dId, 'vocal', 1.0);
      this.engine.setDeckStemVolume(dId, 'drums', 1.0);
      this.engine.setDeckStemVolume(dId, 'bass', 1.0);
      this.engine.setDeckStemVolume(dId, 'melody', 1.0);
      const stems = this.engine.getDeckStems(dId);
      if (stems.vocalMuted) this.engine.toggleDeckStemMute(dId, 'vocal');
      if (stems.drumsMuted) this.engine.toggleDeckStemMute(dId, 'drums');
      if (stems.bassMuted) this.engine.toggleDeckStemMute(dId, 'bass');
      if (stems.melodyMuted) this.engine.toggleDeckStemMute(dId, 'melody');
      stems.vocalSolo = false;
      stems.drumsSolo = false;
      stems.bassSolo = false;
      stems.melodySolo = false;
      stems.activeAcapella = false;
      stems.activeInstrumental = false;
    });
    this.requestUpdate();
  }

  private isolateAllVocals() {
    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((dId) => {
      this.engine.toggleDeckStemSolo(dId, 'vocal');
    });
    this.requestUpdate();
  }

  private isolateAllInstrumentals() {
    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((dId) => {
      const stems = this.engine.getDeckStems(dId);
      if (!stems.vocalMuted) this.engine.toggleDeckStemMute(dId, 'vocal');
      if (stems.drumsMuted) this.engine.toggleDeckStemMute(dId, 'drums');
      if (stems.bassMuted) this.engine.toggleDeckStemMute(dId, 'bass');
      if (stems.melodyMuted) this.engine.toggleDeckStemMute(dId, 'melody');
    });
    this.requestUpdate();
  }

  private isolateDrumAndBass() {
    (['1', '2', '3', '4'] as OpusDeckId[]).forEach((dId) => {
      const stems = this.engine.getDeckStems(dId);
      if (!stems.vocalMuted) this.engine.toggleDeckStemMute(dId, 'vocal');
      if (!stems.melodyMuted) this.engine.toggleDeckStemMute(dId, 'melody');
      if (stems.drumsMuted) this.engine.toggleDeckStemMute(dId, 'drums');
      if (stems.bassMuted) this.engine.toggleDeckStemMute(dId, 'bass');
    });
    this.requestUpdate();
  }

  private triggerChannelAcapella(deckId: OpusDeckId) {
    const stems = this.engine.getDeckStems(deckId);
    if (stems.vocalSolo) {
      // Unsolo vocal
      this.engine.toggleDeckStemSolo(deckId, 'vocal');
      stems.activeAcapella = false;
    } else {
      this.engine.toggleDeckStemSolo(deckId, 'vocal');
      stems.activeAcapella = true;
      stems.activeInstrumental = false;
    }
    this.requestUpdate();
  }

  private triggerChannelInstrumental(deckId: OpusDeckId) {
    const stems = this.engine.getDeckStems(deckId);
    this.engine.toggleDeckStemMute(deckId, 'vocal');
    stems.activeInstrumental = stems.vocalMuted;
    stems.activeAcapella = false;
    this.requestUpdate();
  }

  override render() {
    const channelOrder: OpusDeckId[] = ['3', '1', '2', '4']; // Pioneer 4-Channel Layout
    const selectedFx = this.engine.opusPerformanceState.selectedSoundColorFx;
    const numSegments = 12;

    return html`
      <div class="mixer-chassis">
        <!-- Sound Color FX Selection -->
        <div class="color-fx-bar">
          <span class="color-fx-title">SOUND COLOR FX</span>
          <div class="color-fx-grid">
            ${(['space', 'dub_echo', 'sweep', 'noise', 'crush', 'filter'] as SoundColorFxType[]).map(
              (fx) => html`
                <button
                  class="color-fx-btn ${selectedFx === fx ? 'active' : ''}"
                  @click=${() => this.engine.setSoundColorFxType(fx)}
                >
                  ${fx.replace('_', ' ').toUpperCase()}
                </button>
              `
            )}
          </div>
        </div>

        <!-- Dedicated Master Stems Separation Toolbar -->
        <div class="stems-master-toolbar">
          <div class="stems-master-title">
            <span class="stems-master-badge">STEMS DSP</span>
            <span>4-Stem Isolation (Vocal • Drums • Bass • Synth)</span>
          </div>

          <div class="stems-master-actions">
            <button class="btn-stems-global" @click=${() => this.resetAllStems()}>
              <span>✨ ALL ON</span>
            </button>
            <button class="btn-stems-global" @click=${() => this.isolateAllVocals()}>
              <span>🎤 ACAPELLA ALL</span>
            </button>
            <button class="btn-stems-global" @click=${() => this.isolateAllInstrumentals()}>
              <span>🎸 INST ALL</span>
            </button>
            <button class="btn-stems-global" @click=${() => this.isolateDrumAndBass()}>
              <span>🥁 D&B ONLY</span>
            </button>
          </div>
        </div>

        <!-- 4 Channel Strips Grid: CH 3, CH 1, CH 2, CH 4 -->
        <div class="channels-4-grid">
          ${channelOrder.map((deckId) => {
            const state = this.engine.deckStates[deckId];
            const stems: DeckStemsState = this.engine.getDeckStems(deckId);
            const levelPct = this.deckLevels[deckId] || 0;
            const activeSegmentsCount = Math.round((levelPct / 100) * numSegments);

            return html`
              <div class="channel-strip">
                <span class="ch-label-badge ch-badge-${deckId}">CH ${deckId}</span>

                <!-- Trim Knob -->
                <div class="knob-row">
                  <span class="knob-caption">TRIM</span>
                  <input
                    type="range"
                    class="knob-input-mini"
                    min="-12"
                    max="12"
                    step="0.5"
                    .value=${String(state.trim)}
                    @input=${(e: Event) =>
                      this.engine.setDeckTrim(
                        deckId,
                        parseFloat((e.target as HTMLInputElement).value)
                      )}
                  />
                  <span class="knob-readout">${state.trim > 0 ? `+${state.trim}` : state.trim}dB</span>
                </div>

                <!-- High EQ Knob -->
                <div class="knob-row">
                  <span class="knob-caption">HI EQ</span>
                  <input
                    type="range"
                    class="knob-input-mini"
                    min="-26"
                    max="6"
                    step="0.5"
                    .value=${String(state.highEq)}
                    @input=${(e: Event) =>
                      this.engine.setDeckEq(
                        deckId,
                        'high',
                        parseFloat((e.target as HTMLInputElement).value)
                      )}
                  />
                  <span class="knob-readout">${state.highEq > 0 ? `+${state.highEq}` : state.highEq}dB</span>
                </div>

                <!-- Mid EQ Knob -->
                <div class="knob-row">
                  <span class="knob-caption">MID EQ</span>
                  <input
                    type="range"
                    class="knob-input-mini"
                    min="-26"
                    max="6"
                    step="0.5"
                    .value=${String(state.midEq)}
                    @input=${(e: Event) =>
                      this.engine.setDeckEq(
                        deckId,
                        'mid',
                        parseFloat((e.target as HTMLInputElement).value)
                      )}
                  />
                  <span class="knob-readout">${state.midEq > 0 ? `+${state.midEq}` : state.midEq}dB</span>
                </div>

                <!-- Low EQ Knob -->
                <div class="knob-row">
                  <span class="knob-caption">LOW EQ</span>
                  <input
                    type="range"
                    class="knob-input-mini"
                    min="-26"
                    max="6"
                    step="0.5"
                    .value=${String(state.lowEq)}
                    @input=${(e: Event) =>
                      this.engine.setDeckEq(
                        deckId,
                        'low',
                        parseFloat((e.target as HTMLInputElement).value)
                      )}
                  />
                  <span class="knob-readout">${state.lowEq > 0 ? `+${state.lowEq}` : state.lowEq}dB</span>
                </div>

                <!-- Sound Color FX Knob -->
                <div class="knob-row">
                  <span class="knob-caption" style="color: #f4a261;">COLOR</span>
                  <input
                    type="range"
                    class="knob-input-mini"
                    min="-100"
                    max="100"
                    step="1"
                    .value=${String(state.colorFxValue)}
                    @input=${(e: Event) =>
                      this.engine.setDeckColorFx(
                        deckId,
                        parseFloat((e.target as HTMLInputElement).value)
                      )}
                  />
                  <span class="knob-readout" style="color: ${state.colorFxValue !== 0 ? '#f4a261' : 'inherit'}">
                    ${state.colorFxValue === 0 ? 'FLAT' : state.colorFxValue}
                  </span>
                </div>

                <!-- DEDICATED STEMS CONTROL SECTION (BETWEEN EQ & FADER) -->
                <div class="channel-stems-block">
                  <div class="channel-stems-header">
                    <span class="stems-tag-label">🎛️ STEMS</span>
                    <span style="font-size: 0.5rem; color: rgba(255,255,255,0.5);">ISO/MUTE</span>
                  </div>

                  <!-- 4-Stem Isolation Buttons Grid (Vocals, Drums, Bass, Synth) -->
                  <div class="stems-iso-btn-group">
                    <!-- 1. Vocals Stem (V) -->
                    <button
                      class="btn-stem-iso stem-vocal ${stems.vocalSolo ? 'solo' : stems.vocalMuted ? 'muted' : 'active'}"
                      @click=${() => this.engine.toggleDeckStemMute(deckId, 'vocal')}
                      title="Vocal Formant Isolator / Kill (Click to Mute, Hold Acapella to Solo)"
                    >
                      <span>🎤</span>
                      <span>VOC</span>
                    </button>

                    <!-- 2. Drums Stem (D) -->
                    <button
                      class="btn-stem-iso stem-drums ${stems.drumsSolo ? 'solo' : stems.drumsMuted ? 'muted' : 'active'}"
                      @click=${() => this.engine.toggleDeckStemMute(deckId, 'drums')}
                      title="Drums & Transients Isolator / Kill"
                    >
                      <span>🥁</span>
                      <span>DRM</span>
                    </button>

                    <!-- 3. Bass Stem (B) -->
                    <button
                      class="btn-stem-iso stem-bass ${stems.bassSolo ? 'solo' : stems.bassMuted ? 'muted' : 'active'}"
                      @click=${() => this.engine.toggleDeckStemMute(deckId, 'bass')}
                      title="Sub-Bass & Crossover Isolator / Kill"
                    >
                      <span>🎸</span>
                      <span>BAS</span>
                    </button>

                    <!-- 4. Synth / Melody Stem (M) -->
                    <button
                      class="btn-stem-iso stem-melody ${stems.melodySolo ? 'solo' : stems.melodyMuted ? 'muted' : 'active'}"
                      @click=${() => this.engine.toggleDeckStemMute(deckId, 'melody')}
                      title="Synth & Harmonic Lead Isolator / Kill"
                    >
                      <span>🎹</span>
                      <span>SYN</span>
                    </button>
                  </div>

                  <!-- Quick Stem Punches: Acapella & Instrumental -->
                  <div class="stems-quick-row">
                    <button
                      class="btn-stem-punch ${stems.vocalSolo ? 'acapella-active' : ''}"
                      @click=${() => this.triggerChannelAcapella(deckId)}
                      title="Solo Vocal Acapella for Deck ${deckId}"
                    >
                      ACAP
                    </button>
                    <button
                      class="btn-stem-punch ${stems.vocalMuted && !stems.vocalSolo ? 'inst-active' : ''}"
                      @click=${() => this.triggerChannelInstrumental(deckId)}
                      title="Mute Vocal Instrumental for Deck ${deckId}"
                    >
                      INST
                    </button>
                  </div>
                </div>

                <!-- Headphone CUE -->
                <button
                  class="cue-headphone-btn ${state.cueHeadphones ? 'active' : ''}"
                  @click=${() => {
                    state.cueHeadphones = !state.cueHeadphones;
                    this.requestUpdate();
                  }}
                >
                  🎧 CUE
                </button>

                <!-- Standardized 100mm Virtual Fader Stage with Peak VU Meter & dB Scale -->
                <div class="fader-stage-wrap">
                  <!-- dB Calibration Legend -->
                  <div class="fader-decibel-scale">
                    <span>+6</span>
                    <span>0</span>
                    <span>-6</span>
                    <span>-12</span>
                    <span>-24</span>
                    <span>-∞</span>
                  </div>

                  <!-- 100mm Fader -->
                  <input
                    type="range"
                    class="channel-fader-vert"
                    min="0"
                    max="1.5"
                    step="0.01"
                    .value=${String(state.volume)}
                    @input=${(e: Event) =>
                      this.engine.setDeckVolume(
                        deckId,
                        parseFloat((e.target as HTMLInputElement).value)
                      )}
                    title="Channel ${deckId} Volume (100mm Travel)"
                  />

                  <!-- Stereo Peak VU Meter -->
                  <div class="channel-vu-meter" title="Channel ${deckId} Peak Output Level">
                    ${Array.from({ length: numSegments }).map((_, idx) => {
                      const isActive = idx < activeSegmentsCount;
                      const isRed = idx >= 10;
                      const isYellow = idx >= 7 && idx < 10;
                      const isGreen = idx < 7;
                      return html`
                        <div
                          class="vu-segment ${isActive ? 'active' : ''} ${isRed ? 'red' : isYellow ? 'yellow' : isGreen ? 'green' : ''}"
                        ></div>
                      `;
                    })}
                  </div>
                </div>

                <!-- Numeric dB Readout -->
                <span class="fader-readout-db">${this.formatVolumeToDb(state.volume)}</span>

                <!-- Crossfader Assign: A / THRU / B -->
                <div class="cf-assign-row">
                  ${(['A', 'THRU', 'B'] as const).map(
                    (assign) => html`
                      <button
                        class="cf-assign-btn ${state.crossfaderAssign === assign ? 'active' : ''}"
                        @click=${() => this.engine.setCrossfaderAssign(deckId, assign)}
                      >
                        ${assign}
                      </button>
                    `
                  )}
                </div>
              </div>
            `;
          })}
        </div>

        <!-- Master Section & Crossfader Bar -->
        <div class="mixer-bottom-stage">
          <!-- Crossfader -->
          <div class="crossfader-chassis">
            <div style="display: flex; justify-content: space-between; font-size: 0.625rem; font-weight: 800;">
              <span style="color: #f4a261;">◀ CROSSFADER A</span>
              <div style="display: flex; gap: 4px;">
                ${(['smooth', 'linear', 'scratch'] as const).map(
                  (curve) => html`
                    <button
                      style="font: inherit; font-size: 0.5625rem; font-weight: 800; background: ${this.engine.crossfaderCurve === curve ? '#fff' : 'rgba(255,255,255,0.08)'}; color: ${this.engine.crossfaderCurve === curve ? '#000' : 'rgba(255,255,255,0.7)'}; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;"
                      @click=${() => {
                        this.engine.crossfaderCurve = curve;
                        this.engine.updateCrossfader(this.engine.crossfaderPosition);
                        this.requestUpdate();
                      }}
                    >
                      ${curve.toUpperCase()}
                    </button>
                  `
                )}
              </div>
              <span style="color: #2af6de;">CROSSFADER B ▶</span>
            </div>

            <input
              type="range"
              class="cf-slider-horiz"
              min="-1"
              max="1"
              step="0.01"
              .value=${String(this.engine.crossfaderPosition)}
              @input=${(e: Event) =>
                this.engine.updateCrossfader(parseFloat((e.target as HTMLInputElement).value))}
            />
          </div>

          <!-- Master Stereo VU Meters -->
          <div class="master-stereo-meters">
            <div style="display: flex; justify-content: space-between; font-size: 0.625rem; font-weight: 900; color: rgba(255,255,255,0.7);">
              <span>MASTER L/R</span>
              <span>${this.masterLevel > 0 ? `${(this.masterLevel * 0.06 - 6).toFixed(1)} dB` : '-∞ dB'}</span>
            </div>
            <div class="vu-master-bar">
              <div class="vu-master-fill" style="width: ${this.masterLevel}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
