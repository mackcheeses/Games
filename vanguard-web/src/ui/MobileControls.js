import nipplejs from 'nipplejs';

class MobileControls {
  constructor() {
    this.leftJoystick = null;
    this.rightJoystick = null;
    this.container = null;
    this.buttons = {};
    
    this.moveVector = { x: 0, z: 0 };
    this.lookVector = { x: 0, y: 0 };
    
    this.actions = {
      fire: false,
      reload: false,
      jump: false,
      crouch: false,
      ads: false
    };
    
    this.sensitivity = { x: 0.08, y: 0.06 };
    this.isActive = false;
  }
  
  init() {
    this.createContainer();
    this.createJoysticks();
    this.createButtons();
    this.isActive = true;
    console.log('[MobileControls] Initialized');
    return this;
  }
  
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'mobile-controls';
    this.container.innerHTML = `
      <div id="joystick-left-zone"></div>
      <div id="joystick-right-zone"></div>
      <div id="touch-buttons">
        <button id="btn-fire" class="touch-btn fire-btn">FIRE</button>
        <button id="btn-ads" class="touch-btn ads-btn">ADS</button>
        <button id="btn-reload" class="touch-btn reload-btn">R</button>
        <button id="btn-jump" class="touch-btn jump-btn">JUMP</button>
        <button id="btn-crouch" class="touch-btn crouch-btn">C</button>
      </div>
    `;
    document.body.appendChild(this.container);
    
    this.injectStyles();
  }
  
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #mobile-controls {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 200;
      }
      
      #joystick-left-zone {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 40%;
        height: 50%;
        pointer-events: auto;
      }
      
      #joystick-right-zone {
        position: absolute;
        right: 20%;
        bottom: 0;
        width: 30%;
        height: 50%;
        pointer-events: auto;
      }
      
      #touch-buttons {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 20%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-end;
        padding: 10px;
        gap: 10px;
        pointer-events: auto;
      }
      
      .touch-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.5);
        background: rgba(0,0,0,0.3);
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
      }
      
      .touch-btn:active, .touch-btn.active {
        background: rgba(255,255,255,0.3);
        border-color: #fff;
      }
      
      .fire-btn {
        width: 80px;
        height: 80px;
        background: rgba(255,0,0,0.3);
        border-color: rgba(255,100,100,0.7);
      }
      
      .fire-btn:active, .fire-btn.active {
        background: rgba(255,0,0,0.6);
      }
      
      .ads-btn {
        width: 50px;
        height: 50px;
        font-size: 10px;
      }
      
      .reload-btn, .crouch-btn {
        width: 50px;
        height: 50px;
      }
      
      .jump-btn {
        width: 70px;
        height: 70px;
        position: absolute;
        right: 100px;
        bottom: 20px;
        background: rgba(0,150,255,0.3);
        border-color: rgba(100,200,255,0.7);
      }
      
      @media (orientation: portrait) {
        #mobile-controls {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  createJoysticks() {
    const leftZone = document.getElementById('joystick-left-zone');
    const rightZone = document.getElementById('joystick-right-zone');
    
    this.leftJoystick = nipplejs.create({
      zone: leftZone,
      mode: 'dynamic',
      position: { left: '50%', bottom: '50%' },
      color: 'white',
      size: 120,
      restOpacity: 0.5,
      fadeTime: 100
    });
    
    this.rightJoystick = nipplejs.create({
      zone: rightZone,
      mode: 'dynamic',
      position: { left: '50%', bottom: '50%' },
      color: 'white',
      size: 100,
      restOpacity: 0.5,
      fadeTime: 100
    });
    
    this.leftJoystick.on('move', (evt, data) => {
      if (data.vector) {
        this.moveVector.x = data.vector.x;
        this.moveVector.z = -data.vector.y;
      }
    });
    
    this.leftJoystick.on('end', () => {
      this.moveVector.x = 0;
      this.moveVector.z = 0;
    });
    
    this.rightJoystick.on('move', (evt, data) => {
      if (data.vector) {
        this.lookVector.x = data.vector.x * this.sensitivity.x;
        this.lookVector.y = data.vector.y * this.sensitivity.y;
      }
    });
    
    this.rightJoystick.on('end', () => {
      this.lookVector.x = 0;
      this.lookVector.y = 0;
    });
  }
  
  createButtons() {
    const buttonConfigs = [
      { id: 'btn-fire', action: 'fire', holdable: true },
      { id: 'btn-ads', action: 'ads', holdable: true },
      { id: 'btn-reload', action: 'reload', holdable: false },
      { id: 'btn-jump', action: 'jump', holdable: false },
      { id: 'btn-crouch', action: 'crouch', toggle: true }
    ];
    
    buttonConfigs.forEach(config => {
      const btn = document.getElementById(config.id);
      if (!btn) return;
      
      this.buttons[config.action] = btn;
      
      if (config.toggle) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.actions[config.action] = !this.actions[config.action];
          btn.classList.toggle('active', this.actions[config.action]);
        });
      } else if (config.holdable) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.actions[config.action] = true;
          btn.classList.add('active');
        });
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.actions[config.action] = false;
          btn.classList.remove('active');
        });
        btn.addEventListener('touchcancel', (e) => {
          e.preventDefault();
          this.actions[config.action] = false;
          btn.classList.remove('active');
        });
      } else {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.actions[config.action] = true;
          btn.classList.add('active');
          setTimeout(() => btn.classList.remove('active'), 100);
        });
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
        });
      }
    });
  }
  
  getMovement() {
    return { ...this.moveVector };
  }
  
  getLook() {
    return { ...this.lookVector };
  }
  
  getActions() {
    return { ...this.actions };
  }
  
  consumeAction(action) {
    const value = this.actions[action];
    if (action === 'jump' || action === 'reload') {
      this.actions[action] = false;
    }
    return value;
  }
  
  setSensitivity(x, y) {
    this.sensitivity.x = x;
    this.sensitivity.y = y;
  }
  
  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }
  
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
  
  destroy() {
    if (this.leftJoystick) {
      this.leftJoystick.destroy();
    }
    if (this.rightJoystick) {
      this.rightJoystick.destroy();
    }
    if (this.container) {
      this.container.remove();
    }
    this.isActive = false;
  }
}

export default MobileControls;
