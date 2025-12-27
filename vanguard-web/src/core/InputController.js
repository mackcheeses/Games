import MobileControls from '../ui/MobileControls.js';

class InputController {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0 };
    this.isPointerLocked = false;
    this.sensitivity = { x: 0.002, y: 0.002 };
    this.isMobile = this.detectMobile();
    this.mobileControls = null;
    
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
    
    if (this.isMobile) {
      this.setupMobileControls();
    } else {
      this.setupDesktopControls();
    }
    
    console.log(`[InputController] Initialized in ${this.isMobile ? 'mobile' : 'desktop'} mode`);
    return this;
  }
  
  setupMobileControls() {
    this.mobileControls = new MobileControls();
    this.mobileControls.init();
    
    const mobileSensitivity = this.loadMobileSensitivity();
    this.mobileControls.setSensitivity(mobileSensitivity.x, mobileSensitivity.y);
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
    if (!this.isPointerLocked && !this.isMobile) {
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
    if (this.isMobile && this.mobileControls) {
      const mobileMove = this.mobileControls.getMovement();
      const mobileLook = this.mobileControls.getLook();
      const mobileActions = this.mobileControls.getActions();
      
      this.state.movement.x = mobileMove.x;
      this.state.movement.z = mobileMove.z;
      
      this.state.look.x = mobileLook.x;
      this.state.look.y = mobileLook.y;
      
      this.state.actions.fire = mobileActions.fire;
      this.state.actions.reload = mobileActions.reload;
      this.state.actions.jump = mobileActions.jump;
      this.state.actions.crouch = mobileActions.crouch;
      this.state.actions.ads = mobileActions.ads;
    } else {
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
  }
  
  resetLookDelta() {
    this.state.look.x = 0;
    this.state.look.y = 0;
  }
  
  consumeAction(action) {
    const value = this.state.actions[action];
    if (action === 'jump' || action === 'reload') {
      this.state.actions[action] = false;
      if (this.isMobile && this.mobileControls) {
        this.mobileControls.consumeAction(action);
      }
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
  
  setMobileSensitivity(x, y) {
    if (this.mobileControls) {
      this.mobileControls.setSensitivity(x, y);
    }
    this.saveMobileSensitivity(x, y);
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
  
  loadMobileSensitivity() {
    try {
      const saved = localStorage.getItem('vanguard_mobile_sensitivity');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[InputController] Failed to load mobile sensitivity:', e);
    }
    return { x: 0.08, y: 0.06 };
  }
  
  saveMobileSensitivity(x, y) {
    try {
      localStorage.setItem('vanguard_mobile_sensitivity', JSON.stringify({ x, y }));
    } catch (e) {
      console.warn('[InputController] Failed to save mobile sensitivity:', e);
    }
  }
  
  isLocked() {
    if (this.isMobile) {
      return true;
    }
    return this.isPointerLocked;
  }
  
  isMobileDevice() {
    return this.isMobile;
  }
  
  destroy() {
    if (this.mobileControls) {
      this.mobileControls.destroy();
    }
  }
}

export default new InputController();
