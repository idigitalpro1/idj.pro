/**
 * @fileoverview Control real time music with a MIDI controller
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlaybackState, Prompt } from './types';
import { GoogleGenAI, LiveMusicFilteredPrompt } from '@google/genai';
import { PromptDjMidi } from './components/PromptDjMidi';
import { ToastMessage } from './components/ToastMessage';
import { LiveMusicHelper } from './utils/LiveMusicHelper';
import { AudioAnalyser } from './utils/AudioAnalyser';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  apiVersion: 'v1alpha',
});
const model = 'lyria-realtime-exp';

function main() {
  const initialPrompts = buildInitialPrompts();

  const pdjMidi = new PromptDjMidi(initialPrompts);
  document.body.appendChild(pdjMidi);

  const toastMessage = new ToastMessage();
  document.body.appendChild(toastMessage);

  const liveMusicHelper = new LiveMusicHelper(ai, model);
  liveMusicHelper.setWeightedPrompts(initialPrompts);
  pdjMidi.liveMusicHelper = liveMusicHelper;

  const audioAnalyser = new AudioAnalyser(liveMusicHelper.audioContext);
  liveMusicHelper.extraDestination = audioAnalyser.node;

  pdjMidi.addEventListener('prompts-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<Map<string, Prompt>>;
    const prompts = customEvent.detail;
    liveMusicHelper.setWeightedPrompts(prompts);
  }));

  pdjMidi.addEventListener('play-pause', () => {
    liveMusicHelper.playPause();
  });

  pdjMidi.addEventListener('start-ai-recording', () => {
    liveMusicHelper.startRecording();
  });

  pdjMidi.addEventListener('stop-ai-recording', async () => {
    try {
      const result = await liveMusicHelper.stopRecording();
      // Auto import into Mix Lab
      window.dispatchEvent(
        new CustomEvent('import-to-mix-lab', {
          detail: {
            audioBuffer: result.audioBuffer,
            title: result.title,
            elementType: 'melody',
          },
        })
      );
      toastMessage.show(`⚡ Recorded & Auto-Imported "${result.title}" (${result.duration.toFixed(1)}s) to Mix Lab!`);
      pdjMidi.activeView = 'multitrack_mixer';
    } catch (err: any) {
      toastMessage.show(`Recording error: ${err?.message || 'Could not process audio'}`);
    }
  });

  liveMusicHelper.addEventListener('recording-state-changed', ((e: Event) => {
    const custom = e as CustomEvent<{ isRecording: boolean; recordedSeconds: number }>;
    pdjMidi.isAiRecording = custom.detail.isRecording;
    pdjMidi.aiRecordedSeconds = custom.detail.recordedSeconds;
  }));

  liveMusicHelper.addEventListener('recording-progress', ((e: Event) => {
    const custom = e as CustomEvent<{ recordedSeconds: number }>;
    pdjMidi.aiRecordedSeconds = custom.detail.recordedSeconds;
  }));

  liveMusicHelper.addEventListener('playback-state-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<PlaybackState>;
    const playbackState = customEvent.detail;
    pdjMidi.playbackState = playbackState;
    playbackState === 'playing' ? audioAnalyser.start() : audioAnalyser.stop();
  }));

  liveMusicHelper.addEventListener('filtered-prompt', ((e: Event) => {
    const customEvent = e as CustomEvent<LiveMusicFilteredPrompt>;
    const filteredPrompt = customEvent.detail;
    toastMessage.show(filteredPrompt.filteredReason!)
    pdjMidi.addFilteredPrompt(filteredPrompt.text!);
  }));

  const errorToast = ((e: Event) => {
    const customEvent = e as CustomEvent<string>;
    const error = customEvent.detail;
    toastMessage.show(error);
  });

  liveMusicHelper.addEventListener('error', errorToast);
  pdjMidi.addEventListener('error', errorToast);

  audioAnalyser.addEventListener('audio-level-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<number>;
    const level = customEvent.detail;
    pdjMidi.audioLevel = level;
  }));

}

function buildInitialPrompts() {
  // Pick 3 random prompts to start at weight = 1
  const startOn = [...DEFAULT_PROMPTS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const prompts = new Map<string, Prompt>();

  for (let i = 0; i < DEFAULT_PROMPTS.length; i++) {
    const promptId = `prompt-${i}`;
    const prompt = DEFAULT_PROMPTS[i];
    const { text, color } = prompt;
    prompts.set(promptId, {
      promptId,
      text,
      weight: startOn.includes(prompt) ? 1 : 0,
      cc: i,
      color,
    });
  }

  return prompts;
}

const DEFAULT_PROMPTS = [
  { color: '#01ff70', text: 'Tech House (Rolling Basslines & Club Tracks)' },
  { color: '#f4a261', text: 'House (Classic Four-on-the-Floor & Vocals)' },
  { color: '#ff4d4f', text: 'Techno (Peak Time / Driving Warehouse)' },
  { color: '#2af6de', text: 'Melodic House & Techno (Atmospheric Synth Leads)' },
  { color: '#ff25f6', text: 'Drum & Bass (174 BPM Fast Breakbeats)' },
  { color: '#ffb703', text: 'Afro House (Percussive Rhythms & Deep Grooves)' },
  { color: '#9900ff', text: 'Deep House (Lush Chords & Warm Sub-Bass)' },
  { color: '#3dffab', text: 'Minimal / Deep Tech (Stripped-Back Micro-Grooves)' },
  { color: '#00c3ff', text: 'Progressive House (Extended Melodic Builds)' },
  { color: '#ff66c4', text: 'Indie Dance (Dark Disco & Retro Synthwave)' },
  { color: '#01ff70', text: 'Rolling Sub Bassline' },
  { color: '#2af6de', text: 'Atmospheric Breakdown' },
  { color: '#ff4d4f', text: 'Punchy 909 Kick' },
  { color: '#ff25f6', text: 'Neuro Bass Reese' },
  { color: '#ffb703', text: 'Organic Tribal Percussion' },
  { color: '#9900ff', text: 'Lush Organ Chords' },
];

main();
