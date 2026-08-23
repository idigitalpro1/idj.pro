/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CustomDecal } from '../types';
import { AuthService } from '../utils/AuthService';
import type { VirtualDjEngine } from '../utils/VirtualDjEngine';

@customElement('custom-decal-modal')
export class CustomDecalModal extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(12px);
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
      background: linear-gradient(180deg, #1c1c28 0%, #12121a 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
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

    /* Decal Grid */
    .decals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 14px;
    }

    .decal-item-card {
      background: rgba(0, 0, 0, 0.35);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .decal-item-card:hover {
      border-color: #2af6de;
      transform: translateY(-2px);
    }

    .decal-item-card.selected {
      border-color: #ff25f6;
      box-shadow: 0 0 16px rgba(255, 37, 246, 0.4);
      background: rgba(255, 37, 246, 0.08);
    }

    .decal-preview-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
      background: #000;
    }

    .decal-preview-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .decal-name {
      font-size: 0.75rem;
      font-weight: 700;
      color: #ffffff;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 110px;
    }

    /* Upload Area */
    .upload-custom-section {
      background: rgba(0, 0, 0, 0.4);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .upload-inputs-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .custom-input {
      flex: 1;
      min-width: 200px;
      font: inherit;
      font-size: 0.8125rem;
      padding: 8px 12px;
      background: #111118;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: #ffffff;
      outline: none;
    }

    .custom-input:focus {
      border-color: #ff25f6;
    }

    .upload-file-btn {
      font: inherit;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .upload-file-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Apply Actions */
    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 16px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .apply-btn {
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 800;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-apply-A {
      background: #ff25f6;
      color: #000;
    }

    .btn-apply-B {
      background: #2af6de;
      color: #000;
    }

    .btn-apply-both {
      background: #ffffff;
      color: #000;
    }
  `;

  @property({ attribute: false }) public engine!: VirtualDjEngine;
  @property({ type: String }) public targetDeckId: 'A' | 'B' = 'A';
  @property({ type: Boolean }) public isOpen = false;

  @state() private selectedDecal: CustomDecal | null = null;
  @state() private customName = '';
  @state() private customUrl = '';

  private authService = AuthService.getInstance();

  override connectedCallback() {
    super.connectedCallback();
    const profile = this.authService.getProfile();
    this.selectedDecal = profile.customDecals?.[0] || null;
  }

  private handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const decal = this.authService.addCustomDecal({
          name: file.name.replace(/\.[^/.]+$/, ''),
          imageUrl: dataUrl,
          type: 'vinyl_label',
        });
        this.selectedDecal = decal;
        this.requestUpdate();
      }
    };
    reader.readAsDataURL(file);
  }

  private addUrlDecal() {
    if (!this.customUrl.trim()) return;
    const decal = this.authService.addCustomDecal({
      name: this.customName.trim() || 'Custom Vinyl Decal',
      imageUrl: this.customUrl.trim(),
      type: 'vinyl_label',
    });
    this.selectedDecal = decal;
    this.customName = '';
    this.customUrl = '';
    this.requestUpdate();
  }

  private applyToDeck(deckId: 'A' | 'B' | 'both') {
    if (!this.selectedDecal) return;

    if (deckId === 'A' || deckId === 'both') {
      this.engine.setDeckDecal('A', this.selectedDecal);
    }
    if (deckId === 'B' || deckId === 'both') {
      this.engine.setDeckDecal('B', this.selectedDecal);
    }

    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `Applied "${this.selectedDecal.name}" decal to Deck ${deckId.toUpperCase()}!`,
        bubbles: true,
        composed: true,
      })
    );
    this.close();
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close-decal-modal', { bubbles: true, composed: true }));
  }

  override render() {
    if (!this.isOpen) return html``;

    const profile = this.authService.getProfile();
    const allDecals = profile.customDecals || [];

    return html`
      <div class="modal-overlay" @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) this.close();
      }}>
        <div class="modal-dialog">
          <div class="dialog-header">
            <div class="dialog-title">
              <span>🎨 iDj.pro Custom Art Decals & Slipmat Studio</span>
            </div>
            <button class="close-btn" @click=${this.close}>✕</button>
          </div>

          <!-- Decals Library -->
          <div>
            <div style="font-size: 0.8125rem; font-weight: 800; color: rgba(255,255,255,0.7); margin-bottom: 10px;">
              SELECT DECALS & SLIPMATS (${allDecals.length})
            </div>
            <div class="decals-grid">
              ${allDecals.map(
                (decal) => html`
                  <div
                    class="decal-item-card ${this.selectedDecal?.id === decal.id ? 'selected' : ''}"
                    @click=${() => (this.selectedDecal = decal)}
                  >
                    <div class="decal-preview-circle">
                      <img src="${decal.imageUrl}" alt="${decal.name}" />
                    </div>
                    <span class="decal-name" title="${decal.name}">${decal.name}</span>
                  </div>
                `
              )}
            </div>
          </div>

          <!-- Upload Custom Decal -->
          <div class="upload-custom-section">
            <div style="font-size: 0.8125rem; font-weight: 800; color: #ffffff;">
              ⬆️ Upload Your Custom Artwork or Slipmat
            </div>
            <div class="upload-inputs-row">
              <input
                type="text"
                class="custom-input"
                placeholder="Decal Name (e.g. DJ Hologram)"
                .value=${this.customName}
                @input=${(e: Event) => (this.customName = (e.target as HTMLInputElement).value)}
              />
              <input
                type="text"
                class="custom-input"
                placeholder="Paste Image URL (PNG, JPG, SVG, WebP)..."
                .value=${this.customUrl}
                @input=${(e: Event) => (this.customUrl = (e.target as HTMLInputElement).value)}
              />
              <button class="upload-file-btn" @click=${this.addUrlDecal}>Add URL</button>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <button
                class="upload-file-btn"
                @click=${() => {
                  const input = this.shadowRoot?.querySelector('#decal-file-input') as HTMLInputElement;
                  input?.click();
                }}
              >
                📁 Choose File From Computer
              </button>
              <input
                type="file"
                id="decal-file-input"
                accept="image/*"
                style="display: none;"
                @change=${(e: Event) =>
                  this.handleFileUpload((e.target as HTMLInputElement).files)}
              />
              <span style="font-size: 0.6875rem; color: rgba(255,255,255,0.5);">
                Supports transparent PNGs, SVGs, or custom slipmat prints
              </span>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="dialog-footer">
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7);">
              Selected: <strong>${this.selectedDecal?.name || 'None'}</strong>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="apply-btn btn-apply-A" @click=${() => this.applyToDeck('A')}>
                Apply to Deck A
              </button>
              <button class="apply-btn btn-apply-B" @click=${() => this.applyToDeck('B')}>
                Apply to Deck B
              </button>
              <button class="apply-btn btn-apply-both" @click=${() => this.applyToDeck('both')}>
                Apply to Both
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
