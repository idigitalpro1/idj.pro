# Authentication (Clerk)

Clerk is the security gate for the iDj.pro mixer UI and the live-music WebSocket proxy. The existing local `AuthService` (guest/profile/decals) is unchanged and still runs after sign-in.

## Environment variables

| Name | Where | Required | Description |
|------|--------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Client (Vite) + optional on API | Yes (client) | Clerk publishable key (`pk_test_…` / `pk_live_…`). |
| `CLERK_SECRET_KEY` | Server (`api/live-music.ts`) | Yes (API) | Clerk secret key. Never expose to the browser. |
| `ALLOWED_EMAILS` | Server | No | Comma-separated email allowlist. If set, only those emails may use the live-music WebSocket. |

Optional for API request auth if you prefer a non-Vite-prefixed name:

| Name | Description |
|------|-------------|
| `CLERK_PUBLISHABLE_KEY` | Used by the API if present; otherwise falls back to `VITE_CLERK_PUBLISHABLE_KEY`. |

## How it works

1. **Client gate (`index.ts`)** — loads Clerk with `VITE_CLERK_PUBLISHABLE_KEY`. Missing key → config error. Signed out → mounts Clerk SignIn. Signed in → boots the mixer (`main()`).
2. **WebSocket (`SecureLiveMusicClient` → `api/live-music.ts`)** — the browser appends the session JWT as `?__clerk_token=…` on the WS URL (browsers cannot set `Authorization` on `WebSocket`). The server also accepts `Authorization: Bearer …` and the `__session` cookie. Unauthenticated upgrades are closed with code `1008`.
3. **Allowlist** — when `ALLOWED_EMAILS` is set, the server loads the Clerk user and rejects connections whose primary email is not on the list.

## Local development

```bash
# .env.local (do not commit secrets)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…
# ALLOWED_EMAILS=you@example.com
```

Ensure the Clerk instance allows your local origin (e.g. `http://localhost:3000`) under allowed origins / authorized parties.
