/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SerializedDjSession } from '../types';

const STORAGE_KEY = 'idpro_opus_quad_session_v2';

/**
 * Service for local session checkpointing & state serialization.
 * Allows remote DJs to instantly recover active stem layers, loop states, fader levels,
 * loaded tracks, and genre weights upon accidental page refresh or network reconnect.
 */
export class SessionStorageService {
  private static instance: SessionStorageService | null = null;
  private saveDebounceTimer: number | null = null;

  public static getInstance(): SessionStorageService {
    if (!SessionStorageService.instance) {
      SessionStorageService.instance = new SessionStorageService();
    }
    return SessionStorageService.instance;
  }

  /**
   * Save the current DJ performance session state (debounced).
   */
  public saveSessionDebounced(session: SerializedDjSession, delayMs = 600): void {
    if (typeof window === 'undefined') return;

    if (this.saveDebounceTimer !== null) {
      window.clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = window.setTimeout(() => {
      this.saveSessionImmediate(session);
      this.saveDebounceTimer = null;
    }, delayMs);
  }

  /**
   * Save session immediately without debounce.
   */
  public saveSessionImmediate(session: SerializedDjSession): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    try {
      const payload: SerializedDjSession = {
        ...session,
        savedAt: Date.now(),
        version: 2,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      // Storage quota or private mode restriction
      return false;
    }
  }

  /**
   * Load checkpointed session from localStorage if available.
   */
  public loadSession(): SerializedDjSession | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as SerializedDjSession;
      if (!parsed || !parsed.decks || !parsed.deckStems) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Check if a saved session checkpoint exists.
   */
  public hasSavedSession(): boolean {
    return this.loadSession() !== null;
  }

  /**
   * Get timestamp of last saved checkpoint.
   */
  public getSavedSessionTimestamp(): number | null {
    const session = this.loadSession();
    return session ? session.savedAt : null;
  }

  /**
   * Clear saved session checkpoint.
   */
  public clearSession(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
