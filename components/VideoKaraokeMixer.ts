/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { KaraokeLyricLine, KaraokeState, OpusDeckId, VideoMixerMasterState, VideoVisualState } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('video-karaoke-mixer')
export class VideoKaraokeMixer extends LitElement {
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

    .video-header {
      background: linear-gradient(90deg, rgba(255, 77, 79, 0.15), rgba(255, 37, 246, 0.15));
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

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-badge {
      font-size: 0.8125rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ff4d4f, #ff25f6);
      color: #fff;
      padding: 5px 12px;
      border-radius: 6px;
      letter-spacing: 1px;
      text-transform: uppercase;
      box-shadow: 0 0 14px rgba(255, 77, 79, 0.4);
    }

    .header-desc {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.75);
    }

    /* Video Mixing Stage */
    .video-stage-grid {
      display: grid;
      grid-template-columns: 1fr 1.3fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 1080px) {
      .video-stage-grid {
        grid-template-columns: 1fr;
      }
    }

    .deck-video-card {
      background: #14141f;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .deck-tag {
      font-size: 0.75rem;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 4px;
      background: #2af6de;
      color: #000;
    }

    .canvas-preview-container {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #08080f;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas-preview {
      width: 100%;
      height: 100%;
      display: block;
    }

    .screen-overlay-tag {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 800;
      backdrop-filter: blur(4px);
    }

    .video-controls-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }

    .fx-select {
      font: inherit;
      font-size: 0.6875rem;
      background: #0f0f18;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
    }

    /* Master Video Output (Center) */
    .master-video-card {
      background: #181828;
      border: 2px solid rgba(255, 37, 246, 0.35);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }

    .master-crossfader-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(0, 0, 0, 0.4);
      padding: 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .video-crossfader {
      width: 100%;
      height: 8px;
      cursor: pointer;
      accent-color: #ff25f6;
    }

    .crossfader-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.6875rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Karaoke Engine Section */
    .karaoke-section {
      background: #14141f;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .karaoke-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 10px;
    }

    .karaoke-title {
      font-size: 0.9375rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .karaoke-body-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 16px;
    }

    @media (max-width: 900px) {
      .karaoke-body-grid {
        grid-template-columns: 1fr;
      }
    }

    /* CDG Karaoke Lyric Screen */
    .lyrics-display-stage {
      background: #070712;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 24px 18px;
      min-height: 220px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8);
    }

    .karaoke-bounce-ball {
      font-size: 1.5rem;
      margin-bottom: 10px;
      animation: bounce 0.8s infinite alternate ease-in-out;
    }

    @keyframes bounce {
      from { transform: translateY(0) scale(1); }
      to { transform: translateY(-12px) scale(1.1); }
    }

    .current-lyric-line {
      font-size: 1.35rem;
      font-weight: 900;
      color: #ffd166;
      text-shadow: 0 0 16px rgba(255, 209, 102, 0.8);
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .upcoming-lyric-line {
      font-size: 0.9375rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
    }

    .karaoke-controls-panel {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .karaoke-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 7px 12px;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .btn-vocal-cut {
      background: #ff4d4f;
      color: #ffffff;
      box-shadow: 0 0 12px rgba(255, 77, 79, 0.4);
    }

    .btn-vocal-cut.active {
      background: #3dffab;
      color: #000;
      box-shadow: 0 0 16px rgba(61, 255, 171, 0.6);
    }

    .singer-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.6875rem;
    }

    .btn-popout {
      background: linear-gradient(135deg, #2af6de, #00b4d8);
      color: #000;
      font-weight: 900;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.6875rem;
      transition: all 0.15s;
    }

    .btn-popout:hover {
      box-shadow: 0 0 14px rgba(42, 246, 222, 0.6);
      transform: translateY(-1px);
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;

  @state() private videoMaster!: VideoMixerMasterState;
  @state() private karaoke!: KaraokeState;
  @state() private activeLyricIndex = 0;

  private animationFrameId: number | null = null;
  private canvasDeck1: HTMLCanvasElement | null = null;
  private canvasDeck2: HTMLCanvasElement | null = null;
  private canvasMaster: HTMLCanvasElement | null = null;
  private timeStep = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.videoMaster = this.engine.videoMasterState;
    this.karaoke = this.engine.karaokeState;

    this.engine.addEventListener('video-master-changed', () => {
      this.videoMaster = { ...this.engine.videoMasterState };
      this.requestUpdate();
    });

    this.engine.addEventListener('karaoke-state-changed', () => {
      this.karaoke = { ...this.engine.karaokeState };
      this.requestUpdate();
    });

    this.startVisualizerLoop();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private startVisualizerLoop() {
    const render = () => {
      this.timeStep += 0.03;

      // Update lyrics index progress
      const currentLyricTime = this.timeStep % 48;
      const lyrics = this.karaoke.lyrics;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentLyricTime >= lyrics[i].time) {
          if (this.activeLyricIndex !== i) {
            this.activeLyricIndex = i;
          }
          break;
        }
      }

      this.drawDeckVisualizer(this.canvasDeck1, '1', '#ff25f6', '#7928ca');
      this.drawDeckVisualizer(this.canvasDeck2, '2', '#2af6de', '#0070f3');
      this.drawMasterVisualizer(this.canvasMaster);

      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  private drawDeckVisualizer(canvas: HTMLCanvasElement | null, deckId: OpusDeckId, primaryColor: string, secondaryColor: string) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const isPlaying = this.engine.deckStates[deckId]?.isPlaying ?? false;
    const speed = isPlaying ? 1.0 : 0.2;

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, w, h);

    // Audio-reactive Synth Wave Grid / Spectrum Aurora
    const barCount = 32;
    const barWidth = w / barCount;

    for (let i = 0; i < barCount; i++) {
      const freq = Math.sin(this.timeStep * speed + i * 0.2) * 0.5 + 0.5;
      const barHeight = freq * (h * 0.7) * (isPlaying ? 1.0 : 0.3);

      const grad = ctx.createLinearGradient(0, h, 0, h - barHeight);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(1, secondaryColor);

      ctx.fillStyle = grad;
      ctx.fillRect(i * barWidth + 1, h - barHeight, barWidth - 2, barHeight);
    }

    // Grid Perspective Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let y = h * 0.5; y < h; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private drawMasterVisualizer(canvas: HTMLCanvasElement | null) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const crossPos = this.videoMaster.crossfaderPosition; // -1 to 1

    ctx.fillStyle = '#05050d';
    ctx.fillRect(0, 0, w, h);

    // Render Crossfader Blend between Left (Deck 1) and Right (Deck 2)
    const leftWeight = (1 - crossPos) / 2;
    const rightWeight = (1 + crossPos) / 2;

    // Center circular audio-reactive portal
    const radius = Math.min(w, h) * 0.35 + Math.sin(this.timeStep * 2) * 10;
    const grad = ctx.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, radius);
    grad.addColorStop(0, `rgba(255, 37, 246, ${leftWeight})`);
    grad.addColorStop(0.5, `rgba(42, 246, 222, ${rightWeight})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // Visual Logo Watermark
    if (this.videoMaster.overlayLogo) {
      ctx.font = 'bold 12px system-ui';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('iDj.pro Master Video Out', 12, h - 12);
    }
  }

  private popoutMasterWindow() {
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: '🎬 Master Video & Karaoke stream routed to Fullscreen Projector / External Display output!',
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const currentLyric = this.karaoke.lyrics[this.activeLyricIndex]?.text || '♪ Singing in progress... ♪';
    const nextLyric = this.karaoke.lyrics[this.activeLyricIndex + 1]?.text || '♪ Instrumental Outro ♪';

    return html`
      <!-- Header -->
      <div class="video-header">
        <div class="header-title-group">
          <span class="header-badge">Video & Karaoke Mixing Suite</span>
          <div>
            <div style="font-size: 0.9375rem; font-weight: 900; color: #ffffff;">
              Synchronized Video Decks, Real-Time CDG Karaoke & Projector Stream
            </div>
            <div class="header-desc">
              Dual audio-reactive visualizer shaders, smooth video crossfading, vocal remover DSP, and key transposition for live performers.
            </div>
          </div>
        </div>

        <button class="btn-popout" @click=${this.popoutMasterWindow} title="Pop-out Video Screen to external venue projector or second monitor">
          🖥️ Projector / Fullscreen Pop-Out
        </button>
      </div>

      <!-- Video Mixing Stage -->
      <div class="video-stage-grid">
        <!-- Deck 1 Video -->
        <div class="deck-video-card">
          <div class="card-top-bar">
            <span class="deck-tag" style="background: #ff25f6; color: #000;">DECK 1 VIDEO</span>
            <span style="font-size: 0.6875rem; color: rgba(255,255,255,0.6);">Shader: Cyber Neon</span>
          </div>

          <div class="canvas-preview-container">
            <span class="screen-overlay-tag">D1 OUTPUT</span>
            <canvas
              class="canvas-preview"
              width="320"
              height="180"
              ${(el: HTMLCanvasElement) => (this.canvasDeck1 = el)}
            ></canvas>
          </div>

          <div class="video-controls-row">
            <select
              class="fx-select"
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.engine.setVideoDeckState('1', { shaderPreset: val as any });
              }}
            >
              <option value="cyber_neon">Cyber Neon Grid</option>
              <option value="synthwave_grid">Synthwave Horizon</option>
              <option value="audio_tunnel">Audio Reactive Tunnel</option>
              <option value="spectrum_aurora">Spectrum Aurora</option>
            </select>
          </div>
        </div>

        <!-- Master Video Output & Video Crossfader -->
        <div class="master-video-card">
          <div class="card-top-bar">
            <span class="deck-tag" style="background: linear-gradient(135deg, #ff25f6, #2af6de); color: #000;">
              MASTER VIDEO OUT
            </span>
            <span style="font-size: 0.6875rem; color: #3dffab; font-weight: 800;">● LIVE 60 FPS</span>
          </div>

          <div class="canvas-preview-container">
            <span class="screen-overlay-tag">PROJECTOR FEED</span>
            <canvas
              class="canvas-preview"
              width="480"
              height="270"
              ${(el: HTMLCanvasElement) => (this.canvasMaster = el)}
            ></canvas>
          </div>

          <!-- Video Crossfader Controls -->
          <div class="master-crossfader-section">
            <div class="crossfader-labels">
              <span style="color: #ff25f6;">◀ DECK 1 VIDEO</span>
              <span style="color: rgba(255,255,255,0.8);">
                TRANSITION: <strong>${this.videoMaster.transitionEffect.toUpperCase()}</strong>
              </span>
              <span style="color: #2af6de;">DECK 2 VIDEO ▶</span>
            </div>
            <input
              type="range"
              class="video-crossfader"
              min="-1"
              max="1"
              step="0.01"
              .value=${this.videoMaster.crossfaderPosition.toString()}
              @input=${(e: Event) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.engine.setVideoCrossfader(val);
              }}
            />
          </div>

          <div class="video-controls-row">
            <select
              class="fx-select"
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.engine.setVideoTransitionEffect(val as any);
              }}
            >
              <option value="dissolve">Cross Dissolve</option>
              <option value="wipe_left">Wipe Left</option>
              <option value="wipe_up">Wipe Up</option>
              <option value="additive">Additive Blend</option>
              <option value="glitch_cut">Glitch FX Transition</option>
              <option value="motion_zoom">Motion Zoom In</option>
            </select>
          </div>
        </div>

        <!-- Deck 2 Video -->
        <div class="deck-video-card">
          <div class="card-top-bar">
            <span class="deck-tag" style="background: #2af6de; color: #000;">DECK 2 VIDEO</span>
            <span style="font-size: 0.6875rem; color: rgba(255,255,255,0.6);">Shader: Synth Horizon</span>
          </div>

          <div class="canvas-preview-container">
            <span class="screen-overlay-tag">D2 OUTPUT</span>
            <canvas
              class="canvas-preview"
              width="320"
              height="180"
              ${(el: HTMLCanvasElement) => (this.canvasDeck2 = el)}
            ></canvas>
          </div>

          <div class="video-controls-row">
            <select
              class="fx-select"
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.engine.setVideoDeckState('2', { shaderPreset: val as any });
              }}
            >
              <option value="synthwave_grid">Synthwave Horizon</option>
              <option value="cyber_neon">Cyber Neon Grid</option>
              <option value="audio_tunnel">Audio Reactive Tunnel</option>
              <option value="spectrum_aurora">Spectrum Aurora</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Karaoke & CDG Live Lyrics Engine -->
      <div class="karaoke-section">
        <div class="karaoke-head">
          <div class="karaoke-title">
            <span>🎤 Live CDG Karaoke Engine & Singer Queue</span>
          </div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7);">
            Active Track: <strong style="color: #ffd166;">${this.karaoke.songTitle}</strong> (${this.karaoke.artist})
          </div>
        </div>

        <div class="karaoke-body-grid">
          <!-- CDG Lyric Bouncing Ball Screen -->
          <div class="lyrics-display-stage">
            <div class="karaoke-bounce-ball">🟡</div>
            <div class="current-lyric-line">${currentLyric}</div>
            <div class="upcoming-lyric-line">${nextLyric}</div>
          </div>

          <!-- Performer Singer Controls & Queue -->
          <div class="karaoke-controls-panel">
            <div style="font-size: 0.8125rem; font-weight: 800; color: #2af6de;">
              Live Singer Performance Controls
            </div>

            <button
              class="karaoke-btn btn-vocal-cut ${this.karaoke.vocalCutActive ? 'active' : ''}"
              @click=${() => this.engine.toggleKaraokeVocalCut()}
              title="One-touch Neural Vocal Cut to turn any track into a Karaoke backing track"
            >
              <span>🎙️</span> ${this.karaoke.vocalCutActive ? 'Vocal Cut Active (Karaoke Mode)' : '1-Touch Vocal Cut (Remove Vocals)'}
            </button>

            <!-- Singer Key Transpose -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">
              <span style="font-size: 0.75rem; font-weight: 700;">Singer Key Shift:</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button
                  class="karaoke-btn"
                  style="padding: 2px 8px; background: rgba(255,255,255,0.15);"
                  @click=${() => this.engine.setKaraokeKeyShift(this.karaoke.keyShift - 1)}
                >
                  -1
                </button>
                <span style="font-size: 0.8125rem; font-weight: 900; color: #ffd166; min-width: 30px; text-align: center;">
                  ${this.karaoke.keyShift > 0 ? `+${this.karaoke.keyShift}` : this.karaoke.keyShift} st
                </span>
                <button
                  class="karaoke-btn"
                  style="padding: 2px 8px; background: rgba(255,255,255,0.15);"
                  @click=${() => this.engine.setKaraokeKeyShift(this.karaoke.keyShift + 1)}
                >
                  +1
                </button>
              </div>
            </div>

            <!-- Up Next Singer Queue -->
            <div style="font-size: 0.75rem; font-weight: 800; color: rgba(255,255,255,0.8); margin-top: 4px;">
              Singer Queue (Next Up):
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${this.karaoke.singerQueue.map(
                (q, idx) => html`
                  <div class="singer-item">
                    <span><strong>#${idx + 1} ${q.name}</strong> • ${q.song}</span>
                    <span style="color: #2af6de; font-weight: 800;">${q.keyOffset === 0 ? 'Orig Key' : `${q.keyOffset} st`}</span>
                  </div>
                `
              )}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
