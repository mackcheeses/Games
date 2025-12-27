# Vanguard Web

A mobile-optimized 3D FPS game built with Three.js and Rapier physics, designed for GitHub Pages deployment.

## Features

- **Cross-Platform**: Works on Android Chrome and Desktop browsers
- **Physics-Based**: Rapier3D WASM physics engine with Kinematic Character Controller
- **Mobile Controls**: NippleJS dual virtual joysticks
- **Wave-Based Survival**: Fight through waves of enemies
- **Performance Optimized**: Fixed timestep physics, frustum culling, object pooling

## Tech Stack

- **Three.js** - 3D rendering (WebGL 2.0)
- **Rapier3D** - WASM physics engine
- **three-pathfinding** - NavMesh-based AI navigation
- **NippleJS** - Virtual joystick controls
- **Vite** - Build tool

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Project Structure

```
vanguard-web/
├── public/              # Static assets (WASM copied here at build)
├── src/
│   ├── main.js          # Entry point
│   ├── Game.js          # Main game orchestrator
│   ├── core/            # Core systems (physics, input, audio)
│   ├── systems/         # Game systems (navigation, weapons, enemies)
│   ├── entities/        # Game entities (player, enemy)
│   ├── world/           # World construction (arena, lighting)
│   ├── ui/              # User interface (HUD, menus)
│   └── utils/           # Utilities (pooling, math, storage)
├── index.html
├── style.css
├── vite.config.js
└── package.json
```

## Controls

### Desktop
- **WASD** - Move
- **Mouse** - Look around
- **Left Click** - Fire
- **Right Click** - Aim Down Sights
- **Space** - Jump
- **C** - Crouch
- **R** - Reload

### Mobile
- **Left Joystick** - Move
- **Right Joystick** - Look
- **Fire Button** - Shoot
- **ADS Button** - Aim Down Sights
- **Jump Button** - Jump
- **Crouch Button** - Toggle crouch
- **Reload Button** - Reload weapon

## License

MIT
