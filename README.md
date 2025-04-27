# Voxel Fire

## Controls

- Drag with the mouse to rotate the view
- Scroll to zoom in and out
- Use the control panel to adjust fire properties:
  - Intensity: Controls how fast the fire updates
  - Size: Changes the dimensions of the fire effect
  - Presets: Quick configurations for different fire styles
  - Play/Pause: Toggles the fire animation

## Performance Considerations

The fire effect uses [Three.js](https://threejs.org/) instanced mesh rendering for optimal performance. However, if you experience performance issues:

1. Reduce fire dimensions (width, height, depth)
2. Increase fire update interval (slower updates)
3. Increase voxel size (less detailed fire)

## Customization

To customize the fire appearance, you can modify:

1. The fire palette colors in the `createFirePalette` function
2. The fire propagation algorithm in the `propagateFire` function 
3. The decay rate and randomness in the fire algorithm

## Project Setup

```sh
npm install
```

## Testing

```sh
npx vitest
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
