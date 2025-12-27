import * as THREE from 'three';
import PhysicsManager from '../core/PhysicsManager.js';

class Arena {
  constructor() {
    this.group = new THREE.Group();
    this.width = 40;
    this.depth = 40;
    this.wallHeight = 5;
    this.wallThickness = 1;
  }
  
  create() {
    this.createFloor();
    this.createWalls();
    this.createLighting();
    this.createObstacles();
    return this.group;
  }
  
  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(this.width, this.depth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333344,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    this.group.add(floor);
    
    PhysicsManager.createGroundCollider(this.width, this.depth);
    
    const gridHelper = new THREE.GridHelper(this.width, 20, 0x444466, 0x222233);
    gridHelper.position.y = 0.01;
    this.group.add(gridHelper);
  }
  
  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x445566,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const halfWidth = this.width / 2;
    const halfDepth = this.depth / 2;
    const halfHeight = this.wallHeight / 2;
    
    const wallConfigs = [
      { w: this.width, h: this.wallHeight, d: this.wallThickness, x: 0, y: halfHeight, z: -halfDepth },
      { w: this.width, h: this.wallHeight, d: this.wallThickness, x: 0, y: halfHeight, z: halfDepth },
      { w: this.wallThickness, h: this.wallHeight, d: this.depth, x: -halfWidth, y: halfHeight, z: 0 },
      { w: this.wallThickness, h: this.wallHeight, d: this.depth, x: halfWidth, y: halfHeight, z: 0 }
    ];
    
    wallConfigs.forEach((config, index) => {
      const geometry = new THREE.BoxGeometry(config.w, config.h, config.d);
      const wall = new THREE.Mesh(geometry, wallMaterial);
      wall.position.set(config.x, config.y, config.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.name = `wall_${index}`;
      this.group.add(wall);
      
      PhysicsManager.createWallCollider(
        config.w, config.h, config.d,
        config.x, config.y, config.z
      );
    });
  }
  
  createLighting() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    this.group.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.bias = -0.0001;
    
    this.group.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362312, 0.3);
    this.group.add(hemisphereLight);
  }
  
  createObstacles() {
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x556677,
      roughness: 0.6,
      metalness: 0.4
    });
    
    this.obstacles = [
      { x: -10, z: -10, w: 3, h: 2, d: 3 },
      { x: 10, z: -10, w: 3, h: 2, d: 3 },
      { x: -10, z: 10, w: 3, h: 2, d: 3 },
      { x: 10, z: 10, w: 3, h: 2, d: 3 },
      { x: 0, z: 0, w: 4, h: 1.5, d: 4 },
    ];
    
    this.obstacles.forEach((obs, index) => {
      const geometry = new THREE.BoxGeometry(obs.w, obs.h, obs.d);
      const mesh = new THREE.Mesh(geometry, obstacleMaterial);
      mesh.position.set(obs.x, obs.h / 2, obs.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `obstacle_${index}`;
      this.group.add(mesh);
      
      PhysicsManager.createWallCollider(
        obs.w, obs.h, obs.d,
        obs.x, obs.h / 2, obs.z
      );
    });
  }
  
  getSpawnPoints() {
    return [
      { x: -15, y: 1, z: -15 },
      { x: 15, y: 1, z: -15 },
      { x: -15, y: 1, z: 15 },
      { x: 15, y: 1, z: 15 },
    ];
  }
  
  getPlayerSpawnPoint() {
    return { x: 0, y: 1, z: 15 };
  }
  
  getFloorGeometry() {
    const floor = this.group.getObjectByName('floor');
    return floor ? floor.geometry : null;
  }
  
  getNavigationBounds() {
    return {
      width: this.width,
      depth: this.depth,
      obstacles: this.obstacles || []
    };
  }
}

export default Arena;
