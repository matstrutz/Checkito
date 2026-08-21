export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {}

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 80, 'Roguelite Xadrez', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

    const start = this.add.text(width / 2, height / 2, 'Iniciar Jogo', { fontSize: '24px', color: '#0f0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.on('pointerup', () => {
      try { localStorage.removeItem('checkito_state'); } catch (e) {}
      this.scene.start('CharacterSelectScene');
    });

    this.add.text(width / 2, height / 2 + 60, 'Clique para iniciar', { fontSize: '16px', color: '#aaa' }).setOrigin(0.5);
  }
}
