class InputController {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0 };
    this.isPointerLocked = false;
    this.sensitivity = { x: 0.002, y: 0.002 };
    this.isMobile = this.detectMobile();
    this.joysticks = { move: null, look: null };
    this.touchButtons = {};
    
    this.state = {
      movement: { x: 0, z: 0 },
      look: { x: 0, y: 0 },
      actions: {
        fire: false,
        reload: false,
        jump: false,
        crouch: false,
        ads: false
      }
    };
    
    this.loadSettings();
  }
  
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || ('ontouchstart' in window)
      || (navigator.maxTouchPoints > 0);
  }
  
  init(canvas) {
    this.canvas = canvas;
    
    if (!this.isMobile) {
      this.setupDesktopControls();
    }
    
    return this;
  }
  
  setupDesktopControls() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    
    this.canvas.addEventListener('click', () => this.requestPointerLock());
    
    document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    document.addEventListener('pointerlockerror', () => this.onPointerLockError());
  }
  
  requestPointerLock() {
    if (!this.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }
  
  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
    
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.style.display = this.isPointerLocked ? 'block' : 'none';
    }
  }
  
  onPointerLockError() {
    console.error('[InputController] Pointer lock failed');
  }
  
  onKeyDown(event) {
    if (event.repeat) return;
    this.keys[event.code] = true;
    
    if (event.code === 'Space') {
      this.state.actions.jump = true;
    }
    if (event.code === 'KeyC') {
      this.state.actions.crouch = !this.state.actions.crouch;
    }
    if (event.code === 'KeyR') {
      this.state.actions.reload = true;
    }
    
    if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
      event.preventDefault();
    }
  }
  
  onKeyUp(event) {
    this.keys[event.code] = false;
    
    if (event.code === 'Space') {
      this.state.actions.jump = false;
    }
    if (event.code === 'KeyR') {
      this.state.actions.reload = false;
    }
  }
  
  onMouseMove(event) {
    if (!this.isPointerLocked) return;
    
    this.state.look.x = event.movementX * this.sensitivity.x;
    this.state.look.y = event.movementY * this.sensitivity.y;
  }
  
  onMouseDown(event) {
    if (!this.isPointerLocked) return;
    
    if (event.button === 0) {
      this.state.actions.fire = true;
    }
    if (event.button === 2) {
      this.state.actions.ads = true;
    }
  }
  
  onMouseUp(event) {
    if (event.button === 0) {
      this.state.actions.fire = false;
    }
    if (event.button === 2) {
      this.state.actions.ads = false;
    }
  }
  
  update() {
    this.state.movement.x = 0;
    this.state.movement.z = 0;
    
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.state.movement.z = -1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this.state.movement.z = 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.state.movement.x = -1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.state.movement.x = 1;
    
    const len = Math.sqrt(
      this.state.movement.x * this.state.movement.x +
      this.state.movement.z * this.state.movement.z
    );
    if (len > 0) {
      this.state.movement.x /= len;
      this.state.movement.z /= len;
    }
  }
  
  resetLookDelta() {
    this.state.look.x = 0;
    this.state.look.y = 0;
  }
  
  consumeAction(action) {
    const value = this.state.actions[action];
    if (action === 'jump' || action === 'reload') {
      this.state.actions[action] = false;
    }
    return value;
  }
  
  getMovement() {
    return { ...this.state.movement };
  }
  
  getLook() {
    return { ...this.state.look };
  }
  
  getActions() {
    return { ...this.state.actions };
  }
  
  setSensitivity(x, y) {
    this.sensitivity.x = x;
    this.sensitivity.y = y;
    this.saveSettings();
  }
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('vanguard_input_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.sensitivity = settings.sensitivity || this.sensitivity;
      }
    } catch (e) {
      console.warn('[InputController] Failed to load settings:', e);
    }
  }
  
  saveSettings() {
    try {
      localStorage.setItem('vanguard_input_settings', JSON.stringify({
        sensitivity: this.sensitivity
      }));
    } catch (e) {
      console.warn('[InputController] Failed to save settings:', e);
    }
  }
  
  isLocked() {
    return this.isPointerLocked;
  }
  
  destroy() {
    if (!this.isMobile) {
      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mousedown', this.onMouseDown);
      document.removeEventListener('mouseup', this.onMouseUp);
    }
  }
}

export default new InputController();
