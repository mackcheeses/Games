class WaveManager {
  constructor() {
    this.currentWave = 0;
    this.totalWaves = 5;
    this.enemyManager = null;
    this.hud = null;
    
    this.waveConfigs = [
      { enemies: 3, health: 100, speed: 3.0, damage: 10 },
      { enemies: 5, health: 100, speed: 3.3, damage: 10 },
      { enemies: 7, health: 120, speed: 3.3, damage: 12 },
      { enemies: 10, health: 130, speed: 3.6, damage: 12 },
      { enemies: 15, health: 150, speed: 3.9, damage: 15 }
    ];
    
    this.state = 'WAITING';
    this.waveStartTime = 0;
    this.timeBetweenWaves = 3.0;
    
    this.enemiesKilledThisWave = 0;
    this.totalEnemiesKilled = 0;
    
    this.onWaveStartCallbacks = [];
    this.onWaveCompleteCallbacks = [];
    this.onGameOverCallbacks = [];
  }
  
  init(enemyManager, hud) {
    this.enemyManager = enemyManager;
    this.hud = hud;
    
    this.enemyManager.onEnemyDeath(() => this.handleEnemyDeath());
    
    console.log('[WaveManager] Initialized with', this.totalWaves, 'waves');
    return this;
  }
  
  start() {
    this.currentWave = 0;
    this.state = 'INTERMISSION';
    this.waveStartTime = performance.now();
    this.totalEnemiesKilled = 0;
    
    if (this.hud) {
      this.hud.showMessage('Get Ready!', 2000);
      this.hud.updateWave(1, this.totalWaves);
    }
    
    console.log('[WaveManager] Started');
  }
  
  update(deltaTime) {
    switch (this.state) {
      case 'WAITING':
        break;
        
      case 'INTERMISSION':
        this.updateIntermission();
        break;
        
      case 'ACTIVE':
        this.updateActive();
        break;
        
      case 'COMPLETE':
        break;
    }
  }
  
  updateIntermission() {
    const elapsed = (performance.now() - this.waveStartTime) / 1000;
    
    if (elapsed >= this.timeBetweenWaves) {
      this.startNextWave();
    }
  }
  
  updateActive() {
    const aliveCount = this.enemyManager.getAliveCount();
    
    if (aliveCount === 0) {
      this.completeWave();
    }
  }
  
  startNextWave() {
    this.currentWave++;
    this.state = 'ACTIVE';
    this.enemiesKilledThisWave = 0;
    
    const config = this.waveConfigs[this.currentWave - 1] || this.waveConfigs[this.waveConfigs.length - 1];
    
    this.enemyManager.spawnWave(config.enemies, {
      health: config.health,
      speed: config.speed,
      damage: config.damage
    });
    
    if (this.hud) {
      this.hud.updateWave(this.currentWave, this.totalWaves);
      this.hud.showMessage(`Wave ${this.currentWave}`, 2000);
    }
    
    this.onWaveStartCallbacks.forEach(cb => cb(this.currentWave, config));
    
    console.log('[WaveManager] Wave', this.currentWave, 'started with', config.enemies, 'enemies');
  }
  
  completeWave() {
    console.log('[WaveManager] Wave', this.currentWave, 'complete!');
    
    this.onWaveCompleteCallbacks.forEach(cb => cb(this.currentWave));
    
    if (this.currentWave >= this.totalWaves) {
      this.gameComplete();
    } else {
      this.state = 'INTERMISSION';
      this.waveStartTime = performance.now();
      
      if (this.hud) {
        this.hud.showMessage('Wave Complete!', 2000);
      }
    }
  }
  
  gameComplete() {
    this.state = 'COMPLETE';
    
    if (this.hud) {
      this.hud.showMessage('Victory! All waves cleared!', 5000);
    }
    
    this.onGameOverCallbacks.forEach(cb => cb(true, this.totalEnemiesKilled));
    
    console.log('[WaveManager] Game complete! Total kills:', this.totalEnemiesKilled);
  }
  
  handleEnemyDeath() {
    this.enemiesKilledThisWave++;
    this.totalEnemiesKilled++;
  }
  
  handlePlayerDeath() {
    this.state = 'COMPLETE';
    
    if (this.hud) {
      this.hud.showMessage('Game Over', 5000);
    }
    
    this.onGameOverCallbacks.forEach(cb => cb(false, this.totalEnemiesKilled));
    
    console.log('[WaveManager] Player died. Game over.');
  }
  
  onWaveStart(callback) {
    this.onWaveStartCallbacks.push(callback);
  }
  
  onWaveComplete(callback) {
    this.onWaveCompleteCallbacks.push(callback);
  }
  
  onGameOver(callback) {
    this.onGameOverCallbacks.push(callback);
  }
  
  getCurrentWave() {
    return this.currentWave;
  }
  
  getTotalWaves() {
    return this.totalWaves;
  }
  
  getState() {
    return this.state;
  }
  
  isActive() {
    return this.state === 'ACTIVE';
  }
  
  isComplete() {
    return this.state === 'COMPLETE';
  }
  
  reset() {
    this.currentWave = 0;
    this.state = 'WAITING';
    this.enemiesKilledThisWave = 0;
    this.totalEnemiesKilled = 0;
    
    if (this.enemyManager) {
      this.enemyManager.clearAll();
    }
  }
}

export default WaveManager;
