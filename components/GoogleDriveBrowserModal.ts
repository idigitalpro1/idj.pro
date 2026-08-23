/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DeckTrackState, GoogleDriveAudioFile, GoogleDriveState, OpusDeckId } from '../types';
import { GoogleDriveService } from '../utils/GoogleDriveService';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('google-drive-browser-modal')
export class GoogleDriveBrowserModal extends LitElement {
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
      z-index: 1050;
      padding: 16px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.98);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .modal-dialog {
      background: linear-gradient(180deg, #14141e 0%, #0d0d14 100%);
      border: 1px solid rgba(66, 133, 244, 0.35);
      border-radius: 18px;
      width: 100%;
      max-width: 880px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(66, 133, 244, 0.15);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.4);
    }

    .dialog-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .drive-logo {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .dialog-title {
      font-size: 1.125rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.5px;
    }

    .dialog-subtitle {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .close-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Modal Body */
    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Google Sign-in Card */
    .auth-banner {
      background: linear-gradient(135deg, rgba(66, 133, 244, 0.12) 0%, rgba(52, 168, 83, 0.08) 50%, rgba(251, 188, 5, 0.08) 100%);
      border: 1px solid rgba(66, 133, 244, 0.3);
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }

    .auth-banner-title {
      font-size: 1.125rem;
      font-weight: 800;
      color: #ffffff;
    }

    .auth-banner-desc {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.75);
      max-width: 540px;
      line-height: 1.5;
    }

    /* Official Google GSI Button */
    .gsi-material-button {
      -moz-user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
      -webkit-appearance: none;
      background-color: WHITE;
      background-image: none;
      border: 1px solid #747775;
      -webkit-border-radius: 20px;
      border-radius: 20px;
      -webkit-box-sizing: border-box;
      box-sizing: border-box;
      color: #1f1f1f;
      cursor: pointer;
      font-family: 'Roboto', arial, sans-serif;
      font-size: 14px;
      height: 40px;
      letter-spacing: 0.25px;
      outline: none;
      overflow: hidden;
      padding: 0 16px;
      position: relative;
      text-align: center;
      vertical-align: middle;
      white-space: nowrap;
      width: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      transition: all 0.2s ease;
    }

    .gsi-material-button:hover {
      box-shadow: 0 4px 16px rgba(255, 255, 255, 0.25);
      background-color: #f8f9fa;
    }

    .gsi-material-button-content-wrapper {
      display: flex;
      align-items: center;
      flex-direction: row;
      flex-wrap: nowrap;
      height: 100%;
      justify-content: space-between;
      position: relative;
      width: 100%;
    }

    .gsi-material-button-icon {
      height: 20px;
      margin-right: 12px;
      min-width: 20px;
      width: 20px;
    }

    .gsi-material-button-contents {
      -webkit-flex-grow: 1;
      flex-grow: 1;
      font-family: 'Roboto', arial, sans-serif;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: top;
    }

    /* Authenticated User Status Bar */
    .user-drive-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px 14px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .user-info-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid rgba(66, 133, 244, 0.5);
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 800;
      color: #fff;
    }

    .user-email {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .disconnect-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 700;
      background: rgba(255, 77, 79, 0.15);
      color: #ff4d4f;
      border: 1px solid rgba(255, 77, 79, 0.3);
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .disconnect-btn:hover {
      background: #ff4d4f;
      color: #fff;
    }

    /* Navigation & Search Bar */
    .toolbar-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      flex-wrap: wrap;
    }

    .breadcrumb-item {
      background: none;
      border: none;
      color: #4285f4;
      cursor: pointer;
      padding: 2px 4px;
      font-weight: 700;
      font-size: inherit;
    }

    .breadcrumb-item:hover {
      text-decoration: underline;
    }

    .search-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #111118;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 6px 12px;
      min-width: 220px;
    }

    .search-input {
      background: transparent;
      border: none;
      color: #fff;
      font: inherit;
      font-size: 0.8125rem;
      outline: none;
      width: 100%;
    }

    /* Files Grid & Cards */
    .files-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 200px;
    }

    .file-item {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      transition: all 0.15s;
    }

    .file-item:hover {
      border-color: rgba(66, 133, 244, 0.4);
      background: rgba(66, 133, 244, 0.06);
    }

    .file-item.folder {
      cursor: pointer;
      background: rgba(255, 255, 255, 0.03);
    }

    .file-item.folder:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .file-meta-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }

    .file-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .file-name-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-sub {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.5);
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .tag-badge {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
    }

    .deck-load-buttons {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .load-deck-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 900;
      padding: 5px 9px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .load-deck-btn:hover {
      transform: scale(1.05);
    }

    .delete-btn {
      font: inherit;
      font-size: 0.6875rem;
      font-weight: 700;
      background: transparent;
      border: 1px solid rgba(255, 77, 79, 0.3);
      color: #ff4d4f;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .delete-btn:hover {
      background: #ff4d4f;
      color: #fff;
    }

    /* Upload & Backup Toolbar */
    .upload-strip {
      background: rgba(0, 0, 0, 0.4);
      border: 1px dashed rgba(66, 133, 244, 0.4);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .upload-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 8px 14px;
      border-radius: 8px;
      background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 0 12px rgba(66, 133, 244, 0.3);
    }

    .upload-btn:hover {
      box-shadow: 0 0 18px rgba(66, 133, 244, 0.6);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    .loading-spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid rgba(66, 133, 244, 0.3);
      border-radius: 50%;
      border-top-color: #4285f4;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;
  @property({ type: Boolean }) public isOpen = false;

  @state() private driveState: GoogleDriveState = GoogleDriveService.getInstance().getState();
  @state() private isUploading = false;
  @state() private activeDownloadId: string | null = null;
  @state() private searchDebounceTimer: any = null;

  private driveService = GoogleDriveService.getInstance();

  override connectedCallback() {
    super.connectedCallback();
    this.driveService.addEventListener('drive-state-changed', this.handleDriveStateChanged as EventListener);
    this.driveState = this.driveService.getState();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.driveService.removeEventListener('drive-state-changed', this.handleDriveStateChanged as EventListener);
  }

  private handleDriveStateChanged = (e: CustomEvent<GoogleDriveState>) => {
    this.driveState = e.detail;
    this.requestUpdate();
  };

  private closeModal() {
    this.dispatchEvent(new CustomEvent('close-drive-modal', { bubbles: true, composed: true }));
  }

  private async handleSignIn() {
    try {
      await this.driveService.signIn();
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: '✅ Successfully connected Google Drive music crate!',
          bubbles: true,
          composed: true,
        })
      );
    } catch (err: any) {
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `Google Drive sign-in error: ${err.message}`,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private async handleSignOut() {
    await this.driveService.signOut();
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: 'Disconnected from Google Drive.',
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.driveService.listFiles(this.driveState.currentFolderId, val);
    }, 350);
  }

  private async handleLoadToDeck(deckId: OpusDeckId, file: GoogleDriveAudioFile) {
    if (!this.engine) return;

    try {
      this.activeDownloadId = file.id;
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `⏳ Downloading "${file.name}" from Google Drive...`,
          bubbles: true,
          composed: true,
        })
      );

      const { audioBuffer, fileName, duration } = await this.driveService.downloadAndDecodeAudio(
        file.id,
        this.engine.audioContext
      );

      const bpm = file.bpm || 126;
      const key = file.key || '8A';

      const track: DeckTrackState = {
        id: `gdrive-${file.id}`,
        title: fileName.replace(/\.[^/.]+$/, ''),
        artist: 'Google Drive Cloud Track',
        source: 'google_drive',
        duration,
        bpm,
        key,
        audioBuffer,
        artworkUrl: file.thumbnailLink || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
        genre: 'Cloud Library',
      };

      await this.engine.loadTrackToDeck(deckId, track);

      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `✨ Loaded "${track.title}" into OPUS-QUAD Deck ${deckId}!`,
          bubbles: true,
          composed: true,
        })
      );
    } catch (err: any) {
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `Failed to load track: ${err.message}`,
          bubbles: true,
          composed: true,
        })
      );
    } finally {
      this.activeDownloadId = null;
    }
  }

  /**
   * Delete file with MANDATORY user confirmation dialog per Workspace guidelines
   */
  private async handleDeleteFile(file: GoogleDriveAudioFile) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${file.name}" from your Google Drive? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await this.driveService.deleteFile(file.id);
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `🗑️ Deleted "${file.name}" from Google Drive.`,
          bubbles: true,
          composed: true,
        })
      );
    } catch (err: any) {
      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `Delete error: ${err.message}`,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private handleTriggerUpload() {
    const fileInput = this.shadowRoot?.querySelector('#drive-file-input') as HTMLInputElement;
    fileInput?.click();
  }

  private async handleUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        this.dispatchEvent(
          new CustomEvent('toast', {
            detail: `Uploading "${file.name}" to Google Drive...`,
            bubbles: true,
            composed: true,
          })
        );
        await this.driveService.uploadAudioRecording(file, file.name);
        this.dispatchEvent(
          new CustomEvent('toast', {
            detail: `✅ Uploaded "${file.name}" to Google Drive!`,
            bubbles: true,
            composed: true,
          })
        );
      } catch (err: any) {
        this.dispatchEvent(
          new CustomEvent('toast', {
            detail: `Upload failed: ${err.message}`,
            bubbles: true,
            composed: true,
          })
        );
      }
    }
  }

  override render() {
    if (!this.isOpen) return html``;

    const { isAuthenticated, isConnecting, userEmail, userName, userPhoto, files, folderPath, isLoadingFiles, error } =
      this.driveState;

    return html`
      <div class="modal-overlay" @click=${(e: Event) => {
        if (e.target === e.currentTarget) this.closeModal();
      }}>
        <div class="modal-dialog">
          <!-- Header -->
          <div class="dialog-header">
            <div class="dialog-title-group">
              <svg class="drive-logo" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <div>
                <div class="dialog-title">Google Drive Cloud Music Crate</div>
                <div class="dialog-subtitle">Stream, load, and backup your DJ audio files & stems directly from Google Drive</div>
              </div>
            </div>
            <button class="close-btn" @click=${this.closeModal} title="Close">✕</button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            ${!isAuthenticated
              ? html`
                  <div class="auth-banner">
                    <svg style="width: 56px; height: 50px;" viewBox="0 0 87.3 78">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                    <div class="auth-banner-title">Connect Your Google Drive</div>
                    <div class="auth-banner-desc">
                      Access your personal music tracks, DJ crates, lossless WAV stems, and backup recorded live sets directly in iDj.pro on the Pioneer OPUS-QUAD standalone system with permission from your account.
                    </div>

                    <button
                      class="gsi-material-button"
                      @click=${this.handleSignIn}
                      ?disabled=${isConnecting}
                    >
                      <div class="gsi-material-button-state"></div>
                      <div class="gsi-material-button-content-wrapper">
                        <div class="gsi-material-button-icon">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="display: block;">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span class="gsi-material-button-contents">
                          ${isConnecting ? 'Connecting to Google...' : 'Sign in with Google'}
                        </span>
                      </div>
                    </button>
                    ${error ? html`<div style="color: #ff4d4f; font-size: 0.75rem;">${error}</div>` : ''}
                  </div>
                `
              : html`
                  <!-- Authenticated State -->
                  <div class="user-drive-status">
                    <div class="user-info-row">
                      <img src="${userPhoto || 'https://api.dicebear.com/7.x/bottts/svg?seed=google'}" class="user-avatar" alt="Avatar" />
                      <div>
                        <div class="user-name">${userName || 'Google Drive DJ'}</div>
                        <div class="user-email">${userEmail} • Connected with Full Drive Access</div>
                      </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <button class="upload-btn" @click=${this.handleTriggerUpload}>
                        <span>⬆️ Upload Audio / Stems</span>
                      </button>
                      <input
                        type="file"
                        id="drive-file-input"
                        multiple
                        accept="audio/*,.mp3,.wav,.flac,.m4a,.aac"
                        style="display: none;"
                        @change=${(e: Event) => this.handleUploadFiles((e.target as HTMLInputElement).files)}
                      />
                      <button class="disconnect-btn" @click=${this.handleSignOut}>Disconnect</button>
                    </div>
                  </div>

                  <!-- Toolbar & Navigation -->
                  <div class="toolbar-row">
                    <div class="breadcrumbs">
                      <span>📁</span>
                      ${folderPath.map(
                        (folder, index) => html`
                          ${index > 0 ? html`<span>/</span>` : ''}
                          <button
                            class="breadcrumb-item"
                            @click=${() => this.driveService.navigateToBreadcrumb(index)}
                          >
                            ${folder.name}
                          </button>
                        `
                      )}
                    </div>

                    <div class="search-input-box">
                      <span>🔍</span>
                      <input
                        type="text"
                        class="search-input"
                        placeholder="Search audio tracks in Drive..."
                        @input=${this.handleSearchInput}
                      />
                    </div>
                  </div>

                  <!-- Files List -->
                  ${isLoadingFiles
                    ? html`
                        <div class="empty-state">
                          <div class="loading-spinner"></div>
                          <div style="margin-top: 10px;">Scanning Google Drive for audio files & crates...</div>
                        </div>
                      `
                    : files.length === 0
                    ? html`
                        <div class="empty-state">
                          <div style="font-size: 2rem; margin-bottom: 8px;">🎵</div>
                          <div>No audio files found in this folder.</div>
                          <div style="font-size: 0.75rem; margin-top: 4px;">
                            Upload MP3, WAV, FLAC, or AAC tracks or choose another folder above.
                          </div>
                        </div>
                      `
                    : html`
                        <div class="files-list">
                          ${files.map((file) =>
                            file.isFolder
                              ? html`
                                  <div
                                    class="file-item folder"
                                    @click=${() => this.driveService.openFolder(file.id, file.name)}
                                  >
                                    <div class="file-meta-left">
                                      <span class="file-icon">📁</span>
                                      <div class="file-name-group">
                                        <span class="file-name">${file.name}</span>
                                        <span class="file-sub">Music Folder / DJ Crate</span>
                                      </div>
                                    </div>
                                    <button class="delete-btn" @click=${(e: Event) => {
                                      e.stopPropagation();
                                      this.handleDeleteFile(file);
                                    }}>
                                      Delete
                                    </button>
                                  </div>
                                `
                              : html`
                                  <div class="file-item">
                                    <div class="file-meta-left">
                                      <span class="file-icon">🎧</span>
                                      <div class="file-name-group">
                                        <span class="file-name">${file.name}</span>
                                        <div class="file-sub">
                                          <span>${file.sizeFormatted || 'Audio File'}</span>
                                          ${file.bpm
                                            ? html`<span class="tag-badge" style="background: rgba(61, 255, 171, 0.15); color: #3dffab;">${file.bpm} BPM</span>`
                                            : ''}
                                          ${file.key
                                            ? html`<span class="tag-badge" style="background: rgba(42, 246, 222, 0.15); color: #2af6de;">${file.key}</span>`
                                            : ''}
                                        </div>
                                      </div>
                                    </div>
                                    <div class="deck-load-buttons">
                                      ${this.activeDownloadId === file.id
                                        ? html`<span class="loading-spinner" style="width: 16px; height: 16px;"></span>`
                                        : html`
                                            <button
                                              class="load-deck-btn"
                                              style="background: #f4a261; color: #000;"
                                              @click=${() => this.handleLoadToDeck('1', file)}
                                              title="Load to OPUS-QUAD Deck 1"
                                            >
                                              Deck 1
                                            </button>
                                            <button
                                              class="load-deck-btn"
                                              style="background: #2af6de; color: #000;"
                                              @click=${() => this.handleLoadToDeck('2', file)}
                                              title="Load to OPUS-QUAD Deck 2"
                                            >
                                              Deck 2
                                            </button>
                                            <button
                                              class="load-deck-btn"
                                              style="background: #ff25f6; color: #000;"
                                              @click=${() => this.handleLoadToDeck('3', file)}
                                              title="Load to OPUS-QUAD Deck 3"
                                            >
                                              Deck 3
                                            </button>
                                            <button
                                              class="load-deck-btn"
                                              style="background: #3dffab; color: #000;"
                                              @click=${() => this.handleLoadToDeck('4', file)}
                                              title="Load to OPUS-QUAD Deck 4"
                                            >
                                              Deck 4
                                            </button>
                                          `}
                                      <button class="delete-btn" @click=${() => this.handleDeleteFile(file)}>
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                `
                          )}
                        </div>
                      `}
                `}
          </div>
        </div>
      </div>
    `;
  }
}
