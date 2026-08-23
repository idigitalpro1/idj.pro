/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { AudioTrackInfo, ControlChange, ElementType, IDproiPreset } from '../types';
import { MultiTrackEngine, TRACK_COLORS } from '../utils/MultiTrackEngine';
import type { MidiDispatcher } from '../utils/MidiDispatcher';

@customElement('multi-track-mixer')
export class MultiTrackMixer extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1200px;
      margin: 24px auto;
      font-family: 'Google Sans', system-ui, -apple-system, sans-serif;
      color: #ffffff;
      box-sizing: border-box;
      user-select: none;
    }

    .mixer-shell {
      background: rgba(18, 18, 24, 0.85);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Header & Action Bar */
    .mixer-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 16px;
    }

    .title-area h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #ffffff 40%, #a0a0b0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .title-area p {
      margin: 4px 0 0 0;
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .header-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    .btn {
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-primary {
      background: linear-gradient(135deg, #9900ff, #5200ff);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 14px rgba(153, 0, 255, 0.35);
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #b026ff, #6a1aff);
      box-shadow: 0 6px 18px rgba(153, 0, 255, 0.5);
    }

    .btn-accent {
      background: linear-gradient(135deg, #2af6de, #00bfa5);
      color: #0b141a;
      border-color: transparent;
      font-weight: 700;
    }

    .btn-accent:hover {
      background: linear-gradient(135deg, #4ef8e4, #00d9bc);
    }

    /* Master Transport Bar */
    .transport-bar {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 12px 18px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .transport-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .play-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3dffab;
      color: #0b1c14;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 16px rgba(61, 255, 171, 0.4);
      transition: all 0.15s ease;
    }

    .play-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 0 22px rgba(61, 255, 171, 0.6);
    }

    .play-btn.playing {
      background: #ffdd28;
      box-shadow: 0 0 16px rgba(255, 221, 40, 0.4);
    }

    .timeline-container {
      flex: 1;
      min-width: 200px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .timeline-track {
      position: relative;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      cursor: pointer;
      overflow: hidden;
    }

    .timeline-fill {
      height: 100%;
      background: linear-gradient(90deg, #2af6de, #ff25f6);
      border-radius: 4px;
      transition: width 0.05s linear;
    }

    .time-readout {
      display: flex;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .master-visualizer-canvas {
      width: 140px;
      height: 36px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Upload & Dropzone Banner */
    .dropzone {
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .dropzone:hover,
    .dropzone.dragover {
      border-color: #2af6de;
      background: rgba(42, 246, 222, 0.05);
      box-shadow: 0 0 20px rgba(42, 246, 222, 0.1);
    }

    .dropzone-icon {
      width: 32px;
      height: 32px;
      fill: #2af6de;
    }

    .dropzone-text {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .dropzone-hint {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
    }

    /* Track Channels Console */
    .channels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
    }

    .channel-strip {
      background: rgba(24, 24, 32, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .channel-strip.muted {
      opacity: 0.55;
    }

    .channel-strip.solo {
      border-color: #ffdd28;
      box-shadow: 0 0 16px rgba(255, 221, 40, 0.2);
    }

    .channel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 8px;
    }

    .channel-index-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      color: #000;
    }

    .channel-name {
      font-size: 0.8125rem;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .delete-track-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      font-size: 0.875rem;
      line-height: 1;
    }

    .delete-track-btn:hover {
      color: #ff4d4f;
      background: rgba(255, 77, 79, 0.1);
    }

    /* Waveform / Visualizer thumbnail */
    .track-waveform-canvas {
      width: 100%;
      height: 38px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    /* Element Isolation Selector */
    .element-select-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .control-label {
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(255, 255, 255, 0.45);
      display: flex;
      justify-content: space-between;
    }

    .element-select {
      background: #121216;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 5px 8px;
      font-family: inherit;
      font-size: 0.75rem;
      outline: none;
      cursor: pointer;
    }

    .element-select:focus {
      border-color: #2af6de;
    }

    /* Equalizer Mini Sliders */
    .eq-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: rgba(0, 0, 0, 0.25);
      padding: 8px 6px;
      border-radius: 6px;
    }

    .eq-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .eq-label {
      font-size: 0.625rem;
      color: rgba(255, 255, 255, 0.4);
      font-family: 'JetBrains Mono', monospace;
    }

    .eq-slider {
      width: 100%;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      outline: none;
    }

    .eq-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #2af6de;
      cursor: pointer;
    }

    /* Fader & Pan Controls */
    .fader-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .fader-slider {
      flex: 1;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      outline: none;
    }

    .fader-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ffffff;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
    }

    .slider-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.7);
      width: 38px;
      text-align: right;
    }

    /* Mute / Solo Button Group */
    .channel-toggles {
      display: flex;
      gap: 6px;
    }

    .toggle-btn {
      flex: 1;
      padding: 4px;
      font-size: 0.6875rem;
      font-weight: 700;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      text-align: center;
      transition: all 0.12s ease;
    }

    .toggle-btn.active-mute {
      background: #ff4d4f;
      color: #ffffff;
      border-color: #ff4d4f;
      box-shadow: 0 0 10px rgba(255, 77, 79, 0.4);
    }

    .toggle-btn.active-solo {
      background: #ffdd28;
      color: #000000;
      border-color: #ffdd28;
      box-shadow: 0 0 10px rgba(255, 221, 40, 0.4);
    }

    .midi-badge {
      font-size: 0.625rem;
      font-family: 'JetBrains Mono', monospace;
      color: #2af6de;
      background: rgba(42, 246, 222, 0.1);
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid rgba(42, 246, 222, 0.2);
    }

    /* iDproi.com Mixdown Mastering Module */
    .idproi-mastering-panel {
      background: linear-gradient(135deg, rgba(34, 18, 54, 0.85) 0%, rgba(18, 22, 40, 0.85) 100%);
      border: 1px solid rgba(153, 0, 255, 0.35);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 12px 30px rgba(153, 0, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      position: relative;
      overflow: hidden;
    }

    .idproi-mastering-panel::before {
      content: '';
      position: absolute;
      top: -50px;
      right: -50px;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(153, 0, 255, 0.25) 0%, transparent 70%);
      pointer-events: none;
    }

    .idproi-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .idproi-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .idproi-logo-badge {
      background: linear-gradient(135deg, #ff25f6, #9900ff);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
      box-shadow: 0 0 12px rgba(255, 37, 246, 0.4);
    }

    .idproi-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .idproi-subtitle {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .mastering-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      transition: background 0.2s ease;
    }

    .toggle-switch.active {
      background: #3dffab;
      box-shadow: 0 0 12px rgba(61, 255, 171, 0.5);
    }

    .toggle-knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      background: #ffffff;
      border-radius: 50%;
      transition: transform 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .toggle-switch.active .toggle-knob {
      transform: translateX(20px);
    }

    .idproi-controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      align-items: center;
    }

    .preset-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .preset-chip {
      font-family: inherit;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 5px 9px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .preset-chip:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .preset-chip.active {
      background: linear-gradient(135deg, #ff25f6, #9900ff);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 2px 10px rgba(153, 0, 255, 0.4);
    }

    .dsp-feature-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .dsp-tag {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dsp-tag::before {
      content: '✓';
      color: #3dffab;
      font-weight: bold;
    }
  `;

  @property({ type: Object }) midiDispatcher: MidiDispatcher | null = null;

  @state() private engine: MultiTrackEngine = new MultiTrackEngine();
  @state() private tracks: AudioTrackInfo[] = [];
  @state() private isPlaying = false;
  @state() private currentTime = 0;
  @state() private totalDuration = 0;
  @state() private isExporting = false;
  @state() private exportMessage = '';
  @state() private isDraggingOver = false;

  private visualizerCanvas: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.setupEngineListeners();
    this.setupMidiListener();
    window.addEventListener('import-to-mix-lab', this.handleExternalImport as EventListener);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.teardownMidiListener();
    window.removeEventListener('import-to-mix-lab', this.handleExternalImport as EventListener);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private handleExternalImport = (e: CustomEvent<{ audioBuffer: AudioBuffer; name?: string; title?: string; elementType?: ElementType }>) => {
    const { audioBuffer, name, title, elementType } = e.detail;
    if (audioBuffer) {
      this.importTrackFromBuffer(audioBuffer, name || title || 'AI Gen Stem', elementType || 'melody');
    }
  };

  public importTrackFromBuffer(
    audioBuffer: AudioBuffer,
    name: string,
    elementType: ElementType = 'melody'
  ) {
    if (this.tracks.length >= 5) {
      this.tracks = this.tracks.slice(0, 4);
    }

    const trackIndex = this.tracks.length;
    const newTrack: AudioTrackInfo = {
      id: `ai-imported-${Date.now()}-${trackIndex}`,
      name: name || `AI Stem Track 0${trackIndex + 1}`,
      audioBuffer,
      duration: audioBuffer.duration,
      volume: 0.9,
      pan: trackIndex === 1 ? -0.2 : trackIndex === 2 ? 0.2 : 0,
      muted: false,
      solo: false,
      lowGain: 0,
      midGain: 0,
      highGain: 1,
      elementType,
      filterCutoff: 1000,
      playbackRate: 1.0,
      color: TRACK_COLORS[trackIndex % TRACK_COLORS.length],
      midiCcVolume: trackIndex,
      midiCcPan: trackIndex + 5,
    };

    this.tracks = [...this.tracks, newTrack];
    this.engine.registerTrack(newTrack);
    this.dispatchToast(`⚡ Auto-Imported "${newTrack.name}" into Mix Lab Channel 0${trackIndex + 1}!`);
    this.requestUpdate();
  }

  override firstUpdated() {
    this.startVisualizerLoop();
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('midiDispatcher')) {
      this.teardownMidiListener();
      this.setupMidiListener();
    }
  }

  private setupEngineListeners() {
    this.engine.addEventListener('playback-state', (e: any) => {
      this.isPlaying = e.detail.isPlaying;
      this.requestUpdate();
    });

    this.engine.addEventListener('time-updated', (e: any) => {
      this.currentTime = e.detail.time;
      this.totalDuration = this.engine.totalDuration;
      this.requestUpdate();
    });

    this.engine.addEventListener('idproi-updated', () => {
      this.requestUpdate();
    });
  }

  private setupMidiListener() {
    if (!this.midiDispatcher) return;
    this.midiDispatcher.addEventListener('cc-message', this.handleMidiCc as EventListener);
  }

  private teardownMidiListener() {
    if (!this.midiDispatcher) return;
    this.midiDispatcher.removeEventListener('cc-message', this.handleMidiCc as EventListener);
  }

  private handleMidiCc = (e: CustomEvent<ControlChange>) => {
    const { cc, value } = e.detail;
    // Map CC 0-4 to Track Volumes
    if (cc >= 0 && cc < 5 && cc < this.tracks.length) {
      const normVal = (value / 127) * 1.5;
      this.updateTrack(this.tracks[cc].id, { volume: normVal });
    }
    // Map CC 5-9 to Track Pans
    else if (cc >= 5 && cc < 10 && cc - 5 < this.tracks.length) {
      const panVal = (value / 127) * 2 - 1; // -1 to +1
      this.updateTrack(this.tracks[cc - 5].id, { pan: panVal });
    }
    // Map CC 10 to iDproi Intensity
    else if (cc === 10) {
      const intensity = Math.round((value / 127) * 100);
      this.engine.idproiConfig.intensity = intensity;
      this.engine.applyIDproiConfig(this.engine.idproiConfig);
      this.requestUpdate();
    }
  };

  private startVisualizerLoop() {
    const canvas = this.shadowRoot?.querySelector('#master-spectrum') as HTMLCanvasElement;
    if (canvas) {
      this.visualizerCanvas = canvas;
      this.canvasCtx = canvas.getContext('2d');
    }

    const freqData = new Uint8Array(64);

    const render = () => {
      if (this.canvasCtx && this.visualizerCanvas) {
        this.engine.getMasterFrequencyData(freqData);
        const ctx = this.canvasCtx;
        const width = this.visualizerCanvas.width;
        const height = this.visualizerCanvas.height;

        ctx.clearRect(0, 0, width, height);

        const barWidth = width / freqData.length;
        for (let i = 0; i < freqData.length; i++) {
          const barHeight = (freqData[i] / 255) * height;
          const hue = (i / freqData.length) * 280 + 160;
          ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }
      }
      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  // Handle Multi-file upload (up to 5 tracks)
  private async handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.processUploadedFiles(Array.from(input.files));
    input.value = '';
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDraggingOver = true;
  }

  private handleDragLeave() {
    this.isDraggingOver = false;
  }

  private async handleDrop(e: DragEvent) {
    e.preventDefault();
    this.isDraggingOver = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      await this.processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  }

  private async processUploadedFiles(files: File[]) {
    // Limit to up to 5 tracks total
    const remainingSlots = 5 - this.tracks.length;
    if (remainingSlots <= 0) {
      this.dispatchToast('Maximum of 5 audio tracks supported.');
      return;
    }

    const filesToLoad = files.slice(0, remainingSlots);
    for (let i = 0; i < filesToLoad.length; i++) {
      const file = filesToLoad[i];
      try {
        const audioBuffer = await this.engine.decodeAudioFile(file);
        const trackIndex = this.tracks.length;
        const newTrack: AudioTrackInfo = {
          id: `track-${Date.now()}-${trackIndex}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          audioBuffer,
          duration: audioBuffer.duration,
          volume: 0.9,
          pan: 0,
          muted: false,
          solo: false,
          lowGain: 0,
          midGain: 0,
          highGain: 0,
          elementType: 'full',
          filterCutoff: 1000,
          playbackRate: 1.0,
          color: TRACK_COLORS[trackIndex % TRACK_COLORS.length],
          midiCcVolume: trackIndex,
          midiCcPan: trackIndex + 5,
        };

        this.tracks = [...this.tracks, newTrack];
        this.engine.registerTrack(newTrack);
      } catch (err: any) {
        this.dispatchToast(`Failed to load ${file.name}: ${err?.message}`);
      }
    }

    this.dispatchToast(`Loaded ${filesToLoad.length} track(s) into mixer.`);
  }

  private async loadDemoStems() {
    try {
      this.dispatchToast('Synthesizing 5-element demo stems...');
      const buffers = await this.engine.generateDemoStems();
      const stemNames = [
        '01 • Kick & Snare Drums',
        '02 • 808 Sub-Bassline',
        '03 • Lush Synth Chords',
        '04 • Arpeggiator Lead',
        '05 • Ambient Vocal Shimmer',
      ];
      const elementTypes: ElementType[] = ['drums', 'bass', 'melody', 'melody', 'ambient'];

      const newTracks: AudioTrackInfo[] = buffers.map((buf, idx) => ({
        id: `demo-stem-${idx}`,
        name: stemNames[idx],
        audioBuffer: buf,
        duration: buf.duration,
        volume: 0.85,
        pan: idx === 2 ? -0.2 : idx === 3 ? 0.25 : 0,
        muted: false,
        solo: false,
        lowGain: idx === 1 ? 3 : 0,
        midGain: 0,
        highGain: idx === 3 || idx === 4 ? 2 : 0,
        elementType: elementTypes[idx],
        filterCutoff: 1000,
        playbackRate: 1.0,
        color: TRACK_COLORS[idx % TRACK_COLORS.length],
        midiCcVolume: idx,
        midiCcPan: idx + 5,
      }));

      this.tracks = newTracks;
      newTracks.forEach((t) => this.engine.registerTrack(t));
      this.dispatchToast('5 Demo Stems loaded! Ready to mix with iDproi.com mastering.');
    } catch (err: any) {
      this.dispatchToast(`Error generating demo stems: ${err?.message}`);
    }
  }

  private updateTrack(trackId: string, updates: Partial<AudioTrackInfo>) {
    this.tracks = this.tracks.map((t) => {
      if (t.id === trackId) {
        const updated = { ...t, ...updates };
        this.engine.updateTrackParameters(updated);
        return updated;
      }
      return t;
    });
  }

  private toggleMute(trackId: string) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track) return;
    this.updateTrack(trackId, { muted: !track.muted });
  }

  private toggleSolo(trackId: string) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const newSolo = !track.solo;

    this.tracks = this.tracks.map((t) => {
      if (t.id === trackId) {
        const updated = { ...t, solo: newSolo, muted: false };
        this.engine.updateTrackParameters(updated);
        return updated;
      } else {
        const updated = { ...t, muted: newSolo ? true : false };
        this.engine.updateTrackParameters(updated);
        return updated;
      }
    });
  }

  private deleteTrack(trackId: string) {
    this.tracks = this.tracks.filter((t) => t.id !== trackId);
    if (this.tracks.length === 0) {
      this.engine.stop();
    }
  }

  private clearAllTracks() {
    this.engine.stop();
    this.tracks = [];
    this.dispatchToast('Cleared all tracks.');
  }

  private togglePlayPause() {
    if (this.tracks.length === 0) {
      this.dispatchToast('Please upload or load tracks first.');
      return;
    }

    if (this.isPlaying) {
      this.engine.pause();
    } else {
      this.engine.playAll(this.tracks, this.currentTime);
    }
  }

  private handleTimelineSeek(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = pos * this.engine.totalDuration;
    this.engine.seek(this.tracks, seekTime);
  }

  private toggleIDproiMixdown() {
    this.engine.idproiConfig.enabled = !this.engine.idproiConfig.enabled;
    this.engine.applyIDproiConfig(this.engine.idproiConfig);
    this.requestUpdate();
    this.dispatchToast(
      this.engine.idproiConfig.enabled ? 'iDproi.com Mixdown Mastering Activated' : 'iDproi.com Mixdown Bypassed'
    );
  }

  private selectPreset(preset: IDproiPreset) {
    this.engine.applyIDproiPreset(preset);
  }

  private handleIntensityChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    this.engine.idproiConfig.intensity = val;
    this.engine.applyIDproiConfig(this.engine.idproiConfig);
    this.requestUpdate();
  }

  private async exportMixdown() {
    if (this.tracks.length === 0) {
      this.dispatchToast('No audio tracks to export.');
      return;
    }

    try {
      this.isExporting = true;
      this.exportMessage = 'Rendering high-res iDproi.com mixdown...';
      const blob = await this.engine.exportMixdownWav(this.tracks);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iDproi_Mixdown_${new Date().toISOString().slice(0, 10)}.wav`;
      a.click();
      URL.revokeObjectURL(url);

      this.exportMessage = 'Export Complete!';
      this.dispatchToast('Mixdown exported successfully!');
    } catch (err: any) {
      this.dispatchToast(`Export failed: ${err?.message}`);
    } finally {
      this.isExporting = false;
    }
  }

  private dispatchToast(message: string) {
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: message,
        bubbles: true,
        composed: true,
      })
    );
  }

  private formatTime(secs: number): string {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  override render() {
    const idproi = this.engine.idproiConfig;
    const progressPercent = this.totalDuration > 0 ? (this.currentTime / this.totalDuration) * 100 : 0;

    return html`
      <div class="mixer-shell" id="multitrack-mixer-container">
        <!-- Header -->
        <div class="mixer-header">
          <div class="title-area">
            <h2>
              <svg style="width: 24px; height: 24px; fill: #2af6de;" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
              Multi-Track Studio Mixer
            </h2>
            <p>
              Upload up to 5 audio tracks, isolate & shape individual frequency elements, and master with the signature iDproi.com mixdown engine.
            </p>
          </div>

          <div class="header-actions">
            <button class="btn" @click=${this.loadDemoStems} title="Load 5 synthesized audio stems">
              <svg style="width: 14px; height: 14px; fill: #ffdd28;" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              <span>Load 5 Demo Stems</span>
            </button>

            <label class="btn btn-primary" title="Upload up to 5 audio tracks (.mp3, .wav, .aac, .ogg)">
              <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              <span>Upload Tracks (${this.tracks.length}/5)</span>
              <input
                type="file"
                accept="audio/*"
                multiple
                style="display: none;"
                @change=${this.handleFileInput}
              />
            </label>

            ${this.tracks.length > 0
              ? html`
                  <button class="btn" @click=${this.clearAllTracks} title="Clear all mixer tracks">
                    <span>Clear</span>
                  </button>
                `
              : ''}
          </div>
        </div>

        <!-- Master Transport Bar -->
        <div class="transport-bar">
          <div class="transport-controls">
            <button
              class="play-btn ${this.isPlaying ? 'playing' : ''}"
              @click=${this.togglePlayPause}
              title="${this.isPlaying ? 'Pause' : 'Play All'}"
            >
              ${this.isPlaying
                ? html`
                    <svg style="width: 18px; height: 18px; fill: currentColor;" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  `
                : html`
                    <svg style="width: 18px; height: 18px; fill: currentColor;" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  `}
            </button>
            <button class="btn" style="padding: 6px 10px;" @click=${() => this.engine.stop()} title="Stop and rewind">
              <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z"/>
              </svg>
            </button>
          </div>

          <div class="timeline-container">
            <div class="timeline-track" @click=${this.handleTimelineSeek}>
              <div class="timeline-fill" style="width: ${progressPercent}%;"></div>
            </div>
            <div class="time-readout">
              <span>${this.formatTime(this.currentTime)}</span>
              <span>${this.formatTime(this.totalDuration)}</span>
            </div>
          </div>

          <canvas id="master-spectrum" class="master-visualizer-canvas" width="140" height="36"></canvas>

          <button
            class="btn btn-accent"
            @click=${this.exportMixdown}
            ?disabled=${this.isExporting || this.tracks.length === 0}
            title="Render and download master mixdown WAV"
          >
            <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
            </svg>
            <span>${this.isExporting ? 'Exporting...' : 'Export iDproi Mixdown'}</span>
          </button>
        </div>

        <!-- iDproi.com Signature Mixdown Mastering Strip -->
        <div class="idproi-mastering-panel">
          <div class="idproi-header">
            <div class="idproi-brand">
              <span class="idproi-logo-badge">iDproi.com</span>
              <div>
                <div class="idproi-title">
                  <span>Signature Mixdown DSP Engine</span>
                </div>
                <div class="idproi-subtitle">
                  Multi-band harmonic exciter, analog warmth saturator, stereo air & brickwall peak limiter
                </div>
              </div>
            </div>

            <div class="mastering-toggle" @click=${this.toggleIDproiMixdown} title="Toggle iDproi Mixdown Mastering">
              <span style="font-size: 0.8125rem; font-weight: 600; color: ${idproi.enabled ? '#3dffab' : 'rgba(255,255,255,0.4)'}">
                ${idproi.enabled ? 'MASTER ACTIVE' : 'BYPASSED'}
              </span>
              <div class="toggle-switch ${idproi.enabled ? 'active' : ''}">
                <div class="toggle-knob"></div>
              </div>
            </div>
          </div>

          <div class="idproi-controls-grid">
            <div>
              <div class="control-label" style="margin-bottom: 6px;">
                <span>Mastering Profile</span>
              </div>
              <div class="preset-chips">
                <button
                  class="preset-chip ${idproi.preset === 'signature' ? 'active' : ''}"
                  @click=${() => this.selectPreset('signature')}
                >
                  Signature
                </button>
                <button
                  class="preset-chip ${idproi.preset === 'club_punch' ? 'active' : ''}"
                  @click=${() => this.selectPreset('club_punch')}
                >
                  Club Punch
                </button>
                <button
                  class="preset-chip ${idproi.preset === 'radio_clarity' ? 'active' : ''}"
                  @click=${() => this.selectPreset('radio_clarity')}
                >
                  Radio Clarity
                </button>
                <button
                  class="preset-chip ${idproi.preset === 'tape_warmth' ? 'active' : ''}"
                  @click=${() => this.selectPreset('tape_warmth')}
                >
                  Tape Warmth
                </button>
                <button
                  class="preset-chip ${idproi.preset === 'spatial_air' ? 'active' : ''}"
                  @click=${() => this.selectPreset('spatial_air')}
                >
                  Spatial Air
                </button>
                <button
                  class="preset-chip ${idproi.preset === 'bass_maximizer' ? 'active' : ''}"
                  @click=${() => this.selectPreset('bass_maximizer')}
                >
                  Bass Max
                </button>
              </div>
            </div>

            <div>
              <div class="control-label">
                <span>Mixdown Intensity</span>
                <span class="midi-badge">MIDI CC:10</span>
                <span>${idproi.intensity}%</span>
              </div>
              <div class="slider-row">
                <input
                  type="range"
                  class="fader-slider"
                  min="0"
                  max="100"
                  .value=${idproi.intensity}
                  @input=${this.handleIntensityChange}
                />
              </div>
            </div>
          </div>

          <div class="dsp-feature-list">
            <span class="dsp-tag">75Hz Sub-Bass Punch</span>
            <span class="dsp-tag">12kHz Silky Air</span>
            <span class="dsp-tag">Analog Tube Saturation</span>
            <span class="dsp-tag">Stereo Field Maximizer</span>
            <span class="dsp-tag">-0.3dB True Peak Limiter</span>
          </div>
        </div>

        <!-- Drag & Drop Zone if fewer than 5 tracks -->
        ${this.tracks.length === 0
          ? html`
              <div
                class="dropzone ${this.isDraggingOver ? 'dragover' : ''}"
                @dragover=${this.handleDragOver}
                @dragleave=${this.handleDragLeave}
                @drop=${this.handleDrop}
                @click=${() => (this.shadowRoot?.querySelector('input[type=file]') as HTMLInputElement)?.click()}
              >
                <svg class="dropzone-icon" viewBox="0 0 24 24">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
                <div class="dropzone-text">Drag & drop up to 5 audio tracks here, or click to browse</div>
                <div class="dropzone-hint">Supports MP3, WAV, AAC, OGG, and FLAC stems (or click "Load 5 Demo Stems" above)</div>
              </div>
            `
          : ''}

        <!-- 5-Channel Mixer Console Grid -->
        <div class="channels-grid">
          ${this.tracks.map((track, idx) => {
            const level = this.engine.getTrackAudioLevel(track.id);
            const levelPercent = Math.min(100, Math.round(level * 180));

            return html`
              <div class="channel-strip ${track.muted ? 'muted' : ''} ${track.solo ? 'solo' : ''}">
                <div class="channel-header">
                  <span class="channel-index-badge" style="background: ${track.color};">
                    TRK ${idx + 1}
                  </span>
                  <span class="channel-name" title="${track.name}">${track.name}</span>
                  <button class="delete-track-btn" @click=${() => this.deleteTrack(track.id)} title="Remove track">
                    ✕
                  </button>
                </div>

                <!-- Element Isolation Filter -->
                <div class="element-select-container">
                  <div class="control-label">
                    <span>Element Shape</span>
                  </div>
                  <select
                    class="element-select"
                    .value=${track.elementType}
                    @change=${(e: Event) =>
                      this.updateTrack(track.id, {
                        elementType: (e.target as HTMLSelectElement).value as ElementType,
                      })}
                  >
                    <option value="full">Full Frequency Mix</option>
                    <option value="drums">Drums (Punch Low-pass)</option>
                    <option value="bass">Bass / 808 (Sub isolate)</option>
                    <option value="melody">Melody / Synth (Bandpass)</option>
                    <option value="vocal">Vocals (Air presence)</option>
                    <option value="ambient">Ambience / FX (Highpass)</option>
                  </select>
                </div>

                <!-- 3-Band Parametric EQ -->
                <div class="element-select-container">
                  <div class="control-label">
                    <span>3-Band EQ</span>
                  </div>
                  <div class="eq-grid">
                    <div class="eq-col">
                      <span class="eq-label">LOW</span>
                      <input
                        type="range"
                        class="eq-slider"
                        min="-18"
                        max="12"
                        .value=${track.lowGain}
                        @input=${(e: Event) =>
                          this.updateTrack(track.id, {
                            lowGain: parseFloat((e.target as HTMLInputElement).value),
                          })}
                      />
                    </div>
                    <div class="eq-col">
                      <span class="eq-label">MID</span>
                      <input
                        type="range"
                        class="eq-slider"
                        min="-18"
                        max="12"
                        .value=${track.midGain}
                        @input=${(e: Event) =>
                          this.updateTrack(track.id, {
                            midGain: parseFloat((e.target as HTMLInputElement).value),
                          })}
                      />
                    </div>
                    <div class="eq-col">
                      <span class="eq-label">HIGH</span>
                      <input
                        type="range"
                        class="eq-slider"
                        min="-18"
                        max="12"
                        .value=${track.highGain}
                        @input=${(e: Event) =>
                          this.updateTrack(track.id, {
                            highGain: parseFloat((e.target as HTMLInputElement).value),
                          })}
                      />
                    </div>
                  </div>
                </div>

                <!-- Volume & Pan Faders with MIDI CC Badges -->
                <div class="fader-section">
                  <div class="control-label">
                    <span>Volume</span>
                    <span class="midi-badge">CC:${track.midiCcVolume}</span>
                    <span>${Math.round(track.volume * 100)}%</span>
                  </div>
                  <div class="slider-row">
                    <input
                      type="range"
                      class="fader-slider"
                      min="0"
                      max="1.5"
                      step="0.01"
                      .value=${track.volume}
                      @input=${(e: Event) =>
                        this.updateTrack(track.id, {
                          volume: parseFloat((e.target as HTMLInputElement).value),
                        })}
                    />
                  </div>

                  <div class="control-label" style="margin-top: 4px;">
                    <span>Stereo Pan</span>
                    <span class="midi-badge">CC:${track.midiCcPan}</span>
                    <span>${track.pan < -0.05 ? `${Math.round(Math.abs(track.pan) * 100)}% L` : track.pan > 0.05 ? `${Math.round(track.pan * 100)}% R` : 'Center'}</span>
                  </div>
                  <div class="slider-row">
                    <input
                      type="range"
                      class="fader-slider"
                      min="-1"
                      max="1"
                      step="0.02"
                      .value=${track.pan}
                      @input=${(e: Event) =>
                        this.updateTrack(track.id, {
                          pan: parseFloat((e.target as HTMLInputElement).value),
                        })}
                    />
                  </div>
                </div>

                <!-- Mute & Solo Buttons -->
                <div class="channel-toggles">
                  <button
                    class="toggle-btn ${track.muted ? 'active-mute' : ''}"
                    @click=${() => this.toggleMute(track.id)}
                    title="Mute track"
                  >
                    MUTE
                  </button>
                  <button
                    class="toggle-btn ${track.solo ? 'active-solo' : ''}"
                    @click=${() => this.toggleSolo(track.id)}
                    title="Solo track"
                  >
                    SOLO
                  </button>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'multi-track-mixer': MultiTrackMixer;
  }
}
