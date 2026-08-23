/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';
import type { MidiDispatcher } from '../utils/MidiDispatcher';
import type { ControlChange } from '../types';

interface ShapeParticle {
  id: string;
  cc: number;
  value: number;
  type: 'circle' | 'square' | 'diamond' | 'triangle' | 'pill' | 'star';
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

const SHAPE_TYPES: ShapeParticle['type'][] = ['circle', 'square', 'diamond', 'triangle', 'pill', 'star'];

const PRESET_COLORS = [
  '#9900ff', // Violet
  '#5200ff', // Deep Blue
  '#ff25f6', // Pink
  '#2af6de', // Cyan
  '#ffdd28', // Yellow
  '#3dffab', // Mint Green
  '#d8ff3e', // Lime Green
  '#d9b2ff', // Light Purple
];

@customElement('midi-visualizer')
export class MidiVisualizer extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1200px;
      margin: 20px auto;
      background: rgba(18, 18, 18, 0.75);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      box-sizing: border-box;
      color: #ffffff;
      font-family: 'Google Sans', sans-serif;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }

    h3 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
      letter-spacing: -0.025em;
      font-weight: 700;
      background: linear-gradient(135deg, #fff 30%, #a8a8a8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
      margin: 0 0 24px 0;
    }

    .dashboard {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    @media (min-width: 900px) {
      .dashboard {
        grid-template-columns: 1fr 340px;
      }
    }

    /* Shape Canvas Styles */
    .visualizer-stage {
      position: relative;
      height: 380px;
      background: radial-gradient(circle at center, #18181b 0%, #09090b 100%);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* Grid overlay for a tech aesthetic */
    .grid-overlay {
      position: absolute;
      inset: 0;
      background-size: 30px 30px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      pointer-events: none;
      z-index: 1;
    }

    /* Floating Canvas Entities */
    .canvas-shape {
      position: absolute;
      transform-origin: center;
      mix-blend-mode: screen;
      pointer-events: none;
      transition: all 0.1s cubic-bezier(0.1, 0.8, 0.2, 1);
      z-index: 2;
    }

    .shape-circle {
      border-radius: 50%;
    }

    .shape-square {
      border-radius: 4px;
    }

    .shape-diamond {
      transform: rotate(45deg);
      border-radius: 4px;
    }

    .shape-triangle {
      width: 0 !important;
      height: 0 !important;
      background: transparent !important;
      border-left: var(--tri-size) solid transparent;
      border-right: var(--tri-size) solid transparent;
      border-bottom: var(--tri-height) solid var(--tri-color);
      filter: drop-shadow(0 0 12px var(--tri-color));
    }

    .shape-pill {
      border-radius: 9999px;
    }

    .shape-star {
      clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    }

    /* Side Panel Styles */
    .side-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Log Stream / HUD */
    .hud-panel {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 16px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 180px;
    }

    .hud-header {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.4);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
    }

    .hud-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
      flex: 1;
      max-height: 180px;
    }

    .hud-row {
      display: flex;
      align-items: center;
      font-size: 0.8125rem;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 4px;
      border-left: 3px solid #71717a;
      transition: background 0.2s;
    }

    .hud-row.active {
      background: rgba(255, 255, 255, 0.05);
    }

    .hud-time {
      color: rgba(255, 255, 255, 0.25);
      margin-right: 12px;
      font-size: 0.75rem;
    }

    .hud-cc {
      color: #2af6de;
      font-weight: bold;
      margin-right: 12px;
    }

    .hud-val-container {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hud-val {
      font-weight: bold;
      color: #ff25f6;
    }

    .hud-bar {
      width: 40px;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .hud-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff25f6, #9900ff);
      border-radius: 3px;
    }

    .no-messages {
      color: rgba(255, 255, 255, 0.25);
      font-size: 0.8125rem;
      text-align: center;
      margin: auto;
    }

    /* Simulation Control Deck */
    .simulator {
      background: rgba(30, 41, 59, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px;
    }

    .sim-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 12px;
    }

    .sim-button {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 4px;
      color: #fff;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      text-align: center;
    }

    .sim-button:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .sim-button:active {
      transform: translateY(1px);
      background: rgba(255, 255, 255, 0.08);
    }

    /* Faders */
    .sim-fader-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .sim-fader-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sim-fader-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      width: 70px;
      color: rgba(255, 255, 255, 0.6);
    }

    .sim-slider {
      flex: 1;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      outline: none;
      cursor: pointer;
    }

    .sim-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #3dffab;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(61, 255, 171, 0.7);
      transition: transform 0.1s;
    }

    .sim-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }

    /* CSS Geometric shape gallery mapped to CC channels */
    .matrix-panel {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
      margin-top: 24px;
    }

    .matrix-title {
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 12px;
      font-weight: 600;
    }

    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    @media (min-width: 600px) {
      .matrix-grid {
        grid-template-columns: repeat(8, 1fr);
      }
    }

    .matrix-cell {
      background: rgba(30, 41, 59, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      transition: all 0.15s ease-out;
    }

    .matrix-cell-title {
      font-size: 0.625rem;
      color: rgba(255, 255, 255, 0.3);
      margin-top: 6px;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Small dynamic cell visual representing MIDI value */
    .matrix-shape-indicator {
      width: 18px;
      height: 18px;
      transition: all 0.1s cubic-bezier(0.12, 0.8, 0.2, 1.1);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.05);
    }
  `;

  @property({ type: Object }) midiDispatcher: MidiDispatcher | null = null;

  @state() private activeParticles: ShapeParticle[] = [];
  @state() private receivedLogs: { id: string; time: string; cc: number; val: number; color: string }[] = [];
  @state() private ccValues: Map<number, number> = new Map();
  @state() private activeDeviceName: string | null = null;
  @state() private deviceCount = 0;

  // Internal counter to generate unique IDs
  private particleCounter = 0;
  private logCounter = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.setupMidiListener();
    // Pre-populate some dummy state keys for mapping indicators
    for (let c = 0; c < 16; c++) {
      this.ccValues.set(c, 0);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.teardownMidiListener();
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('midiDispatcher')) {
      this.teardownMidiListener();
      this.setupMidiListener();
    }
  }

  private setupMidiListener() {
    if (!this.midiDispatcher) return;
    
    this.midiDispatcher.addEventListener('cc-message', this.handleCcMessage as EventListener);
    this.midiDispatcher.addEventListener('devices-changed', this.handleDevicesUpdate as EventListener);
    this.midiDispatcher.addEventListener('active-device-changed', this.handleDevicesUpdate as EventListener);
    this.updateDeviceInfo();
  }

  private teardownMidiListener() {
    if (!this.midiDispatcher) return;
    this.midiDispatcher.removeEventListener('cc-message', this.handleCcMessage as EventListener);
    this.midiDispatcher.removeEventListener('devices-changed', this.handleDevicesUpdate as EventListener);
    this.midiDispatcher.removeEventListener('active-device-changed', this.handleDevicesUpdate as EventListener);
  }

  private handleDevicesUpdate = () => {
    this.updateDeviceInfo();
    this.requestUpdate();
  };

  private updateDeviceInfo() {
    if (!this.midiDispatcher) return;
    const devices = this.midiDispatcher.getConnectedDevices();
    this.deviceCount = devices.length;
    if (this.midiDispatcher.activeMidiInputId) {
      this.activeDeviceName = this.midiDispatcher.getDeviceName(this.midiDispatcher.activeMidiInputId);
    } else {
      this.activeDeviceName = devices.length > 0 ? devices[0].name : null;
    }
  }

  private handleCcMessage = (event: CustomEvent<ControlChange>) => {
    const { cc, value } = event.detail;
    
    // Store latest value
    const updatedValues = new Map(this.ccValues);
    updatedValues.set(cc, value);
    this.ccValues = updatedValues;

    // Trigger visual creations
    this.spawnParticle(cc, value);
    this.addLog(cc, value);
  };

  private spawnParticle(cc: number, value: number) {
    if (value === 0) return; // avoid spawning on silent zero values
    
    const id = `p-${this.particleCounter++}`;
    const randType = SHAPE_TYPES[cc % SHAPE_TYPES.length];
    const randColor = PRESET_COLORS[cc % PRESET_COLORS.length];
    
    // Scale is relative to MIDI CC depth (0 to 127)
    const normalizedVal = value / 127;
    const sizeScale = 0.4 + normalizedVal * 1.6; // Scale ranges from 0.4x to 2x

    // Generate smart random coordinate within bounds from center outwards
    const bounds = 300; // visual stage constraint
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (bounds * 0.35); // Concentrate towards middle
    const xOffset = Math.cos(angle) * distance;
    const yOffset = Math.sin(angle) * distance;

    const newParticle: ShapeParticle = {
      id,
      cc,
      value,
      type: randType,
      color: randColor,
      x: xOffset,
      y: yOffset,
      scale: sizeScale,
      rotation: Math.random() * 360,
      opacity: 0.95,
    };

    this.activeParticles = [...this.activeParticles, newParticle];

    // Gradually fade out and remove visual particles
    setTimeout(() => {
      this.activeParticles = this.activeParticles.map(p => {
        if (p.id === id) {
          return { ...p, opacity: 0, scale: p.scale * 1.5, rotation: p.rotation + 45 };
        }
        return p;
      });
      this.requestUpdate();

      // Completely remove from DOM after CSS transition finishes
      setTimeout(() => {
        this.activeParticles = this.activeParticles.filter(p => p.id !== id);
      }, 500);
    }, 600);
  }

  private addLog(cc: number, value: number) {
    const time = new Date().toLocaleTimeString(undefined, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + '.' + String(Date.now() % 1000).padStart(3, '0');

    const logColor = PRESET_COLORS[cc % PRESET_COLORS.length];
    const newLog = {
      id: `l-${this.logCounter++}`,
      time,
      cc,
      val: value,
      color: logColor,
    };

    // Cap log size at last 8 items
    this.receivedLogs = [newLog, ...this.receivedLogs].slice(0, 8);
  }

  /**
   * Dispatches custom simulated MIDI events directly through the shared
   * MIDI dispatcher so the entire interface (Prompt DJ cells & visualizer)
   * reacts in real-time.
   */
  private triggerSimulatedCc(cc: number, value: number) {
    if (!this.midiDispatcher) return;

    const detail: ControlChange = {
      channel: 0,
      cc,
      value,
    };

    this.midiDispatcher.dispatchEvent(
      new CustomEvent<ControlChange>('cc-message', { detail })
    );
  }

  private handleSimulatorButton(cc: number) {
    // Generate a burst of values or toggle value
    const currentVal = this.ccValues.get(cc) || 0;
    const nextVal = currentVal > 0 ? 0 : 127;
    this.triggerSimulatedCc(cc, nextVal);
  }

  private handleSliderInput(e: Event, cc: number) {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    this.triggerSimulatedCc(cc, value);
  }

  override render() {
    return html`
      <div id="midi-visualizer-container">
        <h3>
          <svg style="width: 20px; height: 20px; fill: #2af6de;" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
          MIDI Core Visualizer
        </h3>
        <p class="subtitle">
          Observe incoming MIDI signals transformed into active, real-time geometric visual matrices.
        </p>

        <div class="dashboard">
          <!-- Geometric Canvas viewport -->
          <div class="visualizer-stage" id="visualizer-stage-view">
            <div class="grid-overlay"></div>
            
            ${repeat(
              this.activeParticles,
              (p) => p.id,
              (p) => {
                const color = p.color;
                
                if (p.type === 'triangle') {
                  const size = Math.round(35 * p.scale);
                  const styles = styleMap({
                    left: `calc(50% + ${p.x}px - ${size}px)`,
                    top: `calc(50% + ${p.y}px - ${size}px)`,
                    '--tri-size': `${size}px`,
                    '--tri-height': `${size * 1.5}px`,
                    '--tri-color': color,
                    transform: `rotate(${p.rotation}deg)`,
                    opacity: String(p.opacity),
                  });
                  return html`
                    <div class="canvas-shape shape-triangle" style=${styles}></div>
                  `;
                }

                const size = Math.round(70 * p.scale);
                const styles = styleMap({
                  left: `calc(50% + ${p.x}px - ${size / 2}px)`,
                  top: `calc(50% + ${p.y}px - ${size / 2}px)`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: p.type === 'star' ? 'transparent' : color,
                  boxShadow: p.type === 'star' ? 'none' : `0 0 ${20 * p.scale}px ${color}`,
                  transform: `rotate(${p.rotation}deg)`,
                  opacity: String(p.opacity),
                });

                if (p.type === 'star') {
                  const starStyles = styleMap({
                    ...styles,
                    background: color,
                    filter: `drop-shadow(0 0 ${15 * p.scale}px ${color})`,
                  });
                  return html`<div class="canvas-shape shape-star" style=${starStyles}></div>`;
                }

                return html`
                  <div class="canvas-shape shape-${p.type}" style=${styles}></div>
                `;
              }
            )}

            ${this.activeParticles.length === 0
              ? html`
                  <div style="z-index: 10; text-align: center; pointer-events: none;">
                    <div style="font-size: 2.5rem; filter: grayscale(1); margin-bottom: 8px; animation: pulse 2s infinite;">🎹</div>
                    <div style="font-family: inherit; font-size: 0.8125rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.08em;">
                      Awaiting MIDI Activity
                    </div>
                  </div>
                `
              : ''}
          </div>

          <!-- Log and simulator side section -->
          <div class="side-panel">
            <!-- MIDI Monitor Log Stream -->
            <div class="hud-panel">
              <div class="hud-header">
                <span>Signal Monitor</span>
                <span style="color: ${this.activeDeviceName ? '#3dffab' : '#2af6de'}; font-size: 0.6875rem; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${this.activeDeviceName ? `● ${this.activeDeviceName}` : (this.deviceCount > 0 ? '● Standby' : '● Ready')}
                </span>
              </div>
              <div class="hud-list">
                ${this.receivedLogs.length > 0
                  ? repeat(
                      this.receivedLogs,
                      (l) => l.id,
                      (l) => html`
                        <div class="hud-row" style="border-left-color: ${l.color}">
                          <span class="hud-time">${l.time}</span>
                          <span class="hud-cc">CC:${l.cc}</span>
                          <div class="hud-val-container">
                            <span class="hud-val">${l.val}</span>
                            <div class="hud-bar">
                              <div class="hud-bar-fill" style="width: ${(l.val / 127) * 100}%; background: ${l.color}"></div>
                            </div>
                          </div>
                        </div>
                      `
                    )
                  : html`<div class="no-messages">Play prompts or interact with controls below to dispatch events</div>`}
              </div>
            </div>

            <!-- Virtual MIDI Simulation Controller -->
            <div class="simulator">
              <div style="font-size: 0.8125rem; font-weight: bold; text-transform: uppercase; color: rgba(255, 255, 255, 0.6); display: flex; align-items: center; justify-content: space-between;">
                <span>Virtual MIDI Deck</span>
                <span style="font-size: 0.6875rem; color: #ffdd28; font-weight: normal; font-family: monospace;">TEST HARNESS</span>
              </div>
              
              <div class="sim-buttons">
                <button class="sim-button" @click=${() => this.handleSimulatorButton(0)}>Trigger CC:0</button>
                <button class="sim-button" @click=${() => this.handleSimulatorButton(1)}>Trigger CC:1</button>
                <button class="sim-button" @click=${() => this.handleSimulatorButton(2)}>Trigger CC:2</button>
                <button class="sim-button" @click=${() => this.handleSimulatorButton(3)}>Trigger CC:3</button>
              </div>

              <div class="sim-fader-container">
                <div class="sim-fader-row">
                  <span class="sim-fader-label">CC:0 Fader</span>
                  <input 
                    type="range" 
                    class="sim-slider" 
                    min="0" 
                    max="127" 
                    .value=${this.ccValues.get(0) || 0} 
                    @input=${(e: Event) => this.handleSliderInput(e, 0)}>
                </div>
                <div class="sim-fader-row">
                  <span class="sim-fader-label">CC:1 Mod</span>
                  <input 
                    type="range" 
                    class="sim-slider" 
                    style="--theme-color: #ff25f6;"
                    min="0" 
                    max="127" 
                    .value=${this.ccValues.get(1) || 0} 
                    @input=${(e: Event) => this.handleSliderInput(e, 1)}>
                </div>
                <div class="sim-fader-row">
                  <span class="sim-fader-label">CC:2 Expression</span>
                  <input 
                    type="range" 
                    class="sim-slider" 
                    min="0" 
                    max="127" 
                    .value=${this.ccValues.get(2) || 0} 
                    @input=${(e: Event) => this.handleSliderInput(e, 2)}>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mapped Active Shape Grid Matrix -->
        <div class="matrix-panel">
          <div class="matrix-title">Decks Geometric Matrix Projection (CC Map)</div>
          <div class="matrix-grid">
            ${Array.from({ length: 16 }).map((_, i) => {
              const val = this.ccValues.get(i) || 0;
              const color = PRESET_COLORS[i % PRESET_COLORS.length];
              const mappedType = SHAPE_TYPES[i % SHAPE_TYPES.length];
              
              // Scale calculation for preview shape
              const sizeFactor = 0.5 + (val / 127) * 0.5;

              const styleProps: Record<string, string> = {
                transform: `scale(${sizeFactor}) rotate(${(val / 127) * 180}deg)`,
                opacity: val > 0 ? '1' : '0.3',
              };

              if (mappedType === 'triangle') {
                styleProps['border-left'] = '10px solid transparent';
                styleProps['border-right'] = '10px solid transparent';
                styleProps['border-bottom'] = `16px solid ${color}`;
                styleProps['width'] = '0';
                styleProps['height'] = '0';
                styleProps['background'] = 'transparent';
              } else if (mappedType === 'star') {
                styleProps['clip-path'] = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                styleProps['background'] = color;
              } else if (mappedType === 'pill') {
                styleProps['border-radius'] = '99px';
                styleProps['background'] = color;
                styleProps['width'] = '22px';
                styleProps['height'] = '12px';
              } else {
                styleProps['background'] = color;
                if (mappedType === 'circle') styleProps['border-radius'] = '50%';
                if (mappedType === 'diamond') styleProps['transform'] = `scale(${sizeFactor}) rotate(${45 + (val / 127) * 180}deg)`;
                if (mappedType === 'square') styleProps['border-radius'] = '3px';
              }

              if (val > 0) {
                styleProps['box-shadow'] = `0 0 10px ${color}`;
              }

              return html`
                <div class="matrix-cell">
                  <div class="matrix-shape-indicator" style=${styleMap(styleProps)}></div>
                  <div class="matrix-cell-title">CC: ${i}</div>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'midi-visualizer': MidiVisualizer;
  }
}
