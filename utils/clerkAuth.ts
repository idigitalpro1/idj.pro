/**
 * Shared Clerk client helpers for the Vite + Lit mixer.
 * Local AuthService (guest/profile) remains unchanged; Clerk is the security gate.
 */
import type { Clerk } from '@clerk/clerk-js';

let clerkInstance: Clerk | null = null;

export function setClerkInstance(clerk: Clerk): void {
  clerkInstance = clerk;
}

export function getClerkInstance(): Clerk | null {
  return clerkInstance;
}

/** Returns the current Clerk session JWT, or null if signed out. */
export async function getClerkSessionToken(): Promise<string | null> {
  const clerk = clerkInstance;
  if (!clerk?.session) return null;
  try {
    return (await clerk.session.getToken()) ?? null;
  } catch {
    return null;
  }
}
