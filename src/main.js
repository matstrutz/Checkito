import MenuScene from './scenes/MenuScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import OpponentSelectScene from './scenes/OpponentSelectScene.js';
import GameScene from './scenes/GameScene.js';
import ShopScene from './scenes/ShopScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
  type: Phaser.CANVAS,
  parent: 'game-container',
  width: 800,
  height: 600,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#121418',
  pixelArt: true,
  scene: [MenuScene, CharacterSelectScene, OpponentSelectScene, GameScene, ShopScene, GameOverScene, VictoryScene],
};

window.game = new Phaser.Game(config);
