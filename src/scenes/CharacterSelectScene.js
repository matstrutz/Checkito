import chars from '../data/characters.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelectScene' }); }

  create() {
    const { width, height } = this.scale;
    this.add.text(width/2, 40, 'Escolha seu personagem', { fontSize: '28px', color: '#fff' }).setOrigin(0.5);

    const list = Object.values(chars.playerCharacters);
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      const btn = this.add.text(width/2, 120 + i*48, c.displayName, { fontSize: '20px', color: '#0f0' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerup', () => {
        // go to opponent selection with chosen player character
        // include persisted progression state if available
        try {
          const raw = localStorage.getItem('checkito_state');
          if (raw) {
            const s = JSON.parse(raw);
            this.scene.start('OpponentSelectScene', { playerCharacterId: c.id, score: s.score, upgrades: s.upgrades, round: s.round });
            return;
          }
        } catch (e) {
          // fallthrough to default
        }
        this.scene.start('OpponentSelectScene', { playerCharacterId: c.id });
      });
    }

    const back = this.add.text(80, height - 40, 'Voltar', { fontSize: '16px', color: '#aaa' }).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MenuScene'));
  }
}
