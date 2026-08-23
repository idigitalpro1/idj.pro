/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import type { GoogleDriveAudioFile, GoogleDriveState } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

export class GoogleDriveService extends EventTarget {
  private static instance: GoogleDriveService;
  private app: FirebaseApp;
  private auth: Auth;
  private provider: GoogleAuthProvider;

  // In-memory access token caching only (never written to localStorage or sessionStorage)
  private cachedAccessToken: string | null = null;
  private isSigningIn = false;

  private state: GoogleDriveState = {
    isAuthenticated: false,
    isConnecting: false,
    userEmail: null,
    userName: null,
    userPhoto: null,
    files: [],
    currentFolderId: null,
    folderPath: [{ id: 'root', name: 'My Drive' }],
    isLoadingFiles: false,
    searchQuery: '',
    selectedFileId: null,
    activeUploadProgress: null,
    activeDownloadFileId: null,
    error: null,
  };

  private constructor() {
    super();
    this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    this.auth = getAuth(this.app);

    this.provider = new GoogleAuthProvider();
    GOOGLE_DRIVE_SCOPES.forEach((scope) => {
      this.provider.addScope(scope);
    });
    this.provider.setCustomParameters({
      prompt: 'select_account',
    });

    this.setupAuthListener();
  }

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  public getState(): GoogleDriveState {
    return { ...this.state };
  }

  private setupAuthListener() {
    onAuthStateChanged(this.auth, (user: User | null) => {
      if (user) {
        this.state.isAuthenticated = !!this.cachedAccessToken;
        this.state.userEmail = user.email || null;
        this.state.userName = user.displayName || null;
        this.state.userPhoto = user.photoURL || null;
      } else {
        this.cachedAccessToken = null;
        this.state.isAuthenticated = false;
        this.state.userEmail = null;
        this.state.userName = null;
        this.state.userPhoto = null;
        this.state.files = [];
      }
      this.emitStateChange();
    });
  }

  public getAccessToken(): string | null {
    return this.cachedAccessToken;
  }

  public async signIn(): Promise<{ user: User; accessToken: string } | null> {
    try {
      this.state.isConnecting = true;
      this.state.error = null;
      this.isSigningIn = true;
      this.emitStateChange();

      const result = await signInWithPopup(this.auth, this.provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Google Drive authorization succeeded, but access token was not returned.');
      }

      this.cachedAccessToken = credential.accessToken;
      this.state.isAuthenticated = true;
      this.state.userEmail = result.user.email || null;
      this.state.userName = result.user.displayName || null;
      this.state.userPhoto = result.user.photoURL || null;
      this.state.isConnecting = false;
      this.emitStateChange();

      // Automatically list files from root upon successful authentication
      await this.listFiles();

      return { user: result.user, accessToken: this.cachedAccessToken };
    } catch (err: any) {
      console.error('Google Drive sign-in error:', err);
      this.state.error = err.message || 'Failed to authenticate with Google Drive';
      this.state.isAuthenticated = false;
      this.state.isConnecting = false;
      this.emitStateChange();
      throw err;
    } finally {
      this.isSigningIn = false;
    }
  }

  public async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
      this.cachedAccessToken = null;
      this.state.isAuthenticated = false;
      this.state.userEmail = null;
      this.state.userName = null;
      this.state.userPhoto = null;
      this.state.files = [];
      this.state.currentFolderId = null;
      this.state.folderPath = [{ id: 'root', name: 'My Drive' }];
      this.state.error = null;
      this.emitStateChange();
    } catch (err: any) {
      console.error('Error signing out of Google Drive:', err);
    }
  }

  /**
   * Fetch audio files and folders from Google Drive
   */
  public async listFiles(folderId: string | null = null, query: string = ''): Promise<GoogleDriveAudioFile[]> {
    if (!this.cachedAccessToken) {
      return [];
    }

    try {
      this.state.isLoadingFiles = true;
      this.state.error = null;
      this.state.searchQuery = query;
      this.emitStateChange();

      const targetFolderId = folderId || (this.state.folderPath.length > 0 ? this.state.folderPath[this.state.folderPath.length - 1].id : 'root');
      this.state.currentFolderId = targetFolderId === 'root' ? null : targetFolderId;

      let q = "trashed = false and (mimeType contains 'audio/' or name contains '.mp3' or name contains '.wav' or name contains '.flac' or name contains '.m4a' or name contains '.aac' or name contains '.ogg' or name contains '.aif' or mimeType = 'application/vnd.google-apps.folder')";

      if (query.trim()) {
        const sanitized = query.trim().replace(/'/g, "\\'");
        q += ` and name contains '${sanitized}'`;
      } else if (targetFolderId && targetFolderId !== 'root') {
        q += ` and '${targetFolderId}' in parents`;
      }

      const params = new URLSearchParams({
        q,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webContentLink, iconLink)',
        orderBy: 'folder, name_natural',
        pageSize: '100',
      });

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${this.cachedAccessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.cachedAccessToken = null;
          this.state.isAuthenticated = false;
          throw new Error('Google Drive session expired. Please sign in again.');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Google Drive API error: ${response.status}`);
      }

      const data = await response.json();
      const files: GoogleDriveAudioFile[] = (data.files || []).map((f: any) => {
        const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
        const bytes = parseInt(f.size || '0', 10);
        let sizeFormatted = '';
        if (bytes > 0) {
          const mb = (bytes / (1024 * 1024)).toFixed(1);
          sizeFormatted = `${mb} MB`;
        }

        // Estimate BPM and Key for track cards based on name tags if present
        let estimatedBpm: number | undefined;
        let estimatedKey: string | undefined;
        const bpmMatch = f.name.match(/(\d{2,3})\s*bpm/i);
        if (bpmMatch) {
          estimatedBpm = parseInt(bpmMatch[1], 10);
        }
        const keyMatch = f.name.match(/\b([1-9]|1[0-2])[AB]\b/i);
        if (keyMatch) {
          estimatedKey = keyMatch[0].toUpperCase();
        }

        return {
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          sizeFormatted,
          createdTime: f.createdTime,
          modifiedTime: f.modifiedTime,
          thumbnailLink: f.thumbnailLink,
          webContentLink: f.webContentLink,
          iconLink: f.iconLink,
          isFolder,
          bpm: estimatedBpm,
          key: estimatedKey,
        };
      });

      this.state.files = files;
      this.state.isLoadingFiles = false;
      this.emitStateChange();
      return files;
    } catch (err: any) {
      console.error('Error listing Google Drive files:', err);
      this.state.error = err.message || 'Failed to list files from Google Drive';
      this.state.isLoadingFiles = false;
      this.emitStateChange();
      return [];
    }
  }

  /**
   * Navigate into a folder
   */
  public async openFolder(folderId: string, folderName: string) {
    this.state.folderPath = [...this.state.folderPath, { id: folderId, name: folderName }];
    this.state.currentFolderId = folderId;
    await this.listFiles(folderId);
  }

  /**
   * Navigate to a specific breadcrumb in folder hierarchy
   */
  public async navigateToBreadcrumb(index: number) {
    if (index >= 0 && index < this.state.folderPath.length) {
      this.state.folderPath = this.state.folderPath.slice(0, index + 1);
      const target = this.state.folderPath[index];
      this.state.currentFolderId = target.id === 'root' ? null : target.id;
      await this.listFiles(target.id === 'root' ? null : target.id);
    }
  }

  /**
   * Download audio binary from Google Drive and decode into AudioBuffer
   */
  public async downloadAndDecodeAudio(
    fileId: string,
    audioContext: AudioContext
  ): Promise<{ audioBuffer: AudioBuffer; fileName: string; duration: number }> {
    if (!this.cachedAccessToken) {
      throw new Error('Please sign in to Google Drive first.');
    }

    try {
      this.state.activeDownloadFileId = fileId;
      this.emitStateChange();

      // 1. Fetch file metadata for the title
      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`, {
        headers: { Authorization: `Bearer ${this.cachedAccessToken}` },
      });
      const meta = metaRes.ok ? await metaRes.json() : { name: 'Drive Audio Track' };

      // 2. Fetch binary media content
      const mediaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.cachedAccessToken}` },
      });

      if (!mediaRes.ok) {
        throw new Error(`Failed to download audio file: HTTP ${mediaRes.status}`);
      }

      const arrayBuffer = await mediaRes.arrayBuffer();

      // 3. Decode into Web Audio AudioBuffer for real-time DJ playback
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      this.state.activeDownloadFileId = null;
      this.emitStateChange();

      return {
        audioBuffer,
        fileName: meta.name || 'Google Drive Track',
        duration: audioBuffer.duration,
      };
    } catch (err: any) {
      this.state.activeDownloadFileId = null;
      this.state.error = err.message || 'Failed to download and decode audio from Google Drive';
      this.emitStateChange();
      throw err;
    }
  }

  /**
   * Upload recorded DJ mix, stems, or audio buffer to Google Drive
   */
  public async uploadAudioRecording(
    blob: Blob,
    fileName: string,
    onProgress?: (percent: number) => void
  ): Promise<GoogleDriveAudioFile> {
    if (!this.cachedAccessToken) {
      throw new Error('Please sign in to Google Drive first.');
    }

    try {
      this.state.activeUploadProgress = 0;
      this.emitStateChange();

      // 1. Ensure or find "iDj.pro DJ Sets & Recordings" folder in user's Drive
      let targetFolderId = this.state.currentFolderId;
      if (!targetFolderId) {
        targetFolderId = await this.getOrCreateRecordingsFolder();
      }

      const metadata = {
        name: fileName.endsWith('.wav') || fileName.endsWith('.mp3') ? fileName : `${fileName}.wav`,
        mimeType: blob.type || 'audio/wav',
        parents: targetFolderId ? [targetFolderId] : undefined,
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webContentLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cachedAccessToken}`,
        },
        body: form,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errText}`);
      }

      const fileData = await response.json();

      this.state.activeUploadProgress = 100;
      setTimeout(() => {
        this.state.activeUploadProgress = null;
        this.emitStateChange();
      }, 1000);

      // Refresh list to show newly uploaded file
      await this.listFiles(this.state.currentFolderId);

      return {
        id: fileData.id,
        name: fileData.name,
        mimeType: fileData.mimeType,
        size: fileData.size,
        webContentLink: fileData.webContentLink,
      };
    } catch (err: any) {
      this.state.activeUploadProgress = null;
      this.state.error = err.message || 'Failed to upload recording to Google Drive';
      this.emitStateChange();
      throw err;
    }
  }

  /**
   * Creates or locates the default recordings folder
   */
  private async getOrCreateRecordingsFolder(): Promise<string | null> {
    if (!this.cachedAccessToken) return null;
    try {
      const q = "name = 'iDj.pro DJ Sets & Stems' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${this.cachedAccessToken}` },
      });
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }

      // Create new folder
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cachedAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'iDj.pro DJ Sets & Stems',
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        return created.id;
      }
    } catch (e) {
      console.warn('Could not create DJ folder in Drive:', e);
    }
    return null;
  }

  /**
   * Delete a file from Google Drive.
   * NOTE: The calling UI MUST present an explicit confirmation dialog first!
   */
  public async deleteFile(fileId: string): Promise<boolean> {
    if (!this.cachedAccessToken) {
      throw new Error('Please sign in to Google Drive first.');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.cachedAccessToken}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete file: HTTP ${response.status}`);
      }

      // Update local state
      this.state.files = this.state.files.filter((f) => f.id !== fileId);
      this.emitStateChange();
      return true;
    } catch (err: any) {
      console.error('Error deleting Google Drive file:', err);
      this.state.error = err.message || 'Failed to delete file from Google Drive';
      this.emitStateChange();
      throw err;
    }
  }

  private emitStateChange() {
    this.dispatchEvent(new CustomEvent('drive-state-changed', { detail: this.getState() }));
  }
}
