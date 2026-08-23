/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DeckTrackState, StreamRecentTrack } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

export const RECENT_STREAM_TRACKS: StreamRecentTrack[] = [
  {
    id: 'stream-1',
    title: 'Bossa Nova Sunset Chill',
    artist: 'Lyria AI Realtime Gen',
    genre: 'Bossa Nova / Lounge',
    source: 'ai_gen',
    duration: '3:20',
    bpm: 118,
    key: '5A',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
    plays: 1420,
    stemsAvailable: true,
  },
  {
    id: 'stream-2',
    title: 'Cyberpunk Drum & Bass Assault',
    artist: 'iDpro Audio Hijack Lab',
    genre: 'Drum and Bass',
    source: 'hijack',
    duration: '3:45',
    bpm: 174,
    key: '9A',
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&auto=format&fit=crop&q=80',
    plays: 2890,
    stemsAvailable: true,
  },
  {
    id: 'stream-3',
    title: 'Sparkling Arpeggios & Deep 808',
    artist: 'Lyria AI Engine',
    genre: 'Chillwave',
    source: 'ai_gen',
    duration: '2:50',
    bpm: 126,
    key: '8B',
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=100&auto=format&fit=crop&q=80',
    plays: 980,
    stemsAvailable: true,
  },
  {
    id: 'stream-4',
    title: 'Parisian French Touch Filter',
    artist: 'iDpro Studio Session',
    genre: 'Funk / Nu-Disco',
    source: 'spotify',
    duration: '3:15',
    bpm: 122,
    key: '7A',
    coverArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=100&auto=format&fit=crop&q=80',
    plays: 3410,
    stemsAvailable: true,
  },
  {
    id: 'stream-5',
    title: 'Berlin Acid 303 Modular',
    artist: 'iDpro Virtual Deck VIP',
    genre: 'Industrial Acid',
    source: 'file',
    duration: '4:10',
    bpm: 132,
    key: '1A',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80',
    plays: 4120,
    stemsAvailable: true,
  },
  {
    id: 'stream-6',
    title: 'Neo Soul Lush Rhodes Session',
    artist: 'Lyria AI Realtime Gen',
    genre: 'Neo Soul',
    source: 'ai_gen',
    duration: '3:05',
    bpm: 95,
    key: '4A',
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&auto=format&fit=crop&q=80',
    plays: 1750,
    stemsAvailable: true,
  },
];

@customElement('recent-tracks-slider')
export class RecentTracksSlider extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      background: rgba(12, 12, 18, 0.92);
      backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.6);
      padding: 6px 16px;
    }

    .slider-container {
      display: flex;
      align-items: center;
      gap: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .drawer-toggle {
      border: 0;
      background: transparent;
      color: #fff;
      padding: 7px 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      font: inherit;
      cursor: pointer;
      white-space: nowrap;
    }

    .drawer-hint {
      color: rgba(255, 255, 255, 0.45);
      font-size: 0.68rem;
      font-weight: 700;
    }

    .slider-label-group {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      padding-right: 12px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .live-pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff25f6;
      box-shadow: 0 0 8px #ff25f6;
      animation: pulse 1.2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }

    .slider-title {
      font-size: 0.75rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Track Cards Carousel */
    .tracks-marquee {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      scroll-behavior: smooth;
      scrollbar-width: none;
      padding: 4px 0;
      flex: 1;
    }

    .tracks-marquee::-webkit-scrollbar {
      display: none;
    }

    .marquee-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 240px;
      max-width: 280px;
      flex-shrink: 0;
      transition: all 0.15s;
    }

    .marquee-card:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .card-thumb {
      width: 38px;
      height: 38px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .card-text-block {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .card-title {
      font-size: 0.75rem;
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-subtitle {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-load-actions {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .mini-load-btn {
      font: inherit;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      transition: all 0.12s;
    }

    .mini-deck-A {
      background: #ff25f6;
      color: #000;
    }

    .mini-deck-A:hover {
      box-shadow: 0 0 8px #ff25f6;
    }

    .mini-deck-B {
      background: #2af6de;
      color: #000;
    }

    .mini-deck-B:hover {
      box-shadow: 0 0 8px #2af6de;
    }

    @media (max-width: 700px) {
      :host {
        bottom: 58px;
        padding-inline: 10px;
      }

      .slider-container.expanded {
        align-items: stretch;
        flex-direction: column;
        gap: 5px;
      }

      .marquee-card {
        min-width: 210px;
      }
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;
  @state() private expanded = false;

  private loadStreamTrackToDeck(deckId: 'A' | 'B', track: StreamRecentTrack) {
    const deckTrack: DeckTrackState = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      source: track.source as any,
      duration: 200,
      bpm: track.bpm,
      key: track.key,
      audioBuffer: null,
      artworkUrl: track.coverArt,
    };

    this.engine.loadTrackToDeck(deckId, deckTrack);
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `Loaded "${track.title}" into Deck ${deckId}!`,
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <div class="slider-container ${this.expanded ? 'expanded' : ''}">
        <button
          class="drawer-toggle"
          @click=${() => (this.expanded = !this.expanded)}
          aria-expanded=${this.expanded}
          title="${this.expanded ? 'Hide' : 'Show'} recent tracks"
        >
          <span class="live-pulse-dot"></span>
          <span class="slider-title">Recent tracks</span>
          <span class="drawer-hint">${this.expanded ? 'Hide ↓' : 'Show ↑'}</span>
        </button>

        ${this.expanded
          ? html`
              <div class="tracks-marquee">
                ${RECENT_STREAM_TRACKS.map(
                  (track) => html`
                    <div class="marquee-card">
                      <img src="${track.coverArt}" alt="${track.title}" class="card-thumb" />
                      <div class="card-text-block">
                        <span class="card-title">${track.title}</span>
                        <span class="card-subtitle">${track.artist} • ${track.bpm} BPM</span>
                      </div>
                      <div class="card-load-actions">
                        <button
                          class="mini-load-btn mini-deck-A"
                          @click=${() => this.loadStreamTrackToDeck('A', track)}
                          title="Load to Deck A"
                        >
                          Deck A
                        </button>
                        <button
                          class="mini-load-btn mini-deck-B"
                          @click=${() => this.loadStreamTrackToDeck('B', track)}
                          title="Load to Deck B"
                        >
                          Deck B
                        </button>
                      </div>
                    </div>
                  `
                )}
              </div>
            `
          : html``}
      </div>
    `;
  }
}
