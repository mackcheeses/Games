class HUD {
  constructor() {
    this.container = null;
    this.elements = {};
  }
  
  init() {
    this.createContainer();
    this.createHealthBar();
    this.createAmmoDisplay();
    this.createWaveDisplay();
    this.createReloadIndicator();
    
    console.log('[HUD] Initialized');
    return this;
  }
  
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'hud-container';
    this.container.innerHTML = `
      <div id="hud-health">
        <div class="hud-label">HEALTH</div>
        <div id="health-bar">
          <div id="health-fill"></div>
        </div>
        <div id="health-value">100</div>
      </div>
      <div id="hud-ammo">
        <div id="ammo-current">30</div>
        <div id="ammo-separator">/</div>
        <div id="ammo-reserve">90</div>
      </div>
      <div id="hud-wave">
        <div class="hud-label">WAVE</div>
        <div id="wave-number">1</div>
      </div>
      <div id="hud-reload">
        <div id="reload-text">RELOADING</div>
        <div id="reload-bar">
          <div id="reload-fill"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);
    
    this.elements = {
      healthFill: document.getElementById('health-fill'),
      healthValue: document.getElementById('health-value'),
      ammoCurrent: document.getElementById('ammo-current'),
      ammoReserve: document.getElementById('ammo-reserve'),
      waveNumber: document.getElementById('wave-number'),
      reloadContainer: document.getElementById('hud-reload'),
      reloadFill: document.getElementById('reload-fill')
    };
    
    this.injectStyles();
  }
  
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #hud-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 150;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .hud-label {
        font-size: 10px;
        color: rgba(255,255,255,0.6);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 4px;
      }
      
      #hud-health {
        position: absolute;
        bottom: 20px;
        left: 20px;
      }
      
      #health-bar {
        width: 200px;
        height: 8px;
        background: rgba(0,0,0,0.5);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.2);
      }
      
      #health-fill {
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #ff4444, #ff6b6b);
        transition: width 0.2s ease;
      }
      
      #health-value {
        font-size: 14px;
        color: #fff;
        margin-top: 4px;
        font-weight: bold;
      }
      
      #hud-ammo {
        position: absolute;
        bottom: 20px;
        right: 20px;
        display: flex;
        align-items: baseline;
        font-family: 'Courier New', monospace;
      }
      
      #ammo-current {
        font-size: 48px;
        color: #fff;
        font-weight: bold;
        text-shadow: 0 0 10px rgba(0,0,0,0.5);
      }
      
      #ammo-separator {
        font-size: 32px;
        color: rgba(255,255,255,0.5);
        margin: 0 8px;
      }
      
      #ammo-reserve {
        font-size: 24px;
        color: rgba(255,255,255,0.7);
      }
      
      #hud-ammo.low #ammo-current {
        color: #ff4444;
        animation: pulse 0.5s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      #hud-wave {
        position: absolute;
        top: 20px;
        right: 20px;
        text-align: right;
      }
      
      #wave-number {
        font-size: 36px;
        color: #fff;
        font-weight: bold;
      }
      
      #hud-reload {
        position: absolute;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      #hud-reload.visible {
        opacity: 1;
      }
      
      #reload-text {
        font-size: 14px;
        color: #fff;
        margin-bottom: 8px;
        letter-spacing: 2px;
      }
      
      #reload-bar {
        width: 200px;
        height: 4px;
        background: rgba(0,0,0,0.5);
        border-radius: 2px;
        overflow: hidden;
      }
      
      #reload-fill {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #00d4ff, #0099cc);
        transition: width 0.05s linear;
      }
      
      @media (max-width: 600px) {
        #ammo-current {
          font-size: 32px;
        }
        #ammo-separator {
          font-size: 20px;
        }
        #ammo-reserve {
          font-size: 18px;
        }
        #health-bar {
          width: 150px;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  createHealthBar() {
  }
  
  createAmmoDisplay() {
  }
  
  createWaveDisplay() {
  }
  
  createReloadIndicator() {
  }
  
  updateHealth(current, max) {
    const percent = (current / max) * 100;
    this.elements.healthFill.style.width = `${percent}%`;
    this.elements.healthValue.textContent = Math.ceil(current);
    
    if (percent <= 25) {
      this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
    } else if (percent <= 50) {
      this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff6600, #ffaa00)';
    } else {
      this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff4444, #ff6b6b)';
    }
  }
  
  updateAmmo(current, reserve, magazineSize) {
    this.elements.ammoCurrent.textContent = current;
    this.elements.ammoReserve.textContent = reserve;
    
    const hudAmmo = document.getElementById('hud-ammo');
    if (current <= magazineSize * 0.3) {
      hudAmmo.classList.add('low');
    } else {
      hudAmmo.classList.remove('low');
    }
  }
  
  updateWave(waveNumber, totalWaves) {
    if (totalWaves) {
      this.elements.waveNumber.textContent = `${waveNumber}/${totalWaves}`;
    } else {
      this.elements.waveNumber.textContent = waveNumber;
    }
  }
  
  showReload(progress) {
    this.elements.reloadContainer.classList.add('visible');
    this.elements.reloadFill.style.width = `${progress * 100}%`;
  }
  
  hideReload() {
    this.elements.reloadContainer.classList.remove('visible');
    this.elements.reloadFill.style.width = '0%';
  }
  
  showMessage(text, duration = 2000) {
    let messageEl = document.getElementById('hud-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'hud-message';
      messageEl.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        color: #fff;
        text-shadow: 0 0 10px rgba(0,0,0,0.8);
        text-align: center;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      this.container.appendChild(messageEl);
    }
    
    messageEl.textContent = text;
    messageEl.style.opacity = '1';
    
    setTimeout(() => {
      messageEl.style.opacity = '0';
    }, duration);
  }
  
  destroy() {
    if (this.container) {
      this.container.remove();
    }
  }
}

export default HUD;
