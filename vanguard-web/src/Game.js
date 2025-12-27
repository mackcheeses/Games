import * as THREE from 'three';
import PhysicsManager from './core/PhysicsManager.js';
import InputController from './core/InputController.js';
import Arena from './world/Arena.js';
import Player from './entities/Player.js';
import WeaponSystem from './systems/WeaponSystem.js';
import NavigationManager from './systems/NavigationManager.js';
import EnemyManager from './systems/EnemyManager.js';
import WaveManager from './systems/WaveManager.js';
import HUD from './ui/HUD.js';

class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    this.arena = null;
    this.player = null;
    this.weaponSystem = null;
    this.navigationManager = null;
    this.enemyManager = null;
    this.waveManager = null;
    this.hud = null;
    this.debugInfo = document.getElementById('debug-info');
    this.frameCount = 0;
    this.fps = 0;
    this.lastFpsUpdate = 0;
    this.gameStarted = false;
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
    
    this.weaponSystem = new WeaponSystem();
    this.weaponSystem.init(this.camera, this.scene);
    
    this.navigationManager = new NavigationManager();
    this.navigationManager.init(this.arena.getNavigationBounds());
    
    this.enemyManager = new EnemyManager();
    this.enemyManager.init(
      this.scene,
      this.navigationManager,
      this.player,
      this.weaponSystem,
      this.arena.getSpawnPoints()
    );
    
    this.enemyManager.onPlayerDamage((damage, attacker) => {
      this.player.takeDamage(damage);
      if (!this.player.isAlive()) {
        this.waveManager.handlePlayerDeath();
      }
    });
    
    this.hud = new HUD();
    this.hud.init();
    
    this.waveManager = new WaveManager();
    this.waveManager.init(this.enemyManager, this.hud);
    
    this.waveManager.onGameOver((victory, kills) => {
      console.log('[Game] Game over!', victory ? 'Victory!' : 'Defeat', 'Kills:', kills);
    });
    
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
    
    const startGame = () => {
      if (!this.gameStarted && InputController.isLocked()) {
        this.gameStarted = true;
        this.waveManager.start();
      }
    };
    
    document.addEventListener('click', startGame);
    document.addEventListener('touchstart', () => {
      if (!this.gameStarted) {
        this.gameStarted = true;
        this.waveManager.start();
      }
    }, { once: true });
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
      if (InputController.isMobileDevice()) {
        crosshair.innerHTML = 'Tap to start<br><small>Left: Move | Right: Look | Buttons: Actions</small>';
      } else {
        crosshair.innerHTML = 'Click to play<br><small>WASD to move | Mouse to look | LMB to shoot | R to reload</small>';
      }
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
  
  updateHUD() {
    if (!this.hud || !this.player || !this.weaponSystem) return;
    
    this.hud.updateHealth(this.player.getHealth(), this.player.getMaxHealth());
    
    const weaponState = this.weaponSystem.getState();
    this.hud.updateAmmo(
      weaponState.currentMagazine,
      weaponState.reserveAmmo,
      weaponState.magazineSize
    );
    
    if (weaponState.isReloading) {
      this.hud.showReload(weaponState.reloadProgress);
    } else {
      this.hud.hideReload();
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
      const weaponState = this.weaponSystem ? this.weaponSystem.getState() : {};
      const waveState = this.waveManager ? this.waveManager.getState() : 'N/A';
      const enemyCount = this.enemyManager ? this.enemyManager.getAliveCount() : 0;
      
      this.debugInfo.textContent = [
        `FPS: ${this.fps}`,
        `Pos: ${debug.position}`,
        `Health: ${debug.health}`,
        `Ammo: ${weaponState.currentMagazine || 0}/${weaponState.reserveAmmo || 0}`,
        `Wave: ${this.waveManager ? this.waveManager.getCurrentWave() : 0}/${this.waveManager ? this.waveManager.getTotalWaves() : 0}`,
        `Enemies: ${enemyCount}`,
        `State: ${waveState}`,
        `Mode: ${InputController.isMobileDevice() ? 'Mobile' : 'Desktop'}`
      ].join('\n');
    }
  }
  
  update(deltaTime) {
    PhysicsManager.update(deltaTime);
    
    if (this.player) {
      this.player.update(deltaTime);
    }
    
    if (this.weaponSystem) {
      this.weaponSystem.update(deltaTime);
    }
    
    if (this.enemyManager && this.gameStarted) {
      this.enemyManager.update(deltaTime);
    }
    
    if (this.waveManager && this.gameStarted) {
      this.waveManager.update(deltaTime);
    }
    
    this.updateHUD();
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
    if (this.weaponSystem) this.weaponSystem.destroy();
    if (this.enemyManager) this.enemyManager.destroy();
    if (this.navigationManager) this.navigationManager.destroy();
    if (this.hud) this.hud.destroy();
    this.renderer.dispose();
  }
}

export default Game;
