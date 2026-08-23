/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { TrackHistoryItem } from '../types';
import { AuthService } from '../utils/AuthService';
import { TrackHistoryService } from '../utils/TrackHistoryService';

@customElement('track-history-modal')
export class TrackHistoryModal extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(14px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 16px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.97);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .modal-dialog {
      background: linear-gradient(180deg, #1c1c28 0%, #101018 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      width: 100%;
      max-width: 720px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 14px;
    }

    .dialog-title {
      font-size: 1.125rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .close-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Sharing Toolbar */
    .sharing-toolbar {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .share-link-row {
      display: flex;
      gap: 8px;
    }

    .share-input {
      flex: 1;
      font: inherit;
      font-size: 0.8125rem;
      background: #111118;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 8px 12px;
      color: #3dffab;
      outline: none;
    }

    .share-action-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 8px 14px;
      border-radius: 8px;
      background: #ff25f6;
      color: #000;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .share-action-btn:hover {
      box-shadow: 0 0 12px rgba(255, 37, 246, 0.6);
    }

    .export-buttons-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .export-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .export-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
    }

    /* History List */
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 380px;
      overflow-y: auto;
    }

    .history-item-row {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 10px 14px;
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      gap: 12px;
      align-items: center;
      transition: all 0.15s;
    }

    .history-item-row:hover {
      background: rgba(0, 0, 0, 0.5);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .item-deck-tag {
      font-size: 0.6875rem;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .deck-tag-A {
      background: #ff25f6;
      color: #000;
    }

    .deck-tag-B {
      background: #2af6de;
      color: #000;
    }

    .deck-tag-hijack {
      background: #ffdd28;
      color: #000;
    }

    .deck-tag-ai {
      background: #9900ff;
      color: #fff;
    }

    .item-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .item-title {
      font-size: 0.875rem;
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-artist {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      font-family: monospace;
    }

    .item-time {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.4);
    }
  `;

  @property({ type: Boolean }) public isOpen = false;

  @state() private history: TrackHistoryItem[] = [];
  @state() private shareUrl = '';

  private historyService = TrackHistoryService.getInstance();
  private authService = AuthService.getInstance();

  override connectedCallback() {
    super.connectedCallback();
    this.refreshHistory();
    this.historyService.addEventListener('history-updated', () => this.refreshHistory());
  }

  private refreshHistory() {
    this.history = this.historyService.getHistory();
    const profile = this.authService.getProfile();
    this.shareUrl = this.historyService.generateShareableUrl(profile.djAlias);
  }

  private copyShareUrl() {
    navigator.clipboard.writeText(this.shareUrl);
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: 'Live Setlist & Mix Share URL copied to clipboard!',
        bubbles: true,
        composed: true,
      })
    );
  }

  private exportText() {
    const text = this.historyService.exportAsText();
    this.downloadFile('idjpro_setlist.txt', text, 'text/plain');
  }

  private exportM3u() {
    const m3u = this.historyService.exportAsM3U();
    this.downloadFile('idjpro_playlist.m3u', m3u, 'audio/x-mpegurl');
  }

  private exportCsv() {
    const csv = this.historyService.exportAsCsv();
    this.downloadFile('idjpro_track_history.csv', csv, 'text/csv');
  }

  private downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `Exported ${filename}`,
        bubbles: true,
        composed: true,
      })
    );
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close-history-modal', { bubbles: true, composed: true }));
  }

  override render() {
    if (!this.isOpen) return html``;

    return html`
      <div
        class="modal-overlay"
        @click=${(e: MouseEvent) => {
          if (e.target === e.currentTarget) this.close();
        }}
      >
        <div class="modal-dialog">
          <div class="dialog-header">
            <div class="dialog-title">
              <span>📜 Live Track History & Setlist Sharing</span>
            </div>
            <button class="close-btn" @click=${this.close}>✕</button>
          </div>

          <!-- Sharing & Export Hub -->
          <div class="sharing-toolbar">
            <div style="font-size: 0.8125rem; font-weight: 800; color: #ffffff;">
              🔗 Share Live Session & Setlist Link
            </div>
            <div class="share-link-row">
              <input type="text" class="share-input" readonly .value=${this.shareUrl} />
              <button class="share-action-btn" @click=${this.copyShareUrl}>
                📋 Copy Link
              </button>
            </div>

            <div style="font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.6); margin-top: 4px;">
              Export Setlist Format:
            </div>
            <div class="export-buttons-row">
              <button class="export-btn" @click=${this.exportText}>
                📄 Plain Text / Setlist
              </button>
              <button class="export-btn" @click=${this.exportM3u}>
                🎵 M3U Playlist (DJ Softwares)
              </button>
              <button class="export-btn" @click=${this.exportCsv}>
                📊 CSV Spreadsheet
              </button>
              <button
                class="export-btn"
                style="color: #ff4d4f; border-color: rgba(255, 77, 79, 0.4);"
                @click=${() => this.historyService.clearHistory()}
              >
                🗑️ Clear History
              </button>
            </div>
          </div>

          <!-- Track List -->
          <div>
            <div style="font-size: 0.8125rem; font-weight: 800; color: rgba(255,255,255,0.7); margin-bottom: 10px;">
              RECENTLY SPUN TRACKS (${this.history.length})
            </div>

            ${this.history.length === 0
              ? html`
                  <div style="text-align: center; padding: 30px; color: rgba(255,255,255,0.5); font-size: 0.875rem;">
                    No tracks logged in this session yet. Load a track into Deck A or B or start Audio Hijack!
                  </div>
                `
              : html`
                  <div class="history-list">
                    ${this.history.map(
                      (item) => html`
                        <div class="history-item-row">
                          <span class="item-deck-tag deck-tag-${item.deck}">
                            DECK ${item.deck.toUpperCase()}
                          </span>
                          <div class="item-meta">
                            <span class="item-title">${item.title}</span>
                            <span class="item-artist">${item.artist}</span>
                          </div>
                          <div class="item-stats">
                            <span>${item.bpm} BPM</span>
                            <span>•</span>
                            <span>${item.key}</span>
                          </div>
                          <span class="item-time">
                            ${new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      `
                    )}
                  </div>
                `}
          </div>
        </div>
      </div>
    `;
  }
}
