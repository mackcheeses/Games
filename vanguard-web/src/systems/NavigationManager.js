import * as THREE from 'three';
import { Pathfinding } from 'three-pathfinding';

class NavigationManager {
  constructor() {
    this.pathfinding = null;
    this.zone = null;
    this.zoneName = 'arena';
    this.navMesh = null;
    this.debugHelper = null;
  }
  
  init(floorBounds) {
    this.pathfinding = new Pathfinding();
    
    this.navMesh = this.createNavMeshGeometry(floorBounds);
    
    this.zone = Pathfinding.createZone(this.navMesh);
    this.pathfinding.setZoneData(this.zoneName, this.zone);
    
    console.log('[NavigationManager] NavMesh created with', this.zone.groups.length, 'groups');
    return this;
  }
  
  createNavMeshGeometry(bounds) {
    const { width, depth, obstacles } = bounds;
    
    const halfWidth = width / 2 - 1;
    const halfDepth = depth / 2 - 1;
    
    const vertices = [];
    const indices = [];
    
    const gridSize = 2;
    const cols = Math.floor(width / gridSize);
    const rows = Math.floor(depth / gridSize);
    
    const getIndex = (x, z) => x + z * (cols + 1);
    
    for (let z = 0; z <= rows; z++) {
      for (let x = 0; x <= cols; x++) {
        const px = -halfWidth + (x / cols) * (halfWidth * 2);
        const pz = -halfDepth + (z / rows) * (halfDepth * 2);
        vertices.push(px, 0, pz);
      }
    }
    
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        const cellCenterX = -halfWidth + ((x + 0.5) / cols) * (halfWidth * 2);
        const cellCenterZ = -halfDepth + ((z + 0.5) / rows) * (halfDepth * 2);
        
        let blocked = false;
        if (obstacles) {
          for (const obs of obstacles) {
            const dx = Math.abs(cellCenterX - obs.x);
            const dz = Math.abs(cellCenterZ - obs.z);
            if (dx < obs.w / 2 + 1 && dz < obs.d / 2 + 1) {
              blocked = true;
              break;
            }
          }
        }
        
        if (!blocked) {
          const a = getIndex(x, z);
          const b = getIndex(x + 1, z);
          const c = getIndex(x, z + 1);
          const d = getIndex(x + 1, z + 1);
          
          indices.push(a, c, b);
          indices.push(b, c, d);
        }
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  findPath(startPos, endPos) {
    if (!this.pathfinding || !this.zone) {
      return [endPos];
    }
    
    const start = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
    const end = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
    
    const groupID = this.pathfinding.getGroup(this.zoneName, start);
    
    if (groupID === null) {
      return [end];
    }
    
    const path = this.pathfinding.findPath(start, end, this.zoneName, groupID);
    
    if (!path || path.length === 0) {
      return [end];
    }
    
    return path;
  }
  
  getClosestNode(position) {
    if (!this.pathfinding || !this.zone) {
      return position;
    }
    
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    const groupID = this.pathfinding.getGroup(this.zoneName, pos);
    
    if (groupID === null) {
      return position;
    }
    
    const closestNode = this.pathfinding.getClosestNode(pos, this.zoneName, groupID);
    
    if (closestNode) {
      return {
        x: closestNode.centroid.x,
        y: closestNode.centroid.y,
        z: closestNode.centroid.z
      };
    }
    
    return position;
  }
  
  isPointOnNavMesh(position) {
    if (!this.pathfinding || !this.zone) {
      return true;
    }
    
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    const groupID = this.pathfinding.getGroup(this.zoneName, pos);
    
    return groupID !== null;
  }
  
  clampToNavMesh(position) {
    if (!this.isPointOnNavMesh(position)) {
      return this.getClosestNode(position);
    }
    return position;
  }
  
  createDebugVisualization(scene) {
    if (this.navMesh) {
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      
      this.debugHelper = new THREE.Mesh(this.navMesh.clone(), material);
      this.debugHelper.position.y = 0.1;
      scene.add(this.debugHelper);
    }
  }
  
  hideDebugVisualization() {
    if (this.debugHelper) {
      this.debugHelper.visible = false;
    }
  }
  
  showDebugVisualization() {
    if (this.debugHelper) {
      this.debugHelper.visible = true;
    }
  }
  
  destroy() {
    if (this.navMesh) {
      this.navMesh.dispose();
    }
    if (this.debugHelper) {
      this.debugHelper.geometry.dispose();
      this.debugHelper.material.dispose();
    }
  }
}

export default NavigationManager;
