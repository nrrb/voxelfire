// src/stores/fireEffectStore.js
import { defineStore } from 'pinia';

export const useFireEffectStore = defineStore('fireEffect', {
  state: () => ({
    // Fire configuration
    fireWidth: 20,
    fireHeight: 30,
    fireDepth: 20,
    voxelSize: 0.5,
    fireUpdateInterval: 50,

    // UI state
    isPlaying: true,
    showControls: true,

    // Performance metrics
    fps: 0,
    activeVoxels: 0
  }),

  getters: {
    maxVoxels: (state) => state.fireWidth * state.fireHeight * state.fireDepth,
    fireIntensity: (state) => 100 - state.fireUpdateInterval,
    voxelDensity: (state) => state.activeVoxels / state.maxVoxels * 100
  },

  actions: {
    setFireDimensions(width, height, depth) {
      this.fireWidth = width;
      this.fireHeight = height;
      this.fireDepth = depth;
    },

    setVoxelSize(size) {
      this.voxelSize = size;
    },

    setFireUpdateInterval(interval) {
      // Clamp to reasonable values (10-200ms)
      this.fireUpdateInterval = Math.max(10, Math.min(200, interval));
    },

    togglePlayPause() {
      this.isPlaying = !this.isPlaying;
    },

    toggleControls() {
      this.showControls = !this.showControls;
    },

    updatePerformanceMetrics(fps, activeVoxels) {
      this.fps = fps;
      this.activeVoxels = activeVoxels;
    },

    // Preset configurations
    applySmallFirePreset() {
      this.setFireDimensions(15, 20, 15);
      this.setVoxelSize(0.6);
      this.setFireUpdateInterval(60);
    },

    applyMediumFirePreset() {
      this.setFireDimensions(20, 30, 20);
      this.setVoxelSize(0.5);
      this.setFireUpdateInterval(50);
    },

    applyLargeFirePreset() {
      this.setFireDimensions(30, 40, 30);
      this.setVoxelSize(0.4);
      this.setFireUpdateInterval(40);
    },

    applyIntenseFirePreset() {
      this.setFireDimensions(25, 35, 25);
      this.setVoxelSize(0.45);
      this.setFireUpdateInterval(30); // Faster updates = more intense fire
    },

    applyGentleFirePreset() {
      this.setFireDimensions(20, 25, 20);
      this.setVoxelSize(0.5);
      this.setFireUpdateInterval(80); // Slower updates = gentler fire
    }
  }
});
