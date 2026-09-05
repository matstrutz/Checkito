export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {}

  create() {
    const { width, height } = this.scale;
    const background = 0x121418;
    const foreground = '#e2d5a1';
    const muted = '#c5b98f';
    const left = Math.max(28, width * 0.038);
    const lineWidth = Math.min(528, width * 0.31);
    const titleY = Math.max(54, height * 0.095);
    const buttonStartY = height * 0.278;
    const buttonGap = height * 0.102;

    this.add.rectangle(0, 0, width, height, background).setOrigin(0);
    this.add.text(left + 48, titleY, 'CHECKITO', {
      fontSize: '32px',
      color: foreground,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const actions = [
      { label: 'Novo Jogo', action: () => this.startNewGame() },
      { label: 'Continuar' },
      { label: 'Opções' },
      { label: 'Sair' }
    ];

    actions.forEach((item, index) => {
      const y = buttonStartY + index * buttonGap;
      const text = this.add.text(left + 8, y - 22, item.label, {
        fontSize: '32px',
        color: muted
      }).setOrigin(0, 0.5);
      const line = this.add.rectangle(left, y + 18, lineWidth, 4, 0x9d956f).setOrigin(0, 0.5);
      const hitArea = this.add.rectangle(left + lineWidth / 2, y, lineWidth, 64, 0x000000, 0)
        .setInteractive({ useHandCursor: Boolean(item.action) });

      hitArea.on('pointerover', () => {
        text.setColor(foreground);
        line.setFillStyle(0xe2d5a1, 1);
        line.setScale(1, 1.5);
      });
      hitArea.on('pointerout', () => {
        text.setColor(muted);
        line.setFillStyle(0x9d956f, 1);
        line.setScale(1, 1);
      });
      if (item.action) hitArea.on('pointerup', item.action);
    });
  }

  startNewGame() {
    try { localStorage.removeItem('checkito_state'); } catch (e) {}
    this.scene.start('CharacterSelectScene');
  }
}
