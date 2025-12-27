import * as THREE from 'three';
import { Enemy } from '../entities/Enemy.js';

class EnemyManager {
  constructor() {
    this.scene = null;
    this.navigationManager = null;
    this.player = null;
    this.weaponSystem = null;
    
    this.enemies = [];
    this.pool = [];
    this.poolSize = 20;
    
    this.spawnPoints = [];
    this.activeCount = 0;
    
    this.onEnemyDeathCallbacks = [];
    this.onPlayerDamageCallbacks = [];
  }
  
  init(scene, navigationManager, player, weaponSystem, spawnPoints) {
    this.scene = scene;
    this.navigationManager = navigationManager;
    this.player = player;
    this.weaponSystem = weaponSystem;
    this.spawnPoints = spawnPoints || [];
    
    this.initializePool();
    
    if (this.weaponSystem) {
      this.weaponSystem.onHit((hit) => this.handleWeaponHit(hit));
    }
    
    console.log('[EnemyManager] Initialized with pool of', this.poolSize);
    return this;
  }
  
  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const enemy = new Enemy(i);
      enemy.hide();
      this.pool.push(enemy);
    }
  }
  
  getFromPool() {
    for (const enemy of this.pool) {
      if (!enemy.isActive) {
        return enemy;
      }
    }
    
    const newEnemy = new Enemy(this.pool.length);
    this.pool.push(newEnemy);
    console.log('[EnemyManager] Pool expanded to', this.pool.length);
    return newEnemy;
  }
  
  spawn(position, config = {}) {
    const enemy = this.getFromPool();
    
    if (!enemy.mesh) {
      enemy.create(this.scene, position);
    } else {
      enemy.reset(position);
    }
    
    if (config.health) enemy.maxHealth = config.health;
    if (config.speed) enemy.moveSpeed = config.speed;
    if (config.damage) enemy.damage = config.damage;
    
    enemy.health = enemy.maxHealth;
    
    enemy.onDeath((deadEnemy) => this.handleEnemyDeath(deadEnemy));
    enemy.onAttack((attacker, damage) => this.handleEnemyAttack(attacker, damage));
    
    this.enemies.push(enemy);
    this.activeCount++;
    
    return enemy;
  }
  
  spawnAtRandomPoint(config = {}) {
    if (this.spawnPoints.length === 0) {
      console.warn('[EnemyManager] No spawn points available');
      return null;
    }
    
    const playerPos = this.player.getPosition();
    
    const validPoints = this.spawnPoints.filter(point => {
      const dist = Math.sqrt(
        Math.pow(point.x - playerPos.x, 2) +
        Math.pow(point.z - playerPos.z, 2)
      );
      return dist > 5;
    });
    
    const points = validPoints.length > 0 ? validPoints : this.spawnPoints;
    const spawnPoint = points[Math.floor(Math.random() * points.length)];
    
    const position = new THREE.Vector3(
      spawnPoint.x + (Math.random() - 0.5) * 2,
      spawnPoint.y,
      spawnPoint.z + (Math.random() - 0.5) * 2
    );
    
    return this.spawn(position, config);
  }
  
  spawnWave(count, config = {}) {
    const spawned = [];
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const enemy = this.spawnAtRandomPoint(config);
        if (enemy) spawned.push(enemy);
      }, i * 500);
    }
    
    return spawned;
  }
  
  update(deltaTime) {
    const playerPosition = this.player.getPosition();
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (!enemy.isActive) {
        this.enemies.splice(i, 1);
        this.activeCount--;
        continue;
      }
      
      enemy.update(deltaTime, playerPosition, this.navigationManager);
    }
  }
  
  handleWeaponHit(hit) {
    if (!hit || !hit.collider) return;
    
    for (const enemy of this.enemies) {
      if (enemy.collider === hit.collider) {
        const damage = this.weaponSystem.currentWeapon.damage;
        enemy.takeDamage(damage);
        return;
      }
    }
    
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      
      const dist = enemy.position.distanceTo(
        new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z)
      );
      
      if (dist < 1.5) {
        const damage = this.weaponSystem.currentWeapon.damage;
        enemy.takeDamage(damage);
        return;
      }
    }
  }
  
  handleEnemyDeath(enemy) {
    this.onEnemyDeathCallbacks.forEach(cb => cb(enemy));
  }
  
  handleEnemyAttack(attacker, damage) {
    const distanceToPlayer = attacker.position.distanceTo(this.player.getPosition());
    
    if (distanceToPlayer <= attacker.attackRange * 1.5) {
      this.onPlayerDamageCallbacks.forEach(cb => cb(damage, attacker));
    }
  }
  
  onEnemyDeath(callback) {
    this.onEnemyDeathCallbacks.push(callback);
  }
  
  onPlayerDamage(callback) {
    this.onPlayerDamageCallbacks.push(callback);
  }
  
  getActiveCount() {
    return this.activeCount;
  }
  
  getAliveCount() {
    return this.enemies.filter(e => e.isAlive()).length;
  }
  
  killAll() {
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        enemy.die();
      }
    }
  }
  
  clearAll() {
    for (const enemy of this.enemies) {
      enemy.hide();
    }
    this.enemies = [];
    this.activeCount = 0;
  }
  
  destroy() {
    for (const enemy of this.pool) {
      enemy.destroy(this.scene);
    }
    this.pool = [];
    this.enemies = [];
    this.activeCount = 0;
  }
}

export default EnemyManager;
