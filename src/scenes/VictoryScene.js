export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data) {
    this.finalScore = data && typeof data.score === 'number' ? data.score : 0;
    this.finalRound = data && Number.isInteger(data.round) ? data.round : 30;
  }

  create() {
    const { width, height } = this.scale;
    const panelW = Math.min(480, width - 32);
    const panelH = 260;
    this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x111111, 0.95);
    this.add.text(width / 2, height / 2 - 64, 'Você venceu!', { fontSize: '36px', color: '#66ff88' }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 - 8, `Você chegou à rodada ${this.finalRound}`, {
      fontSize: '20px', color: '#fff', wordWrap: { width: panelW - 32 }, align: 'center'
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 28, `Pontuação final: ${this.finalScore}`, { fontSize: '18px', color: '#ddd' }).setOrigin(0.5);

    const restart = this.add.text(width / 2, height / 2 + 82, 'Jogar novamente', { fontSize: '20px', color: '#0f0' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    restart.on('pointerup', () => {
      try { localStorage.removeItem('checkito_state'); } catch (e) {}
      this.scene.start('MenuScene');
    });
  }
}