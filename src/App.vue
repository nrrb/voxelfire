<!-- src/App.vue -->
<template>
  <div class="app">
    <VoxelFireEffect />
  </div>
</template>

<script setup>
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import VoxelFireEffect from '@/components/VoxelFireEffect.vue';

// Setup Pinia
const pinia = createPinia();
const app = createApp({});
app.use(pinia);
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #000;
  color: #fff;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

.app {
  width: 100vw;
  height: 100vh;
}
</style>
