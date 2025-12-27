import Game from './Game.js';

async function main() {
  console.log('[Main] Vanguard Web starting...');
  
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch((err) => {
      console.log('[Main] Could not lock orientation:', err.message);
    });
  }
  
  try {
    const game = new Game();
    await game.init();
    game.start();
    
    window.game = game;
    
    console.log('[Main] Game started successfully');
  } catch (error) {
    console.error('[Main] Failed to start game:', error);
    
    const loading = document.getElementById('loading');
    if (loading) {
      const loadingText = loading.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = 'Failed to load: ' + error.message;
        loadingText.style.color = '#ff6b6b';
      }
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
