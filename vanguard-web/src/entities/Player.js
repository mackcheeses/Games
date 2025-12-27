import * as THREE from 'three';
import PhysicsManager from '../core/PhysicsManager.js';
import InputController from '../core/InputController.js';

class Player {
  constructor() {
    this.camera = null;
    this.body = null;
    this.collider = null;
    
    this.position = new THREE.Vector3(0, 1, 15);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = { pitch: 0, yaw: 0 };
    
    this.moveSpeed = 5.0;
    this.sprintSpeed = 8.0;
    this.crouchSpeed = 2.5;
    this.jumpForce = 5.0;
    this.gravity = -20.0;
    
    this.height = 1.8;
    this.crouchHeight = 1.0;
    this.eyeOffset = 0.7;
    this.radius = 0.3;
    
    this.isGrounded = false;
    this.isCrouching = false;
    this.isSprinting = false;
    
    this.health = 100;
    this.maxHealth = 100;
    
    this.tempVec3 = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
  }
  
  init(camera, spawnPoint) {
    this.camera = camera;
    
    if (spawnPoint) {
      this.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
    }
    
    const { body, collider } = PhysicsManager.createKinematicBody(
      this.position.x,
      this.position.y,
      this.position.z,
      { x: this.radius, y: this.height / 2, z: this.radius }
    );
    
    this.body = body;
    this.collider = collider;
    
    this.camera.position.copy(this.position);
    this.camera.position.y += this.eyeOffset;
    
    this.camera.fov = 75;
    this.camera.near = 0.1;
    this.camera.far = 100;
    this.camera.updateProjectionMatrix();
    
    console.log('[Player] Initialized at', this.position);
    return this;
  }
  
  update(deltaTime) {
    InputController.update();
    
    this.handleLook();
    this.handleMovement(deltaTime);
    this.handleActions();
    
    this.updateCamera();
    
    InputController.resetLookDelta();
  }
  
  handleLook() {
    const look = InputController.getLook();
    
    this.rotation.yaw -= look.x;
    this.rotation.pitch -= look.y;
    
    this.rotation.pitch = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, this.rotation.pitch)
    );
  }
  
  handleMovement(deltaTime) {
    const movement = InputController.getMovement();
    const actions = InputController.getActions();
    
    this.forward.set(
      Math.sin(this.rotation.yaw),
      0,
      Math.cos(this.rotation.yaw)
    ).normalize();
    
    this.right.set(
      Math.cos(this.rotation.yaw),
      0,
      -Math.sin(this.rotation.yaw)
    ).normalize();
    
    this.moveDirection.set(0, 0, 0);
    this.moveDirection.addScaledVector(this.right, movement.x);
    this.moveDirection.addScaledVector(this.forward, movement.z);
    
    if (this.moveDirection.length() > 0) {
      this.moveDirection.normalize();
    }
    
    let speed = this.moveSpeed;
    if (this.isCrouching) {
      speed = this.crouchSpeed;
    } else if (this.isSprinting && movement.z < 0) {
      speed = this.sprintSpeed;
    }
    
    this.velocity.x = this.moveDirection.x * speed;
    this.velocity.z = this.moveDirection.z * speed;
    
    if (this.isGrounded) {
      if (actions.jump) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        InputController.consumeAction('jump');
      } else {
        this.velocity.y = -0.1;
      }
    } else {
      this.velocity.y += this.gravity * deltaTime;
    }
    
    this.velocity.y = Math.max(this.velocity.y, -30);
    
    const desiredMovement = {
      x: this.velocity.x * deltaTime,
      y: this.velocity.y * deltaTime,
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
    
    this.isGrounded = PhysicsManager.isGrounded();
    
    if (this.position.y < -10) {
      this.respawn();
    }
  }
  
  handleActions() {
    const actions = InputController.getActions();
    
    if (actions.crouch !== this.isCrouching) {
      this.isCrouching = actions.crouch;
      this.updateColliderHeight();
    }
    
    this.isSprinting = InputController.keys['ShiftLeft'] || InputController.keys['ShiftRight'];
  }
  
  updateColliderHeight() {
    const targetHeight = this.isCrouching ? this.crouchHeight : this.height;
    console.log('[Player] Crouch:', this.isCrouching, 'Height:', targetHeight);
  }
  
  updateCamera() {
    const eyeHeight = this.isCrouching
      ? this.crouchHeight - 0.2
      : this.height - 0.2;
    
    this.camera.position.set(
      this.position.x,
      this.position.y + eyeHeight,
      this.position.z
    );
    
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.rotation.yaw;
    this.camera.rotation.x = this.rotation.pitch;
  }
  
  respawn() {
    this.position.set(0, 2, 15);
    this.velocity.set(0, 0, 0);
    this.rotation.pitch = 0;
    this.rotation.yaw = 0;
    this.health = this.maxHealth;
    
    this.body.setNextKinematicTranslation({
      x: this.position.x,
      y: this.position.y,
      z: this.position.z
    });
    
    console.log('[Player] Respawned');
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    if (this.health <= 0) {
      this.onDeath();
    }
    
    return this.health;
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health;
  }
  
  onDeath() {
    console.log('[Player] Died');
  }
  
  getPosition() {
    return this.position.clone();
  }
  
  getRotation() {
    return { ...this.rotation };
  }
  
  getForward() {
    return new THREE.Vector3(
      Math.sin(this.rotation.yaw) * Math.cos(this.rotation.pitch),
      -Math.sin(this.rotation.pitch),
      Math.cos(this.rotation.yaw) * Math.cos(this.rotation.pitch)
    ).normalize();
  }
  
  getHealth() {
    return this.health;
  }
  
  getMaxHealth() {
    return this.maxHealth;
  }
  
  isAlive() {
    return this.health > 0;
  }
  
  getDebugInfo() {
    return {
      position: `${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)}`,
      velocity: `${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)}, ${this.velocity.z.toFixed(2)}`,
      grounded: this.isGrounded,
      crouching: this.isCrouching,
      health: this.health
    };
  }
}

export default Player;
