import * as THREE from 'three';
import PhysicsManager from '../core/PhysicsManager.js';
import InputController from '../core/InputController.js';

class WeaponSystem {
  constructor() {
    this.currentWeapon = null;
    this.camera = null;
    this.scene = null;
    
    this.weapons = {
      assault_rifle: {
        name: 'AR-15',
        damage: 25,
        fireRate: 600,
        magazineSize: 30,
        reserveAmmo: 90,
        reloadTime: 2.0,
        range: 100,
        normalFOV: 75,
        adsFOV: 45,
        adsSpeed: 0.15,
        spread: 0.02,
        recoil: { x: 0.02, y: 0.05 }
      }
    };
    
    this.state = {
      currentMagazine: 30,
      reserveAmmo: 90,
      isReloading: false,
      reloadProgress: 0,
      lastFireTime: 0,
      isADS: false,
      adsProgress: 0,
      currentFOV: 75
    };
    
    this.muzzleFlash = null;
    this.muzzleFlashDuration = 0.05;
    this.muzzleFlashTimer = 0;
    
    this.onHitCallbacks = [];
    this.onFireCallbacks = [];
  }
  
  init(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.currentWeapon = this.weapons.assault_rifle;
    
    this.state.currentMagazine = this.currentWeapon.magazineSize;
    this.state.reserveAmmo = this.currentWeapon.reserveAmmo;
    this.state.currentFOV = this.currentWeapon.normalFOV;
    
    this.createMuzzleFlash();
    
    console.log('[WeaponSystem] Initialized with', this.currentWeapon.name);
    return this;
  }
  
  createMuzzleFlash() {
    const geometry = new THREE.PlaneGeometry(0.3, 0.3);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.muzzleFlash = new THREE.Mesh(geometry, material);
    this.muzzleFlash.visible = false;
    
    const flashLight = new THREE.PointLight(0xffaa00, 0, 5);
    this.muzzleFlash.add(flashLight);
    this.muzzleFlash.userData.light = flashLight;
    
    this.scene.add(this.muzzleFlash);
  }
  
  update(deltaTime) {
    const actions = InputController.getActions();
    
    this.updateADS(deltaTime, actions.ads);
    
    if (this.state.isReloading) {
      this.updateReload(deltaTime);
    } else {
      if (actions.fire && this.canFire()) {
        this.fire();
      }
      
      if (actions.reload || InputController.consumeAction('reload')) {
        this.startReload();
      }
    }
    
    this.updateMuzzleFlash(deltaTime);
  }
  
  updateADS(deltaTime, isAiming) {
    const weapon = this.currentWeapon;
    const targetADS = isAiming ? 1 : 0;
    const adsSpeed = 1 / weapon.adsSpeed;
    
    if (targetADS > this.state.adsProgress) {
      this.state.adsProgress = Math.min(1, this.state.adsProgress + deltaTime * adsSpeed);
    } else if (targetADS < this.state.adsProgress) {
      this.state.adsProgress = Math.max(0, this.state.adsProgress - deltaTime * adsSpeed);
    }
    
    this.state.isADS = this.state.adsProgress > 0.5;
    
    const targetFOV = THREE.MathUtils.lerp(
      weapon.normalFOV,
      weapon.adsFOV,
      this.state.adsProgress
    );
    
    if (Math.abs(this.camera.fov - targetFOV) > 0.1) {
      this.camera.fov = targetFOV;
      this.camera.updateProjectionMatrix();
      this.state.currentFOV = targetFOV;
    }
  }
  
  canFire() {
    if (this.state.isReloading) return false;
    if (this.state.currentMagazine <= 0) return false;
    
    const now = performance.now();
    const fireInterval = 60000 / this.currentWeapon.fireRate;
    
    return (now - this.state.lastFireTime) >= fireInterval;
  }
  
  fire() {
    this.state.currentMagazine--;
    this.state.lastFireTime = performance.now();
    
    const hit = this.performRaycast();
    
    this.showMuzzleFlash();
    this.applyRecoil();
    
    this.onFireCallbacks.forEach(cb => cb(hit));
    
    if (hit) {
      this.onHitCallbacks.forEach(cb => cb(hit));
    }
    
    if (this.state.currentMagazine <= 0 && this.state.reserveAmmo > 0) {
      this.startReload();
    }
  }
  
  performRaycast() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    
    const spread = this.state.isADS 
      ? this.currentWeapon.spread * 0.3 
      : this.currentWeapon.spread;
    
    direction.x += (Math.random() - 0.5) * spread;
    direction.y += (Math.random() - 0.5) * spread;
    direction.normalize();
    
    const origin = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };
    
    const hit = PhysicsManager.raycast(
      origin,
      { x: direction.x, y: direction.y, z: direction.z },
      this.currentWeapon.range
    );
    
    if (hit) {
      this.createHitEffect(hit.point);
    }
    
    return hit;
  }
  
  createHitEffect(point) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 1
    });
    
    const hitMarker = new THREE.Mesh(geometry, material);
    hitMarker.position.set(point.x, point.y, point.z);
    this.scene.add(hitMarker);
    
    const startTime = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.2) {
        hitMarker.material.opacity = 1 - (elapsed / 0.2);
        hitMarker.scale.setScalar(1 + elapsed * 2);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(hitMarker);
        hitMarker.geometry.dispose();
        hitMarker.material.dispose();
      }
    };
    animate();
  }
  
  showMuzzleFlash() {
    if (!this.muzzleFlash) return;
    
    const forward = new THREE.Vector3(0, 0, -0.5);
    forward.applyQuaternion(this.camera.quaternion);
    
    this.muzzleFlash.position.copy(this.camera.position).add(forward);
    this.muzzleFlash.quaternion.copy(this.camera.quaternion);
    
    this.muzzleFlash.visible = true;
    this.muzzleFlash.material.opacity = 1;
    this.muzzleFlash.userData.light.intensity = 2;
    
    this.muzzleFlashTimer = this.muzzleFlashDuration;
  }
  
  updateMuzzleFlash(deltaTime) {
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= deltaTime;
      
      const progress = this.muzzleFlashTimer / this.muzzleFlashDuration;
      this.muzzleFlash.material.opacity = progress;
      this.muzzleFlash.userData.light.intensity = progress * 2;
      
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlash.visible = false;
      }
    }
  }
  
  applyRecoil() {
    const recoilMultiplier = this.state.isADS ? 0.5 : 1;
  }
  
  startReload() {
    if (this.state.isReloading) return;
    if (this.state.currentMagazine >= this.currentWeapon.magazineSize) return;
    if (this.state.reserveAmmo <= 0) return;
    
    this.state.isReloading = true;
    this.state.reloadProgress = 0;
    
    console.log('[WeaponSystem] Reloading...');
  }
  
  updateReload(deltaTime) {
    this.state.reloadProgress += deltaTime / this.currentWeapon.reloadTime;
    
    if (this.state.reloadProgress >= 1) {
      this.completeReload();
    }
  }
  
  completeReload() {
    const needed = this.currentWeapon.magazineSize - this.state.currentMagazine;
    const available = Math.min(needed, this.state.reserveAmmo);
    
    this.state.currentMagazine += available;
    this.state.reserveAmmo -= available;
    this.state.isReloading = false;
    this.state.reloadProgress = 0;
    
    console.log('[WeaponSystem] Reload complete. Magazine:', this.state.currentMagazine);
  }
  
  addAmmo(amount) {
    const maxReserve = this.currentWeapon.magazineSize * 3;
    this.state.reserveAmmo = Math.min(maxReserve, this.state.reserveAmmo + amount);
  }
  
  onHit(callback) {
    this.onHitCallbacks.push(callback);
  }
  
  onFire(callback) {
    this.onFireCallbacks.push(callback);
  }
  
  getState() {
    return {
      currentMagazine: this.state.currentMagazine,
      magazineSize: this.currentWeapon.magazineSize,
      reserveAmmo: this.state.reserveAmmo,
      isReloading: this.state.isReloading,
      reloadProgress: this.state.reloadProgress,
      isADS: this.state.isADS,
      weaponName: this.currentWeapon.name
    };
  }
  
  destroy() {
    if (this.muzzleFlash) {
      this.scene.remove(this.muzzleFlash);
      this.muzzleFlash.geometry.dispose();
      this.muzzleFlash.material.dispose();
    }
  }
}

export default WeaponSystem;
