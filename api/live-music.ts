import http from 'node:http';
import {
  GoogleGenAI,
  type LiveMusicGenerationConfig,
  type LiveMusicSession,
} from '@google/genai';
import { createClerkClient } from '@clerk/backend';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';

const MODEL = 'lyria-realtime-exp';
const MAX_CONNECTIONS_PER_MINUTE = 5;
const connectionAttempts = new Map<string, { count: number; resetAt: number }>();

type ClientCommand =
  | { type: 'set-weighted-prompts'; weightedPrompts: Array<{ text: string; weight: number }> }
  | { type: 'set-config'; musicGenerationConfig: LiveMusicGenerationConfig }
  | { type: 'play' | 'pause' | 'stop' | 'reset-context' };

function isAllowedOrigin(req: http.IncomingMessage): boolean {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function isRateLimited(req: http.IncomingMessage): boolean {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';
  const now = Date.now();
  const current = connectionAttempts.get(ip);

  if (!current || current.resetAt <= now) {
    connectionAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  current.count += 1;
  return current.count > MAX_CONNECTIONS_PER_MINUTE;
}

function send(socket: WebSocket, value: unknown) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(value));
}

function parseAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function incomingMessageToRequest(req: http.IncomingMessage): Request {
  const host = (req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost') as string;
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || 'https';
  const url = new URL(req.url || '/', `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  // Browser WebSocket cannot set Authorization; client sends ?__clerk_token= (or access_token).
  const queryToken =
    url.searchParams.get('__clerk_token')
    ?? url.searchParams.get('access_token');
  if (queryToken && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${queryToken}`);
  }

  return new Request(url.toString(), { method: 'GET', headers });
}

/**
 * Authenticate via Authorization Bearer session JWT, __session cookie, or
 * __clerk_token / access_token query param (mapped to Bearer above).
 */
async function authenticateClerk(req: http.IncomingMessage): Promise<{ userId: string } | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('CLERK_SECRET_KEY is not configured');
    return null;
  }

  const publishableKey =
    process.env.CLERK_PUBLISHABLE_KEY
    || process.env.VITE_CLERK_PUBLISHABLE_KEY;

  const clerk = createClerkClient({
    secretKey,
    ...(publishableKey ? { publishableKey } : {}),
  });

  const request = incomingMessageToRequest(req);
  const state = await clerk.authenticateRequest(request);

  if (!state.isAuthenticated) {
    return null;
  }

  const auth = state.toAuth();
  const userId = auth?.userId;
  if (!userId) {
    return null;
  }

  const allowlist = parseAllowedEmails();
  if (allowlist.length > 0) {
    const user = await clerk.users.getUser(userId);
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
    const email = (primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? '').toLowerCase();
    if (!email || !allowlist.includes(email)) {
      return null;
    }
  }

  return { userId };
}

async function handleCommand(session: LiveMusicSession, raw: RawData) {
  const command = JSON.parse(raw.toString()) as ClientCommand;

  switch (command.type) {
    case 'set-weighted-prompts':
      if (!Array.isArray(command.weightedPrompts) || command.weightedPrompts.length > 32) {
        throw new Error('Invalid weighted prompts.');
      }
      await session.setWeightedPrompts({ weightedPrompts: command.weightedPrompts });
      break;
    case 'set-config':
      await session.setMusicGenerationConfig({ musicGenerationConfig: command.musicGenerationConfig });
      break;
    case 'play':
      session.play();
      break;
    case 'pause':
      session.pause();
      break;
    case 'stop':
      session.stop();
      break;
    case 'reset-context':
      session.resetContext();
      break;
    default:
      throw new Error('Unsupported live music command.');
  }
}

const server = http.createServer((_req, res) => {
  res.writeHead(426, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify({ error: 'WebSocket upgrade required' }));
});

const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

wss.on('connection', async (socket, req) => {
  if (!isAllowedOrigin(req) || isRateLimited(req)) {
    socket.close(1008, 'Connection rejected');
    return;
  }

  let authResult: { userId: string } | null = null;
  try {
    authResult = await authenticateClerk(req);
  } catch (err) {
    console.error('Clerk authentication failed', err);
    socket.close(1008, 'Unauthorized');
    return;
  }

  if (!authResult) {
    socket.close(1008, 'Unauthorized');
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    send(socket, { type: 'error', message: 'Live music is not configured.' });
    socket.close(1011, 'Service unavailable');
    return;
  }

  let session: LiveMusicSession | undefined;

  try {
    const ai = new GoogleGenAI({ apiKey: key, apiVersion: 'v1alpha' });
    session = await ai.live.music.connect({
      model: MODEL,
      callbacks: {
        onmessage: (message) => send(socket, { type: 'message', message }),
        onerror: () => send(socket, { type: 'error', message: 'Upstream live music error.' }),
        onclose: () => socket.close(1011, 'Upstream connection closed'),
      },
    });

    send(socket, { type: 'ready' });

    socket.on('message', (raw) => {
      void handleCommand(session!, raw).catch(() => {
        send(socket, { type: 'error', message: 'Invalid live music command.' });
      });
    });
  } catch {
    send(socket, { type: 'error', message: 'Could not start live music.' });
    socket.close(1011, 'Upstream connection failed');
  }

  socket.on('close', () => session?.close());
});

export default server;
