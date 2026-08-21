import chars from '../data/characters.js';

export default class OpponentSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'OpponentSelectScene' }); }

  init(data) {
    this.playerCharacterId = data && data.playerCharacterId ? data.playerCharacterId : null;
    // try to take progression state from incoming data, otherwise from localStorage
    if (data && typeof data.score === 'number') {
      this.score = data.score;
      this.upgrades = Array.isArray(data.upgrades) ? data.upgrades.slice() : [];
      this.round = data.round || 1;
    } else {
      try {
        const raw = localStorage.getItem('checkito_state');
        if (raw) {
          const s = JSON.parse(raw);
          this.score = typeof s.score === 'number' ? s.score : 0;
          this.upgrades = Array.isArray(s.upgrades) ? s.upgrades.slice() : [];
          this.round = s.round || 1;
        } else {
          this.score = 0;
          this.upgrades = [];
          this.round = 1;
        }
      } catch (e) {
        this.score = 0;
        this.upgrades = [];
        this.round = 1;
      }
      // if playerCharacterId wasn't passed, try to read from persisted state
      if (!this.playerCharacterId) {
        try {
          const raw2 = localStorage.getItem('checkito_state');
          if (raw2) {
            const s2 = JSON.parse(raw2);
            if (s2.playerCharacterId) this.playerCharacterId = s2.playerCharacterId;
          }
        } catch (e) {}
      }
    }
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width/2, 40, 'Escolha oponente', { fontSize: '28px', color: '#fff' }).setOrigin(0.5);

    // debug: show current score/upgrades/round
    this.add.text(width - 240, 24, `Pontuação: ${this.score}`, { fontSize: '16px', color: '#fff' });
    this.add.text(width - 240, 44, `Upgrades: ${this.upgrades.join(', ') || 'Nenhum'}`, { fontSize: '12px', color: '#ccc' });
    this.add.text(width - 240, 60, `Rodada (camp): ${this.round}`, { fontSize: '12px', color: '#ccc' });

    // prepare enemy presets
    const enemies = Object.values(chars.enemyCharacters);
    // generate 3 semi-random opponent cards
    const cards = [];
    const kingRewardValue = 10; // value awarded for capturing a king
    for (let i = 0; i < 3; i++) {
      // choose an enemy preset at random (fallback to the first)
      const e = enemies.length ? enemies[Phaser.Math.Between(0, enemies.length - 1)] : { id: 'TheAllRounder', displayName: 'TheAllRounder' };
      // reward now represents the capture value of the enemy king (makes decision to capture king meaningful)
      const reward = kingRewardValue;
      const difficulty = Phaser.Math.Between(1, 3);
      cards.push({ preset: e, reward, difficulty });
    }

    // layout cards centered and responsive
    const cardW = 220;
    const cardH = 220;
    const margin = 40;
    const gap = Math.max(10, Math.min(60, Math.floor((width - margin * 2 - cardW * cards.length) / Math.max(1, cards.length - 1))));
    const totalW = cards.length * cardW + (cards.length - 1) * gap;
    const baseX = Math.max(margin, Math.floor((width - totalW) / 2));

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const x = baseX + i * (cardW + gap);
      const cx = x + cardW / 2;
      const cy = 220;
      const box = this.add.rectangle(cx, cy, cardW, cardH, 0x20232a).setStrokeStyle(2, 0x666).setInteractive({ useHandCursor: true });
      const name = this.add.text(cx, cy - 70, c.preset.displayName || c.preset.id, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
      const info = this.add.text(cx, cy - 10, `Recompensa: ${c.reward} pontos\nDificuldade: ${c.difficulty}`, { fontSize: '16px', color: '#ddd' }).setOrigin(0.5);
      const choose = this.add.text(cx, cy + 70, 'Selecionar', { fontSize: '18px', color: '#0f0' }).setOrigin(0.5);
      const startMatch = () => {
        console.log('[OpponentSelect] choosing opponent', c.preset.id, 'score=', this.score, 'round=', this.round);
        this.scene.start('GameScene', {
          playerCharacterId: this.playerCharacterId,
          enemyCharacterId: c.preset.id,
          score: this.score,
          upgrades: this.upgrades,
          round: this.round
        });
      };
      box.on('pointerup', startMatch);
      choose.setInteractive({ useHandCursor: true });
      choose.on('pointerup', startMatch);
    }

    // removed back button — no returning during campaign
  }
}
