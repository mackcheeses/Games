import RAPIER from '@dimforge/rapier3d-compat';

class PhysicsManager {
  static FIXED_TIMESTEP = 1 / 60;
  
  constructor() {
    this.world = null;
    this.rapier = null;
    this.bodies = new Map();
    this.colliders = new Map();
    this.characterController = null;
    this.accumulator = 0;
    this.initialized = false;
  }
  
  async init() {
    await RAPIER.init();
    this.rapier = RAPIER;
    
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    
    this.characterController = this.world.createCharacterController(0.01);
    this.characterController.enableAutostep(0.5, 0.2, true);
    this.characterController.enableSnapToGround(0.5);
    this.characterController.setApplyImpulsesToDynamicBodies(true);
    
    this.initialized = true;
    console.log('[PhysicsManager] Rapier initialized successfully');
    return this;
  }
  
  createGroundCollider(width, depth) {
    const groundDesc = RAPIER.ColliderDesc.cuboid(width / 2, 0.1, depth / 2)
      .setTranslation(0, -0.1, 0)
      .setFriction(0.8)
      .setRestitution(0.0);
    
    const collider = this.world.createCollider(groundDesc);
    this.colliders.set('ground', collider);
    return collider;
  }
  
  createWallCollider(width, height, depth, x, y, z) {
    const wallDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
      .setTranslation(x, y, z)
      .setFriction(0.5)
      .setRestitution(0.0);
    
    const collider = this.world.createCollider(wallDesc);
    return collider;
  }
  
  createDynamicBody(x, y, z, halfExtents = { x: 0.5, y: 0.5, z: 0.5 }) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z);
    
    const body = this.world.createRigidBody(bodyDesc);
    
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      halfExtents.x,
      halfExtents.y,
      halfExtents.z
    ).setDensity(1.0);
    
    const collider = this.world.createCollider(colliderDesc, body);
    
    return { body, collider };
  }
  
  createKinematicBody(x, y, z, halfExtents = { x: 0.3, y: 0.9, z: 0.3 }) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(x, y, z);
    
    const body = this.world.createRigidBody(bodyDesc);
    
    const colliderDesc = RAPIER.ColliderDesc.capsule(
      halfExtents.y - halfExtents.x,
      halfExtents.x
    ).setTranslation(0, halfExtents.y, 0);
    
    const collider = this.world.createCollider(colliderDesc, body);
    
    return { body, collider };
  }
  
  moveCharacter(collider, desiredMovement, deltaTime) {
    this.characterController.computeColliderMovement(
      collider,
      desiredMovement,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      null
    );
    
    return this.characterController.computedMovement();
  }
  
  isGrounded() {
    return this.characterController.computedGrounded();
  }
  
  update(deltaTime) {
    if (!this.initialized) return;
    
    this.accumulator += deltaTime;
    
    while (this.accumulator >= PhysicsManager.FIXED_TIMESTEP) {
      this.world.step();
      this.accumulator -= PhysicsManager.FIXED_TIMESTEP;
    }
  }
  
  raycast(origin, direction, maxDistance = 100) {
    if (!this.initialized) return null;
    
    const ray = new RAPIER.Ray(origin, direction);
    const hit = this.world.castRay(ray, maxDistance, true);
    
    if (hit) {
      const hitPoint = ray.pointAt(hit.toi);
      return {
        point: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
        distance: hit.toi,
        collider: hit.collider
      };
    }
    
    return null;
  }
  
  getBodyPosition(body) {
    const translation = body.translation();
    return { x: translation.x, y: translation.y, z: translation.z };
  }
  
  getBodyRotation(body) {
    const rotation = body.rotation();
    return { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w };
  }
  
  removeBody(body) {
    this.world.removeRigidBody(body);
  }
  
  removeCollider(collider) {
    this.world.removeCollider(collider, true);
  }
  
  destroy() {
    if (this.world) {
      this.world.free();
      this.world = null;
    }
    this.initialized = false;
  }
}

export default new PhysicsManager();
