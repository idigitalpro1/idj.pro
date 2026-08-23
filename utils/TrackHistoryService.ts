/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DeckTrackState, TrackHistoryItem } from '../types';

const HISTORY_STORAGE_KEY = 'idj_pro_track_history';

export class TrackHistoryService extends EventTarget {
  private static instance: TrackHistoryService;
  private history: TrackHistoryItem[] = [];

  private constructor() {
    super();
    this.loadHistory();
  }

  public static getInstance(): TrackHistoryService {
    if (!TrackHistoryService.instance) {
      TrackHistoryService.instance = new TrackHistoryService();
    }
    return TrackHistoryService.instance;
  }

  public getHistory(): TrackHistoryItem[] {
    return [...this.history];
  }

  public logTrack(
    track: DeckTrackState,
    deck: '1' | '2' | '3' | '4' | 'A' | 'B' | 'mixer' | 'hijack' | 'ai' | 'zone',
  ): TrackHistoryItem {
    // Avoid immediate duplicate entries within 15 seconds for the same deck
    const lastEntry = this.history[0];
    if (
      lastEntry &&
      lastEntry.title === track.title &&
      lastEntry.artist === track.artist &&
      lastEntry.deck === deck &&
      Date.now() - lastEntry.timestamp < 15000
    ) {
      return lastEntry;
    }

    const item: TrackHistoryItem = {
      id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      deck,
      title: track.title || 'Untitled Track',
      artist: track.artist || 'Unknown Artist',
      source: track.source || 'file',
      bpm: track.bpm || 128,
      key: track.key || '8A',
      duration: track.duration || 180,
      artworkUrl: track.artworkUrl,
    };

    this.history.unshift(item);
    // keep maximum 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    this.saveHistory();
    this.dispatchEvent(new CustomEvent('history-updated', { detail: this.history }));
    return item;
  }

  public clearHistory() {
    this.history = [];
    this.saveHistory();
    this.dispatchEvent(new CustomEvent('history-updated', { detail: this.history }));
  }

  public exportAsText(): string {
    if (this.history.length === 0) return 'No tracks played yet in this iDj.pro session.';
    
    let text = `=== iDj.pro by idpro.com Live Setlist ===\n`;
    text += `Session Date: ${new Date().toLocaleString()}\n`;
    text += `Total Tracks: ${this.history.length}\n\n`;

    this.history.slice().reverse().forEach((item, idx) => {
      const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      text += `[${time}] #${idx + 1}. ${item.artist} - ${item.title} (${item.bpm} BPM | ${item.key}) [Deck ${item.deck.toUpperCase()}]\n`;
    });

    text += `\nMastered via iDproi.com Audio Hijack DSP Engine • https://idpro.com\n`;
    return text;
  }

  public exportAsM3U(): string {
    let m3u = '#EXTM3U\n#PLAYLIST:iDj.pro Setlist by idpro.com\n';
    this.history.slice().reverse().forEach(item => {
      m3u += `#EXTINF:${Math.round(item.duration)},${item.artist} - ${item.title}\n`;
      m3u += `#EXTGENRE:Electronic / DJ Mix\n`;
      m3u += `${item.title.replace(/\s+/g, '_')}.mp3\n`;
    });
    return m3u;
  }

  public exportAsCsv(): string {
    let csv = 'Timestamp,Deck,Artist,Title,BPM,Key,Source,Duration(s)\n';
    this.history.forEach(item => {
      const iso = new Date(item.timestamp).toISOString();
      csv += `"${iso}","${item.deck}","${item.artist.replace(/"/g, '""')}","${item.title.replace(/"/g, '""')}",${item.bpm},"${item.key}","${item.source}",${Math.round(item.duration)}\n`;
    });
    return csv;
  }

  public generateShareableUrl(djAlias?: string): string {
    const origin = window.location.origin + window.location.pathname;
    const sessionData = {
      dj: djAlias || 'iDj.pro Master',
      tracksCount: this.history.length,
      topTracks: this.history.slice(0, 5).map(t => `${t.artist} - ${t.title}`),
      ts: Date.now(),
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(sessionData))));
    return `${origin}#session=${b64}`;
  }

  private loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        this.history = JSON.parse(raw);
      } else {
        // seed with realistic starter history
        this.history = [
          {
            id: 'init-1',
            timestamp: Date.now() - 120000,
            deck: 'A',
            title: 'Holographic Sunset (iDpro VIP)',
            artist: 'Cyber Pulse',
            source: 'cloud_library',
            bpm: 126,
            key: '8A',
            duration: 214,
            artworkUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150&auto=format&fit=crop&q=80',
          },
          {
            id: 'init-2',
            timestamp: Date.now() - 600000,
            deck: 'B',
            title: 'Tokyo Midnight Drive (Acid Re-Rub)',
            artist: 'Neon Shinjuku',
            source: 'spotify',
            bpm: 128,
            key: '11B',
            duration: 240,
            artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
          },
          {
            id: 'init-3',
            timestamp: Date.now() - 1200000,
            deck: 'A',
            title: 'Sub-Bass Hijack Anthem',
            artist: 'iDpro Sound System',
            source: 'hijack',
            bpm: 130,
            key: '4A',
            duration: 195,
            artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
          },
        ];
      }
    } catch {
      this.history = [];
    }
  }

  private saveHistory() {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.history));
    } catch {
      // ignore storage errors
    }
  }
}
