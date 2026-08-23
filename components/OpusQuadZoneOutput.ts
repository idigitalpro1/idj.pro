/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { OpusZoneState } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('opus-quad-zone-output')
export class OpusQuadZoneOutput extends LitElement {
  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
    }

    .zone-container {
      background: linear-gradient(180deg, #1b1b26 0%, #101018 100%);
      border: 1px solid rgba(244, 162, 97, 0.35);
      border-radius: 14px;
      padding: 12px 16px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .zone-left-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .zone-badge {
      font-size: 0.75rem;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #f4a261, #e76f51);
      color: #000;
      box-shadow: 0 0 14px rgba(244, 162, 97, 0.5);
    }

    .zone-text-group {
      display: flex;
      flex-direction: column;
    }

    .zone-heading {
      font-size: 0.875rem;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zone-description {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.65);
    }

    .zone-controls-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .zone-source-select {
      font: inherit;
      font-size: 0.75rem;
      background: #09090f;
      color: #f4a261;
      font-weight: 800;
      border: 1px solid rgba(244, 162, 97, 0.4);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
    }

    .zone-volume-col {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zone-vol-slider {
      width: 90px;
      cursor: pointer;
      accent-color: #f4a261;
    }

    .zone-vu-meter {
      width: 50px;
      height: 8px;
      background: #050508;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .zone-vu-fill {
      height: 100%;
      background: linear-gradient(90deg, #3dffab, #f4a261);
      transition: width 0.06s linear;
    }

    .zone-power-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    .zone-power-btn.active {
      background: #3dffab;
      color: #000;
      box-shadow: 0 0 12px rgba(61, 255, 171, 0.5);
    }

    .zone-power-btn.inactive {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;
  @property({ attribute: false }) public zoneState!: OpusZoneState;

  @state() private zoneLevel = 0;
  private timer: number | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.timer = window.setInterval(() => {
      this.zoneLevel = Math.min(100, Math.round(this.engine.getZoneLevel() * 160));
      this.requestUpdate();
    }, 70);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.timer) clearInterval(this.timer);
  }

  override render() {
    const s = this.zoneState || this.engine.opusPerformanceState.zone;

    return html`
      <div class="zone-container">
        <div class="zone-left-info">
          <span class="zone-badge">
            🏢 VERSATILE ZONE OUTPUT
          </span>
          <div class="zone-text-group">
            <span class="zone-heading">
              Dedicated Multi-Room Audio Stream (Separate from Master)
            </span>
            <span class="zone-description">
              Route different music genres or playlists into Lounge, Patio, or VIP Rooms from this single OPUS-QUAD unit.
            </span>
          </div>
        </div>

        <div class="zone-controls-group">
          <label style="font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 700;">Zone Source:</label>
          <select
            class="zone-source-select"
            .value=${s.source}
            @change=${(e: Event) =>
              this.engine.setZoneSource(
                (e.target as HTMLSelectElement).value as
                  | '1'
                  | '2'
                  | '3'
                  | '4'
                  | 'master'
                  | 'lounge_stream'
              )}
          >
            <option value="3">Deck 3 (Deep Velvet Lounge)</option>
            <option value="4">Deck 4 (Subterranean Groove)</option>
            <option value="1">Deck 1 (Sunset Horizon)</option>
            <option value="2">Deck 2 (Tokyo Neon Cyber)</option>
            <option value="lounge_stream">🌴 Dedicated Lounge Ambient Stream</option>
            <option value="master">🎚️ Mirror Master Output</option>
          </select>

          <div class="zone-volume-col">
            <span style="font-size: 0.6875rem; color: rgba(255,255,255,0.6); font-weight: 800;">VOL</span>
            <input
              type="range"
              class="zone-vol-slider"
              min="0"
              max="1.2"
              step="0.02"
              .value=${String(s.volume)}
              @input=${(e: Event) =>
                this.engine.setZoneVolume(parseFloat((e.target as HTMLInputElement).value))}
              title="Zone Output Volume"
            />
            <span style="font-size: 0.6875rem; font-family: monospace;">${Math.round(s.volume * 100)}%</span>
          </div>

          <div class="zone-vu-meter" title="Zone Output Audio Level">
            <div class="zone-vu-fill" style="width: ${s.isPlaying ? this.zoneLevel : 0}%"></div>
          </div>

          <button
            class="zone-power-btn ${s.isPlaying ? 'active' : 'inactive'}"
            @click=${() => this.engine.toggleZonePlayback()}
            title="Toggle Zone Audio Broadcast"
          >
            ${s.isPlaying ? '🔴 ZONE ON' : 'ZONE OFF'}
          </button>
        </div>
      </div>
    `;
  }
}
