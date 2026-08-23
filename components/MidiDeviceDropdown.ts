/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { MidiAccessStatus, MidiDeviceInfo } from '../types';
import type { MidiDispatcher } from '../utils/MidiDispatcher';

/**
 * A dedicated UI dropdown component that lists all connected MIDI input devices,
 * displays real-time connection status, and allows dynamically switching between them.
 */
@customElement('midi-device-dropdown')
export class MidiDeviceDropdown extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: 'Google Sans', system-ui, -apple-system, sans-serif;
      font-size: 0.8125rem;
      user-select: none;
      z-index: 50;
    }

    .dropdown-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .trigger-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      background: rgba(26, 26, 32, 0.85);
      backdrop-filter: blur(16px);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 260px;
    }

    .trigger-button:hover {
      background: rgba(40, 40, 50, 0.95);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .trigger-button:active {
      transform: translateY(0);
    }

    .trigger-button.open {
      border-color: #2af6de;
      box-shadow: 0 0 0 2px rgba(42, 246, 222, 0.2);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #71717a;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .status-dot.connected {
      background: #3dffab;
      box-shadow: 0 0 8px #3dffab;
    }

    .status-dot.requesting {
      background: #ffdd28;
      box-shadow: 0 0 8px #ffdd28;
      animation: pulse 1s infinite;
    }

    .status-dot.error {
      background: #ff4d4f;
      box-shadow: 0 0 8px #ff4d4f;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .device-name-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      text-align: left;
    }

    .chevron-icon {
      width: 14px;
      height: 14px;
      fill: rgba(255, 255, 255, 0.6);
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .trigger-button.open .chevron-icon {
      transform: rotate(180deg);
    }

    /* Menu overlay */
    .menu-panel {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 280px;
      max-width: 340px;
      background: rgba(18, 18, 24, 0.96);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 100;
      animation: menuFadeIn 0.15s ease-out;
    }

    @keyframes menuFadeIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .menu-header {
      padding: 6px 8px;
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 4px;
    }

    .device-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      max-height: 220px;
      overflow-y: auto;
    }

    .device-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 6px;
      background: transparent;
      color: #ffffff;
      border: 1px solid transparent;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      font-size: 0.8125rem;
      transition: all 0.12s ease;
    }

    .device-item:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .device-item.active {
      background: rgba(42, 246, 222, 0.12);
      border-color: rgba(42, 246, 222, 0.3);
    }

    .device-info-left {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
    }

    .device-title {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .device-meta {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.45);
      margin-top: 1px;
    }

    .active-badge {
      font-size: 0.625rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #2af6de;
      background: rgba(42, 246, 222, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .empty-state {
      padding: 14px 10px;
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.75rem;
      line-height: 1.4;
    }

    .menu-footer {
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      gap: 6px;
    }

    .action-btn {
      flex: 1;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #ffffff;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.12s ease;
    }

    .permission-prompt-card {
      padding: 10px;
      margin: 4px 0 8px 0;
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.12), rgba(255, 77, 79, 0.12));
      border: 1px solid rgba(255, 183, 3, 0.35);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .permission-title {
      font-size: 0.75rem;
      font-weight: 800;
      color: #ffdd28;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .permission-desc {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.75);
      line-height: 1.35;
    }

    .btn-authorize {
      margin-top: 4px;
      padding: 6px 10px;
      background: #ffb703;
      color: #000000;
      border: none;
      border-radius: 6px;
      font: inherit;
      font-size: 0.75rem;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .btn-authorize:hover {
      background: #ffdd28;
      box-shadow: 0 0 10px rgba(255, 221, 40, 0.4);
    }
  `;

  @property({ type: Object }) midiDispatcher: MidiDispatcher | null = null;
  @property({ type: String }) activeMidiInputId: string | null = null;
  @property({ type: Array }) devices: MidiDeviceInfo[] = [];
  @property({ type: String }) status: MidiAccessStatus = 'unrequested';

  @state() private isOpen = false;

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.handleOutsideClick);
    this.bindDispatcherEvents();
    this.syncFromDispatcher();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
    this.unbindDispatcherEvents();
  }

  private handleDispatcherUpdate = () => {
    this.syncFromDispatcher();
    this.requestUpdate();
  };

  private bindDispatcherEvents() {
    if (!this.midiDispatcher) return;
    this.midiDispatcher.addEventListener('status-changed', this.handleDispatcherUpdate);
    this.midiDispatcher.addEventListener('devices-changed', this.handleDispatcherUpdate);
    this.midiDispatcher.addEventListener('active-device-changed', this.handleDispatcherUpdate);
  }

  private unbindDispatcherEvents() {
    if (!this.midiDispatcher) return;
    this.midiDispatcher.removeEventListener('status-changed', this.handleDispatcherUpdate);
    this.midiDispatcher.removeEventListener('devices-changed', this.handleDispatcherUpdate);
    this.midiDispatcher.removeEventListener('active-device-changed', this.handleDispatcherUpdate);
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('midiDispatcher')) {
      this.bindDispatcherEvents();
      this.syncFromDispatcher();
    }
  }

  private handleOutsideClick = (e: MouseEvent) => {
    if (!this.isOpen) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.isOpen = false;
    }
  };

  private syncFromDispatcher() {
    if (!this.midiDispatcher) return;
    this.devices = this.midiDispatcher.getConnectedDevices();
    this.activeMidiInputId = this.midiDispatcher.activeMidiInputId;
    this.status = this.midiDispatcher.status;
  }

  private toggleOpen() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.status === 'unrequested') {
      this.requestAccess();
    }
  }

  private async requestAccess() {
    if (!this.midiDispatcher) return;
    try {
      await this.midiDispatcher.getMidiAccess();
      this.syncFromDispatcher();
    } catch (err: any) {
      this.syncFromDispatcher();
      this.dispatchEvent(
        new CustomEvent('error-message', {
          detail: err?.message || 'Failed to access MIDI devices',
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private selectDevice(deviceId: string) {
    this.activeMidiInputId = deviceId;
    if (this.midiDispatcher) {
      this.midiDispatcher.setActiveMidiInput(deviceId);
    }
    this.dispatchEvent(
      new CustomEvent('device-selected', {
        detail: { deviceId },
        bubbles: true,
        composed: true,
      })
    );
    this.isOpen = false;
  }

  private getActiveDeviceDisplayName(): string {
    if (this.status === 'unrequested') {
      return 'Connect MIDI';
    }
    if (this.status === 'requesting') {
      return 'Searching MIDI...';
    }
    if (this.status === 'denied') {
      return 'MIDI Denied';
    }
    if (this.status === 'unsupported') {
      return 'MIDI Unsupported';
    }
    if (this.devices.length === 0) {
      return 'No MIDI Devices';
    }
    if (this.activeMidiInputId) {
      const dev = this.devices.find((d) => d.id === this.activeMidiInputId);
      if (dev) return dev.name;
    }
    return this.devices[0].name;
  }

  override render() {
    const activeLabel = this.getActiveDeviceDisplayName();
    const isConnected = this.status === 'granted' && this.devices.length > 0;
    const dotClass =
      this.status === 'requesting'
        ? 'requesting'
        : this.status === 'denied' || this.status === 'unsupported'
        ? 'error'
        : isConnected
        ? 'connected'
        : '';

    return html`
      <div class="dropdown-container">
        <button
          id="midi-dropdown-trigger"
          class="trigger-button ${this.isOpen ? 'open' : ''}"
          @click=${this.toggleOpen}
          title="Manage & Switch MIDI Input Controllers"
        >
          <span class="status-dot ${dotClass}"></span>
          <span class="device-name-text">${activeLabel}</span>
          <svg class="chevron-icon" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        ${this.isOpen
          ? html`
              <div class="menu-panel" id="midi-dropdown-menu">
                <div class="menu-header">
                  <span>Connected MIDI Inputs</span>
                  <span>${this.devices.length} Detected</span>
                </div>

                ${this.status !== 'granted'
                  ? html`
                      <div class="permission-prompt-card">
                        <div class="permission-title">
                          <span>⚠️</span>
                          <span>${this.status === 'denied'
                            ? 'MIDI Permission Blocked'
                            : this.status === 'unsupported'
                            ? 'Web MIDI Unsupported'
                            : 'Hardware Permission Required'}</span>
                        </div>
                        <div class="permission-desc">
                          ${this.status === 'denied'
                            ? 'Browser blocked MIDI access. Click Lock icon in address bar -> Permissions -> Allow MIDI Devices.'
                            : this.status === 'unsupported'
                            ? 'Web MIDI API is unsupported in this browser. Please use Chrome, Edge, or Opera.'
                            : 'Authorize browser access to detect Pioneer OPUS-QUAD, DDJ, RANE, or USB MIDI DJ controllers.'}
                        </div>
                        ${this.status !== 'unsupported'
                          ? html`
                              <button class="btn-authorize" @click=${this.requestAccess}>
                                <span>🔌 Authorize & Scan MIDI Ports</span>
                              </button>
                            `
                          : ''}
                      </div>
                    `
                  : ''}

                <div class="device-list">
                  ${this.devices.length > 0
                    ? this.devices.map((device) => {
                        const isActive = device.id === this.activeMidiInputId;
                        return html`
                          <div
                            class="device-item ${isActive ? 'active' : ''}"
                            @click=${() => this.selectDevice(device.id)}
                          >
                            <div class="device-info-left">
                              <span
                                class="status-dot ${device.state === 'connected' ? 'connected' : ''}"
                              ></span>
                              <div>
                                <div class="device-title">${device.name}</div>
                                <div class="device-meta">
                                  ${device.manufacturer || 'MIDI Port'} • ${device.state}
                                </div>
                              </div>
                            </div>
                            ${isActive
                              ? html`<span class="active-badge">Active</span>`
                              : ''}
                          </div>
                        `;
                      })
                    : html`
                        <div class="empty-state">
                          ${this.status === 'denied'
                            ? 'Browser blocked MIDI access. Click Retry below.'
                            : this.status === 'unsupported'
                            ? 'Web MIDI API is not supported on this browser.'
                            : 'No hardware MIDI controllers connected. Plug in a USB MIDI keyboard/knob or use the virtual deck.'}
                        </div>
                      `}
                </div>

                <div class="menu-footer">
                  <button
                    class="action-btn"
                    id="midi-rescan-button"
                    @click=${this.requestAccess}
                    title="Rescan USB/Bluetooth ports"
                  >
                    <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24">
                      <path
                        d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                      />
                    </svg>
                    <span>Rescan Ports</span>
                  </button>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'midi-device-dropdown': MidiDeviceDropdown;
  }
}
