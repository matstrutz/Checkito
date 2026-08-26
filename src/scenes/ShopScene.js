import { BUFF_RARITIES, BUFFS_MAP, getShopBuffs } from '../data/buffs.js';

export default class ShopScene extends Phaser.Scene {
  constructor() { super({ key: 'ShopScene' }); }

  init(data) {
    // data can include playerCharacterId, round, score, upgrades
    this.playerCharacterId = data && data.playerCharacterId ? data.playerCharacterId : null;
    this.round = data && data.round ? data.round : 1;
    this.score = data && (typeof data.score === 'number') ? data.score : 0;
    this.upgrades = data && Array.isArray(data.upgrades) ? data.upgrades.slice() : [];
  }

  create() {
    const { width, height } = this.scale;
    const compact = width < 700;
    const margin = Math.max(12, Math.min(24, Math.floor(width * 0.03)));
    const gap = 12;
    const sidebarW = compact ? width - margin * 2 : Math.min(220, Math.floor(width * 0.26));
    const sidebarH = compact ? 92 : height - margin * 2;
    const mainX = compact ? margin : margin + sidebarW + gap;
    const mainY = compact ? margin + sidebarH + gap : margin;
    const mainW = compact ? width - margin * 2 : width - mainX - margin;
    const mainH = height - mainY - margin;
    const panelTextWidth = Math.max(100, sidebarW - 24);

    // background
    this.add.rectangle(0, 0, width, height, 0x121418).setOrigin(0);

    // Player info panel. It becomes a horizontal header on narrow screens.
    this.add.rectangle(margin, margin, sidebarW, sidebarH, 0x1e2226).setOrigin(0).setStrokeStyle(2, 0x444);
    this.scoreText = this.add.text(margin + 12, margin + 12, `Pontuação: ${this.score}`, {
      fontSize: compact ? '16px' : '18px', color: '#fff',
      wordWrap: { width: panelTextWidth }
    });
    this.roundText = this.add.text(margin + 12, margin + 38, `Rodada: ${this.round}`, {
      fontSize: compact ? '14px' : '16px', color: '#ddd',
      wordWrap: { width: panelTextWidth }
    });
    this.payInfo = this.add.text(margin + 12, margin + 64, `Próximo pagamento: a cada 3 rodadas`, {
      fontSize: '12px', color: '#aaa',
      wordWrap: { width: panelTextWidth }
    });

    // top area: active upgrades
    const topH = compact ? 84 : 80;
    this.add.rectangle(mainX, mainY, mainW, topH, 0x1b1f23).setOrigin(0).setStrokeStyle(1, 0x333);
    this.add.text(mainX + 12, mainY + 10, 'Upgrades Ativos:', { fontSize: compact ? '14px' : '16px', color: '#fff' });
    this.upgradesText = this.add.text(mainX + 12, mainY + 34, this.upgrades.join(', ') || 'Nenhum', {
      fontSize: compact ? '12px' : '14px', color: '#ccc',
      wordWrap: { width: Math.max(120, mainW - 24) },
      maxLines: 2
    });

    // center: shop items
    const itemsAreaY = mainY + topH + 12;
    const proceedH = 48;
    const itemsAreaH = Math.max(150, mainH - topH - proceedH - 24);
    this.add.rectangle(mainX, itemsAreaY, mainW, itemsAreaH, 0x141619).setOrigin(0).setStrokeStyle(1, 0x333);
    this.add.text(mainX + 12, itemsAreaY + 8, 'Loja', { fontSize: compact ? '16px' : '18px', color: '#fff' });

    // Generate offers from the rarity table and hide buffs already owned.
    this.shopItems = getShopBuffs(this.upgrades, 3);

    const cardGap = 8;
    const cardX = mainX + 12;
    const cardW = mainW - 24;
    const cardH = Math.max(76, Math.min(112, Math.floor((itemsAreaH - 44 - cardGap * 2) / Math.max(1, this.shopItems.length))));
    const buyW = compact ? 76 : 92;
    const buyH = 34;
    const textX = cardX + 10;
    const textW = Math.max(80, cardW - buyW - 34);
    let iy = itemsAreaY + 40;
    for (let i = 0; i < this.shopItems.length; i++) {
      const buff = this.shopItems[i];
      const itemY = iy;
      this.add.rectangle(cardX + cardW / 2, itemY + cardH / 2, cardW, cardH, 0x1b1f23).setOrigin(0.5).setStrokeStyle(1, 0x333);
      // Display buff name with rarity indicator, price, and description
      const rarityColor = buff.rarity === BUFF_RARITIES.RARE ? '#ff8800' : buff.rarity === BUFF_RARITIES.UNCOMMON ? '#ffff00' : '#ffffff';
      this.add.text(textX, itemY + 8, `[${buff.rarity.toUpperCase()}] ${buff.name} - ${buff.price} pts\n${buff.description}`, {
        fontSize: compact ? '11px' : '12px', color: rarityColor,
        wordWrap: { width: textW },
        maxLines: 4
      });
      const buyBtnX = cardX + cardW - buyW / 2 - 10;
      const buyBtnY = itemY + cardH / 2;
      const buyBg = this.add.rectangle(buyBtnX, buyBtnY, buyW, buyH, 0x23323a).setStrokeStyle(1, 0x66aa66).setInteractive({ useHandCursor: true });
      this.add.text(buyBtnX, buyBtnY, 'Comprar', { fontSize: compact ? '13px' : '15px', color: '#0f0' }).setOrigin(0.5);
      buyBg.on('pointerup', () => this.buyBuff(buff));
      iy += cardH + cardGap;
    }

    // proceed button bottom-right
    const proceedW = Math.min(160, mainW);
    const proceedX = mainX + mainW - proceedW / 2;
    const proceedY = height - margin - proceedH / 2;
    const btn = this.add.rectangle(proceedX, proceedY, proceedW, proceedH, 0x23323a).setStrokeStyle(2, 0x66aa66).setInteractive({ useHandCursor: true });
    this.add.text(proceedX, proceedY, 'Prosseguir', { fontSize: compact ? '16px' : '18px', color: '#fff' }).setOrigin(0.5);
    btn.on('pointerup', () => this.onProceed());

  }

  buyBuff(buff) {
    // Check if buff already purchased
    if (this.upgrades.includes(buff.id)) {
      const msg = this.add.text(300, 24, `Já comprado: ${buff.name}`, { fontSize: '14px', color: '#f88' });
      this.time.delayedCall(1200, () => msg.destroy());
      return;
    }
    
    // Check if player has enough points
    if (this.score >= buff.price) {
      this.score -= buff.price;
      // Add buff ID to upgrades (will be applied in GameScene)
      this.upgrades.push(buff.id);
      if (this.scoreText) this.scoreText.setText(`Pontuação: ${this.score}`);
      // Display active upgrades using buff names (need to resolve IDs to names)
      const upgradeNames = this.upgrades.map(id => {
        const b = BUFFS_MAP[id];
        return b ? b.name : id;
      });
      this.upgradesText.setText(upgradeNames.join(', '));
      const msg = this.add.text(300, 24, `Comprado: ${buff.name}`, { fontSize: '14px', color: '#afa' });
      this.time.delayedCall(1200, () => msg.destroy());
    } else {
      // insufficient points — visual feedback
      if (this.scoreText) this.tweens.add({ targets: this.scoreText, alpha: 0.3, yoyo: true, duration: 200 });
    }
  }

  onProceed() {
    console.log('[ShopScene] onProceed: score=', this.score, 'round=', this.round);
    // persist current progression state to localStorage so other scenes can pick it up
    try {
      const s = { score: this.score, upgrades: this.upgrades, round: this.round, playerCharacterId: this.playerCharacterId };
      localStorage.setItem('checkito_state', JSON.stringify(s));
    } catch (e) {
      // ignore storage errors
    }
    // proceed to opponent selection with updated state
    this.scene.start('OpponentSelectScene', {
      playerCharacterId: this.playerCharacterId,
      score: this.score,
      upgrades: this.upgrades,
      round: this.round
    });
  }

}
