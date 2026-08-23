/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { LatencyCalibrationState } from '../types';
import { MidiDispatcher } from '../utils/MidiDispatcher';
import { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('latency-calibration-modal')
export class LatencyCalibrationModal extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fadeIn 0.18s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-card {
      width: 100%;
      max-width: 580px;
      background: linear-gradient(180deg, #18191f 0%, #0d0e12 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85), 0 0 30px rgba(61, 255, 171, 0.15);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #ffffff;
    }

    .modal-header {
      padding: 18px 24px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-sync {
      padding: 3px 8px;
      font-size: 0.6875rem;
      font-weight: 900;
      border-radius: 6px;
      background: rgba(61, 255, 171, 0.15);
      color: #3dffab;
      border: 1px solid rgba(61, 255, 171, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .btn-close {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .btn-close:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-box {
      font-size: 0.8125rem;
      line-height: 1.45;
      color: rgba(255, 255, 255, 0.7);
      background: rgba(255, 255, 255, 0.04);
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.07);
    }

    /* Metronome & Tap Sync Area */
    .sync-stage {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    .metronome-visualizer {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .pulse-node {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      transition: all 0.08s ease;
    }

    .pulse-node.flashing {
      background: #3dffab;
      border-color: #ffffff;
      box-shadow: 0 0 20px #3dffab, 0 0 35px #3dffab;
      transform: scale(1.3);
    }

    .pulse-label {
      font-size: 0.8125rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
    }

    .tap-pad-btn {
      width: 100%;
      height: 72px;
      background: linear-gradient(135deg, rgba(61, 255, 171, 0.15), rgba(42, 246, 222, 0.15));
      border: 2px dashed rgba(61, 255, 171, 0.5);
      border-radius: 12px;
      color: #3dffab;
      font: inherit;
      font-size: 0.9375rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.1s ease;
      user-select: none;
    }

    .tap-pad-btn:hover {
      background: linear-gradient(135deg, rgba(61, 255, 171, 0.25), rgba(42, 246, 222, 0.25));
      border-color: #3dffab;
    }

    .tap-pad-btn:active, .tap-pad-btn.tapped {
      background: #3dffab;
      color: #000000;
      border-style: solid;
      transform: scale(0.98);
      box-shadow: 0 0 24px rgba(61, 255, 171, 0.6);
    }

    .tap-subtext {
      font-size: 0.6875rem;
      font-weight: 600;
      opacity: 0.8;
    }

    /* Tap History Tape */
    .history-tape {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      width: 100%;
      padding: 4px 0;
    }

    .history-chip {
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      font-size: 0.6875rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      white-space: nowrap;
    }

    .history-chip.pos { color: #ffb703; }
    .history-chip.neg { color: #2af6de; }
    .history-chip.zero { color: #3dffab; }

    /* Results Strip */
    .calibration-results-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      width: 100%;
    }

    .result-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }

    .result-box-label {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .result-box-val {
      font-size: 1.125rem;
      font-weight: 900;
      font-family: 'JetBrains Mono', monospace;
      color: #ffffff;
    }

    .result-box-val.highlight {
      color: #3dffab;
    }

    /* Manual Fine-Tuning Slider */
    .slider-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .slider-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .slider-val-badge {
      font-family: 'JetBrains Mono', monospace;
      padding: 3px 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      color: #3dffab;
      font-weight: 800;
    }

    .offset-slider {
      width: 100%;
      accent-color: #3dffab;
      cursor: pointer;
    }

    .preset-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-preset {
      padding: 5px 10px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.85);
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-preset:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .modal-footer {
      padding: 16px 24px;
      background: rgba(255, 255, 255, 0.02);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .btn-action {
      padding: 10px 18px;
      border-radius: 8px;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3dffab, #2af6de);
      color: #000000;
      box-shadow: 0 4px 14px rgba(61, 255, 171, 0.35);
    }

    .btn-primary:hover {
      box-shadow: 0 6px 20px rgba(61, 255, 171, 0.55);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.15);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  `;

  @property({ type: Boolean }) isOpen = false;
  @property({ attribute: false }) midiDispatcher!: MidiDispatcher;
  @property({ attribute: false }) engine!: VirtualDjEngine;

  @state() private calibrationState: LatencyCalibrationState = {
    isActive: false,
    measuredOffsetMs: 0,
    appliedOffsetMs: 0,
    jitterVarianceMs: 0,
    sampleCount: 0,
    targetBpm: 120,
    isCalibrating: false,
    history: [],
  };

  @state() private isFlashing = false;
  @state() private isPadTapped = false;
  @state() private currentOffset = 0;

  override connectedCallback() {
    super.connectedCallback();
    if (this.midiDispatcher) {
      this.currentOffset = this.midiDispatcher.getLatencyOffsetMs();
      this.calibrationState = this.midiDispatcher.getCalibrationState();
      this.bindDispatcherListeners();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.unbindDispatcherListeners();
    if (this.midiDispatcher) {
      this.midiDispatcher.stopLatencyCalibration();
    }
  }

  private bindDispatcherListeners() {
    if (!this.midiDispatcher) return;
    this.midiDispatcher.addEventListener('calibration-click', this.handleCalibrationClick as EventListener);
    this.midiDispatcher.addEventListener('calibration-state-changed', this.handleCalibrationStateChanged as EventListener);
    this.midiDispatcher.addEventListener('latency-changed', this.handleLatencyChanged as EventListener);
    this.midiDispatcher.addEventListener('cc-message', this.handleMidiCcAsTap as EventListener);
  }

  private unbindDispatcherListeners() {
    if (!this.midiDispatcher) return;
    this.midiDispatcher.removeEventListener('calibration-click', this.handleCalibrationClick as EventListener);
    this.midiDispatcher.removeEventListener('calibration-state-changed', this.handleCalibrationStateChanged as EventListener);
    this.midiDispatcher.removeEventListener('latency-changed', this.handleLatencyChanged as EventListener);
    this.midiDispatcher.removeEventListener('cc-message', this.handleMidiCcAsTap as EventListener);
  }

  private handleCalibrationClick = () => {
    this.isFlashing = true;
    if (this.engine) {
      this.engine.playCalibrationClick();
    }
    setTimeout(() => {
      this.isFlashing = false;
    }, 80);
  };

  private handleCalibrationStateChanged = (e: CustomEvent<LatencyCalibrationState>) => {
    this.calibrationState = e.detail;
  };

  private handleLatencyChanged = (e: CustomEvent<{ latencyOffsetMs: number }>) => {
    this.currentOffset = e.detail.latencyOffsetMs;
  };

  private handleMidiCcAsTap = () => {
    if (this.calibrationState.isCalibrating) {
      this.recordTap();
    }
  };

  private toggleCalibrating() {
    if (this.calibrationState.isCalibrating) {
      this.midiDispatcher.stopLatencyCalibration();
    } else {
      this.midiDispatcher.startLatencyCalibration(120);
    }
  }

  private recordTap() {
    this.isPadTapped = true;
    this.midiDispatcher.recordCalibrationTap();
    setTimeout(() => {
      this.isPadTapped = false;
    }, 90);
  }

  private applyCalibration() {
    if (this.calibrationState.measuredOffsetMs !== 0) {
      this.midiDispatcher.applyMeasuredLatency();
      this.currentOffset = this.midiDispatcher.getLatencyOffsetMs();
    }
    this.close();
  }

  private setPreset(val: number) {
    this.currentOffset = val;
    this.midiDispatcher.setLatencyOffsetMs(val);
  }

  private handleSliderChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10) || 0;
    this.currentOffset = val;
    this.midiDispatcher.setLatencyOffsetMs(val);
  }

  private close() {
    if (this.midiDispatcher) {
      this.midiDispatcher.stopLatencyCalibration();
    }
    this.dispatchEvent(new CustomEvent('close-latency-modal', { bubbles: true, composed: true }));
  }

  override render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="modal-backdrop" @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) this.close();
      }}>
        <div class="modal-card">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-title">
              <span>⏱️ Audio-to-MIDI Latency Sync</span>
              <span class="badge-sync">${this.currentOffset >= 0 ? `+${this.currentOffset}` : this.currentOffset} MS</span>
            </div>
            <button class="btn-close" @click=${this.close}>✕</button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <div class="info-box">
              Calibrate audio buffer discrepancies and USB/Bluetooth hardware jitter. Start the pulse, then tap in time with the audio click on your physical MIDI pad or the button below.
            </div>

            <!-- Sync Stage -->
            <div class="sync-stage">
              <div class="metronome-visualizer">
                <div class="pulse-node ${this.isFlashing ? 'flashing' : ''}"></div>
                <div class="pulse-label">
                  ${this.calibrationState.isCalibrating ? '120 BPM Acoustic Sync Click Active' : 'Metronome Pulse Standby'}
                </div>
                <button
                  class="btn-action ${this.calibrationState.isCalibrating ? 'btn-secondary' : 'btn-primary'}"
                  style="padding: 6px 12px; font-size: 0.75rem;"
                  @click=${this.toggleCalibrating}
                >
                  ${this.calibrationState.isCalibrating ? '⏹ Stop Pulse' : '▶ Start Pulse'}
                </button>
              </div>

              <!-- Big Tap Pad -->
              <button
                class="tap-pad-btn ${this.isPadTapped ? 'tapped' : ''}"
                @click=${this.recordTap}
              >
                <span>🎯 TAP IN TIME (OR TRIGGER MIDI PAD)</span>
                <span class="tap-subtext">${this.calibrationState.sampleCount} / 16 taps sampled</span>
              </button>

              <!-- Tap History Tape -->
              ${this.calibrationState.history.length > 0
                ? html`
                    <div class="history-tape">
                      ${this.calibrationState.history.map(
                        (h) => html`
                          <div class="history-chip ${h > 5 ? 'pos' : h < -5 ? 'neg' : 'zero'}">
                            ${h >= 0 ? `+${h}` : h}ms
                          </div>
                        `
                      )}
                    </div>
                  `
                : ''}

              <!-- Results Row -->
              <div class="calibration-results-row">
                <div class="result-box">
                  <div class="result-box-label">Measured Offset</div>
                  <div class="result-box-val highlight">
                    ${this.calibrationState.measuredOffsetMs >= 0 ? `+${this.calibrationState.measuredOffsetMs}` : this.calibrationState.measuredOffsetMs} ms
                  </div>
                </div>
                <div class="result-box">
                  <div class="result-box-label">Jitter Variance</div>
                  <div class="result-box-val">
                    ±${this.calibrationState.jitterVarianceMs} ms
                  </div>
                </div>
                <div class="result-box">
                  <div class="result-box-label">Active Offset</div>
                  <div class="result-box-val">
                    ${this.currentOffset >= 0 ? `+${this.currentOffset}` : this.currentOffset} ms
                  </div>
                </div>
              </div>
            </div>

            <!-- Fine-Tuning Slider -->
            <div class="slider-section">
              <div class="slider-header">
                <span>Manual Fine-Tuning Compensation</span>
                <span class="slider-val-badge">${this.currentOffset >= 0 ? `+${this.currentOffset}` : this.currentOffset} ms</span>
              </div>
              <input
                type="range"
                class="offset-slider"
                min="-200"
                max="200"
                step="1"
                .value=${this.currentOffset.toString()}
                @input=${this.handleSliderChange}
              />
              <div class="preset-chips">
                <button class="btn-preset" @click=${() => this.setPreset(0)}>0ms (USB Direct)</button>
                <button class="btn-preset" @click=${() => this.setPreset(15)}>+15ms (Low Latency)</button>
                <button class="btn-preset" @click=${() => this.setPreset(35)}>+35ms (Bluetooth)</button>
                <button class="btn-preset" @click=${() => this.setPreset(-20)}>-20ms (Audio Ahead)</button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-action btn-secondary" @click=${() => this.setPreset(0)}>
              Reset to 0ms
            </button>
            <div style="display: flex; gap: 8px;">
              <button class="btn-action btn-secondary" @click=${this.close}>
                Done
              </button>
              ${this.calibrationState.sampleCount >= 3
                ? html`
                    <button class="btn-action btn-primary" @click=${this.applyCalibration}>
                      ✨ Apply Measured (${this.calibrationState.measuredOffsetMs}ms)
                    </button>
                  `
                : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
