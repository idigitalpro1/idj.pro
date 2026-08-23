/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  DjLessonBooking,
  DjLessonCurriculum,
  DjLessonDelivery,
  DjLessonPackage,
} from '../types';

@customElement('dj-lessons-booking-modal')
export class DjLessonsBookingModal extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 4, 10, 0.88);
      backdrop-filter: blur(16px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      padding: 16px;
      animation: modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .modal-dialog {
      background: linear-gradient(180deg, #161622 0%, #0d0d14 100%);
      border: 1px solid rgba(255, 183, 3, 0.4);
      border-radius: 20px;
      width: 100%;
      max-width: 780px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 183, 3, 0.15);
      display: flex;
      flex-direction: column;
      gap: 20px;
      color: #ffffff;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 183, 3, 0.5) rgba(0, 0, 0, 0.2);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding-bottom: 16px;
      gap: 12px;
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .award-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.2), rgba(255, 77, 79, 0.2));
      border: 1px solid #ffb703;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 900;
      color: #ffb703;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      width: fit-content;
    }

    .dialog-title {
      font-size: 1.35rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ffffff 30%, #ffdd28 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }

    .dialog-subtitle {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.75);
      line-height: 1.4;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 8px;
      transition: all 0.15s;
    }

    .close-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.2);
      border-color: #ff4d4f;
    }

    /* Instructor Profile Card */
    .instructor-hero {
      display: flex;
      gap: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .instructor-avatar-box {
      position: relative;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(135deg, #ffb703, #ff25f6, #2af6de);
      flex-shrink: 0;
    }

    .instructor-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
    }

    .instructor-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 240px;
    }

    .instructor-name {
      font-size: 1.15rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .instructor-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .tag-badge {
      font-size: 0.65rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 2px 7px;
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.85);
    }

    /* Tab Switcher for New Booking vs My Scheduled Lessons */
    .view-nav {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
    }

    .nav-tab {
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 800;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      background: transparent;
      border: 1px solid transparent;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.15s;
    }

    .nav-tab.active {
      background: rgba(255, 183, 3, 0.15);
      border-color: #ffb703;
      color: #ffdd28;
    }

    /* Steps and Form Sections */
    .section-title {
      font-size: 0.9375rem;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .section-title span.num {
      width: 22px;
      height: 22px;
      background: #ffb703;
      color: #000;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 600px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .curriculum-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 12px 14px;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    .curriculum-card:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 183, 3, 0.5);
    }

    .curriculum-card.selected {
      background: rgba(255, 183, 3, 0.12);
      border-color: #ffb703;
      box-shadow: 0 0 14px rgba(255, 183, 3, 0.25);
    }

    .curriculum-card-title {
      font-size: 0.8125rem;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .curriculum-card-desc {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.65);
      line-height: 1.35;
    }

    /* Packages */
    .package-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .package-card.selected {
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.15), rgba(255, 37, 246, 0.15));
      border-color: #ffb703;
      box-shadow: 0 0 16px rgba(255, 183, 3, 0.3);
    }

    .package-title {
      font-size: 0.875rem;
      font-weight: 800;
      color: #ffffff;
    }

    .package-sub {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 2px;
    }

    .package-price-box {
      text-align: right;
    }

    .package-price {
      font-size: 1.15rem;
      font-weight: 900;
      color: #ffdd28;
    }

    .package-deposit-tag {
      font-size: 0.625rem;
      color: #3dffab;
      font-weight: 800;
    }

    /* Form Fields */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.8);
    }

    .form-input,
    .form-select {
      font: inherit;
      font-size: 0.8125rem;
      background: #0f0f18;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 8px;
      padding: 9px 12px;
      color: #ffffff;
      outline: none;
      transition: all 0.15s;
    }

    .form-input:focus,
    .form-select:focus {
      border-color: #ffb703;
      box-shadow: 0 0 12px rgba(255, 183, 3, 0.3);
    }

    /* Deposit Summary Box */
    .deposit-summary-box {
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.1), rgba(255, 37, 246, 0.08));
      border: 1px solid #ffb703;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
    }

    .summary-row.total {
      font-size: 1rem;
      font-weight: 900;
      color: #ffffff;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 8px;
    }

    .deposit-highlight {
      font-size: 1.15rem;
      font-weight: 900;
      color: #3dffab;
    }

    /* Submit / Reserve Button */
    .btn-reserve-time {
      font: inherit;
      font-size: 0.9375rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ffb703 0%, #ff7b00 50%, #ff25f6 100%);
      color: #000000;
      border: none;
      border-radius: 10px;
      padding: 14px 20px;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 6px 20px rgba(255, 183, 3, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-reserve-time:hover {
      box-shadow: 0 8px 30px rgba(255, 183, 3, 0.7);
      transform: translateY(-2px);
      color: #000;
    }

    /* Booking Confirmation View */
    .confirmation-view {
      background: rgba(61, 255, 171, 0.05);
      border: 1px solid rgba(61, 255, 171, 0.4);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
    }

    .conf-icon {
      font-size: 3rem;
      line-height: 1;
    }

    .conf-ref-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
      font-weight: 900;
      background: rgba(61, 255, 171, 0.2);
      border: 1px solid #3dffab;
      color: #3dffab;
      padding: 4px 14px;
      border-radius: 20px;
    }

    .conf-details-card {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      width: 100%;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.8125rem;
    }

    /* Booked List */
    .booked-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .booking-item {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
  `;

  @property({ type: Boolean }) public isOpen = false;

  @state() private activeTab: 'schedule_form' | 'my_bookings' | 'confirmation' = 'schedule_form';

  // Form State
  @state() private studentName = '';
  @state() private studentEmail = '';
  @state() private studentPhone = '';
  @state() private studentCity = 'Denver, CO';
  @state() private locationAddress = '';
  @state() private curriculum: DjLessonCurriculum = 'opus_quad_cdj_mastery';
  @state() private delivery: DjLessonDelivery = 'direct_to_you_in_person';
  @state() private packageType: DjLessonPackage = '1_hour_private';
  @state() private scheduledDate = '';
  @state() private scheduledTime = '2:00 PM (Afternoon)';
  @state() private experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional' = 'beginner';
  @state() private gearOwned = 'Pioneer DJ / Controller (or requested instructor gear)';
  @state() private specialRequests = '';

  @state() private savedBookings: DjLessonBooking[] = [];
  @state() private latestBooking: DjLessonBooking | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.loadSavedBookings();
    this.initDefaultDate();
  }

  private initDefaultDate() {
    const today = new Date();
    today.setDate(today.getDate() + 2); // Default to 2 days out
    this.scheduledDate = today.toISOString().split('T')[0];
  }

  private loadSavedBookings() {
    try {
      const stored = localStorage.getItem('idj_djlockjah_bookings');
      if (stored) {
        this.savedBookings = JSON.parse(stored);
      }
    } catch {
      this.savedBookings = [];
    }
  }

  private saveBookingToStorage(booking: DjLessonBooking) {
    this.savedBookings = [booking, ...this.savedBookings];
    try {
      localStorage.setItem('idj_djlockjah_bookings', JSON.stringify(this.savedBookings));
    } catch (e) {
      console.warn('Could not save booking to storage', e);
    }
  }

  private getPackageDetails() {
    switch (this.packageType) {
      case '1_hour_private':
        return { total: 100, deposit: 50, remaining: 50, name: '1-Hour Private Personal Lesson' };
      case '2_hours_masterclass':
        return { total: 180, deposit: 50, remaining: 130, name: '2-Hour Deep-Dive Masterclass' };
      case '4_weeks_intensive':
        return { total: 350, deposit: 50, remaining: 300, name: '4-Week Pro DJ Intensive Program' };
    }
  }

  private handleReserveBooking(e: Event) {
    e.preventDefault();

    if (!this.studentName.trim()) {
      this.dispatchEvent(new CustomEvent('toast', { detail: 'Please enter your name for the lesson reservation.' }));
      return;
    }
    if (!this.studentEmail.trim()) {
      this.dispatchEvent(new CustomEvent('toast', { detail: 'Please provide your email address.' }));
      return;
    }

    const pricing = this.getPackageDetails();
    const randomRef = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `LJ-2025-CO-${randomRef}`;

    const newBooking: DjLessonBooking = {
      id: `booking-${Date.now()}`,
      bookingRef,
      createdAt: Date.now(),
      studentName: this.studentName,
      studentEmail: this.studentEmail,
      studentPhone: this.studentPhone || '(555) 019-2025',
      studentCity: this.studentCity,
      locationAddress: this.locationAddress || 'Direct to Student Location',
      curriculum: this.curriculum,
      delivery: this.delivery,
      packageType: this.packageType,
      scheduledDate: this.scheduledDate,
      scheduledTime: this.scheduledTime,
      experienceLevel: this.experienceLevel,
      gearOwned: this.gearOwned,
      specialRequests: this.specialRequests,
      totalFee: pricing.total,
      depositPaid: pricing.deposit, // $50 deposit
      remainingBalance: pricing.remaining,
      status: 'confirmed',
      instructor: 'DJ LOCKJAH (2025 Colorado DJ of the Year)',
    };

    this.saveBookingToStorage(newBooking);
    this.latestBooking = newBooking;
    this.activeTab = 'confirmation';

    this.dispatchEvent(
      new CustomEvent('toast', {
        detail: `🎉 Time Reserved with DJ LOCKJAH! $50 Deposit Confirmed (${bookingRef})`,
        bubbles: true,
        composed: true,
      })
    );
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close-dj-lessons-modal', { bubbles: true, composed: true }));
  }

  override render() {
    if (!this.isOpen) return html``;

    const pricing = this.getPackageDetails();

    return html`
      <div
        class="modal-overlay"
        @click=${(e: MouseEvent) => {
          if (e.target === e.currentTarget) this.close();
        }}
      >
        <div class="modal-dialog">
          <!-- Header -->
          <div class="dialog-header">
            <div class="header-info">
              <div class="award-pill">
                <span>🏆 2025 Colorado DJ of the Year Award Recipient</span>
              </div>
              <h2 class="dialog-title">Learn to DJ: Private Personal DJ Lessons Direct to You</h2>
              <p class="dialog-subtitle">
                Master the Pioneer OPUS-QUAD, 4-way neural stems, harmonic Camelot mixing & live club performance with 
                <strong>DJ LOCKJAH</strong> — 2025 Colorado DJ of the Year award recipient.
              </p>
            </div>
            <button class="close-btn" @click=${this.close} title="Close Modal">✕</button>
          </div>

          <!-- DJ LOCKJAH Instructor Bio Card -->
          <div class="instructor-hero">
            <div class="instructor-avatar-box">
              <div class="instructor-avatar">🎧</div>
            </div>
            <div class="instructor-meta">
              <div class="instructor-name">
                <span>DJ LOCKJAH</span>
                <span style="font-size: 0.75rem; color: #ffb703;">★ Colorado DJ of the Year (2025)</span>
              </div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); line-height: 1.35;">
                Official Pioneer DJ & rekordbox Master Trainer • 15+ years Red Rocks, Denver club & mountain residency veteran.
                Mobile private lessons direct to your Colorado address or 1-on-1 Ultra-HD interactive studio stream.
              </div>
              <div class="instructor-tags">
                <span class="tag-badge">🚗 Direct To You (Colorado)</span>
                <span class="tag-badge">💻 1-on-1 Online Stream</span>
                <span class="tag-badge">🎚️ OPUS-QUAD & CDJ-3000</span>
                <span class="tag-badge">🎤 4-Way Neural Stems</span>
                <span class="tag-badge">💽 Turntablism & Scratching</span>
              </div>
            </div>
          </div>

          <!-- Navigation Tabs -->
          <div class="view-nav">
            <button
              class="nav-tab ${this.activeTab === 'schedule_form' ? 'active' : ''}"
              @click=${() => (this.activeTab = 'schedule_form')}
            >
              📅 LJ Schedule & $50 Deposit Reservation
            </button>
            <button
              class="nav-tab ${this.activeTab === 'my_bookings' ? 'active' : ''}"
              @click=${() => (this.activeTab = 'my_bookings')}
            >
              📜 My Scheduled Lessons (${this.savedBookings.length})
            </button>
            ${this.latestBooking
              ? html`
                  <button
                    class="nav-tab ${this.activeTab === 'confirmation' ? 'active' : ''}"
                    @click=${() => (this.activeTab = 'confirmation')}
                  >
                    ✅ Booking Confirmation
                  </button>
                `
              : html``}
          </div>

          <!-- Form View -->
          ${this.activeTab === 'schedule_form'
            ? html`
                <form @submit=${this.handleReserveBooking} style="display: flex; flex-direction: column; gap: 18px;">
                  <!-- Step 1: Delivery Mode -->
                  <div class="section-title">
                    <span class="num">1</span>
                    <span>Choose Lesson Format & Location</span>
                  </div>
                  <div class="grid-2">
                    <div
                      class="curriculum-card ${this.delivery === 'direct_to_you_in_person' ? 'selected' : ''}"
                      @click=${() => (this.delivery = 'direct_to_you_in_person')}
                    >
                      <div class="curriculum-card-title">
                        <span>🚗 Direct to You (Mobile Colorado In-Person)</span>
                      </div>
                      <div class="curriculum-card-desc">
                        DJ LOCKJAH travels direct to your home, studio, or event space across Denver Metro, Boulder, CO Springs, Fort Collins & Mountain Corridor. Includes hands-on Pioneer hardware training.
                      </div>
                    </div>

                    <div
                      class="curriculum-card ${this.delivery === 'online_studio_hd' ? 'selected' : ''}"
                      @click=${() => (this.delivery = 'online_studio_hd')}
                    >
                      <div class="curriculum-card-title">
                        <span>💻 1-on-1 Ultra-HD Studio Live Stream</span>
                      </div>
                      <div class="curriculum-card-desc">
                        Interactive private video masterclass with multi-camera top-down deck views, direct lossless audio feed, screen sharing, and recorded session replay provided.
                      </div>
                    </div>
                  </div>

                  <!-- Step 2: Curriculum Focus -->
                  <div class="section-title">
                    <span class="num">2</span>
                    <span>Select Master Training Curriculum</span>
                  </div>
                  <div class="grid-2">
                    <div
                      class="curriculum-card ${this.curriculum === 'opus_quad_cdj_mastery' ? 'selected' : ''}"
                      @click=${() => (this.curriculum = 'opus_quad_cdj_mastery')}
                    >
                      <div class="curriculum-card-title">🎚️ Pioneer OPUS-QUAD & CDJ-3000 Mastery</div>
                      <div class="curriculum-card-desc">
                        Rekordbox USB management, standalone 4-deck routing, Zone output, Sound Color FX, Beat FX timing, and Touchscreen navigation.
                      </div>
                    </div>

                    <div
                      class="curriculum-card ${this.curriculum === 'stems_live_mashups' ? 'selected' : ''}"
                      @click=${() => (this.curriculum = 'stems_live_mashups')}
                    >
                      <div class="curriculum-card-title">🎤 Real-Time Stems & Live Mashups</div>
                      <div class="curriculum-card-desc">
                        4-way live stem separation (Vocals, Drums, Bass, Melody), on-the-fly acapella dropping, instrumental loops, and EQ crossover tricks.
                      </div>
                    </div>

                    <div
                      class="curriculum-card ${this.curriculum === 'club_mixing_fundamentals' ? 'selected' : ''}"
                      @click=${() => (this.curriculum = 'club_mixing_fundamentals')}
                    >
                      <div class="curriculum-card-title">🎧 Club Beatmatching & Camelot Harmonics</div>
                      <div class="curriculum-card-desc">
                        32-bar phrase structure, pitch fader manual riding, Camelot wheel key matching, energy curve programming, and drop transitions.
                      </div>
                    </div>

                    <div
                      class="curriculum-card ${this.curriculum === 'turntablism_scratching' ? 'selected' : ''}"
                      @click=${() => (this.curriculum = 'turntablism_scratching')}
                    >
                      <div class="curriculum-card-title">💽 Turntablism, Scratching & Pad Routines</div>
                      <div class="curriculum-card-desc">
                        Baby scratch, cutting, chirps, 2-click flares, transformer scratch, hot cue tone play, and performance pad finger drumming.
                      </div>
                    </div>

                    <div
                      class="curriculum-card ${this.curriculum === 'open_format_crowd_reading' ? 'selected' : ''}"
                      @click=${() => (this.curriculum = 'open_format_crowd_reading')}
                    >
                      <div class="curriculum-card-title">🎶 Open-Format DJing & Reading the Crowd</div>
                      <div class="curriculum-card-desc">
                        Multi-genre BPM jumps (Hip-Hop to House to Funk), mic presence, set pacing, song library organization, and dance floor psychology.
                      </div>
                    </div>

                    <div
                      class="curriculum-card ${this.curriculum === 'sound_system_hardware' ? 'selected' : ''}"
                      @click=${() => (this.curriculum = 'sound_system_hardware')}
                    >
                      <div class="curriculum-card-title">🔊 Sound System & Hardware Engineering</div>
                      <div class="curriculum-card-desc">
                        PA speaker placement, sub crossover tuning, XLR/TRS cabling, audio interfaces, gain staging, and live sound troubleshooting.
                      </div>
                    </div>
                  </div>

                  <!-- Step 3: Lesson Package -->
                  <div class="section-title">
                    <span class="num">3</span>
                    <span>Choose Lesson Package</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div
                      class="package-card ${this.packageType === '1_hour_private' ? 'selected' : ''}"
                      @click=${() => (this.packageType = '1_hour_private')}
                    >
                      <div>
                        <div class="package-title">1-Hour Private Personal Session</div>
                        <div class="package-sub">Intensive 1-on-1 technique fine-tuning, mixer review & hands-on mixing practice.</div>
                      </div>
                      <div class="package-price-box">
                        <div class="package-price">$100</div>
                        <div class="package-deposit-tag">$50 Deposit to Reserve</div>
                      </div>
                    </div>

                    <div
                      class="package-card ${this.packageType === '2_hours_masterclass' ? 'selected' : ''}"
                      @click=${() => (this.packageType = '2_hours_masterclass')}
                    >
                      <div>
                        <div class="package-title">2-Hour Deep-Dive Masterclass (Recommended)</div>
                        <div class="package-sub">Full comprehensive walkthrough: Pioneer OPUS-QUAD mastery, live stems, set building & recording.</div>
                      </div>
                      <div class="package-price-box">
                        <div class="package-price">$180</div>
                        <div class="package-deposit-tag">$50 Deposit to Reserve</div>
                      </div>
                    </div>

                    <div
                      class="package-card ${this.packageType === '4_weeks_intensive' ? 'selected' : ''}"
                      @click=${() => (this.packageType = '4_weeks_intensive')}
                    >
                      <div>
                        <div class="package-title">4-Week Pro DJ Intensive Program (4 x 90-min Sessions)</div>
                        <div class="package-sub">Complete transformation from beginner to club-ready pro, with demo mix recording and promotion advice.</div>
                      </div>
                      <div class="package-price-box">
                        <div class="package-price">$350</div>
                        <div class="package-deposit-tag">$50 Deposit to Reserve</div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 4: Schedule Date & Time Slot -->
                  <div class="section-title">
                    <span class="num">4</span>
                    <span>LJ Schedule • Date & Time Slot</span>
                  </div>
                  <div class="grid-2">
                    <div class="form-group">
                      <label class="form-label">Preferred Date</label>
                      <input
                        type="date"
                        class="form-input"
                        .value=${this.scheduledDate}
                        @change=${(e: Event) => (this.scheduledDate = (e.target as HTMLInputElement).value)}
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Time Slot</label>
                      <select
                        class="form-select"
                        .value=${this.scheduledTime}
                        @change=${(e: Event) => (this.scheduledTime = (e.target as HTMLSelectElement).value)}
                      >
                        <option value="10:00 AM (Morning Slot)">10:00 AM (Morning Slot)</option>
                        <option value="1:00 PM (Early Afternoon)">1:00 PM (Early Afternoon)</option>
                        <option value="3:30 PM (Mid Afternoon)">3:30 PM (Mid Afternoon)</option>
                        <option value="6:00 PM (Evening Prime)">6:00 PM (Evening Prime)</option>
                        <option value="8:30 PM (Night Masterclass)">8:30 PM (Night Masterclass)</option>
                      </select>
                    </div>
                  </div>

                  <!-- Step 5: Student Contact & Info -->
                  <div class="section-title">
                    <span class="num">5</span>
                    <span>Student Information & Address</span>
                  </div>
                  <div class="grid-2">
                    <div class="form-group">
                      <label class="form-label">Full Name *</label>
                      <input
                        type="text"
                        class="form-input"
                        placeholder="e.g. Alex Rivera"
                        .value=${this.studentName}
                        @input=${(e: Event) => (this.studentName = (e.target as HTMLInputElement).value)}
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Email Address *</label>
                      <input
                        type="email"
                        class="form-input"
                        placeholder="alex@example.com"
                        .value=${this.studentEmail}
                        @input=${(e: Event) => (this.studentEmail = (e.target as HTMLInputElement).value)}
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Phone Number</label>
                      <input
                        type="tel"
                        class="form-input"
                        placeholder="(303) 555-0199"
                        .value=${this.studentPhone}
                        @input=${(e: Event) => (this.studentPhone = (e.target as HTMLInputElement).value)}
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">City / Region in Colorado</label>
                      <input
                        type="text"
                        class="form-input"
                        placeholder="Denver, Boulder, Colorado Springs..."
                        .value=${this.studentCity}
                        @input=${(e: Event) => (this.studentCity = (e.target as HTMLInputElement).value)}
                      />
                    </div>

                    <div class="form-group" style="grid-column: span 2;">
                      <label class="form-label">Lesson Location / Home Address (for Direct-to-You Lessons)</label>
                      <input
                        type="text"
                        class="form-input"
                        placeholder="1234 High St, Denver, CO 80202 (or Online Stream)"
                        .value=${this.locationAddress}
                        @input=${(e: Event) => (this.locationAddress = (e.target as HTMLInputElement).value)}
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Current Experience Level</label>
                      <select
                        class="form-select"
                        .value=${this.experienceLevel}
                        @change=${(e: Event) => (this.experienceLevel = (e.target as HTMLSelectElement).value as any)}
                      >
                        <option value="beginner">Total Beginner (First time touching DJ gear)</option>
                        <option value="intermediate">Intermediate (Know basic beatmatching, want pro polish)</option>
                        <option value="advanced">Advanced (Gigging DJ wanting stems, scratching & OPUS mastery)</option>
                        <option value="professional">Professional (Festival preparation, tour setup)</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">DJ Equipment You Own</label>
                      <input
                        type="text"
                        class="form-input"
                        placeholder="e.g. Pioneer DDJ-FLX4, CDJ-3000, Turntables, or None"
                        .value=${this.gearOwned}
                        @input=${(e: Event) => (this.gearOwned = (e.target as HTMLInputElement).value)}
                      />
                    </div>

                    <div class="form-group" style="grid-column: span 2;">
                      <label class="form-label">Special Requests / Goals / Favorite Artists</label>
                      <input
                        type="text"
                        class="form-input"
                        placeholder="e.g. Want to learn house transitions, prepare a wedding set, or master scratch drops"
                        .value=${this.specialRequests}
                        @input=${(e: Event) => (this.specialRequests = (e.target as HTMLInputElement).value)}
                      />
                    </div>
                  </div>

                  <!-- Step 6: Deposit Summary & Action -->
                  <div class="deposit-summary-box">
                    <div class="summary-row">
                      <span>Instructor:</span>
                      <strong>DJ LOCKJAH (2025 Colorado DJ of the Year)</strong>
                    </div>
                    <div class="summary-row">
                      <span>Package:</span>
                      <span>${pricing.name}</span>
                    </div>
                    <div class="summary-row">
                      <span>Format & Date:</span>
                      <span>${this.delivery === 'direct_to_you_in_person' ? '🚗 Direct to You' : '💻 1-on-1 Online'} • ${this.scheduledDate} (${this.scheduledTime})</span>
                    </div>
                    <div class="summary-row">
                      <span>Total Lesson Fee:</span>
                      <span>$${pricing.total}.00</span>
                    </div>
                    <div class="summary-row total">
                      <span>Reservation Deposit Due Now:</span>
                      <span class="deposit-highlight">$50.00 Deposit</span>
                    </div>
                    <div style="font-size: 0.6875rem; color: rgba(255,255,255,0.7);">
                      * Remaining balance of $${pricing.remaining}.00 is payable directly to DJ LOCKJAH at the time of your lesson.
                    </div>
                  </div>

                  <!-- Button with LJ Schedule -->
                  <button type="submit" class="btn-reserve-time">
                    <span>📅</span>
                    <span>LJ Schedule • Reserve Time & Pay $50 Deposit</span>
                  </button>
                </form>
              `
            : this.activeTab === 'my_bookings'
            ? html`
                <div style="display: flex; flex-direction: column; gap: 14px;">
                  <div style="font-size: 0.875rem; font-weight: 800; color: #fff;">
                    Your Scheduled Lessons with DJ LOCKJAH
                  </div>
                  ${this.savedBookings.length === 0
                    ? html`
                        <div style="padding: 30px; text-align: center; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.02); border-radius: 12px;">
                          No upcoming lessons scheduled yet. Click "LJ Schedule & $50 Deposit Reservation" to reserve your personal session with DJ LOCKJAH!
                        </div>
                      `
                    : html`
                        <div class="booked-list">
                          ${this.savedBookings.map(
                            (b) => html`
                              <div class="booking-item">
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                  <div style="display: flex; align-items: center; gap: 8px;">
                                    <span class="conf-ref-pill">${b.bookingRef}</span>
                                    <span style="font-weight: 900; color: #fff;">${b.studentName}</span>
                                    <span style="font-size: 0.6875rem; background: #3dffab; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 900;">$50 DEPOSIT CONFIRMED</span>
                                  </div>
                                  <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7);">
                                    📅 ${b.scheduledDate} at ${b.scheduledTime} • ${b.delivery === 'direct_to_you_in_person' ? '🚗 Direct to You' : '💻 Online HD'}
                                  </div>
                                  <div style="font-size: 0.6875rem; color: #ffb703;">
                                    Curriculum: ${b.curriculum.replace(/_/g, ' ').toUpperCase()} • Balance due: $${b.remainingBalance}
                                  </div>
                                </div>
                                <div style="display: flex; gap: 6px;">
                                  <button
                                    class="close-btn"
                                    style="font-size: 0.75rem; padding: 6px 10px;"
                                    @click=${() => {
                                      this.latestBooking = b;
                                      this.activeTab = 'confirmation';
                                    }}
                                  >
                                    View Receipt 📄
                                  </button>
                                </div>
                              </div>
                            `
                          )}
                        </div>
                      `}
                </div>
              `
            : html`
                <!-- Confirmation Screen -->
                ${this.latestBooking
                  ? html`
                      <div class="confirmation-view">
                        <div class="conf-icon">🎉</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #3dffab;">
                          DJ Lesson Reserved Successfully!
                        </div>
                        <div class="conf-ref-pill">Booking Ref: ${this.latestBooking.bookingRef}</div>
                        <p style="font-size: 0.8125rem; color: rgba(255,255,255,0.85); max-width: 520px; line-height: 1.4;">
                          Your personal DJ lesson with <strong>DJ LOCKJAH (2025 Colorado DJ of the Year)</strong> has been locked into the schedule with your $50 deposit.
                        </p>

                        <div class="conf-details-card">
                          <div><strong>Student:</strong> ${this.latestBooking.studentName} (${this.latestBooking.studentEmail})</div>
                          <div><strong>Date & Time:</strong> ${this.latestBooking.scheduledDate} at ${this.latestBooking.scheduledTime}</div>
                          <div><strong>Delivery Format:</strong> ${this.latestBooking.delivery === 'direct_to_you_in_person' ? '🚗 Direct to You (Mobile Colorado)' : '💻 1-on-1 Ultra-HD Studio Stream'}</div>
                          <div><strong>Location:</strong> ${this.latestBooking.locationAddress || this.latestBooking.studentCity}</div>
                          <div><strong>Curriculum Focus:</strong> ${this.latestBooking.curriculum.replace(/_/g, ' ').toUpperCase()}</div>
                          <div><strong>Deposit Paid:</strong> <span style="color: #3dffab; font-weight: 900;">$50.00 Deposit (Receipt Confirmed)</span></div>
                          <div><strong>Remaining Balance:</strong> $${this.latestBooking.remainingBalance}.00 (payable at lesson)</div>
                          <div><strong>Direct Instructor Line:</strong> <span style="color: #ffb703;">lessons@idpro.com • djlockjah@idpro.com</span></div>
                        </div>

                        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                          <button
                            class="btn-reserve-time"
                            style="font-size: 0.8125rem; padding: 10px 18px;"
                            @click=${() => {
                              this.dispatchEvent(new CustomEvent('toast', { detail: '🗓️ Lesson details saved to your profile and calendar!' }));
                              this.close();
                            }}
                          >
                            <span>🎧</span>
                            <span>Return to Virtual DJ Workspace</span>
                          </button>

                          <button
                            class="close-btn"
                            style="font-size: 0.8125rem; padding: 10px 16px;"
                            @click=${() => (this.activeTab = 'schedule_form')}
                          >
                            Schedule Another Time
                          </button>
                        </div>
                      </div>
                    `
                  : html``}
              `}
        </div>
      </div>
    `;
  }
}
