/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HardwareControllerPreset, HardwareProfile } from '../types';
import type { MidiDispatcher } from '../utils/MidiDispatcher';
import { HARDWARE_PROFILES, type VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('hardware-compatibility-hub')
export class HardwareCompatibilityHub extends LitElement {
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

    .hub-header {
      background: linear-gradient(90deg, rgba(42, 246, 222, 0.15), rgba(255, 183, 3, 0.15));
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

    .hub-badge {
      font-size: 0.8125rem;
      font-weight: 900;
      background: linear-gradient(135deg, #2af6de, #ffb703);
      color: #000;
      padding: 5px 12px;
      border-radius: 6px;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 900;
    }

    /* Hardware Profiles Grid */
    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .profile-card {
      background: #14141f;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .profile-card:hover {
      border-color: #2af6de;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(42, 246, 222, 0.2);
    }

    .profile-card.active {
      border: 2px solid #2af6de;
      background: linear-gradient(135deg, rgba(42, 246, 222, 0.12), rgba(20, 20, 31, 0.95));
      box-shadow: 0 0 20px rgba(42, 246, 222, 0.4);
    }

    .profile-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .profile-name {
      font-size: 0.9375rem;
      font-weight: 900;
      color: #ffffff;
    }

    .profile-brand {
      font-size: 0.6875rem;
      color: #2af6de;
      font-weight: 700;
      text-transform: uppercase;
    }

    .workflow-pill {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
    }

    .profile-desc {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.4;
    }

    .profile-features {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .feature-tag {
      font-size: 0.625rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.85);
    }

    /* MIDI Mapping & Learn Box */
    .midi-learn-panel {
      background: #14141f;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .midi-learn-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 10px;
    }

    .midi-learn-title {
      font-size: 0.9375rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .midi-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
    }

    .midi-table th {
      text-align: left;
      padding: 8px;
      background: rgba(0, 0, 0, 0.4);
      color: rgba(255, 255, 255, 0.6);
      font-weight: 800;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .midi-table td {
      padding: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.85);
    }

    .btn-learn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-learn:hover {
      background: #2af6de;
      color: #000;
    }

    .btn-learn.active {
      background: #ff25f6;
      color: #000;
      border-color: #ff25f6;
      animation: pulse 1.2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;
  @property({ attribute: false }) public midiDispatcher!: MidiDispatcher;

  @state() private activePreset: HardwareControllerPreset = 'opus_quad';
  @state() private isLearningTarget: string | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.activePreset = this.engine.activeHardwareProfile.id;
    this.engine.addEventListener('hardware-profile-changed', () => {
      this.activePreset = this.engine.activeHardwareProfile.id;
      this.requestUpdate();
    });
  }

  private selectPreset(presetId: HardwareControllerPreset) {
    this.engine.setHardwareProfile(presetId);
    this.activePreset = presetId;
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `🔌 Loaded hardware profile: ${this.engine.activeHardwareProfile.name}`,
        bubbles: true,
        composed: true,
      })
    );
  }

  private toggleMidiLearn(control: string) {
    if (this.isLearningTarget === control) {
      this.isLearningTarget = null;
    } else {
      this.isLearningTarget = control;
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `🎛️ MIDI Learn active for [${control}] • Move knob/fader on your DJ controller now...`,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  override render() {
    const active = this.engine.activeHardwareProfile;

    return html`
      <!-- Header -->
      <div class="hub-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="hub-badge">Hardware Ecosystem</span>
          <div>
            <div style="font-size: 0.9375rem; font-weight: 900; color: #ffffff;">
              Extensive Hardware Controller Compatibility & Preset Mappings
            </div>
            <div style="font-size: 0.8125rem; color: rgba(255, 255, 255, 0.75);">
              Native support for club standard nexus rigs, motorized battle turntables, 4-deck standalones, and custom MIDI setups.
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <button
            class="btn-learn"
            style="background: rgba(61, 255, 171, 0.15); color: #3dffab; border-color: rgba(61, 255, 171, 0.4); padding: 6px 14px; font-weight: 800;"
            @click=${() => this.dispatchEvent(new CustomEvent('open-latency-modal', { bubbles: true, composed: true }))}
          >
            ⏱️ Calibrate Controller Latency
          </button>
          <div style="font-size: 0.75rem; color: #2af6de; font-weight: 800;">
            Active Profile: ${active.name}
          </div>
        </div>
      </div>

      <!-- Controller Profiles Grid -->
      <div class="profiles-grid">
        ${HARDWARE_PROFILES.map(
          (p) => html`
            <div
              class="profile-card ${this.activePreset === p.id ? 'active' : ''}"
              @click=${() => this.selectPreset(p.id)}
            >
              <div>
                <div class="profile-top">
                  <div>
                    <div class="profile-brand">${p.brand}</div>
                    <div class="profile-name">${p.name}</div>
                  </div>
                  <span class="workflow-pill">${p.workflow.replace('_', ' ')}</span>
                </div>

                <div class="profile-desc" style="margin-top: 8px;">
                  ${p.description}
                </div>
              </div>

              <div class="profile-features">
                <span class="feature-tag">${p.channels} Channels</span>
                <span class="feature-tag">${p.motorizedPlatters ? 'Motorized Platters' : 'Capacitive Platters'}</span>
                <span class="feature-tag">${p.dedicatedStemButtons ? 'Dedicated Stems' : 'Pad Stems'}</span>
                ${p.displayScreens ? html`<span class="feature-tag">On-Screen Displays</span>` : ''}
              </div>
            </div>
          `
        )}
      </div>

      <!-- MIDI Learn & Custom Mapping Table -->
      <div class="midi-learn-panel">
        <div class="midi-learn-head">
          <div class="midi-learn-title">
            <span>🎛️ Interactive Universal MIDI Learn & CC Matrix</span>
          </div>
          <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6);">
            Click "Learn" to bind physical knobs, crossfaders, and buttons
          </div>
        </div>

        <table class="midi-table">
          <thead>
            <tr>
              <th>DJ Function</th>
              <th>Control Type</th>
              <th>Assigned MIDI CC / Note</th>
              <th>Channel</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Crossfader</strong></td>
              <td>Analog Slider (0-127)</td>
              <td><span style="color: #2af6de; font-weight: 800;">CC #10</span></td>
              <td>Ch 1</td>
              <td>
                <button
                  class="btn-learn ${this.isLearningTarget === 'Crossfader' ? 'active' : ''}"
                  @click=${() => this.toggleMidiLearn('Crossfader')}
                >
                  ${this.isLearningTarget === 'Crossfader' ? 'Listening...' : 'Learn'}
                </button>
              </td>
            </tr>
            <tr>
              <td><strong>Deck 1 Volume Fader</strong></td>
              <td>Vertical Fader (0-127)</td>
              <td><span style="color: #2af6de; font-weight: 800;">CC #19</span></td>
              <td>Ch 1</td>
              <td>
                <button
                  class="btn-learn ${this.isLearningTarget === 'D1_Vol' ? 'active' : ''}"
                  @click=${() => this.toggleMidiLearn('D1_Vol')}
                >
                  ${this.isLearningTarget === 'D1_Vol' ? 'Listening...' : 'Learn'}
                </button>
              </td>
            </tr>
            <tr>
              <td><strong>Deck 1 Vocal Stem Mute</strong></td>
              <td>Pad / Button (Note On)</td>
              <td><span style="color: #ff25f6; font-weight: 800;">Note #36 (C1)</span></td>
              <td>Ch 1</td>
              <td>
                <button
                  class="btn-learn ${this.isLearningTarget === 'D1_VocalMute' ? 'active' : ''}"
                  @click=${() => this.toggleMidiLearn('D1_VocalMute')}
                >
                  ${this.isLearningTarget === 'D1_VocalMute' ? 'Listening...' : 'Learn'}
                </button>
              </td>
            </tr>
            <tr>
              <td><strong>Deck 2 Volume Fader</strong></td>
              <td>Vertical Fader (0-127)</td>
              <td><span style="color: #2af6de; font-weight: 800;">CC #20</span></td>
              <td>Ch 1</td>
              <td>
                <button
                  class="btn-learn ${this.isLearningTarget === 'D2_Vol' ? 'active' : ''}"
                  @click=${() => this.toggleMidiLearn('D2_Vol')}
                >
                  ${this.isLearningTarget === 'D2_Vol' ? 'Listening...' : 'Learn'}
                </button>
              </td>
            </tr>
            <tr>
              <td><strong>Deck 2 Vocal Stem Mute</strong></td>
              <td>Pad / Button (Note On)</td>
              <td><span style="color: #ff25f6; font-weight: 800;">Note #38 (D1)</span></td>
              <td>Ch 1</td>
              <td>
                <button
                  class="btn-learn ${this.isLearningTarget === 'D2_VocalMute' ? 'active' : ''}"
                  @click=${() => this.toggleMidiLearn('D2_VocalMute')}
                >
                  ${this.isLearningTarget === 'D2_VocalMute' ? 'Listening...' : 'Learn'}
                </button>
              </td>
            </tr>
            <tr>
              <td><strong>Master Video Crossfader</strong></td>
              <td>Slider (0-127)</td>
              <td><span style="color: #ffd166; font-weight: 800;">CC #11</span></td>
              <td>Ch 1</td>
              <td>
                <button
                  class="btn-learn ${this.isLearningTarget === 'Video_CF' ? 'active' : ''}"
                  @click=${() => this.toggleMidiLearn('Video_CF')}
                >
                  ${this.isLearningTarget === 'Video_CF' ? 'Listening...' : 'Learn'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
}
