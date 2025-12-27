import * as THREE from 'three';
import PhysicsManager from '../core/PhysicsManager.js';

const EnemyState = {
  IDLE: 'IDLE',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  DEAD: 'DEAD'
};

class Enemy {
  constructor(id) {
    this.id = id;
    this.mesh = null;
    this.body = null;
    this.collider = null;
    
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    
    this.state = EnemyState.IDLE;
    this.health = 100;
    this.maxHealth = 100;
    this.damage = 10;
    this.moveSpeed = 3.0;
    this.attackRange = 2.0;
    this.detectionRange = 20.0;
    this.attackCooldown = 1.0;
    this.lastAttackTime = 0;
    
    this.currentPath = [];
    this.pathIndex = 0;
    this.pathUpdateInterval = 0.5;
    this.lastPathUpdate = 0;
    
    this.isActive = false;
    this.deathTime = 0;
    this.fadeOutDuration = 1.0;
    
    this.onDeathCallbacks = [];
    this.onAttackCallbacks = [];
  }
  
  create(scene, position) {
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.copy(position);
    this.mesh.userData.enemy = this;
    this.mesh.userData.enemyId = this.id;
    
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.4, -0.35);
    this.mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.4, -0.35);
    this.mesh.add(rightEye);
    
    scene.add(this.mesh);
    
    this.position.copy(position);
    
    const { body, collider } = PhysicsManager.createKinematicBody(
      position.x, position.y, position.z,
      { x: 0.4, y: 0.9, z: 0.4 }
    );
    
    this.body = body;
    this.collider = collider;
    
    this.isActive = true;
    this.state = EnemyState.IDLE;
    this.health = this.maxHealth;
    
    return this;
  }
  
  update(deltaTime, playerPosition, navigationManager) {
    if (!this.isActive) return;
    
    if (this.state === EnemyState.DEAD) {
      this.updateDeath(deltaTime);
      return;
    }
    
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    this.updateState(distanceToPlayer);
    
    switch (this.state) {
      case EnemyState.IDLE:
        break;
        
      case EnemyState.CHASE:
        this.updateChase(deltaTime, playerPosition, navigationManager);
        break;
        
      case EnemyState.ATTACK:
        this.updateAttack(deltaTime, playerPosition);
        break;
    }
    
    this.updateMesh();
  }
  
  updateState(distanceToPlayer) {
    if (this.state === EnemyState.DEAD) return;
    
    if (distanceToPlayer <= this.attackRange) {
      this.state = EnemyState.ATTACK;
    } else if (distanceToPlayer <= this.detectionRange) {
      this.state = EnemyState.CHASE;
    } else {
      this.state = EnemyState.IDLE;
    }
  }
  
  updateChase(deltaTime, playerPosition, navigationManager) {
    const now = performance.now() / 1000;
    
    if (now - this.lastPathUpdate > this.pathUpdateInterval) {
      this.currentPath = navigationManager.findPath(this.position, playerPosition);
      this.pathIndex = 0;
      this.lastPathUpdate = now;
    }
    
    if (this.currentPath.length > 0) {
      let targetPoint = this.currentPath[this.pathIndex];
      
      if (!targetPoint) {
        targetPoint = playerPosition;
      }
      
      const direction = new THREE.Vector3(
        targetPoint.x - this.position.x,
        0,
        targetPoint.z - this.position.z
      );
      
      const distanceToWaypoint = direction.length();
      
      if (distanceToWaypoint < 0.5 && this.pathIndex < this.currentPath.length - 1) {
        this.pathIndex++;
      }
      
      if (distanceToWaypoint > 0.1) {
        direction.normalize();
        
        this.velocity.x = direction.x * this.moveSpeed;
        this.velocity.z = direction.z * this.moveSpeed;
        
        const desiredMovement = {
          x: this.velocity.x * deltaTime,
          y: -0.1,
          z: this.velocity.z * deltaTime
        };
        
        const computedMovement = PhysicsManager.moveCharacter(
          this.collider,
          desiredMovement,
          deltaTime
        );
        
        this.position.x += computedMovement.x;
        this.position.y += computedMovement.y;
        this.position.z += computedMovement.z;
        
        this.body.setNextKinematicTranslation({
          x: this.position.x,
          y: this.position.y,
          z: this.position.z
        });
        
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
      }
    }
  }
  
  updateAttack(deltaTime, playerPosition) {
    const now = performance.now() / 1000;
    
    const direction = new THREE.Vector3(
      playerPosition.x - this.position.x,
      0,
      playerPosition.z - this.position.z
    );
    const angle = Math.atan2(direction.x, direction.z);
    this.mesh.rotation.y = angle;
    
    if (now - this.lastAttackTime >= this.attackCooldown) {
      this.performAttack();
      this.lastAttackTime = now;
    }
  }
  
  performAttack() {
    this.onAttackCallbacks.forEach(cb => cb(this, this.damage));
    
    if (this.mesh) {
      const originalScale = this.mesh.scale.x;
      this.mesh.scale.set(1.2, 0.8, 1.2);
      
      setTimeout(() => {
        if (this.mesh) {
          this.mesh.scale.set(originalScale, originalScale, originalScale);
        }
      }, 100);
    }
  }
  
  updateDeath(deltaTime) {
    const elapsed = (performance.now() - this.deathTime) / 1000;
    const progress = elapsed / this.fadeOutDuration;
    
    if (this.mesh) {
      this.mesh.material.opacity = 1 - progress;
      this.mesh.material.transparent = true;
      this.mesh.position.y -= deltaTime * 0.5;
    }
    
    if (progress >= 1) {
      this.isActive = false;
    }
  }
  
  updateMesh() {
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
  }
  
  takeDamage(amount) {
    if (this.state === EnemyState.DEAD) return;
    
    this.health -= amount;
    
    if (this.mesh) {
      const originalColor = this.mesh.material.color.getHex();
      this.mesh.material.color.setHex(0xffffff);
      
      setTimeout(() => {
        if (this.mesh && this.state !== EnemyState.DEAD) {
          this.mesh.material.color.setHex(originalColor);
        }
      }, 50);
    }
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.state = EnemyState.DEAD;
    this.health = 0;
    this.deathTime = performance.now();
    
    if (this.mesh) {
      this.mesh.material.color.setHex(0x444444);
    }
    
    this.onDeathCallbacks.forEach(cb => cb(this));
  }
  
  reset(position) {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.state = EnemyState.IDLE;
    this.isActive = true;
    this.currentPath = [];
    this.pathIndex = 0;
    
    if (this.mesh) {
      this.mesh.position.copy(position);
      this.mesh.material.opacity = 1;
      this.mesh.material.transparent = false;
      this.mesh.material.color.setHex(0xff4444);
      this.mesh.visible = true;
    }
    
    if (this.body) {
      this.body.setNextKinematicTranslation({
        x: position.x,
        y: position.y,
        z: position.z
      });
    }
  }
  
  hide() {
    if (this.mesh) {
      this.mesh.visible = false;
    }
    this.isActive = false;
  }
  
  onDeath(callback) {
    this.onDeathCallbacks.push(callback);
  }
  
  onAttack(callback) {
    this.onAttackCallbacks.push(callback);
  }
  
  getPosition() {
    return this.position.clone();
  }
  
  getState() {
    return this.state;
  }
  
  isAlive() {
    return this.health > 0 && this.state !== EnemyState.DEAD;
  }
  
  destroy(scene) {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    
    if (this.body) {
      PhysicsManager.removeBody(this.body);
    }
    
    if (this.collider) {
      PhysicsManager.removeCollider(this.collider);
    }
  }
}

export { Enemy, EnemyState };
