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

interface CalendarDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  availableSlots: number;
}

@customElement('dj-lockjah-lessons-section')
export class DjLockjahLessonsSection extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1360px;
      margin: 0 auto;
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .lessons-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 8px 4px 40px 4px;
    }

    /* Hero & Bio Section */
    .bio-hero-card {
      background: linear-gradient(135deg, rgba(26, 20, 36, 0.95) 0%, rgba(18, 18, 28, 0.95) 50%, rgba(32, 22, 14, 0.95) 100%);
      border: 1px solid rgba(255, 183, 3, 0.45);
      border-radius: 20px;
      padding: 24px 28px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 183, 3, 0.12);
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 24px;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .bio-hero-card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(255, 183, 3, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    @media (max-width: 900px) {
      .bio-hero-card {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }

    .instructor-portrait-wrap {
      position: relative;
      width: 110px;
      height: 110px;
      border-radius: 50%;
      padding: 4px;
      background: linear-gradient(135deg, #ffb703 0%, #ff25f6 50%, #2af6de 100%);
      box-shadow: 0 0 25px rgba(255, 183, 3, 0.4);
      margin: 0 auto;
      flex-shrink: 0;
    }

    .instructor-portrait {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #090910;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      border: 2px solid #12121e;
    }

    .award-crown-badge {
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: #ffb703;
      color: #000;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 900;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      border: 2px solid #000;
    }

    .bio-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .award-header-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.25), rgba(255, 77, 79, 0.25));
      border: 1px solid #ffb703;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 900;
      color: #ffdd28;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      width: fit-content;
    }

    @media (max-width: 900px) {
      .award-header-pill {
        margin: 0 auto;
      }
    }

    .instructor-title-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      flex-wrap: wrap;
    }

    @media (max-width: 900px) {
      .instructor-title-row {
        justify-content: center;
      }
    }

    .instructor-name-heading {
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 40%, #ffdd28 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }

    .instructor-role-tag {
      font-size: 0.875rem;
      color: #2af6de;
      font-weight: 800;
    }

    .bio-text {
      font-size: 0.875rem;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.82);
      max-width: 720px;
    }

    .bio-badges-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    @media (max-width: 900px) {
      .bio-badges-row {
        justify-content: center;
      }
    }

    .feature-pill {
      font-size: 0.7rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 4px 10px;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bio-cta-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 183, 3, 0.3);
      border-radius: 14px;
      padding: 16px 20px;
      text-align: center;
      min-width: 180px;
    }

    .deposit-callout-num {
      font-size: 1.75rem;
      font-weight: 900;
      color: #3dffab;
      line-height: 1;
    }

    .deposit-callout-label {
      font-size: 0.6875rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
    }

    /* Main Booking Grid: Calendar & Schedule on Left, Options & Form on Right */
    .booking-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 20px;
    }

    @media (max-width: 1024px) {
      .booking-grid {
        grid-template-columns: 1fr;
      }
    }

    .card-panel {
      background: rgba(18, 18, 28, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 12px;
      gap: 10px;
    }

    .panel-title {
      font-size: 1.05rem;
      font-weight: 900;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    /* Calendar Controls & View */
    .cal-nav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 8px 14px;
    }

    .cal-month-title {
      font-size: 0.9375rem;
      font-weight: 900;
      color: #ffdd28;
      letter-spacing: 0.5px;
    }

    .cal-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.8125rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .cal-btn:hover {
      background: rgba(255, 183, 3, 0.2);
      border-color: #ffb703;
      color: #ffb703;
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      text-align: center;
      font-size: 0.6875rem;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      margin-top: 4px;
    }

    .calendar-days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }

    .cal-day-cell {
      aspect-ratio: 1.1;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }

    .cal-day-cell:hover:not(.past):not(.disabled) {
      background: rgba(255, 183, 3, 0.15);
      border-color: #ffb703;
      transform: translateY(-2px);
    }

    .cal-day-cell.selected {
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.3), rgba(255, 37, 246, 0.25));
      border-color: #ffb703;
      box-shadow: 0 0 14px rgba(255, 183, 3, 0.4);
    }

    .cal-day-cell.past {
      opacity: 0.3;
      cursor: not-allowed;
      background: rgba(0, 0, 0, 0.2);
    }

    .cal-day-cell.other-month {
      opacity: 0.35;
    }

    .cal-day-num {
      font-size: 0.875rem;
      font-weight: 900;
      color: #ffffff;
    }

    .cal-slot-dot {
      font-size: 0.5625rem;
      font-weight: 800;
      color: #3dffab;
      margin-top: 2px;
    }

    .cal-day-cell.selected .cal-day-num {
      color: #ffdd28;
    }

    /* Time Slots Selector */
    .slots-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slots-title {
      font-size: 0.8125rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
    }

    .slot-pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 0.75rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .slot-pill:hover {
      background: rgba(255, 183, 3, 0.12);
      border-color: rgba(255, 183, 3, 0.5);
    }

    .slot-pill.selected {
      background: #ffb703;
      color: #000000;
      border-color: #ffb703;
      font-weight: 900;
      box-shadow: 0 0 12px rgba(255, 183, 3, 0.4);
    }

    /* Packages & Options */
    .option-group-title {
      font-size: 0.8125rem;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }

    .packages-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pkg-choice-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px 14px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      transition: all 0.15s ease;
    }

    .pkg-choice-card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 183, 3, 0.4);
    }

    .pkg-choice-card.selected {
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.15), rgba(255, 37, 246, 0.12));
      border-color: #ffb703;
      box-shadow: 0 0 14px rgba(255, 183, 3, 0.25);
    }

    .pkg-name {
      font-size: 0.8125rem;
      font-weight: 900;
      color: #ffffff;
    }

    .pkg-subtext {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 2px;
    }

    .pkg-price-col {
      text-align: right;
      flex-shrink: 0;
    }

    .pkg-fee {
      font-size: 1rem;
      font-weight: 900;
      color: #ffdd28;
    }

    .pkg-dep {
      font-size: 0.625rem;
      font-weight: 800;
      color: #3dffab;
    }

    /* Form Fields */
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    @media (max-width: 600px) {
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .input-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.75);
    }

    .input-ctrl,
    .select-ctrl {
      font: inherit;
      font-size: 0.8125rem;
      background: #0d0d16;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffffff;
      outline: none;
      transition: all 0.15s;
    }

    .input-ctrl:focus,
    .select-ctrl:focus {
      border-color: #ffb703;
      box-shadow: 0 0 10px rgba(255, 183, 3, 0.3);
    }

    /* Clear Big Book Now Button & Deposit Summary */
    .deposit-checkout-card {
      background: linear-gradient(135deg, rgba(255, 183, 3, 0.12), rgba(61, 255, 171, 0.08));
      border: 1px solid #ffb703;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .checkout-summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
    }

    .checkout-summary-row.total-due {
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 8px;
      font-size: 1.05rem;
      font-weight: 900;
    }

    .btn-book-now-main {
      font: inherit;
      font-size: 1rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ffb703 0%, #ff7b00 50%, #ff25f6 100%);
      color: #000000;
      border: none;
      border-radius: 12px;
      padding: 16px 24px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      transition: all 0.18s ease;
      box-shadow: 0 8px 24px rgba(255, 183, 3, 0.45);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-book-now-main:hover {
      box-shadow: 0 10px 34px rgba(255, 183, 3, 0.8);
      transform: translateY(-2px);
      color: #000000;
    }

    /* Interactive Payment Modal Overlay */
    .payment-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 4, 10, 0.92);
      backdrop-filter: blur(20px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 3000;
      padding: 16px;
      animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalPop {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .payment-dialog {
      background: linear-gradient(180deg, #181826 0%, #0d0d14 100%);
      border: 1px solid #ffb703;
      border-radius: 20px;
      width: 100%;
      max-width: 540px;
      padding: 24px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 183, 3, 0.25);
      display: flex;
      flex-direction: column;
      gap: 16px;
      color: #ffffff;
    }

    .pay-methods-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .pay-method-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 8px 4px;
      font-size: 0.6875rem;
      font-weight: 800;
      color: #ffffff;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
    }

    .pay-method-btn.active {
      background: rgba(255, 183, 3, 0.2);
      border-color: #ffb703;
      color: #ffdd28;
    }

    /* Past Bookings & Testimonials */
    .social-proof-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
      margin-top: 10px;
    }

    .proof-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .proof-quote {
      font-size: 0.75rem;
      font-style: italic;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.4;
    }

    .proof-author {
      font-size: 0.6875rem;
      font-weight: 900;
      color: #ffdd28;
    }
  `;

  // Calendar State
  @state() private currentCalendarDate: Date = new Date();
  @state() private selectedDateString: string = '';
  @state() private selectedTimeSlot: string = '2:00 PM (Afternoon)';

  // Lesson Configuration State
  @state() private delivery: DjLessonDelivery = 'direct_to_you_in_person';
  @state() private curriculum: DjLessonCurriculum = 'opus_quad_cdj_mastery';
  @state() private packageType: DjLessonPackage = '1_hour_private';
  @state() private experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional' = 'beginner';

  // Student Info
  @state() private studentName = '';
  @state() private studentEmail = '';
  @state() private studentPhone = '';
  @state() private studentCity = 'Denver, CO';
  @state() private studentAddress = '';
  @state() private gearOwned = 'Pioneer DJ / Controller (or requested gear)';
  @state() private specialRequests = '';

  // Payment Flow State
  @state() private isPaymentModalOpen = false;
  @state() private selectedPaymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'cash_app' = 'card';
  @state() private isProcessingPayment = false;
  @state() private isPaymentSuccess = false;
  @state() private confirmedBooking: DjLessonBooking | null = null;

  // Credit Card Inputs for payment flow
  @state() private cardNumber = '•••• •••• •••• 4242';
  @state() private cardExp = '08/28';
  @state() private cardCvc = '888';
  @state() private cardZip = '80202';

  override connectedCallback() {
    super.connectedCallback();
    this.initDefaultDateSelection();
  }

  private initDefaultDateSelection() {
    const today = new Date();
    today.setDate(today.getDate() + 2); // Default 2 days ahead
    this.selectedDateString = today.toISOString().split('T')[0];
  }

  private getMonthDays(): CalendarDay[] {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prev month padding
    for (let i = firstDayIndex; i > 0; i--) {
      const d = new Date(year, month - 1, prevLastDate - i + 1);
      const isPast = d < today;
      days.push({
        date: d,
        dateString: d.toISOString().split('T')[0],
        dayNumber: prevLastDate - i + 1,
        isCurrentMonth: false,
        isToday: false,
        isPast,
        availableSlots: isPast ? 0 : 3,
      });
    }

    // Current month
    for (let i = 1; i <= lastDate; i++) {
      const d = new Date(year, month, i);
      const isToday = d.getTime() === today.getTime();
      const isPast = d < today;
      days.push({
        date: d,
        dateString: d.toISOString().split('T')[0],
        dayNumber: i,
        isCurrentMonth: true,
        isToday,
        isPast,
        availableSlots: isPast ? 0 : (i % 3 === 0 ? 2 : 4),
      });
    }

    // Next month padding to fill 35 or 42 grid
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateString: d.toISOString().split('T')[0],
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
        availableSlots: 3,
      });
    }

    return days;
  }

  private prevMonth() {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() - 1,
      1
    );
  }

  private nextMonth() {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() + 1,
      1
    );
  }

  private getPricing() {
    switch (this.packageType) {
      case '1_hour_private':
        return { total: 100, deposit: 50, remaining: 50, name: '1-Hour Private Personal Lesson' };
      case '2_hours_masterclass':
        return { total: 180, deposit: 50, remaining: 130, name: '2-Hour Deep-Dive Masterclass' };
      case '4_weeks_intensive':
        return { total: 350, deposit: 50, remaining: 300, name: '4-Week Pro DJ Intensive Program' };
    }
  }

  private handleTriggerBookingFlow() {
    if (!this.studentName.trim()) {
      this.dispatchEvent(new CustomEvent('toast', { detail: 'Please enter your name for the lesson booking.' }));
      return;
    }
    if (!this.studentEmail.trim()) {
      this.dispatchEvent(new CustomEvent('toast', { detail: 'Please provide an email address for your confirmation.' }));
      return;
    }

    this.isPaymentModalOpen = true;
    this.isPaymentSuccess = false;
  }

  private handleExecuteDepositPayment() {
    this.isProcessingPayment = true;

    setTimeout(() => {
      this.isProcessingPayment = false;
      this.isPaymentSuccess = true;

      const pricing = this.getPricing();
      const randomRef = Math.floor(1000 + Math.random() * 9000);
      const bookingRef = `LOCKJAH-CO-2025-${randomRef}`;

      const newBooking: DjLessonBooking = {
        id: `booking-${Date.now()}`,
        bookingRef,
        createdAt: Date.now(),
        studentName: this.studentName,
        studentEmail: this.studentEmail,
        studentPhone: this.studentPhone || '(555) 019-2025',
        studentCity: this.studentCity,
        locationAddress: this.studentAddress || 'Direct to Student Location',
        curriculum: this.curriculum,
        delivery: this.delivery,
        packageType: this.packageType,
        scheduledDate: this.selectedDateString,
        scheduledTime: this.selectedTimeSlot,
        experienceLevel: this.experienceLevel,
        gearOwned: this.gearOwned,
        specialRequests: this.specialRequests,
        totalFee: pricing.total,
        depositPaid: 50, // $50 deposit
        remainingBalance: pricing.remaining,
        status: 'confirmed',
        instructor: 'DJ LOCKJAH (2025 Colorado DJ of the Year)',
      };

      this.confirmedBooking = newBooking;

      // Save to localStorage
      try {
        const stored = localStorage.getItem('idj_djlockjah_bookings');
        const list: DjLessonBooking[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem('idj_djlockjah_bookings', JSON.stringify([newBooking, ...list]));
      } catch (e) {
        console.warn('Could not save booking', e);
      }

      this.dispatchEvent(
        new CustomEvent('toast', {
          detail: `🎉 $50 Deposit Authorized! Lesson Booked with DJ LOCKJAH (${bookingRef})`,
          bubbles: true,
          composed: true,
        })
      );
    }, 1200);
  }

  override render() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthLabel = `${monthNames[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;
    const pricing = this.getPricing();
    const days = this.getMonthDays();

    const timeSlots = [
      { slot: '10:00 AM', label: 'Morning Slot' },
      { slot: '1:00 PM', label: 'Early Afternoon' },
      { slot: '3:30 PM', label: 'Mid Afternoon' },
      { slot: '6:00 PM', label: 'Evening Prime' },
      { slot: '8:30 PM', label: 'Night Masterclass' },
    ];

    return html`
      <div class="lessons-container">
        <!-- Brief Bio & Instructor Hero for DJ LOCKJAH (2025 Colorado DJ of the Year) -->
        <div class="bio-hero-card">
          <div class="instructor-portrait-wrap">
            <div class="instructor-portrait">🎧</div>
            <div class="award-crown-badge" title="2025 Colorado DJ of the Year">🏆</div>
          </div>

          <div class="bio-details">
            <div class="award-header-pill">
              <span>★ 2025 Colorado DJ of the Year Award Recipient</span>
            </div>
            <div class="instructor-title-row">
              <h1 class="instructor-name-heading">DJ LOCKJAH</h1>
              <span class="instructor-role-tag">• Official Pioneer DJ & rekordbox Master Coach</span>
            </div>
            <div class="bio-text">
              Winner of the <strong>2025 Colorado DJ of the Year</strong> award, DJ LOCKJAH brings over 15 years of legendary Red Rocks, Denver nightlife, and festival performance expertise directly to your fingertips. Whether you are learning your very first beatmatch on the Pioneer OPUS-QUAD, mastering 4-way neural stem separation, or honing world-class turntablism scratch techniques, DJ LOCKJAH delivers customized, private 1-on-1 instruction traveling direct to your Colorado address or streaming live via Ultra-HD multi-cam studio feeds.
            </div>
            <div class="bio-badges-row">
              <span class="feature-pill">🚗 Mobile Direct to You (Denver, Boulder, Springs, Mountains)</span>
              <span class="feature-pill">💻 1-on-1 Ultra-HD Studio Stream</span>
              <span class="feature-pill">🎚️ Pioneer OPUS-QUAD, CDJ-3000 & DJM-A9</span>
              <span class="feature-pill">🎤 4-Way Neural Stems & Acapella Drops</span>
            </div>
          </div>

          <div class="bio-cta-box">
            <div class="deposit-callout-num">$50</div>
            <div class="deposit-callout-label">Deposit to Reserve</div>
            <div style="font-size: 0.625rem; color: rgba(255,255,255,0.6);">Remaining balance paid at lesson</div>
          </div>
        </div>

        <!-- Main Booking Grid: Interactive Calendar & Schedule Form -->
        <div class="booking-grid">
          <!-- Left Column: Interactive Booking Calendar Interface -->
          <div class="card-panel">
            <div class="panel-header">
              <h2 class="panel-title">
                <span>📅</span>
                <span>Interactive Booking Calendar</span>
              </h2>
              <span style="font-size: 0.75rem; color: #3dffab; font-weight: 800;">
                ● Live Slot Availability
              </span>
            </div>

            <!-- Month / Year Navigation -->
            <div class="cal-nav-bar">
              <button class="cal-btn" @click=${this.prevMonth} title="Previous Month">◀ Prev</button>
              <span class="cal-month-title">${currentMonthLabel}</span>
              <button class="cal-btn" @click=${this.nextMonth} title="Next Month">Next ▶</button>
            </div>

            <!-- Weekday Headers -->
            <div class="calendar-weekdays">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <!-- Calendar Days Grid -->
            <div class="calendar-days-grid">
              ${days.map(
                (d) => html`
                  <div
                    class="cal-day-cell ${d.isCurrentMonth ? '' : 'other-month'} ${d.isPast ? 'past' : ''} ${this.selectedDateString === d.dateString ? 'selected' : ''}"
                    @click=${() => {
                      if (!d.isPast) {
                        this.selectedDateString = d.dateString;
                      }
                    }}
                  >
                    <span class="cal-day-num">${d.dayNumber}</span>
                    ${!d.isPast && d.availableSlots > 0
                      ? html`<span class="cal-slot-dot">${d.availableSlots} open</span>`
                      : d.isPast
                      ? html``
                      : html`<span style="font-size: 0.5rem; color: #ff4d4f;">booked</span>`}
                  </div>
                `
              )}
            </div>

            <!-- Time Slots for Selected Date -->
            <div class="slots-container">
              <div class="slots-title">
                <span>Available Time Slots for <strong>${this.selectedDateString || 'Selected Date'}</strong>:</span>
                <span style="color: #ffdd28; font-size: 0.75rem;">DJ LOCKJAH Schedule</span>
              </div>
              <div class="slots-grid">
                ${timeSlots.map(
                  (ts) => html`
                    <div
                      class="slot-pill ${this.selectedTimeSlot.startsWith(ts.slot) ? 'selected' : ''}"
                      @click=${() => (this.selectedTimeSlot = `${ts.slot} (${ts.label})`)}
                    >
                      <span>${ts.slot}</span>
                      <span style="font-size: 0.625rem; opacity: 0.8;">${ts.label}</span>
                    </div>
                  `
                )}
              </div>
            </div>

            <!-- Lesson Format / Delivery -->
            <div>
              <div class="option-group-title">
                <span>📍</span>
                <span>Select Lesson Location Format</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
                <div
                  class="pkg-choice-card ${this.delivery === 'direct_to_you_in_person' ? 'selected' : ''}"
                  @click=${() => (this.delivery = 'direct_to_you_in_person')}
                >
                  <div>
                    <div class="pkg-name">🚗 Direct to You</div>
                    <div class="pkg-subtext">Mobile in-person anywhere in Colorado</div>
                  </div>
                </div>

                <div
                  class="pkg-choice-card ${this.delivery === 'online_studio_hd' ? 'selected' : ''}"
                  @click=${() => (this.delivery = 'online_studio_hd')}
                >
                  <div>
                    <div class="pkg-name">💻 Ultra-HD Studio Stream</div>
                    <div class="pkg-subtext">1-on-1 multi-cam direct stream</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Package Selection, Student Details & $50 Book Now Flow -->
          <div class="card-panel">
            <div class="panel-header">
              <h2 class="panel-title">
                <span>🎛️</span>
                <span>Lesson Details & $50 Deposit</span>
              </h2>
              <span class="award-header-pill" style="font-size: 0.65rem; padding: 2px 8px;">
                Direct Booking
              </span>
            </div>

            <!-- Choose Lesson Package -->
            <div>
              <div class="option-group-title">
                <span>🎓</span>
                <span>Select Training Package</span>
              </div>
              <div class="packages-stack" style="margin-top: 6px;">
                <div
                  class="pkg-choice-card ${this.packageType === '1_hour_private' ? 'selected' : ''}"
                  @click=${() => (this.packageType = '1_hour_private')}
                >
                  <div>
                    <div class="pkg-name">1-Hour Private Personal Session</div>
                    <div class="pkg-subtext">Intensive technique coaching, mixer setup & transitions</div>
                  </div>
                  <div class="pkg-price-col">
                    <div class="pkg-fee">$100</div>
                    <div class="pkg-dep">$50 Deposit</div>
                  </div>
                </div>

                <div
                  class="pkg-choice-card ${this.packageType === '2_hours_masterclass' ? 'selected' : ''}"
                  @click=${() => (this.packageType = '2_hours_masterclass')}
                >
                  <div>
                    <div class="pkg-name">2-Hour Deep-Dive Masterclass ⭐</div>
                    <div class="pkg-subtext">OPUS-QUAD mastery, live stems, Camelot harmonics & recording</div>
                  </div>
                  <div class="pkg-price-col">
                    <div class="pkg-fee">$180</div>
                    <div class="pkg-dep">$50 Deposit</div>
                  </div>
                </div>

                <div
                  class="pkg-choice-card ${this.packageType === '4_weeks_intensive' ? 'selected' : ''}"
                  @click=${() => (this.packageType = '4_weeks_intensive')}
                >
                  <div>
                    <div class="pkg-name">4-Week Pro DJ Intensive Program</div>
                    <div class="pkg-subtext">4 x 90-min sessions from fundamentals to club demo mix</div>
                  </div>
                  <div class="pkg-price-col">
                    <div class="pkg-fee">$350</div>
                    <div class="pkg-dep">$50 Deposit</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Student Contact Form -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="option-group-title">
                <span>👤</span>
                <span>Student Information</span>
              </div>
              <div class="form-grid-2">
                <div class="input-group">
                  <label class="input-label">Student Name *</label>
                  <input
                    type="text"
                    class="input-ctrl"
                    placeholder="e.g. Jordan Miller"
                    .value=${this.studentName}
                    @input=${(e: Event) => (this.studentName = (e.target as HTMLInputElement).value)}
                    required
                  />
                </div>

                <div class="input-group">
                  <label class="input-label">Email Address *</label>
                  <input
                    type="email"
                    class="input-ctrl"
                    placeholder="jordan@example.com"
                    .value=${this.studentEmail}
                    @input=${(e: Event) => (this.studentEmail = (e.target as HTMLInputElement).value)}
                    required
                  />
                </div>

                <div class="input-group">
                  <label class="input-label">Phone Number</label>
                  <input
                    type="tel"
                    class="input-ctrl"
                    placeholder="(303) 555-0199"
                    .value=${this.studentPhone}
                    @input=${(e: Event) => (this.studentPhone = (e.target as HTMLInputElement).value)}
                  />
                </div>

                <div class="input-group">
                  <label class="input-label">Colorado City / Area</label>
                  <input
                    type="text"
                    class="input-ctrl"
                    placeholder="Denver, Boulder, Springs..."
                    .value=${this.studentCity}
                    @input=${(e: Event) => (this.studentCity = (e.target as HTMLInputElement).value)}
                  />
                </div>

                <div class="input-group" style="grid-column: span 2;">
                  <label class="input-label">Street Address (for Direct-to-You Lessons)</label>
                  <input
                    type="text"
                    class="input-ctrl"
                    placeholder="1234 Larimer St, Denver, CO (or Online)"
                    .value=${this.studentAddress}
                    @input=${(e: Event) => (this.studentAddress = (e.target as HTMLInputElement).value)}
                  />
                </div>

                <div class="input-group" style="grid-column: span 2;">
                  <label class="input-label">Curriculum Focus</label>
                  <select
                    class="select-ctrl"
                    .value=${this.curriculum}
                    @change=${(e: Event) => (this.curriculum = (e.target as HTMLSelectElement).value as any)}
                  >
                    <option value="opus_quad_cdj_mastery">Pioneer OPUS-QUAD & CDJ-3000 Standalone Mastery</option>
                    <option value="stems_live_mashups">Real-Time 4-Way Neural Stems & Live Mashups</option>
                    <option value="club_mixing_fundamentals">Club Beatmatching & Camelot Harmonics</option>
                    <option value="turntablism_scratching">Turntablism, Scratching & Performance Pads</option>
                    <option value="open_format_crowd_reading">Open-Format DJing & Reading the Crowd</option>
                    <option value="sound_system_hardware">Sound System Engineering & PA Crossovers</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Clear $50 Deposit Checkout Box & Big Book Now Button -->
            <div class="deposit-checkout-card">
              <div class="checkout-summary-row">
                <span>Selected Date & Time:</span>
                <strong>${this.selectedDateString} at ${this.selectedTimeSlot}</strong>
              </div>
              <div class="checkout-summary-row">
                <span>Instructor:</span>
                <span>DJ LOCKJAH (2025 CO DJ of the Year)</span>
              </div>
              <div class="checkout-summary-row">
                <span>Package Total:</span>
                <span>$${pricing.total}.00</span>
              </div>
              <div class="checkout-summary-row total-due">
                <span>Deposit Due Today:</span>
                <span style="color: #3dffab; font-size: 1.25rem;">$50.00 Deposit</span>
              </div>
              <div style="font-size: 0.6875rem; color: rgba(255,255,255,0.7);">
                * Balance of $${pricing.remaining}.00 payable directly to DJ LOCKJAH at your lesson.
              </div>

              <!-- Clear 'Book Now' Button -->
              <button
                class="btn-book-now-main"
                @click=${this.handleTriggerBookingFlow}
                title="Book Now • Pay $50 Deposit with DJ LOCKJAH"
              >
                <span>📅</span>
                <span>Book Now • Pay $50 Deposit</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Student Praise & Social Proof -->
        <div class="social-proof-strip">
          <div class="proof-card">
            <div class="proof-quote">
              "Lockjah came straight to my house in Denver with a Pioneer rig. In 2 hours I learned more about phrase mixing and 4-way stems than a year of watching YouTube videos."
            </div>
            <div class="proof-author">— Marcus T. (Denver, CO)</div>
          </div>

          <div class="proof-card">
            <div class="proof-quote">
              "Hands down the best DJ coach in Colorado. Helped me program my Rekordbox USBs and nail my first club residency set at Church Nightclub."
            </div>
            <div class="proof-author">— Elena S. (Boulder, CO)</div>
          </div>

          <div class="proof-card">
            <div class="proof-quote">
              "2025 Colorado DJ of the Year for a reason. Clear, patient, and unlocks scratch transitions on motorized turntables effortlessly."
            </div>
            <div class="proof-author">— David K. (Fort Collins, CO)</div>
          </div>
        </div>

        <!-- Interactive $50 Payment Flow Modal -->
        ${this.isPaymentModalOpen
          ? html`
              <div
                class="payment-modal-overlay"
                @click=${(e: MouseEvent) => {
                  if (e.target === e.currentTarget && !this.isProcessingPayment) {
                    this.isPaymentModalOpen = false;
                  }
                }}
              >
                <div class="payment-dialog">
                  ${!this.isPaymentSuccess
                    ? html`
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                          <div>
                            <div class="award-header-pill" style="font-size: 0.65rem; padding: 2px 8px;">
                              Secure $50 Deposit Authorization
                            </div>
                            <h3 style="margin: 4px 0 0 0; font-size: 1.25rem; font-weight: 900; color: #fff;">
                              Reserve Time with DJ LOCKJAH
                            </h3>
                          </div>
                          <button
                            class="cal-btn"
                            @click=${() => (this.isPaymentModalOpen = false)}
                            style="padding: 4px 8px;"
                          >
                            ✕
                          </button>
                        </div>

                        <!-- Summary Pill -->
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; font-size: 0.8125rem; display: flex; justify-content: space-between; align-items: center;">
                          <div>
                            <div><strong>${this.studentName}</strong> • ${pricing.name}</div>
                            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">
                              📅 ${this.selectedDateString} at ${this.selectedTimeSlot} (${this.delivery === 'direct_to_you_in_person' ? '🚗 Direct to You' : '💻 Online HD'})
                            </div>
                          </div>
                          <div style="font-size: 1.3rem; font-weight: 900; color: #3dffab;">
                            $50.00
                          </div>
                        </div>

                        <!-- Payment Method Selector -->
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                          <label style="font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.7);">
                            Select Payment Method for $50 Deposit
                          </label>
                          <div class="pay-methods-grid">
                            <button
                              class="pay-method-btn ${this.selectedPaymentMethod === 'card' ? 'active' : ''}"
                              @click=${() => (this.selectedPaymentMethod = 'card')}
                            >
                              💳 Card
                            </button>
                            <button
                              class="pay-method-btn ${this.selectedPaymentMethod === 'apple_pay' ? 'active' : ''}"
                              @click=${() => (this.selectedPaymentMethod = 'apple_pay')}
                            >
                               Apple Pay
                            </button>
                            <button
                              class="pay-method-btn ${this.selectedPaymentMethod === 'google_pay' ? 'active' : ''}"
                              @click=${() => (this.selectedPaymentMethod = 'google_pay')}
                            >
                              G Pay
                            </button>
                            <button
                              class="pay-method-btn ${this.selectedPaymentMethod === 'cash_app' ? 'active' : ''}"
                              @click=${() => (this.selectedPaymentMethod = 'cash_app')}
                            >
                              $ Cash App
                            </button>
                          </div>
                        </div>

                        <!-- Card Details -->
                        ${this.selectedPaymentMethod === 'card'
                          ? html`
                              <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div class="input-group">
                                  <label class="input-label">Card Number</label>
                                  <input
                                    type="text"
                                    class="input-ctrl"
                                    .value=${this.cardNumber}
                                    @input=${(e: Event) => (this.cardNumber = (e.target as HTMLInputElement).value)}
                                  />
                                </div>
                                <div class="form-grid-2">
                                  <div class="input-group">
                                    <label class="input-label">Expires</label>
                                    <input
                                      type="text"
                                      class="input-ctrl"
                                      .value=${this.cardExp}
                                      @input=${(e: Event) => (this.cardExp = (e.target as HTMLInputElement).value)}
                                    />
                                  </div>
                                  <div class="input-group">
                                    <label class="input-label">CVC / CVV</label>
                                    <input
                                      type="text"
                                      class="input-ctrl"
                                      .value=${this.cardCvc}
                                      @input=${(e: Event) => (this.cardCvc = (e.target as HTMLInputElement).value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            `
                          : html`
                              <div style="background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2); border-radius: 10px; padding: 20px; text-align: center; font-size: 0.8125rem; color: #ffdd28;">
                                Ready to authorize $50.00 deposit via ${this.selectedPaymentMethod.replace('_', ' ').toUpperCase()}
                              </div>
                            `}

                        <div style="font-size: 0.6875rem; color: rgba(255,255,255,0.55); text-align: center;">
                          🔒 256-bit encrypted SSL checkout • Instant receipt issued & added to DJ LOCKJAH schedule.
                        </div>

                        <!-- Action Button -->
                        <button
                          class="btn-book-now-main"
                          ?disabled=${this.isProcessingPayment}
                          @click=${this.handleExecuteDepositPayment}
                        >
                          <span>${this.isProcessingPayment ? '⏳' : '🔒'}</span>
                          <span>
                            ${this.isProcessingPayment
                              ? 'Authorizing $50.00 Deposit...'
                              : 'Authorize & Pay $50 Deposit Now'}
                          </span>
                        </button>
                      `
                    : html`
                        <!-- Payment Success State -->
                        <div style="text-align: center; display: flex; flex-direction: column; gap: 14px; align-items: center; padding: 10px 0;">
                          <div style="font-size: 3rem;">🎉</div>
                          <h3 style="margin: 0; font-size: 1.4rem; font-weight: 900; color: #3dffab;">
                            $50 Deposit Confirmed!
                          </h3>
                          <div style="font-family: monospace; background: rgba(61,255,171,0.15); border: 1px solid #3dffab; color: #3dffab; padding: 4px 12px; border-radius: 20px; font-weight: 900;">
                            ${this.confirmedBooking?.bookingRef}
                          </div>
                          <p style="font-size: 0.8125rem; color: rgba(255,255,255,0.85); line-height: 1.4; margin: 0;">
                            Your private DJ lesson with <strong>DJ LOCKJAH (2025 Colorado DJ of the Year)</strong> is officially locked in for <strong>${this.confirmedBooking?.scheduledDate}</strong> at <strong>${this.confirmedBooking?.scheduledTime}</strong>.
                          </p>

                          <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; width: 100%; text-align: left; font-size: 0.75rem; display: flex; flex-direction: column; gap: 6px;">
                            <div><strong>Student:</strong> ${this.confirmedBooking?.studentName} (${this.confirmedBooking?.studentEmail})</div>
                            <div><strong>Format:</strong> ${this.confirmedBooking?.delivery === 'direct_to_you_in_person' ? '🚗 Direct to You (Mobile Colorado)' : '💻 1-on-1 Ultra-HD Studio Stream'}</div>
                            <div><strong>Location:</strong> ${this.confirmedBooking?.locationAddress || this.confirmedBooking?.studentCity}</div>
                            <div><strong>Deposit Paid:</strong> <span style="color: #3dffab; font-weight: 900;">$50.00 (Authorized)</span></div>
                            <div><strong>Remaining Balance:</strong> $${this.confirmedBooking?.remainingBalance}.00</div>
                          </div>

                          <button
                            class="btn-book-now-main"
                            style="width: 100%;"
                            @click=${() => {
                              this.isPaymentModalOpen = false;
                            }}
                          >
                            <span>🎧</span>
                            <span>Back to DJ Workspace</span>
                          </button>
                        </div>
                      `}
                </div>
              </div>
            `
          : html``}
      </div>
    `;
  }
}
