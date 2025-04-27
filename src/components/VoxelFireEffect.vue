<template>
  <div class="voxel-fire-container">
    <div id="scene-container" ref="containerRef"></div>

    <div v-if="store.showControls" class="controls-panel">
      <div class="controls-header">
        <h2>3D Voxel Demoscene Fire Effect</h2>
        <button @click="store.toggleControls" class="btn btn-small">
          <span class="btn-icon">−</span>
        </button>
      </div>

      <div class="controls-body">
        <div class="control-group">
          <label>Fire Intensity</label>
          <input
            type="range"
            min="10"
            max="100"
            :value="100 - store.fireUpdateInterval"
            @input="onIntensityChange"
          />
          <span class="control-value">{{ store.fireIntensity }}%</span>
        </div>

        <div class="control-group">
          <label>Fire Size</label>
          <div class="button-group">
            <button @click="store.applySmallFirePreset" class="btn">Small</button>
            <button @click="store.applyMediumFirePreset" class="btn">Medium</button>
            <button @click="store.applyLargeFirePreset" class="btn">Large</button>
          </div>
        </div>

        <div class="control-group">
          <label>Presets</label>
          <div class="button-group">
            <button @click="store.applyGentleFirePreset" class="btn">Gentle</button>
            <button @click="store.applyIntenseFirePreset" class="btn">Intense</button>
          </div>
        </div>

        <div class="control-group">
          <button
            @click="store.togglePlayPause"
            class="btn btn-primary"
          >
            {{ store.isPlaying ? 'Pause' : 'Play' }}
          </button>
        </div>

        <div class="performance-stats">
          <div>FPS: {{ Math.round(store.fps) }}</div>
          <div>Active Voxels: {{ store.activeVoxels }}</div>
          <div>Voxel Density: {{ Math.round(store.voxelDensity) }}%</div>
        </div>
      </div>
    </div>

    <button
      v-else
      @click="store.toggleControls"
      class="controls-toggle-btn"
    >
      Show Controls
    </button>

    <div class="instructions">
      <p>Drag to rotate, scroll to zoom</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useFireEffectStore } from '@/stores/fireEffectStore';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Store for fire effect configuration
const store = useFireEffectStore();

// Reference to the container element
const containerRef = ref(null);

// Variables to hold Three.js objects
let scene, camera, renderer, controls;
let firePixels, palette;
let instancedMesh, voxelGeometry, voxelMaterial;
let ground, groundGeometry, groundMaterial;
let dummy, animationFrameId;
let lastTime = 0;
let frameCount = 0;
let lastFpsUpdate = 0;

// Intensity slider handler
const onIntensityChange = (event) => {
  const intensity = parseInt(event.target.value);
  store.setFireUpdateInterval(100 - intensity);
};

// Initialize Three.js scene
const initScene = () => {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 40);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  containerRef.value.appendChild(renderer.domElement);

  // Add controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 10, 0);
  controls.update();

  // Create fire palette
  palette = createFirePalette();

  // Initialize fire data structure
  initFireData();

  // Create voxel geometry and material
  voxelGeometry = new THREE.BoxGeometry(store.voxelSize, store.voxelSize, store.voxelSize);
  voxelMaterial = new THREE.MeshBasicMaterial();

  // Create instanced mesh for better performance
  const maxVoxels = store.maxVoxels;
  instancedMesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, maxVoxels);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.count = 0; // Initially no visible voxels
  scene.add(instancedMesh);

  // Dummy for positioning
  dummy = new THREE.Object3D();

  // Add ground to represent the fire source
  groundGeometry = new THREE.PlaneGeometry(
    store.fireWidth * store.voxelSize,
    store.fireDepth * store.voxelSize
  );
  groundMaterial = new THREE.MeshBasicMaterial({
    color: 0x330000,
    side: THREE.DoubleSide
  });
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = Math.PI / 2;
  ground.position.y = -0.25;
  scene.add(ground);

  // Initial fire source
  setFireSource();

  // Start animation
  animate(0);
};

// Create fire palette
const createFirePalette = () => {
  const palette = [];

  // Black (base for no fire)
  palette.push(new THREE.Color(0x000000));

  // Dark red to bright yellow gradient
  for (let i = 0; i < 30; i++) {
    const value = i / 30;
    palette.push(new THREE.Color(
      Math.min(1, value * 3),                       // R: quickly to full
      Math.max(0, Math.min(1, (value - 0.3) * 3)),  // G: delayed start, then quickly to full
      Math.max(0, Math.min(1, (value - 0.6) * 5))   // B: more delayed, then quickly to full but lower max
    ));
  }

  return palette;
};

// Initialize fire data structure
const initFireData = () => {
  firePixels = Array(store.fireWidth).fill().map(() =>
    Array(store.fireHeight).fill().map(() =>
      Array(store.fireDepth).fill(0)
    )
  );
};

// Set fire source values
const setFireSource = () => {
  // The bottom row of the fire effect has the maximum heat
  const y = 0;
  for (let x = 0; x < store.fireWidth; x++) {
    for (let z = 0; z < store.fireDepth; z++) {
      firePixels[x][y][z] = palette.length - 1;
    }
  }
};

// Fire propagation algorithm
const propagateFire = () => {
  for (let x = 0; x < store.fireWidth; x++) {
    for (let y = 1; y < store.fireHeight; y++) {
      for (let z = 0; z < store.fireDepth; z++) {
        // Calculate spread and decay
        const decay = Math.floor(Math.random() * 3);

        // Get the value from the pixel below
        const belowValue = firePixels[x][y-1][z];

        // Random neighbor selection for spreading
        let targetX = x;
        let targetZ = z;

        // Randomly adjust x and z position with some bias upward
        const rand = Math.floor(Math.random() * 4);
        if (rand === 0 && x > 0) targetX = x - 1;
        else if (rand === 1 && x < store.fireWidth - 1) targetX = x + 1;
        else if (rand === 2 && z > 0) targetZ = z - 1;
        else if (rand === 3 && z < store.fireDepth - 1) targetZ = z + 1;

        // Apply the new value with decay
        const newValue = Math.max(0, belowValue - decay);
        firePixels[targetX][y][targetZ] = newValue;
      }
    }
  }
};

// Update voxel visualization
const updateVoxels = () => {
  let count = 0;

  // Iterate through all fire pixels
  for (let x = 0; x < store.fireWidth; x++) {
    for (let y = 0; y < store.fireHeight; y++) {
      for (let z = 0; z < store.fireDepth; z++) {
        const intensity = firePixels[x][y][z];

        // Only render voxels with intensity > 0 (skip black voxels)
        if (intensity > 0) {
          // Position the voxel
          dummy.position.set(
            (x - store.fireWidth / 2) * store.voxelSize,
            y * store.voxelSize,
            (z - store.fireDepth / 2) * store.voxelSize
          );

          // Set color based on the fire intensity
          const color = palette[intensity];
          instancedMesh.setColorAt(count, color);

          // Set the transformation matrix
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(count, dummy.matrix);

          count++;
        }
      }
    }
  }

  // Update active voxels count in the store
  store.updatePerformanceMetrics(store.fps, count);

  // Update instance data
  instancedMesh.count = count;
  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }
};

// Animation loop
const animate = (time) => {
  // Calculate FPS
  frameCount++;
  if (time - lastFpsUpdate > 1000) { // Update FPS every second
    store.updatePerformanceMetrics(frameCount * 1000 / (time - lastFpsUpdate), store.activeVoxels);
    frameCount = 0;
    lastFpsUpdate = time;
  }

  // Update fire at a controlled rate if not paused
  if (store.isPlaying && time - lastTime > store.fireUpdateInterval) {
    lastTime = time;

    // Randomize the fire source
    setFireSource();

    // Propagate fire upward
    propagateFire();

    // Update voxel visualization
    updateVoxels();
  }

  // Render scene
  renderer.render(scene, camera);

  // Request next frame
  animationFrameId = requestAnimationFrame(animate);
};

// Handle window resize
const handleResize = () => {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// Rebuild scene when fire configuration changes
const rebuildScene = () => {
  // Clean up existing scene
  if (scene) {
    scene.remove(instancedMesh);
    scene.remove(ground);

    instancedMesh.dispose();
    voxelGeometry.dispose();
    voxelMaterial.dispose();
    groundGeometry.dispose();
    groundMaterial.dispose();
  }

  // Initialize new fire data
  initFireData();

  // Create new geometry based on updated voxel size
  voxelGeometry = new THREE.BoxGeometry(store.voxelSize, store.voxelSize, store.voxelSize);

  // Create new instanced mesh
  instancedMesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, store.maxVoxels);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.count = 0;
  scene.add(instancedMesh);

  // Update ground plane
  groundGeometry = new THREE.PlaneGeometry(
    store.fireWidth * store.voxelSize,
    store.fireDepth * store.voxelSize
  );
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = Math.PI / 2;
  ground.position.y = -0.25;
  scene.add(ground);

  // Reset fire source
  setFireSource();
};

// Watch for changes in fire configuration
watch(() => [store.fireWidth, store.fireHeight, store.fireDepth, store.voxelSize],
  () => {
    if (scene) {
      rebuildScene();
    }
  },
  { deep: true }
);

// Initialize on mount
onMounted(() => {
  initScene();
  window.addEventListener('resize', handleResize);
});

// Cleanup on unmount
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // Dispose Three.js resources
  if (instancedMesh) instancedMesh.dispose();
  if (voxelGeometry) voxelGeometry.dispose();
  if (voxelMaterial) voxelMaterial.dispose();
  if (groundGeometry) groundGeometry.dispose();
  if (groundMaterial) groundMaterial.dispose();
  if (renderer) renderer.dispose();

  // Remove the canvas
  if (containerRef.value && renderer && renderer.domElement) {
    containerRef.value.removeChild(renderer.domElement);
  }
});
</script>

<style scoped>
.voxel-fire-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

#scene-container {
  width: 100%;
  height: 100%;
}

.controls-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 0.5rem;
  width: 300px;
  z-index: 10;
  overflow: hidden;
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: rgba(50, 50, 50, 0.5);
}

.controls-header h2 {
  font-size: 1.25rem;
  margin: 0;
}

.controls-body {
  padding: 1rem;
}

.control-group {
  margin-bottom: 1rem;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.control-group input[type="range"] {
  width: 100%;
  margin-bottom: 0.25rem;
}

.control-value {
  font-size: 0.875rem;
  color: #cccccc;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.btn {
  background-color: #444444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}
</style>
