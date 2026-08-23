import type {
  LiveMusicGenerationConfig,
  LiveMusicServerMessage,
  WeightedPrompt,
} from '@google/genai';

type LiveMusicCommand =
  | { type: 'set-weighted-prompts'; weightedPrompts: WeightedPrompt[] }
  | { type: 'set-config'; musicGenerationConfig: LiveMusicGenerationConfig }
  | { type: 'play' | 'pause' | 'stop' | 'reset-context' };

type ProxyMessage =
  | { type: 'ready' }
  | { type: 'message'; message: LiveMusicServerMessage }
  | { type: 'error'; message: string };

export interface SecureLiveMusicSession {
  setWeightedPrompts(params: { weightedPrompts: WeightedPrompt[] }): Promise<void>;
  setMusicGenerationConfig(params: { musicGenerationConfig: LiveMusicGenerationConfig }): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  resetContext(): void;
  close(): void;
}

interface ConnectOptions {
  model: string;
  callbacks: {
    onmessage(message: LiveMusicServerMessage): void;
    onerror?(): void;
    onclose?(): void;
  };
}

export function connectToLiveMusic({ model, callbacks }: ConnectOptions): Promise<SecureLiveMusicSession> {
  return new Promise((resolve, reject) => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = new URL('/api/live-music', `${protocol}//${location.host}`);
    // The model is fixed server-side so a client cannot spend quota on another model.
    void model;

    const socket = new WebSocket(url);
    let settled = false;

    const send = (command: LiveMusicCommand) => {
      if (socket.readyState !== WebSocket.OPEN) {
        throw new Error('Live music connection is not open.');
      }
      socket.send(JSON.stringify(command));
    };

    const session: SecureLiveMusicSession = {
      setWeightedPrompts: async ({ weightedPrompts }) => send({ type: 'set-weighted-prompts', weightedPrompts }),
      setMusicGenerationConfig: async ({ musicGenerationConfig }) => send({ type: 'set-config', musicGenerationConfig }),
      play: () => send({ type: 'play' }),
      pause: () => send({ type: 'pause' }),
      stop: () => send({ type: 'stop' }),
      resetContext: () => send({ type: 'reset-context' }),
      close: () => socket.close(1000, 'Client closed'),
    };

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(String(event.data)) as ProxyMessage;
        if (data.type === 'ready') {
          settled = true;
          resolve(session);
        } else if (data.type === 'message') {
          callbacks.onmessage(data.message);
        } else {
          callbacks.onerror?.();
          if (!settled) reject(new Error(data.message));
        }
      } catch {
        callbacks.onerror?.();
        if (!settled) reject(new Error('Invalid response from live music service.'));
      }
    });

    socket.addEventListener('error', () => {
      callbacks.onerror?.();
      if (!settled) reject(new Error('Could not connect to live music service.'));
    });

    socket.addEventListener('close', () => {
      callbacks.onclose?.();
      if (!settled) reject(new Error('Live music service closed before it was ready.'));
    });
  });
}
