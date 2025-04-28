import { defineStore } from 'pinia';

export const useFireEffectStore = defineStore('fireEffect', {
  state: () => ({
    // Fire configuration
    fireWidth: 100,
    fireHeight: 40,
    fireDepth: 4,
    voxelSize: 3,
    fireUpdateInterval: 25, // 75% intensity
    opacity: 1, // Fully opaque voxels

    // Camera settings
    cameraPosition: { x: -28.86, y: 46.92, z: -267.69 },
    cameraRotation: { x: Math.PI, y: 0, z: Math.PI },

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
      this.fireDepth = Math.max(1, depth); // Ensure minimum depth of 1
    },

    adjustFireDepth(change) {
      this.fireDepth = Math.max(1, this.fireDepth + change);
    },

    setVoxelSize(size) {
      this.voxelSize = size;
    },

    setOpacity(value) {
      // Clamp to valid opacity range (0-1)
      this.opacity = Math.max(0, Math.min(1, value));
    },

    setFireUpdateInterval(interval) {
      // Clamp to reasonable values (1-100ms)
      this.fireUpdateInterval = Math.max(1, Math.min(100, interval));
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



    // Camera controls
    setCameraPosition(x, y, z) {
      this.cameraPosition = { x: Number(x), y: Number(y), z: Number(z) };
    },

    setCameraRotation(x, y, z) {
      this.cameraRotation = { x: Number(x), y: Number(y), z: Number(z) };
    },

    updateCameraFromOrbitControls(camera) {
      this.cameraPosition = {
        x: Number(camera.position.x.toFixed(2)),
        y: Number(camera.position.y.toFixed(2)),
        z: Number(camera.position.z.toFixed(2))
      };
      this.cameraRotation = {
        x: Number(camera.rotation.x.toFixed(2)),
        y: Number(camera.rotation.y.toFixed(2)),
        z: Number(camera.rotation.z.toFixed(2))
      };
    }
  }
});
