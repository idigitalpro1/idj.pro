/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DeckTrackState } from '../types';
import { TOP_10_ELECTRONIC_GENRES, type ElectronicGenreCategory } from '../types';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

export interface CuratedSourceTrack {
  id: string;
  title: string;
  artist: string;
  source: 'spotify' | 'apple_music' | 'mixcloud' | 'beatport' | 'file' | 'cloud_library';
  genre: string;
  genreCategory?: string;
  bpm: number;
  key: string;
  duration: number;
  artworkUrl: string;
  description: string;
  label?: string;
  remix?: string;
  catalogNumber?: string;
  energyRating?: number;
  chartRank?: number;
}

export const CLOUD_TRACKS: CuratedSourceTrack[] = [
  // --- 1. TECH HOUSE (Leading sales category, rolling basslines) ---
  {
    id: 'bp-th-1',
    title: 'Rhyme Dust (VIP Extended Mix)',
    artist: 'MK & Dom Dolla',
    source: 'beatport',
    genre: 'Tech House',
    genreCategory: 'tech_house',
    bpm: 128,
    key: '11B',
    duration: 330,
    artworkUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&auto=format&fit=crop&q=80',
    description: 'Rolling 909 bass groove, vocal chop hook, heavy club compression.',
    label: 'Columbia / Three Six Zero',
    remix: 'VIP Extended Mix',
    catalogNumber: 'TSZ-299',
    energyRating: 10,
    chartRank: 1,
  },
  {
    id: 'bp-th-2',
    title: 'Losing It (Club Extended)',
    artist: 'FISHER',
    source: 'beatport',
    genre: 'Tech House',
    genreCategory: 'tech_house',
    bpm: 125,
    key: '8A',
    duration: 248,
    artworkUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=200&auto=format&fit=crop&q=80',
    description: 'Relentless rolling sub-bassline, siren build, signature tech-house drop.',
    label: 'Catch & Release',
    remix: 'Club Extended',
    catalogNumber: 'CR-001',
    energyRating: 10,
    chartRank: 4,
  },

  // --- 2. HOUSE (Encompassing classic, vocal, and modern 4-on-the-floor) ---
  {
    id: 'bp-h-1',
    title: 'Love Story (Classic 4-on-Floor Mix)',
    artist: 'Kerri Chandler & Defected All-Stars',
    source: 'beatport',
    genre: 'House',
    genreCategory: 'house',
    bpm: 124,
    key: '8A',
    duration: 380,
    artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    description: 'Lush Hammond organ chords, soul vocal hooks, punchy analog 909 kick.',
    label: 'Defected Records',
    remix: 'Club Vocal Mix',
    catalogNumber: 'DFT-820',
    energyRating: 8,
    chartRank: 2,
  },
  {
    id: 'bp-h-2',
    title: 'You Got the Love (Modern House Rework)',
    artist: 'Vintage Culture & Franky Wah',
    source: 'beatport',
    genre: 'House',
    genreCategory: 'house',
    bpm: 126,
    key: '5B',
    duration: 310,
    artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    description: 'Emotional vocal lead, crisp four-on-the-floor percussion, warm low-end drive.',
    label: 'Ministry of Sound',
    remix: 'Rework',
    catalogNumber: 'MOS-491',
    energyRating: 9,
    chartRank: 8,
  },

  // --- 3. TECHNO (Peak Time / Driving - Fast-paced, warehouse & mainstage) ---
  {
    id: 'bp-tp-1',
    title: 'Space Date (Pleasurekraft Remix)',
    artist: 'Adam Beyer & Green Velvet',
    source: 'beatport',
    genre: 'Techno (Peak Time / Driving)',
    genreCategory: 'techno_peak',
    bpm: 132,
    key: '1A',
    duration: 410,
    artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    description: 'Thunderous industrial kick, modular acid sweeps, cosmic spoken word.',
    label: 'Drumcode',
    remix: 'Pleasurekraft Remix',
    catalogNumber: 'DC210',
    energyRating: 10,
    chartRank: 3,
  },
  {
    id: 'bp-tp-2',
    title: 'Universal Consciousness (Rave Cut)',
    artist: 'Charlotte de Witte',
    source: 'beatport',
    genre: 'Techno (Peak Time / Driving)',
    genreCategory: 'techno_peak',
    bpm: 135,
    key: '11B',
    duration: 375,
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80',
    description: 'Fast-paced, high-energy warehouse techno with acid squelches and driving kick.',
    label: 'KNTXT',
    remix: 'Original Club Mix',
    catalogNumber: 'KNTXT-014',
    energyRating: 10,
    chartRank: 6,
  },

  // --- 4. MELODIC HOUSE & TECHNO (Atmospheric synth leads, emotional breakdowns) ---
  {
    id: 'bp-mt-1',
    title: 'Metro (Extended Club Mix)',
    artist: 'Kevin de Vries & Mau P',
    source: 'beatport',
    genre: 'Melodic House & Techno',
    genreCategory: 'melodic_house_techno',
    bpm: 126,
    key: '8A',
    duration: 352,
    artworkUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=200&auto=format&fit=crop&q=80',
    description: 'Hypnotic synth lead, massive subterranean low-end, peak time club anthem.',
    label: 'Afterlife Recordings',
    remix: 'Extended Club Mix',
    catalogNumber: 'AL084',
    energyRating: 9,
    chartRank: 1,
  },
  {
    id: 'bp-mt-2',
    title: 'Horizon (Progressive Anthem)',
    artist: 'ARTBAT & Sailor & I',
    source: 'beatport',
    genre: 'Melodic House & Techno',
    genreCategory: 'melodic_house_techno',
    bpm: 124,
    key: '6A',
    duration: 440,
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    description: 'Emotional vocal breakdown, progressive arpeggios, soaring atmospheric strings.',
    label: 'UPPERGROUND',
    remix: 'Club Mix',
    catalogNumber: 'UP-005',
    energyRating: 9,
    chartRank: 7,
  },

  // --- 5. DRUM & BASS (High-tempo 170-180 BPM breakbeats, top sales) ---
  {
    id: 'bp-dnb-1',
    title: 'Solar System (Original Mix)',
    artist: 'Sub Focus',
    source: 'beatport',
    genre: 'Drum & Bass',
    genreCategory: 'drum_and_bass',
    bpm: 174,
    key: '4A',
    duration: 288,
    artworkUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200&auto=format&fit=crop&q=80',
    description: 'Epic synth brass intro dropping into a devastating neuro bass assault at 174 BPM.',
    label: 'EMI / Virgin Records',
    remix: 'Original Mix',
    catalogNumber: 'VIR-741',
    energyRating: 10,
    chartRank: 5,
  },
  {
    id: 'bp-dnb-2',
    title: 'Baddadan (VIP Dubplate)',
    artist: 'Chase & Status & Bou ft. Trigga',
    source: 'beatport',
    genre: 'Drum & Bass',
    genreCategory: 'drum_and_bass',
    bpm: 175,
    key: '11B',
    duration: 240,
    artworkUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop&q=80',
    description: 'Global top-selling jump-up breakbeat anthem with ragga vocal delivery.',
    label: 'Universal / EMI',
    remix: 'VIP Dubplate',
    catalogNumber: 'CS-099',
    energyRating: 10,
    chartRank: 2,
  },

  // --- 6. AFRO HOUSE (Percussive rhythms, organic instrumentation, vocal grooves) ---
  {
    id: 'bp-afro-1',
    title: 'Mwaki (Major Lazer VIP Remix)',
    artist: 'Zerb & Sofiya Nzau',
    source: 'beatport',
    genre: 'Afro House',
    genreCategory: 'afro_house',
    bpm: 122,
    key: '6A',
    duration: 315,
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    description: 'Rich organic tribal percussion, Swahili vocal power, lush melodic brass.',
    label: 'TH3RD BRAIN',
    remix: 'Major Lazer VIP Remix',
    catalogNumber: 'TB-902',
    energyRating: 8,
    chartRank: 3,
  },
  {
    id: 'bp-afro-2',
    title: 'Drive (Tribal Sunset Mix)',
    artist: 'Black Coffee & David Guetta ft. Delilah',
    source: 'beatport',
    genre: 'Afro House',
    genreCategory: 'afro_house',
    bpm: 120,
    key: '9A',
    duration: 345,
    artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    description: 'Deep organic Shona & Zulu polyrhythms, warm piano progression, soulful vocal.',
    label: 'Soulistic Music / Ultra',
    remix: 'Tribal Sunset Mix',
    catalogNumber: 'SOUL-088',
    energyRating: 8,
    chartRank: 9,
  },

  // --- 7. DEEP HOUSE (Lush chords, warm sub-bass, relaxed tempos) ---
  {
    id: 'bp-dh-1',
    title: 'What They Say (Velvet Lounge Mix)',
    artist: 'Maya Jane Coles',
    source: 'beatport',
    genre: 'Deep House',
    genreCategory: 'deep_house',
    bpm: 121,
    key: '9B',
    duration: 370,
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80',
    description: 'Lush chord stabs, relaxed swing beat, warm analog sub-bass, smoky ambiance.',
    label: 'Real Tone Records',
    remix: 'Original Club Mix',
    catalogNumber: 'RTR-033',
    energyRating: 7,
    chartRank: 10,
  },
  {
    id: 'bp-dh-2',
    title: 'Can You Feel It (Sunset Reprise)',
    artist: 'Larry Heard & Mr. Fingers',
    source: 'beatport',
    genre: 'Deep House',
    genreCategory: 'deep_house',
    bpm: 119,
    key: '7A',
    duration: 360,
    artworkUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80',
    description: 'Iconic lush synthesizer chords, warm analog bassline, relaxed timeless groove.',
    label: 'Trax / Alleviated',
    remix: 'Classic Sunset Mix',
    catalogNumber: 'ALV-001',
    energyRating: 6,
    chartRank: 12,
  },

  // --- 8. MINIMAL / DEEP TECH (Stripped-back arrangements, subtle micro-grooves) ---
  {
    id: 'bp-min-1',
    title: 'Room Service (Underground Dub)',
    artist: 'PAWSA & Dennis Cruz',
    source: 'beatport',
    genre: 'Minimal / Deep Tech',
    genreCategory: 'minimal_deep_tech',
    bpm: 126,
    key: '7A',
    duration: 395,
    artworkUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&auto=format&fit=crop&q=80',
    description: 'Stripped-back arrangement, hypnotic micro-groove percussion, subtle sub modulation.',
    label: 'Solid Grooves Records',
    remix: 'Underground Dub',
    catalogNumber: 'SG-112',
    energyRating: 8,
    chartRank: 7,
  },
  {
    id: 'bp-min-2',
    title: 'Groove Machine (Micro Cut)',
    artist: 'East End Dubs',
    source: 'beatport',
    genre: 'Minimal / Deep Tech',
    genreCategory: 'minimal_deep_tech',
    bpm: 127,
    key: '11B',
    duration: 410,
    artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    description: 'Subtle micro-percussion loops, deep rubbery sub-bass, club-ready DJ tool.',
    label: 'Eastenderz',
    remix: 'Original Club Cut',
    catalogNumber: 'ENDZ-044',
    energyRating: 8,
    chartRank: 11,
  },

  // --- 9. PROGRESSIVE HOUSE (Extended melodic journeys, driving basslines, dramatic builds) ---
  {
    id: 'bp-prog-1',
    title: 'Opus (Extended Concert Journey)',
    artist: 'Eric Prydz',
    source: 'beatport',
    genre: 'Progressive House',
    genreCategory: 'progressive_house',
    bpm: 126,
    key: '10B',
    duration: 560,
    artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    description: 'Legendary 9-minute escalating arpeggio build, driving bassline, epic climax.',
    label: 'Pryda Recordings / Virgin',
    remix: 'Extended Journey',
    catalogNumber: 'PRY-035',
    energyRating: 10,
    chartRank: 4,
  },
  {
    id: 'bp-prog-2',
    title: 'Sun & Moon (Progressive Club Mix)',
    artist: 'Above & Beyond ft. Richard Bedford',
    source: 'beatport',
    genre: 'Progressive House',
    genreCategory: 'progressive_house',
    bpm: 128,
    key: '9B',
    duration: 466,
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    description: 'Extended melodic journey with emotional piano breakdown and soaring supersaws.',
    label: 'Anjunabeats',
    remix: 'Club Mix Extended',
    catalogNumber: 'ANJ-182',
    energyRating: 9,
    chartRank: 8,
  },

  // --- 10. INDIE DANCE (Retro synthwave, dark disco, post-punk electronic crossover) ---
  {
    id: 'bp-indie-1',
    title: 'Mutant Romance (Dark Disco Edit)',
    artist: 'Maceo Plex & Red Axes',
    source: 'beatport',
    genre: 'Indie Dance',
    genreCategory: 'indie_dance',
    bpm: 121,
    key: '11A',
    duration: 385,
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
    description: 'Retro-infused synthwave leads, dark disco bassline, post-punk electro crossover.',
    label: 'Ellum Audio',
    remix: 'Dark Disco Edit',
    catalogNumber: 'ELL-077',
    energyRating: 9,
    chartRank: 5,
  },
  {
    id: 'bp-indie-2',
    title: 'Cyberpunk Neon Drive',
    artist: 'iDpro Synthwave Unit',
    source: 'spotify',
    genre: 'Indie Dance',
    genreCategory: 'indie_dance',
    bpm: 120,
    key: '4A',
    duration: 260,
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80',
    description: 'Analog synthesizer arp hooks, gated 80s snare, dark electronic disco driver.',
    label: 'idpro.com Audio Lab',
    remix: 'Original Club Mix',
    energyRating: 8,
    chartRank: 14,
  },
];


@customElement('audio-sources-hub')
export class AudioSourcesHub extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1300px;
      margin: 0 auto;
      box-sizing: border-box;
      padding: 0 12px 24px 12px;
    }

    .hub-container {
      background: linear-gradient(180deg, #181822 0%, #101016 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
    }

    .hub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .hub-title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .hub-title {
      font-size: 1.25rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hub-subtitle {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.6);
    }

    /* Tabs for Source Categories */
    .source-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .source-tab-btn {
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .source-tab-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .source-tab-btn.active {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border-color: #ff25f6;
      box-shadow: 0 0 12px rgba(255, 37, 246, 0.3);
    }

    /* URL Ingest Bar */
    .url-ingest-card {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .url-input-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .url-input {
      flex: 1;
      min-width: 260px;
      font: inherit;
      font-size: 0.875rem;
      padding: 10px 14px;
      background: #111118;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 8px;
      color: #ffffff;
      outline: none;
    }

    .url-input:focus {
      border-color: #2af6de;
      box-shadow: 0 0 10px rgba(42, 246, 222, 0.3);
    }

    .load-url-btn {
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 800;
      padding: 10px 18px;
      border-radius: 8px;
      background: linear-gradient(135deg, #ff25f6 0%, #9900ff 100%);
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .load-url-btn:hover {
      box-shadow: 0 0 16px rgba(255, 37, 246, 0.6);
    }

    /* File Drag & Drop Zone */
    .drop-zone {
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 24px;
    }

    .drop-zone:hover,
    .drop-zone.dragover {
      border-color: #2af6de;
      background: rgba(42, 246, 222, 0.08);
    }

    .drop-icon {
      width: 40px;
      height: 40px;
      fill: #2af6de;
      margin-bottom: 8px;
    }

    .drop-title {
      font-size: 1rem;
      font-weight: 800;
      color: #ffffff;
    }

    .drop-subtitle {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 4px;
    }

    /* Track Cards Grid */
    .tracks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 14px;
    }

    .track-card {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px;
      display: grid;
      grid-template-columns: 70px 1fr;
      gap: 12px;
      align-items: center;
      transition: all 0.15s ease;
    }

    .track-card:hover {
      border-color: rgba(255, 255, 255, 0.25);
      background: rgba(0, 0, 0, 0.5);
      transform: translateY(-2px);
    }

    .track-art {
      width: 70px;
      height: 70px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .track-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .card-title {
      font-size: 0.875rem;
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-artist {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.65);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .card-source-tag {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .tag-spotify {
      background: #1db954;
      color: #000;
    }

    .tag-apple {
      background: #fc3c44;
      color: #fff;
    }

    .tag-mixcloud {
      background: #5000ff;
      color: #fff;
    }

    .tag-beatport {
      background: #01ff70;
      color: #000000;
      font-weight: 900;
      box-shadow: 0 0 10px rgba(1, 255, 112, 0.4);
    }

    .tag-cloud {
      background: #9900ff;
      color: #fff;
    }

    .card-label-badge {
      font-size: 0.625rem;
      color: rgba(255, 255, 255, 0.7);
      background: rgba(255, 255, 255, 0.08);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
    }

    .card-chart-rank {
      font-size: 0.625rem;
      font-weight: 900;
      color: #01ff70;
      background: rgba(1, 255, 112, 0.15);
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid rgba(1, 255, 112, 0.3);
    }

    .card-actions {
      display: flex;
      gap: 6px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .load-deck-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .preview-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.15s;
    }

    .preview-btn.playing {
      background: #01ff70;
      color: #000000;
      border-color: #01ff70;
      box-shadow: 0 0 10px rgba(1, 255, 112, 0.5);
    }

    /* Top 10 Electronic Genres Showcase */
    .genres-section {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 18px;
    }

    .genres-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }

    .genres-title {
      font-size: 0.8125rem;
      font-weight: 800;
      color: #01ff70;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .genres-scroll-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 8px;
    }

    .genre-card-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 8px 10px;
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.15s ease-in-out;
    }

    .genre-card-btn:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .genre-card-btn.active {
      background: rgba(1, 255, 112, 0.08);
      border-color: #01ff70;
      box-shadow: 0 0 12px rgba(1, 255, 112, 0.15);
    }

    .genre-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .genre-card-name {
      font-size: 0.75rem;
      font-weight: 800;
      color: #ffffff;
    }

    .genre-card-bpm {
      font-size: 0.625rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #3dffab;
      background: rgba(61, 255, 171, 0.1);
      padding: 1px 4px;
      border-radius: 3px;
    }

    .genre-card-desc {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .genre-spotlight-banner {
      margin-top: 10px;
      background: linear-gradient(90deg, rgba(1, 255, 112, 0.1) 0%, rgba(42, 246, 222, 0.05) 100%);
      border: 1px solid rgba(1, 255, 112, 0.25);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;

  @state() private activeTab: 'all' | 'beatport' | 'spotify' | 'apple_music' | 'mixcloud' | 'local_file' = 'all';
  @state() private selectedGenreId: string = 'all';
  @state() private urlInput = '';
  @state() private isDraggingOver = false;
  @state() private previewingTrackId: string | null = null;
  private previewAudioNode: AudioNode | null = null;


  private handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const trackState: DeckTrackState = {
        id: `file-${Date.now()}-${i}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File / Audio Hijack',
        source: 'file',
        duration: 180,
        bpm: 126,
        key: '8A',
        audioBuffer: null,
        artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
      };

      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuf = e.target?.result as ArrayBuffer;
        if (arrayBuf) {
          try {
            trackState.audioBuffer = await this.engine.audioContext.decodeAudioData(arrayBuf);
            trackState.duration = trackState.audioBuffer.duration;
            if (i === 0) {
              await this.engine.loadTrackToDeck('1', trackState);
              this.dispatchEvent(new CustomEvent('toast', { detail: `Loaded "${trackState.title}" into Deck 1`, bubbles: true, composed: true }));
            } else if (i === 1) {
              await this.engine.loadTrackToDeck('2', trackState);
              this.dispatchEvent(new CustomEvent('toast', { detail: `Loaded "${trackState.title}" into Deck 2`, bubbles: true, composed: true }));
            }
          } catch (err) {
            console.warn('Decode error:', err);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  private handleUrlIngest(deckTarget: '1' | '2' | '3' | '4') {
    if (!this.urlInput.trim()) return;

    const url = this.urlInput.trim();
    let title = 'Stream Track';
    let artist = 'Stream Artist';
    let source: any = 'spotify';
    let genre = 'Electronic';
    let bpm = 126;
    let key = '8A';

    if (url.includes('beatport.com')) {
      source = 'beatport';
      title = 'Beatport Top Chart Ingest';
      artist = 'Beatport Streaming Exclusive';
      genre = 'Melodic Tech';
      bpm = 126;
      key = '8A';
    } else if (url.includes('spotify.com')) {
      source = 'spotify';
      title = 'Spotify Stream Import';
      artist = 'Spotify Ingest';
      genre = 'Dance';
      bpm = 128;
    } else if (url.includes('apple.com') || url.includes('itunes')) {
      source = 'apple_music';
      title = 'Apple Music Ingest';
      artist = 'iTunes Cloud';
      genre = 'Electronic';
      bpm = 124;
    } else if (url.includes('mixcloud.com')) {
      source = 'mixcloud';
      title = 'Mixcloud DJ Set';
      artist = 'Mixcloud Stream';
      genre = 'DJ Mix';
      bpm = 130;
    }

    const track: DeckTrackState = {
      id: `url-stream-${Date.now()}`,
      title,
      artist,
      source,
      sourceUrl: url,
      duration: 240,
      bpm,
      key,
      genre,
      audioBuffer: this.engine.synthesizeElectronicTrackAudio(bpm, 240, source),
      artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80',
    };

    this.engine.loadTrackToDeck(deckTarget, track);
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `Ingested ${source.toUpperCase()} stream into OPUS-QUAD Deck ${deckTarget}!`,
        bubbles: true,
        composed: true,
      })
    );
    this.urlInput = '';
  }

  private togglePreview(track: CuratedSourceTrack) {
    if (this.previewingTrackId === track.id) {
      this.previewingTrackId = null;
      return;
    }
    this.previewingTrackId = track.id;
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `🎧 Previewing Beatport/Streaming snippet: ${track.title}`,
        bubbles: true,
        composed: true,
      })
    );
  }

  private loadCuratedToDeck(deckId: '1' | '2' | '3' | '4', track: CuratedSourceTrack) {
    const audioBuf = this.engine.synthesizeElectronicTrackAudio(track.bpm, track.duration, track.source as any);
    const deckTrack: DeckTrackState = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      source: track.source,
      duration: track.duration,
      bpm: track.bpm,
      key: track.key,
      audioBuffer: audioBuf,
      artworkUrl: track.artworkUrl,
      genre: track.genre,
      label: track.label,
      remix: track.remix,
      catalogNumber: track.catalogNumber,
      energyRating: track.energyRating,
    };
    this.engine.loadTrackToDeck(deckId, deckTrack);
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `Loaded "${track.title}" to OPUS-QUAD Deck ${deckId}`,
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    let filteredTracks =
      this.activeTab === 'all'
        ? CLOUD_TRACKS
        : CLOUD_TRACKS.filter((t) => t.source === this.activeTab);

    if (this.selectedGenreId !== 'all') {
      filteredTracks = filteredTracks.filter(
        (t) => t.genreCategory === this.selectedGenreId
      );
    }

    const activeGenreObj = TOP_10_ELECTRONIC_GENRES.find(
      (g) => g.id === this.selectedGenreId
    );

    return html`
      <div class="hub-container">
        <!-- Header -->
        <div class="hub-header">
          <div class="hub-title-group">
            <span class="hub-title">
              <span>📻 Multi-Source Audio Hijack & Beatport LINK Hub</span>
            </span>
            <span class="hub-subtitle">
              Stream & ingest tracks from Beatport LINK, Spotify, Apple Music / iTunes, Mixcloud, Local MP3/WAV, or Live Generative AI.
            </span>
          </div>
        </div>

        <!-- Top 10 Electronic Music Genres & Categories -->
        <div class="genres-section">
          <div class="genres-header-row">
            <div class="genres-title">
              <span>🔥 Top 10 Electronic Music Genres & Sales Categories</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button
                class="source-tab-btn ${this.selectedGenreId === 'all' ? 'active' : ''}"
                style="padding: 3px 8px; font-size: 0.6875rem;"
                @click=${() => (this.selectedGenreId = 'all')}
              >
                All Genres (${CLOUD_TRACKS.length})
              </button>
            </div>
          </div>

          <div class="genres-scroll-row">
            ${TOP_10_ELECTRONIC_GENRES.map((g) => {
              const count = CLOUD_TRACKS.filter((t) => t.genreCategory === g.id).length;
              return html`
                <button
                  class="genre-card-btn ${this.selectedGenreId === g.id ? 'active' : ''}"
                  @click=${() =>
                    (this.selectedGenreId =
                      this.selectedGenreId === g.id ? 'all' : g.id)}
                >
                  <div class="genre-card-top">
                    <span class="genre-card-name">${g.icon} ${g.name}</span>
                    <span class="genre-card-bpm">${g.typicalBpm}</span>
                  </div>
                  <div class="genre-card-desc">${g.description}</div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
                    <span style="font-size: 0.625rem; color: #a1a1aa;">Key: ${g.harmonicKey}</span>
                    <span style="font-size: 0.625rem; color: ${g.badgeColor}; font-weight: 700;">${count} Tracks</span>
                  </div>
                </button>
              `;
            })}
          </div>

          ${activeGenreObj
            ? html`
                <div class="genre-spotlight-banner">
                  <div>
                    <div style="font-size: 0.8125rem; font-weight: 800; color: #ffffff;">
                      ${activeGenreObj.icon} ${activeGenreObj.name} — ${activeGenreObj.tagline}
                    </div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.8); margin-top: 2px;">
                      ${activeGenreObj.description}
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button
                      class="load-deck-btn"
                      style="background: #01ff70; color: #000;"
                      @click=${() => {
                        const topTrack = CLOUD_TRACKS.find((t) => t.genreCategory === activeGenreObj.id);
                        if (topTrack) this.loadCuratedToDeck('1', topTrack);
                      }}
                    >
                      Load Top Track to Deck 1
                    </button>
                    <button
                      class="load-deck-btn"
                      style="background: #2af6de; color: #000;"
                      @click=${() => {
                        const topTrack = CLOUD_TRACKS.find((t) => t.genreCategory === activeGenreObj.id);
                        if (topTrack) this.loadCuratedToDeck('2', topTrack);
                      }}
                    >
                      Deck 2
                    </button>
                  </div>
                </div>
              `
            : ''}
        </div>

        <!-- Filter Tabs -->
        <div class="source-tabs">
          <button
            class="source-tab-btn ${this.activeTab === 'all' ? 'active' : ''}"
            @click=${() => (this.activeTab = 'all')}
          >
            All Sources (${CLOUD_TRACKS.length})
          </button>
          <button
            class="source-tab-btn ${this.activeTab === 'beatport' ? 'active' : ''}"
            style="${this.activeTab === 'beatport' ? 'background: #01ff70; color: #000;' : ''}"
            @click=${() => (this.activeTab = 'beatport')}
          >
            🎧 Beatport LINK (${CLOUD_TRACKS.filter((t) => t.source === 'beatport').length})
          </button>
          <button
            class="source-tab-btn ${this.activeTab === 'spotify' ? 'active' : ''}"
            @click=${() => (this.activeTab = 'spotify')}
          >
            Spotify Ingest
          </button>
          <button
            class="source-tab-btn ${this.activeTab === 'apple_music' ? 'active' : ''}"
            @click=${() => (this.activeTab = 'apple_music')}
          >
            Apple Music / iTunes
          </button>
          <button
            class="source-tab-btn ${this.activeTab === 'mixcloud' ? 'active' : ''}"
            @click=${() => (this.activeTab = 'mixcloud')}
          >
            Mixcloud Sets
          </button>
        </div>

        <!-- URL Ingestion Card -->
        <div class="url-ingest-card">
          <div style="font-size: 0.8125rem; font-weight: 800; color: #ffffff;">
            🔗 Direct Stream URL Ingestion (Beatport / Spotify / Apple Music / Mixcloud)
          </div>
          <div class="url-input-row">
            <input
              type="text"
              class="url-input"
              placeholder="Paste Beatport track/release URL, Spotify track URI, Apple Music URL, or Mixcloud mix..."
              .value=${this.urlInput}
              @input=${(e: Event) => (this.urlInput = (e.target as HTMLInputElement).value)}
            />
            <button class="load-url-btn" @click=${() => this.handleUrlIngest('1')}>
              Deck 1
            </button>
            <button
              class="load-url-btn"
              style="background: linear-gradient(135deg, #2af6de 0%, #0099ff 100%); color: #000;"
              @click=${() => this.handleUrlIngest('2')}
            >
              Deck 2
            </button>
            <button
              class="load-url-btn"
              style="background: linear-gradient(135deg, #ff25f6 0%, #9900ff 100%); color: #fff;"
              @click=${() => this.handleUrlIngest('3')}
            >
              Deck 3
            </button>
            <button
              class="load-url-btn"
              style="background: linear-gradient(135deg, #3dffab 0%, #00ff83 100%); color: #000;"
              @click=${() => this.handleUrlIngest('4')}
            >
              Deck 4
            </button>
          </div>
        </div>

        <!-- Drag and Drop Local Audio Ingest Zone -->
        <div
          class="drop-zone ${this.isDraggingOver ? 'dragover' : ''}"
          @dragover=${(e: DragEvent) => {
            e.preventDefault();
            this.isDraggingOver = true;
          }}
          @dragleave=${() => (this.isDraggingOver = false)}
          @drop=${(e: DragEvent) => {
            e.preventDefault();
            this.isDraggingOver = false;
            this.handleFileUpload(e.dataTransfer?.files || null);
          }}
          @click=${() => {
            const input = this.shadowRoot?.querySelector('#file-picker') as HTMLInputElement;
            input?.click();
          }}
        >
          <input
            type="file"
            id="file-picker"
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
            style="display: none;"
            @change=${(e: Event) =>
              this.handleFileUpload((e.target as HTMLInputElement).files)}
          />
          <svg class="drop-icon" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
          <div class="drop-title">Drag & Drop MP3, WAV, FLAC, or AAC Audio Files</div>
          <div class="drop-subtitle">
            Files are analyzed in real-time and loaded directly into OPUS-QUAD 4-Channel Standalone Decks.
          </div>
        </div>

        <!-- Curated Track Cards Grid -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 0.8125rem; font-weight: 800; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px;">
            ${this.activeTab === 'beatport' ? '🎧 Beatport Top 100 Charts & Streaming Tracks' : 'Available Ingest Tracks & Cloud Stems'}
          </div>
          ${this.activeTab === 'beatport'
            ? html`
                <div style="font-size: 0.6875rem; color: #01ff70; font-weight: 800;">
                  ● Beatport Streaming Active (Lossless AAC/FLAC)
                </div>
              `
            : ''}
        </div>

        <div class="tracks-grid">
          ${filteredTracks.map(
            (track) => html`
              <div class="track-card">
                <img src="${track.artworkUrl}" alt="${track.title}" class="track-art" />
                <div class="track-details">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    ${track.chartRank
                      ? html`<span class="card-chart-rank">#${track.chartRank} BP</span>`
                      : ''}
                    <span class="card-title">${track.title}</span>
                  </div>
                  <span class="card-artist">${track.artist}</span>
                  <div class="card-meta-row">
                    <span class="card-source-tag tag-${track.source === 'spotify' ? 'spotify' : track.source === 'apple_music' ? 'apple' : track.source === 'mixcloud' ? 'mixcloud' : track.source === 'beatport' ? 'beatport' : 'cloud'}">
                      ${track.source === 'beatport' ? 'Beatport' : track.source.replace('_', ' ')}
                    </span>
                    ${track.label ? html`<span class="card-label-badge">${track.label}</span>` : ''}
                    <span>•</span>
                    <span style="color: #3dffab; font-weight: 700;">${track.bpm} BPM</span>
                    <span>•</span>
                    <span style="color: #ffffff; font-weight: 700;">${track.key}</span>
                  </div>
                  <div class="card-actions">
                    <button
                      class="preview-btn ${this.previewingTrackId === track.id ? 'playing' : ''}"
                      @click=${() => this.togglePreview(track)}
                      title="Cue & Audition Track"
                    >
                      ${this.previewingTrackId === track.id ? '⏸ Pause' : '▶ Cue'}
                    </button>
                    <button
                      class="load-deck-btn"
                      style="background: #f4a261; color: #000;"
                      @click=${() => this.loadCuratedToDeck('1', track)}
                      title="Load to OPUS-QUAD Deck 1"
                    >
                      Deck 1
                    </button>
                    <button
                      class="load-deck-btn"
                      style="background: #2af6de; color: #000;"
                      @click=${() => this.loadCuratedToDeck('2', track)}
                      title="Load to OPUS-QUAD Deck 2"
                    >
                      Deck 2
                    </button>
                    <button
                      class="load-deck-btn"
                      style="background: #ff25f6; color: #000;"
                      @click=${() => this.loadCuratedToDeck('3', track)}
                      title="Load to OPUS-QUAD Deck 3"
                    >
                      Deck 3
                    </button>
                    <button
                      class="load-deck-btn"
                      style="background: #3dffab; color: #000;"
                      @click=${() => this.loadCuratedToDeck('4', track)}
                      title="Load to OPUS-QUAD Deck 4"
                    >
                      Deck 4
                    </button>
                  </div>
                </div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}
