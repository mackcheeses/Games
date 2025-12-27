import * as THREE from 'three';
import PhysicsManager from './core/PhysicsManager.js';
import InputController from './core/InputController.js';
import Arena from './world/Arena.js';
import Player from './entities/Player.js';

class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    this.arena = null;
    this.player = null;
    this.debugInfo = document.getElementById('debug-info');
    this.frameCount = 0;
    this.fps = 0;
    this.lastFpsUpdate = 0;
  }
  
  async init() {
    console.log('[Game] Initializing...');
    
    await PhysicsManager.init();
    
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    
    InputController.init(this.renderer.domElement);
    
    this.arena = new Arena();
    this.scene.add(this.arena.create());
    
    this.player = new Player();
    this.player.init(this.camera, this.arena.getPlayerSpawnPoint());
    
    this.clock = new THREE.Clock();
    
    this.setupEventListeners();
    
    this.hideLoading();
    this.showStartPrompt();
    
    console.log('[Game] Initialization complete');
    return this;
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    const container = document.getElementById('game-container');
    container.appendChild(this.renderer.domElement);
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 30, 60);
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 2, 15);
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());
    
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
      setTimeout(() => {
        loading.style.display = 'none';
      }, 500);
    }
  }
  
  showStartPrompt() {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.innerHTML = 'Click to play<br><small>WASD to move | Mouse to look | Space to jump | C to crouch</small>';
      crosshair.style.fontSize = '16px';
      crosshair.style.textAlign = 'center';
      crosshair.style.lineHeight = '1.5';
    }
  }
  
  updateCrosshair() {
    const crosshair = document.getElementById('crosshair');
    if (crosshair && InputController.isLocked()) {
      crosshair.innerHTML = '+';
      crosshair.style.fontSize = '24px';
      crosshair.style.display = 'block';
    }
  }
  
  updateDebugInfo(deltaTime) {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
    
    if (this.debugInfo && this.player) {
      const debug = this.player.getDebugInfo();
      this.debugInfo.textContent = [
        `FPS: ${this.fps}`,
        `Pos: ${debug.position}`,
        `Vel: ${debug.velocity}`,
        `Grounded: ${debug.grounded}`,
        `Crouching: ${debug.crouching}`,
        `Health: ${debug.health}`,
        `Pointer Lock: ${InputController.isLocked()}`
      ].join('\n');
    }
  }
  
  update(deltaTime) {
    PhysicsManager.update(deltaTime);
    
    if (this.player) {
      this.player.update(deltaTime);
    }
    
    this.updateCrosshair();
    this.updateDebugInfo(deltaTime);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  start() {
    console.log('[Game] Starting game loop');
    
    const gameLoop = () => {
      requestAnimationFrame(gameLoop);
      
      const deltaTime = Math.min(this.clock.getDelta(), 0.1);
      
      this.update(deltaTime);
      this.render();
    };
    
    gameLoop();
  }
  
  destroy() {
    PhysicsManager.destroy();
    InputController.destroy();
    this.renderer.dispose();
  }
}

export default Game;
