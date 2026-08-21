export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalRound = data.round || 1;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 480, 260, 0x111111, 0.95);
    this.add.text(width / 2, height / 2 - 40, 'Game Over', { fontSize: '36px', color: '#ff4444' }).setOrigin(0.5);
    this.add.text(width / 2, height / 2, `Pontuação final: ${this.finalScore}`, { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 28, `Rodada: ${this.finalRound}`, { fontSize: '18px', color: '#ddd' }).setOrigin(0.5);

    const restart = this.add.text(width / 2, height / 2 + 80, 'Reiniciar', { fontSize: '20px', color: '#0f0' }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    restart.on('pointerup', () => {
      this.scene.start('GameScene');
    });
  }
}
