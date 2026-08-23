/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UserProfile } from '../types';
import { AuthService } from '../utils/AuthService';

@customElement('user-profile-modal')
export class UserProfileModal extends LitElement {
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
      background: linear-gradient(180deg, #1a1a26 0%, #101018 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      width: 100%;
      max-width: 580px;
      max-height: 92vh;
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

    /* Google Sign-in Banner */
    .google-auth-box {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .google-btn {
      font: inherit;
      font-size: 0.875rem;
      font-weight: 700;
      background: #ffffff;
      color: #1f1f1f;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      transition: all 0.15s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .google-btn:hover {
      background: #f1f1f1;
      box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
    }

    .guest-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .guest-btn:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* Profile Form */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 500px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full {
      grid-column: span 2;
    }

    @media (max-width: 500px) {
      .form-group.full {
        grid-column: span 1;
      }
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.7);
    }

    .form-input {
      font: inherit;
      font-size: 0.8125rem;
      background: #111118;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffffff;
      outline: none;
    }

    .form-input:focus {
      border-color: #ff25f6;
      box-shadow: 0 0 10px rgba(255, 37, 246, 0.3);
    }

    .avatar-picker-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .avatar-img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid #ff25f6;
      background: #000;
    }

    .save-btn {
      font: inherit;
      font-size: 0.875rem;
      font-weight: 800;
      background: linear-gradient(135deg, #ff25f6 0%, #9900ff 100%);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .save-btn:hover {
      box-shadow: 0 0 16px rgba(255, 37, 246, 0.6);
    }
  `;

  @property({ type: Boolean }) public isOpen = false;

  @state() private profile: UserProfile | null = null;
  @state() private editDjAlias = '';
  @state() private editName = '';
  @state() private editEmail = '';
  @state() private editBio = '';
  @state() private editGenre = '';
  @state() private editSpotify = '';
  @state() private editSoundcloud = '';

  private authService = AuthService.getInstance();

  override connectedCallback() {
    super.connectedCallback();
    this.refreshProfile();
    this.authService.addEventListener('profile-changed', () => this.refreshProfile());
    this.authService.addEventListener('auth-state-changed', () => this.refreshProfile());
  }

  private refreshProfile() {
    const p = this.authService.getProfile();
    this.profile = p;
    this.editDjAlias = p.djAlias || '';
    this.editName = p.name || '';
    this.editEmail = p.email || '';
    this.editBio = p.bio || '';
    this.editGenre = p.genre || '';
    this.editSpotify = p.socials?.spotify || '';
    this.editSoundcloud = p.socials?.soundcloud || '';
  }

  private handleGoogleLogin() {
    const p = this.authService.loginWithGoogle({
      name: this.editName || 'iDpro Resident DJ',
      email: this.editEmail || 'idjpro.dj@idpro.com',
    });
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `Signed in as ${p.name} (${p.djAlias})!`,
        bubbles: true,
        composed: true,
      })
    );
    this.close();
  }

  private handleContinueGuest() {
    const p = this.authService.createGuestProfile();
    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `Switched to Guest Session (${p.djAlias})`,
        bubbles: true,
        composed: true,
      })
    );
    this.close();
  }

  private saveChanges() {
    this.authService.updateProfile({
      djAlias: this.editDjAlias,
      name: this.editName,
      email: this.editEmail,
      bio: this.editBio,
      genre: this.editGenre,
      socials: {
        ...this.profile?.socials,
        spotify: this.editSpotify,
        soundcloud: this.editSoundcloud,
      },
    });

    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: 'DJ Profile and Account Preferences Saved!',
        bubbles: true,
        composed: true,
      })
    );
    this.close();
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close-profile-modal', { bubbles: true, composed: true }));
  }

  override render() {
    if (!this.isOpen) return html``;

    const p = this.profile;

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
              <span>👤 iDj.pro Account & Profile Creation</span>
            </div>
            <button class="close-btn" @click=${this.close}>✕</button>
          </div>

          <!-- Google Auth & Guest Mode Box -->
          <div class="google-auth-box">
            <div style="font-size: 0.875rem; font-weight: 800; color: #ffffff;">
              ${p?.isGuest ? 'Join iDj.pro Community with Google Account' : 'Authenticated Google Profile'}
            </div>
            <button class="google-btn" @click=${this.handleGoogleLogin}>
              <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>${p?.isGuest ? 'Continue with Google' : 'Refresh Google Session'}</span>
            </button>

            <div style="display: flex; justify-content: center; gap: 8px;">
              <button class="guest-btn" @click=${this.handleContinueGuest}>
                Continue as Guest / New Session
              </button>
            </div>
          </div>

          <!-- DJ LOCKJAH Private Lessons Direct to You Card -->
          <div style="background: linear-gradient(135deg, rgba(255, 183, 3, 0.12), rgba(255, 37, 246, 0.1)); border: 1px solid #ffb703; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <span style="font-size: 0.7rem; font-weight: 900; background: #ffb703; color: #000; padding: 2px 8px; border-radius: 20px;">🏆 2025 COLORADO DJ OF THE YEAR</span>
              <span style="font-size: 0.65rem; color: #3dffab; font-weight: 800;">$50 DEPOSIT TO RESERVE</span>
            </div>
            <div style="font-size: 0.875rem; font-weight: 900; color: #ffffff;">
              Learn to DJ: Private Personal DJ Lessons Direct to You
            </div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.75); line-height: 1.35;">
              Train 1-on-1 with <strong>DJ LOCKJAH</strong> on Pioneer OPUS-QUAD, CDJ-3000, 4-way stems & turntablism. Mobile in-person anywhere in Colorado or 1-on-1 Ultra-HD stream.
            </div>
            <button
              style="font: inherit; font-size: 0.8125rem; font-weight: 900; background: linear-gradient(135deg, #ffb703 0%, #ff7b00 100%); color: #000; border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(255, 183, 3, 0.35); text-transform: uppercase;"
              @click=${() => {
                this.close();
                this.dispatchEvent(new CustomEvent('open-dj-lessons-modal', { bubbles: true, composed: true }));
              }}
            >
              <span>📅</span>
              <span>LJ Schedule • Reserve Time & $50 Deposit</span>
            </button>
          </div>

          <!-- Avatar & Alias -->
          <div class="avatar-picker-row">
            <img src="${p?.avatarUrl}" alt="${p?.djAlias}" class="avatar-img" />
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 1rem; font-weight: 800; color: #fff;">${p?.djAlias}</span>
              <span style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">${p?.email} • ${p?.isGuest ? 'Guest Mode' : 'Verified Artist'}</span>
            </div>
          </div>

          <!-- Edit Profile Form -->
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">DJ Alias / Stage Name</label>
              <input
                type="text"
                class="form-input"
                .value=${this.editDjAlias}
                @input=${(e: Event) => (this.editDjAlias = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group">
              <label class="form-label">Artist / Full Name</label>
              <input
                type="text"
                class="form-input"
                .value=${this.editName}
                @input=${(e: Event) => (this.editName = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                class="form-input"
                .value=${this.editEmail}
                @input=${(e: Event) => (this.editEmail = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group">
              <label class="form-label">Primary DJ Genres</label>
              <input
                type="text"
                class="form-input"
                placeholder="e.g. Cyberpunk, House, Techno"
                .value=${this.editGenre}
                @input=${(e: Event) => (this.editGenre = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group full">
              <label class="form-label">DJ Bio & Setup Summary</label>
              <input
                type="text"
                class="form-input"
                .value=${this.editBio}
                @input=${(e: Event) => (this.editBio = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group">
              <label class="form-label">Spotify Artist URL</label>
              <input
                type="text"
                class="form-input"
                placeholder="https://spotify.com/artist/..."
                .value=${this.editSpotify}
                @input=${(e: Event) => (this.editSpotify = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group">
              <label class="form-label">SoundCloud / Mixcloud URL</label>
              <input
                type="text"
                class="form-input"
                placeholder="https://soundcloud.com/..."
                .value=${this.editSoundcloud}
                @input=${(e: Event) => (this.editSoundcloud = (e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          <!-- Save Button -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
            <button class="guest-btn" @click=${this.close}>Cancel</button>
            <button class="save-btn" @click=${this.saveChanges}>Save Profile & Preferences</button>
          </div>
        </div>
      </div>
    `;
  }
}
