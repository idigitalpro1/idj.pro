/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BufferPoolMetrics } from '../types';

/**
 * High-performance Web Audio Float32Array and stem buffer pooling manager.
 * Prevents rapid memory fragmentation and browser tab crashes during long DJ sessions.
 */
export class AudioBufferPool {
  private static instance: AudioBufferPool | null = null;

  // Pool buckets keyed by array length
  private pools: Map<number, Float32Array[]> = new Map();
  private maxBucketsPerSize = 24;
  private maxPoolableSize = 131072; // Up to 128k samples (~2.9s at 44.1kHz)

  // Metrics
  private pooledAllocationsCount = 0;
  private recycledHitsCount = 0;
  private gcCyclesCompleted = 0;
  private lastGcCycleTimestamp: number | null = null;

  private constructor() {
    // Pre-warm common audio worklet & DSP chunk sizes
    [128, 256, 512, 1024, 2048, 4096, 8192, 16384].forEach((size) => {
      this.pools.set(size, []);
      for (let i = 0; i < 4; i++) {
        this.pools.get(size)!.push(new Float32Array(size));
        this.pooledAllocationsCount++;
      }
    });

    // Run scheduled automatic garbage collection every 45 seconds
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        this.runGarbageCollection();
      }, 45000);
    }
  }

  public static getInstance(): AudioBufferPool {
    if (!AudioBufferPool.instance) {
      AudioBufferPool.instance = new AudioBufferPool();
    }
    return AudioBufferPool.instance;
  }

  /**
   * Acquire a clean Float32Array from the pool or allocate a new one if exhausted.
   */
  public acquireFloat32(length: number): Float32Array {
    const bucket = this.pools.get(length);
    if (bucket && bucket.length > 0) {
      this.recycledHitsCount++;
      const buffer = bucket.pop()!;
      buffer.fill(0);
      return buffer;
    }

    this.pooledAllocationsCount++;
    return new Float32Array(length);
  }

  /**
   * Return a Float32Array back to the pool for reuse.
   */
  public releaseFloat32(buffer: Float32Array | null | undefined): void {
    if (!buffer) return;
    const len = buffer.length;
    if (len > this.maxPoolableSize) {
      // Allow browser GC to naturally collect oversized one-off buffers
      return;
    }

    let bucket = this.pools.get(len);
    if (!bucket) {
      bucket = [];
      this.pools.set(len, bucket);
    }

    if (bucket.length < this.maxBucketsPerSize) {
      bucket.push(buffer);
    }
  }

  /**
   * Acquire stereo pair of Float32Arrays for channel processing.
   */
  public acquireStereoPair(length: number): [Float32Array, Float32Array] {
    return [this.acquireFloat32(length), this.acquireFloat32(length)];
  }

  /**
   * Release stereo pair back to pool.
   */
  public releaseStereoPair(left: Float32Array, right: Float32Array): void {
    this.releaseFloat32(left);
    this.releaseFloat32(right);
  }

  /**
   * Explicit Memory Cleanup / Garbage Collection Cycle.
   * Evicts excess pooled arrays and releases stale references.
   */
  public runGarbageCollection(): BufferPoolMetrics {
    let purgedBuffersCount = 0;

    for (const [size, bucket] of this.pools.entries()) {
      // Trim bucket down to standard warm threshold (max 4 per bucket during idle)
      const targetSize = size <= 2048 ? 6 : 2;
      if (bucket.length > targetSize) {
        const toRemove = bucket.length - targetSize;
        bucket.splice(0, toRemove);
        purgedBuffersCount += toRemove;
      }
    }

    this.gcCyclesCompleted++;
    this.lastGcCycleTimestamp = Date.now();

    return this.getMetrics();
  }

  /**
   * Deep Purge: Clears all pool caches immediately.
   */
  public purgeAll(): void {
    for (const bucket of this.pools.values()) {
      bucket.length = 0;
    }
    this.gcCyclesCompleted++;
    this.lastGcCycleTimestamp = Date.now();
  }

  /**
   * Get live diagnostic metrics for telemetry and UI health monitors.
   */
  public getMetrics(): BufferPoolMetrics {
    let totalPooledBuffers = 0;
    let totalPooledMemoryBytes = 0;

    for (const [size, bucket] of this.pools.entries()) {
      totalPooledBuffers += bucket.length;
      totalPooledMemoryBytes += bucket.length * size * 4; // Float32 is 4 bytes per element
    }

    return {
      totalPooledBuffers,
      totalPooledMemoryBytes,
      pooledAllocationsCount: this.pooledAllocationsCount,
      recycledHitsCount: this.recycledHitsCount,
      lastGcCycleTimestamp: this.lastGcCycleTimestamp,
      gcCyclesCompleted: this.gcCyclesCompleted,
    };
  }
}
