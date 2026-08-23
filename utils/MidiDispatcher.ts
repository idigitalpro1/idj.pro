/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ControlChange, LatencyCalibrationState, MidiAccessStatus, MidiDeviceInfo, MidiFeedbackMapping, MidiPermissionDetails, OpusDeckId } from '../types';

/** Class for managing Web MIDI API access, device detection, and dispatching MIDI CC events with latency compensation and bi-directional hardware telemetry. */
export class MidiDispatcher extends EventTarget {
  private access: MIDIAccess | null = null;
  activeMidiInputId: string | null = null;
  activeMidiOutputId: string | null = null;
  status: MidiAccessStatus = 'unrequested';
  lastErrorMessage: string | null = null;
  osPermissionState: 'prompt' | 'granted' | 'denied' | 'unsupported' = 'prompt';

  // Bi-Directional Hardware Feedback Settings
  public feedbackMapping: MidiFeedbackMapping = {
    enabled: true,
    activeOutputId: null,
    sendStemLevels: true,
    sendEqKills: true,
    sendTransportLeds: true,
    sendVuMeters: true,
  };

  // Hardware Audio-to-MIDI Latency Sync Offset (in ms)
  public latencyOffsetMs = 0;

  // Latency Calibration Engine State
  private calibrationState: LatencyCalibrationState = {
    isActive: false,
    measuredOffsetMs: 0,
    appliedOffsetMs: 0,
    jitterVarianceMs: 0,
    sampleCount: 0,
    targetBpm: 120,
    isCalibrating: false,
    history: [],
  };
  private calibrationMetronomeTimer: number | null = null;
  private lastExpectedClickTime = 0;

  constructor() {
    super();
    this.restoreLatencyOffset();
    this.checkInitialPermissionStatus();
  }

  private restoreLatencyOffset() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('idpro_midi_latency_offset');
        if (saved !== null) {
          this.latencyOffsetMs = Math.max(-250, Math.min(250, parseInt(saved, 10) || 0));
          this.calibrationState.appliedOffsetMs = this.latencyOffsetMs;
        }
      } catch {
        // ignore
      }
    }
  }

  /** Set the latency offset in milliseconds (-250ms to +250ms) */
  public setLatencyOffsetMs(offset: number) {
    this.latencyOffsetMs = Math.max(-250, Math.min(250, Math.round(offset)));
    this.calibrationState.appliedOffsetMs = this.latencyOffsetMs;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('idpro_midi_latency_offset', this.latencyOffsetMs.toString());
      } catch {
        // ignore
      }
    }

    this.dispatchEvent(
      new CustomEvent('latency-changed', {
        detail: { latencyOffsetMs: this.latencyOffsetMs },
      })
    );
  }

  public getLatencyOffsetMs(): number {
    return this.latencyOffsetMs;
  }

  public getCalibrationState(): LatencyCalibrationState {
    return { ...this.calibrationState };
  }

  /**
   * Starts a tap-sync latency calibration session.
   * Generates metronome pulse events so user can tap a physical pad in sync.
   */
  public startLatencyCalibration(bpm = 120) {
    this.stopLatencyCalibration();

    this.calibrationState = {
      isActive: true,
      isCalibrating: true,
      measuredOffsetMs: 0,
      appliedOffsetMs: this.latencyOffsetMs,
      jitterVarianceMs: 0,
      sampleCount: 0,
      targetBpm: bpm,
      history: [],
    };

    const intervalMs = (60 / bpm) * 1000;
    this.lastExpectedClickTime = performance.now();

    this.calibrationMetronomeTimer = window.setInterval(() => {
      this.lastExpectedClickTime = performance.now();
      this.dispatchEvent(
        new CustomEvent('calibration-click', {
          detail: { time: this.lastExpectedClickTime, bpm },
        })
      );
    }, intervalMs);

    this.dispatchEvent(
      new CustomEvent('calibration-state-changed', {
        detail: this.getCalibrationState(),
      })
    );
  }

  /**
   * Record a calibration tap from a MIDI pad or UI button.
   */
  public recordCalibrationTap(tapTime = performance.now()): LatencyCalibrationState {
    if (!this.calibrationState.isCalibrating) return this.getCalibrationState();

    const intervalMs = (60 / this.calibrationState.targetBpm) * 1000;
    let diff = tapTime - this.lastExpectedClickTime;

    // Wrap to nearest beat boundary
    while (diff > intervalMs / 2) diff -= intervalMs;
    while (diff < -intervalMs / 2) diff += intervalMs;

    // Ignore wild mis-hits (> 300ms)
    if (Math.abs(diff) < 300) {
      this.calibrationState.history.push(Math.round(diff));
      if (this.calibrationState.history.length > 16) {
        this.calibrationState.history.shift();
      }

      this.calibrationState.sampleCount = this.calibrationState.history.length;

      // Compute median offset and standard deviation (jitter)
      const sorted = [...this.calibrationState.history].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const mean = this.calibrationState.history.reduce((a, b) => a + b, 0) / this.calibrationState.history.length;
      const variance =
        this.calibrationState.history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
        this.calibrationState.history.length;
      const jitter = Math.round(Math.sqrt(variance));

      this.calibrationState.measuredOffsetMs = median;
      this.calibrationState.jitterVarianceMs = jitter;
    }

    this.dispatchEvent(
      new CustomEvent('calibration-state-changed', {
        detail: this.getCalibrationState(),
      })
    );

    return this.getCalibrationState();
  }

  /**
   * Apply measured latency as the active offset and end calibration.
   */
  public applyMeasuredLatency() {
    if (this.calibrationState.history.length >= 3) {
      this.setLatencyOffsetMs(this.calibrationState.measuredOffsetMs);
    }
    this.stopLatencyCalibration();
  }

  /** Stop calibration metronome */
  public stopLatencyCalibration() {
    if (this.calibrationMetronomeTimer !== null) {
      clearInterval(this.calibrationMetronomeTimer);
      this.calibrationMetronomeTimer = null;
    }
    this.calibrationState.isActive = false;
    this.calibrationState.isCalibrating = false;
    this.dispatchEvent(
      new CustomEvent('calibration-state-changed', {
        detail: this.getCalibrationState(),
      })
    );
  }

  /** Check if the Web MIDI API is supported in the current environment */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
  }

  /** Check if MIDI access has already been granted */
  hasAccess(): boolean {
    return this.access !== null && this.status === 'granted';
  }

  /** Query browser permissions API for proactive permission state */
  private async checkInitialPermissionStatus() {
    if (!this.isSupported()) {
      this.status = 'unsupported';
      this.osPermissionState = 'unsupported';
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'midi' as any, sysex: false } as any);
        this.osPermissionState = result.state as 'prompt' | 'granted' | 'denied';
        if (result.state === 'granted') {
          // Auto-connect if permission was previously granted
          this.getMidiAccess().catch(() => {});
        } else if (result.state === 'denied') {
          this.status = 'denied';
          this.lastErrorMessage = 'Browser or OS permissions are currently blocking Web MIDI access.';
          this.dispatchEvent(new CustomEvent('status-changed', { detail: { status: this.status } }));
        }

        result.onchange = () => {
          this.osPermissionState = result.state as 'prompt' | 'granted' | 'denied';
          if (result.state === 'granted' && this.status !== 'granted') {
            this.getMidiAccess().catch(() => {});
          } else if (result.state === 'denied') {
            this.status = 'denied';
            this.dispatchEvent(new CustomEvent('status-changed', { detail: { status: this.status } }));
          }
        };
      }
    } catch {
      // Permissions query for 'midi' not supported on this browser version, will check on requestMIDIAccess
    }
  }

  /** Get structured diagnostic details for UI prompts */
  getPermissionDetails(): MidiPermissionDetails {
    const devices = this.getConnectedDevices();
    let remedyAction = '';

    if (this.status === 'unsupported') {
      remedyAction = 'Use a Web MIDI-compatible browser such as Google Chrome, Microsoft Edge, Brave, or Opera.';
    } else if (this.status === 'denied') {
      remedyAction = 'Click the site settings / lock icon in your browser address bar -> Permissions -> MIDI Devices -> Set to "Allow", then click "Rescan Ports".';
    } else if (this.status === 'blocked_by_os') {
      remedyAction = 'Verify your OS audio/MIDI drivers (CoreMIDI on macOS, Windows MIDI Services, or ALSA on Linux) and grant browser permission in OS Privacy Settings.';
    } else if (this.status === 'granted' && devices.length === 0) {
      remedyAction = 'Web MIDI permission is active. Plug your Pioneer, DDJ, RANE, Denon, or USB MIDI controller into a USB port to start mixing.';
    } else if (this.status === 'granted') {
      remedyAction = `Ready! ${devices.length} hardware controller(s) connected.`;
    }

    return {
      status: this.status,
      canRequest: this.isSupported() && this.status !== 'requesting',
      devicesFound: devices.length,
      activeDeviceId: this.activeMidiInputId,
      errorMessage: this.lastErrorMessage || undefined,
      remedyAction,
      osPromptState: this.osPermissionState,
    };
  }

  /**
   * Requests Web MIDI API access from the user / browser with full error diagnosis.
   * Dispatches 'status-changed' and 'devices-changed' events.
   */
  async getMidiAccess(): Promise<string[]> {
    if (this.access) {
      const inputIds = [...this.access.inputs.keys()];
      if (inputIds.length > 0 && !this.activeMidiInputId) {
        this.activeMidiInputId = inputIds[0];
      }
      return inputIds;
    }

    if (!this.isSupported()) {
      this.status = 'unsupported';
      this.lastErrorMessage = 'Your browser does not support the Web MIDI API. Please use Google Chrome, Microsoft Edge, or Opera.';
      this.dispatchEvent(new CustomEvent('status-changed', { detail: { status: this.status } }));
      throw new Error(this.lastErrorMessage);
    }

    this.status = 'requesting';
    this.lastErrorMessage = null;
    this.dispatchEvent(new CustomEvent('status-changed', { detail: { status: this.status } }));

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
    } catch (err: any) {
      this.access = null;
      const isDenied = err?.name === 'SecurityError' || err?.name === 'NotAllowedError';
      const isAbort = err?.name === 'AbortError' || err?.message?.includes('OS');
      
      this.status = isAbort ? 'blocked_by_os' : isDenied ? 'denied' : 'denied';
      this.lastErrorMessage =
        isDenied
          ? 'Web MIDI access was blocked or denied in browser site permissions. Click Site Settings (Lock icon) to allow MIDI.'
          : isAbort
          ? 'Operating System or MIDI subsystem prevented access. Ensure no conflicting DAW has exclusive lock.'
          : err?.message || 'Unable to acquire MIDI access.';

      this.dispatchEvent(new CustomEvent('status-changed', { detail: { status: this.status } }));
      this.dispatchEvent(new CustomEvent('permission-error', { detail: { error: this.lastErrorMessage } }));
      throw new Error(this.lastErrorMessage);
    }

    if (!this.access) {
      this.status = 'denied';
      this.lastErrorMessage = 'Unable to acquire MIDI access.';
      this.dispatchEvent(new CustomEvent('status-changed', { detail: { status: this.status } }));
      throw new Error(this.lastErrorMessage);
    }

    this.status = 'granted';
    this.lastErrorMessage = null;
    this.dispatchEvent(new CustomEvent('status-changed', { detail: { status: this.status } }));

    // Listen for device hotplugging (connect/disconnect events)
    this.access.onstatechange = (event: MIDIConnectionEvent) => {
      this.bindInputListeners();
      const availableIds = this.access ? [...this.access.inputs.keys()] : [];

      if (this.activeMidiInputId && !this.access?.inputs.has(this.activeMidiInputId)) {
        // Active device was disconnected
        this.activeMidiInputId = availableIds.length > 0 ? availableIds[0] : null;
      } else if (!this.activeMidiInputId && availableIds.length > 0) {
        // A new device was connected and none was active
        this.activeMidiInputId = availableIds[0];
      }

      this.dispatchEvent(
        new CustomEvent('devices-changed', {
          detail: {
            devices: this.getConnectedDevices(),
            inputIds: availableIds,
            activeMidiInputId: this.activeMidiInputId,
            port: event.port,
          },
        })
      );
    };

    this.bindInputListeners();

    const inputIds = [...this.access.inputs.keys()];
    if (inputIds.length > 0 && this.activeMidiInputId === null) {
      this.activeMidiInputId = inputIds[0];
    }

    this.dispatchEvent(
      new CustomEvent('devices-changed', {
        detail: {
          devices: this.getConnectedDevices(),
          inputIds,
          activeMidiInputId: this.activeMidiInputId,
        },
      })
    );

    return inputIds;
  }

  /** Bind message listeners to all detected MIDI inputs */
  private bindInputListeners() {
    if (!this.access) return;

    for (const input of this.access.inputs.values()) {
      // Avoid duplicate handler wrapping
      input.onmidimessage = (event: MIDIMessageEvent) => {
        if (input.id !== this.activeMidiInputId) return;

        const { data } = event;
        if (!data || data.length < 3) {
          return;
        }

        const statusByte = data[0];
        const channel = statusByte & 0x0f;
        const messageType = statusByte & 0xf0;

        // CC message (0xb0 - 0xbf)
        const isControlChange = messageType === 0xb0;
        if (!isControlChange) return;

        const detail: ControlChange = { cc: data[1], value: data[2], channel };
        this.dispatchEvent(
          new CustomEvent<ControlChange>('cc-message', { detail })
        );
      };
    }

    // Auto-select first MIDI output if available and none selected
    const outputIds = [...this.access.outputs.keys()];
    if (outputIds.length > 0 && !this.activeMidiOutputId) {
      this.activeMidiOutputId = outputIds[0];
      this.feedbackMapping.activeOutputId = this.activeMidiOutputId;
    }
  }

  /** Set the active MIDI input device by ID */
  setActiveMidiInput(id: string | null) {
    this.activeMidiInputId = id;
    this.dispatchEvent(
      new CustomEvent('active-device-changed', {
        detail: { activeMidiInputId: this.activeMidiInputId },
      })
    );
  }

  /** Set the active MIDI output device by ID for bi-directional LED/screen feedback */
  setActiveMidiOutput(id: string | null) {
    this.activeMidiOutputId = id;
    this.feedbackMapping.activeOutputId = id;
    this.dispatchEvent(
      new CustomEvent('active-output-changed', {
        detail: { activeMidiOutputId: this.activeMidiOutputId },
      })
    );
  }

  /** Returns an array of connected MIDI input device metadata */
  getConnectedDevices(): MidiDeviceInfo[] {
    if (!this.access) {
      return [];
    }

    const devices: MidiDeviceInfo[] = [];
    for (const input of this.access.inputs.values()) {
      devices.push({
        id: input.id,
        name: input.name || `MIDI Device (${input.id})`,
        manufacturer: input.manufacturer || undefined,
        state: input.state,
        connection: input.connection,
        type: 'input',
      });
    }
    return devices;
  }

  /** Returns an array of connected MIDI output device metadata for LED/OLED telemetry */
  getConnectedOutputDevices(): MidiDeviceInfo[] {
    if (!this.access) {
      return [];
    }

    const devices: MidiDeviceInfo[] = [];
    for (const output of this.access.outputs.values()) {
      devices.push({
        id: output.id,
        name: output.name || `MIDI Output (${output.id})`,
        manufacturer: output.manufacturer || undefined,
        state: output.state,
        connection: output.connection,
        type: 'output',
      });
    }
    return devices;
  }

  /**
   * Send a raw MIDI feedback message to the connected hardware controller
   * e.g., CC 0xB0 or Note On 0x90 to illuminate LEDs or update OLED rings
   */
  public sendMidiFeedback(channel: number, ccOrNote: number, value: number, isNote = false): boolean {
    if (!this.access || !this.feedbackMapping.enabled) return false;
    const targetOutputId = this.activeMidiOutputId || [...this.access.outputs.keys()][0];
    if (!targetOutputId) return false;

    const output = this.access.outputs.get(targetOutputId);
    if (!output) return false;

    try {
      const chClamped = Math.max(0, Math.min(15, channel));
      const statusByte = (isNote ? 0x90 : 0xb0) | chClamped;
      const data1 = Math.max(0, Math.min(127, Math.round(ccOrNote)));
      const data2 = Math.max(0, Math.min(127, Math.round(value)));

      output.send([statusByte, data1, data2]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bi-directional Stem Telemetry Feedback:
   * Maps 4 stems across channels and CCs to drive controller OLEDs and LED rings
   */
  public sendStemTelemetry(
    deckId: OpusDeckId,
    stemType: 'vocal' | 'drums' | 'bass' | 'melody',
    volume: number,
    isMuted: boolean
  ) {
    if (!this.feedbackMapping.sendStemLevels) return;

    const deckNum = parseInt(deckId, 10) - 1; // 0, 1, 2, 3
    const stemOffset = { vocal: 0, drums: 1, bass: 2, melody: 3 }[stemType];
    const cc = 20 + stemOffset; // CC 20..23 for stems
    const val = isMuted ? 0 : Math.round(Math.min(1.5, Math.max(0, volume)) * 84); // 0-127

    this.sendMidiFeedback(deckNum, cc, val);

    // Also send LED toggle note for stem mute indicator
    const note = 60 + stemOffset;
    this.sendMidiFeedback(deckNum, note, isMuted ? 0 : 127, true);
  }

  /**
   * Bi-directional EQ Cut & Isolator Feedback:
   * Sends EQ kill LED updates to hardware buttons (Pioneer DJM-A9 / OPUS-QUAD)
   */
  public sendEqCutFeedback(deckId: OpusDeckId, band: 'low' | 'mid' | 'high', isKilled: boolean, valueDb: number) {
    if (!this.feedbackMapping.sendEqKills) return;

    const deckNum = parseInt(deckId, 10) - 1;
    const bandOffset = { low: 0, mid: 1, high: 2 }[band];
    const cc = 30 + bandOffset;
    // Map -26dB..+6dB to 0..127
    const normalized = Math.max(0, Math.min(127, Math.round(((valueDb + 26) / 32) * 127)));

    this.sendMidiFeedback(deckNum, cc, isKilled ? 0 : normalized);
    // Send LED kill state note
    const note = 70 + bandOffset;
    this.sendMidiFeedback(deckNum, note, isKilled ? 127 : 0, true);
  }

  /**
   * Bi-directional Deck Play/Cue LED State Feedback:
   */
  public sendDeckPlayStateFeedback(deckId: OpusDeckId, isPlaying: boolean, isCueing: boolean) {
    if (!this.feedbackMapping.sendTransportLeds) return;
    const deckNum = parseInt(deckId, 10) - 1;
    // Play LED note 11 (Green ring)
    this.sendMidiFeedback(deckNum, 11, isPlaying ? 127 : 0, true);
    // Cue LED note 12 (Orange ring)
    this.sendMidiFeedback(deckNum, 12, isCueing ? 127 : 0, true);
  }

  /**
   * Bi-directional VU Peak Level Feedback for hardware LED meters:
   */
  public sendVuTelemetry(deckId: OpusDeckId, vuLevel: number) {
    if (!this.feedbackMapping.sendVuMeters) return;
    const deckNum = parseInt(deckId, 10) - 1;
    const val = Math.max(0, Math.min(127, Math.round(vuLevel * 127)));
    this.sendMidiFeedback(deckNum, 40, val);
  }

  /** Retrieves the friendly name of a MIDI device by ID */
  getDeviceName(id: string): string | null {
    if (!this.access) {
      return null;
    }
    const input = this.access.inputs.get(id);
    if (input) return input.name ? `${input.name}${input.manufacturer ? ` (${input.manufacturer})` : ''}` : `MIDI Device ${id}`;
    const output = this.access.outputs.get(id);
    if (output) return output.name ? `${output.name}${output.manufacturer ? ` (${output.manufacturer})` : ''}` : `MIDI Output ${id}`;
    return null;
  }
}

