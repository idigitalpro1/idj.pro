/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CustomDecal, UserProfile } from '../types';

export const BUILTIN_DECALS: CustomDecal[] = [
  {
    id: 'decal-idpro-neon',
    name: 'iDpro Holographic Neon',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="195" fill="%230c0c14" stroke="%23ff25f6" stroke-width="6"/><circle cx="200" cy="200" r="160" fill="none" stroke="%232af6de" stroke-width="2" stroke-dasharray="8 6"/><circle cx="200" cy="200" r="120" fill="%23140a24" stroke="%239900ff" stroke-width="4"/><text x="200" y="165" font-family="system-ui,sans-serif" font-size="28" font-weight="900" fill="%23ff25f6" text-anchor="middle" letter-spacing="4">iDj.pro</text><text x="200" y="195" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="%232af6de" text-anchor="middle" letter-spacing="2">BY IDPRO.COM</text><text x="200" y="240" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="%23ffffff" opacity="0.7" text-anchor="middle">33⅓ RPM • STEREO MASTER</text><circle cx="200" cy="200" r="22" fill="%23050508" stroke="%23ff25f6" stroke-width="3"/><circle cx="200" cy="200" r="8" fill="%23ffffff"/></svg>',
    type: 'vinyl_label',
    isBuiltIn: true,
    category: 'Signature',
  },
  {
    id: 'decal-cyber-grid',
    name: 'Cyberpunk Violet Slipmat',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="195" fill="%231a0033" stroke="%239900ff" stroke-width="8"/><circle cx="200" cy="200" r="150" fill="none" stroke="%23ff25f6" stroke-width="3"/><circle cx="200" cy="200" r="90" fill="%232d004d" stroke="%23ffdd28" stroke-width="4"/><path d="M50 200 H350 M200 50 V350" stroke="%235200ff" stroke-width="2" opacity="0.4"/><text x="200" y="190" font-family="system-ui,sans-serif" font-size="24" font-weight="900" fill="%23ffdd28" text-anchor="middle">CYBERPUNK</text><text x="200" y="215" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="%233dffab" text-anchor="middle">iDpro DSP SLIPMAT</text><circle cx="200" cy="200" r="15" fill="%23000" stroke="%23ff25f6" stroke-width="2"/></svg>',
    type: 'slipmat',
    isBuiltIn: true,
    category: 'Electronic',
  },
  {
    id: 'decal-gold-edition',
    name: 'iDpro.com Gold Edition',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="195" fill="%231c1708" stroke="%23ffd700" stroke-width="7"/><circle cx="200" cy="200" r="140" fill="none" stroke="%23d4af37" stroke-width="2" stroke-dasharray="12 4"/><circle cx="200" cy="200" r="100" fill="%232b210a" stroke="%23ffd700" stroke-width="3"/><text x="200" y="170" font-family="system-ui,sans-serif" font-size="26" font-weight="900" fill="%23ffd700" text-anchor="middle" letter-spacing="3">GOLD MASTER</text><text x="200" y="195" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="%23ffffff" text-anchor="middle">iDpro DIGITAL PRO</text><text x="200" y="235" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="%23d4af37" text-anchor="middle">HI-RES AUDIO HIJACK 96kHz</text><circle cx="200" cy="200" r="18" fill="%230c0a03" stroke="%23ffd700" stroke-width="3"/></svg>',
    type: 'vinyl_label',
    isBuiltIn: true,
    category: 'Luxury',
  },
  {
    id: 'decal-tokyo-drive',
    name: 'Tokyo Midnight Drive',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="195" fill="%2308101a" stroke="%232af6de" stroke-width="6"/><circle cx="200" cy="200" r="130" fill="%230f1c2e" stroke="%23ff25f6" stroke-width="3"/><text x="200" y="165" font-family="system-ui,sans-serif" font-size="26" font-weight="900" fill="%232af6de" text-anchor="middle">TOKYO MIDNIGHT</text><text x="200" y="190" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="%23ff25f6" text-anchor="middle">SYNTHWAVE 128 BPM</text><text x="200" y="240" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="%23ffffff" opacity="0.6" text-anchor="middle">idpro.com • VIRTUAL DECK</text><circle cx="200" cy="200" r="16" fill="%23040910" stroke="%232af6de" stroke-width="2"/></svg>',
    type: 'vinyl_label',
    isBuiltIn: true,
    category: 'Synthwave',
  },
  {
    id: 'decal-acid-bass',
    name: 'Acid 303 Smiley Platter',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="195" fill="%23ffdd28" stroke="%23000000" stroke-width="8"/><circle cx="145" cy="150" r="22" fill="%23000000"/><circle cx="255" cy="150" r="22" fill="%23000000"/><path d="M110 215 Q200 320 290 215" stroke="%23000000" stroke-width="18" fill="none" stroke-linecap="round"/><text x="200" y="95" font-family="system-ui,sans-serif" font-size="24" font-weight="900" fill="%23000000" text-anchor="middle">iDj.pro ACID 303</text><circle cx="200" cy="200" r="18" fill="%23000000"/></svg>',
    type: 'slipmat',
    isBuiltIn: true,
    category: 'Acid House',
  }
];

const USER_STORAGE_KEY = 'idj_pro_user_profile';

export class AuthService extends EventTarget {
  private static instance: AuthService;
  private currentProfile: UserProfile;

  private constructor() {
    super();
    this.currentProfile = this.loadStoredProfile() || this.createGuestProfile();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public getProfile(): UserProfile {
    return this.currentProfile;
  }

  public createGuestProfile(): UserProfile {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guest: UserProfile = {
      id: `guest-${Date.now()}-${randomSuffix}`,
      name: `Guest DJ ${randomSuffix}`,
      djAlias: `DJ Guest #${randomSuffix}`,
      email: `guest${randomSuffix}@idpro.com`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=idjpro-${randomSuffix}`,
      isGuest: true,
      bio: 'Live mixing with iDj.pro by idpro.com with multi-source audio hijack.',
      genre: 'Electronic / Bass / House',
      socials: {
        spotify: 'https://spotify.com',
        soundcloud: 'https://soundcloud.com',
        mixcloud: 'https://mixcloud.com',
        instagram: '',
      },
      customDecals: [...BUILTIN_DECALS],
      createdAt: Date.now(),
    };
    this.saveProfile(guest);
    return guest;
  }

  public updateProfile(updates: Partial<UserProfile>): UserProfile {
    this.currentProfile = {
      ...this.currentProfile,
      ...updates,
    };
    this.saveProfile(this.currentProfile);
    this.dispatchEvent(new CustomEvent('profile-changed', { detail: this.currentProfile }));
    return this.currentProfile;
  }

  public loginWithGoogle(mockUserData?: { name: string; email: string; avatarUrl?: string }): UserProfile {
    const name = mockUserData?.name || 'Pro Sound Engineer';
    const email = mockUserData?.email || 'user@idpro.com';
    const djAlias = name.split(' ')[0] ? `DJ ${name.split(' ')[0]}` : 'DJ iDpro';
    const avatarUrl = mockUserData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

    this.currentProfile = {
      ...this.currentProfile,
      id: `google-${Date.now()}`,
      name,
      djAlias,
      email,
      avatarUrl,
      isGuest: false,
      createdAt: this.currentProfile.createdAt || Date.now(),
    };

    this.saveProfile(this.currentProfile);
    this.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.currentProfile }));
    return this.currentProfile;
  }

  public logout(): UserProfile {
    this.currentProfile = this.createGuestProfile();
    this.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.currentProfile }));
    return this.currentProfile;
  }

  public addCustomDecal(decal: Omit<CustomDecal, 'id'>): CustomDecal {
    const newDecal: CustomDecal = {
      ...decal,
      id: `custom-decal-${Date.now()}`,
      isBuiltIn: false,
    };
    const decals = [...(this.currentProfile.customDecals || []), newDecal];
    this.updateProfile({ customDecals: decals });
    return newDecal;
  }

  public removeCustomDecal(decalId: string) {
    const decals = (this.currentProfile.customDecals || []).filter(d => d.id !== decalId || d.isBuiltIn);
    this.updateProfile({ customDecals: decals });
  }

  private loadStoredProfile(): UserProfile | null {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        // ensure default decals are present
        const decalMap = new Map<string, CustomDecal>();
        BUILTIN_DECALS.forEach(d => decalMap.set(d.id, d));
        if (parsed.customDecals) {
          parsed.customDecals.forEach(d => decalMap.set(d.id, d));
        }
        parsed.customDecals = Array.from(decalMap.values());
        return parsed;
      }
    } catch {
      // ignore JSON errors
    }
    return null;
  }

  private saveProfile(profile: UserProfile) {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore quota errors
    }
  }
}
