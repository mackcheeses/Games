import * as THREE from 'three';
import PhysicsManager from './core/PhysicsManager.js';
import Arena from './world/Arena.js';

class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    this.arena = null;
    this.testCubes = [];
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
    
    this.arena = new Arena();
    this.scene.add(this.arena.create());
    
    this.spawnTestCubes();
    
    this.clock = new THREE.Clock();
    
    this.setupEventListeners();
    
    this.hideLoading();
    
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
    this.camera.position.set(0, 15, 25);
    this.camera.lookAt(0, 0, 0);
  }
  
  spawnTestCubes() {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      roughness: 0.4,
      metalness: 0.6
    });
    
    const spawnPositions = [
      { x: -5, y: 10, z: -5 },
      { x: 0, y: 12, z: 0 },
      { x: 5, y: 14, z: 5 },
      { x: -3, y: 8, z: 3 },
      { x: 3, y: 16, z: -3 },
    ];
    
    spawnPositions.forEach((pos, index) => {
      const mesh = new THREE.Mesh(cubeGeometry, cubeMaterial.clone());
      mesh.material.color.setHSL(index * 0.15, 0.7, 0.5);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      
      const { body, collider } = PhysicsManager.createDynamicBody(
        pos.x, pos.y, pos.z,
        { x: 0.5, y: 0.5, z: 0.5 }
      );
      
      this.testCubes.push({ mesh, body, collider });
    });
    
    console.log(`[Game] Spawned ${this.testCubes.length} test cubes`);
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());
    
    this.renderer.domElement.addEventListener('click', () => {
      this.spawnCubeAtRandom();
    });
  }
  
  spawnCubeAtRandom() {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
      roughness: 0.4,
      metalness: 0.6
    });
    
    const x = (Math.random() - 0.5) * 20;
    const y = 10 + Math.random() * 10;
    const z = (Math.random() - 0.5) * 20;
    
    const mesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    
    const { body, collider } = PhysicsManager.createDynamicBody(
      x, y, z,
      { x: 0.5, y: 0.5, z: 0.5 }
    );
    
    this.testCubes.push({ mesh, body, collider });
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
  
  updateDebugInfo(deltaTime) {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
    
    if (this.debugInfo) {
      this.debugInfo.textContent = [
        `FPS: ${this.fps}`,
        `Cubes: ${this.testCubes.length}`,
        `Physics: Rapier3D`,
        `Click to spawn cubes!`
      ].join('\n');
    }
  }
  
  update(deltaTime) {
    PhysicsManager.update(deltaTime);
    
    this.testCubes.forEach(cube => {
      const pos = PhysicsManager.getBodyPosition(cube.body);
      const rot = PhysicsManager.getBodyRotation(cube.body);
      
      cube.mesh.position.set(pos.x, pos.y, pos.z);
      cube.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    });
    
    this.updateDebugInfo(deltaTime);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  start() {
    console.log('[Game] Starting game loop');
    
    const gameLoop = () => {
      requestAnimationFrame(gameLoop);
      
      const deltaTime = this.clock.getDelta();
      
      this.update(deltaTime);
      this.render();
    };
    
    gameLoop();
  }
  
  destroy() {
    PhysicsManager.destroy();
    this.renderer.dispose();
  }
}

export default Game;
