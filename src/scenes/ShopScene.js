import { BUFF_RARITIES, BUFFS_MAP, getShopBuffs } from '../data/buffs.js';
import { getPaymentCost, MAX_CAMPAIGN_ROUNDS } from '../data/progression.js';

export default class ShopScene extends Phaser.Scene {
  constructor() { super({ key: 'ShopScene' }); }

  init(data) {
    // data can include playerCharacterId, round, score, upgrades
    this.playerCharacterId = data && data.playerCharacterId ? data.playerCharacterId : null;
    this.round = data && data.round ? data.round : 1;
    this.score = data && (typeof data.score === 'number') ? data.score : 0;
    this.upgrades = data && Array.isArray(data.upgrades) ? data.upgrades.slice() : [];
  }

  createBuffTooltip(buff, target) {
    const box = this.add.rectangle(0, 0, 180, 72, 0x111111, 0.96).setStrokeStyle(1, 0xffffff).setVisible(false);
    const title = this.add.text(0, -16, buff.name, {
      fontSize: '12px', color: '#fff', fontStyle: 'bold',
      wordWrap: { width: 150 }
    }).setOrigin(0.5).setVisible(false);
    const description = this.add.text(0, 14, buff.description, {
      fontSize: '11px', color: '#ddd',
      wordWrap: { width: 150 },
      maxLines: 3
    }).setOrigin(0.5, 0.5).setVisible(false);
    const tooltip = this.add.container(0, 0, [box, title, description]);
    tooltip.setDepth(100);
    tooltip.setVisible(false);

    const updatePosition = () => {
      tooltip.setPosition(target.x + 28, target.y - 52);
    };

    const show = () => {
      box.setVisible(true);
      title.setVisible(true);
      description.setVisible(true);
      tooltip.setVisible(true);
      updatePosition();
    };

    const hide = () => {
      box.setVisible(false);
      title.setVisible(false);
      description.setVisible(false);
      tooltip.setVisible(false);
    };

    target.on('pointerover', show);
    target.on('pointerout', hide);
    target.on('pointermove', updatePosition);

    return tooltip;
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
    const nextPaymentRound = this.getNextPaymentRound();
    const roundsUntilPayment = nextPaymentRound ? nextPaymentRound - this.round : 0;

    // background
    this.add.rectangle(0, 0, width, height, 0x121418).setOrigin(0);

    const sidebarInfoH = compact ? 110 : 170;
    const sidebarAugmentsH = Math.max(150, sidebarH - sidebarInfoH - 12);

    // Game name + information panel
    this.add.rectangle(margin, margin, sidebarW, sidebarInfoH, 0x1e2226).setOrigin(0).setStrokeStyle(2, 0x444);
    this.add.text(margin + 12, margin + 10, 'Checkito', {
      fontSize: compact ? '18px' : '22px', color: '#fff', fontStyle: 'bold'
    });
    this.roundText = this.add.text(margin + 12, margin + 42, `Rodada: ${this.round} / ${MAX_CAMPAIGN_ROUNDS}`, {
      fontSize: compact ? '14px' : '16px', color: '#ddd',
      wordWrap: { width: panelTextWidth }
    });
    const remainingRounds = Math.max(0, MAX_CAMPAIGN_ROUNDS - this.round);
    this.add.text(margin + 12, margin + 68, `Faltam ${remainingRounds} rodada${remainingRounds === 1 ? '' : 's'} para o fim`, {
      fontSize: compact ? '12px' : '13px', color: '#aaa',
      wordWrap: { width: panelTextWidth }
    });
    this.scoreText = this.add.text(margin + 12, margin + 94, `Pontuação: ${this.score}`, {
      fontSize: compact ? '16px' : '18px', color: '#fff',
      wordWrap: { width: panelTextWidth }
    });
    this.payInfo = this.add.text(margin + 12, margin + 120, nextPaymentRound
      ? `Próximo pagamento: em ${roundsUntilPayment} rodada${roundsUntilPayment === 1 ? '' : 's'} (rodada ${nextPaymentRound})`
      : 'Nenhum pagamento restante nesta campanha', {
      fontSize: '12px', color: '#aaa',
      wordWrap: { width: panelTextWidth }
    });

    // Augments owned panel
    const augmentsY = margin + sidebarInfoH + 12;
    this.add.rectangle(margin, augmentsY, sidebarW, sidebarAugmentsH, 0x1b1f23).setOrigin(0).setStrokeStyle(1, 0x333);
    this.add.text(margin + 12, augmentsY + 10, 'Augments', { fontSize: compact ? '14px' : '15px', color: '#fff' });

    const ownedBuffs = this.upgrades.map(id => BUFFS_MAP[id]).filter(Boolean);
    const cellSize = compact ? 22 : 24;
    const gapSize = compact ? 8 : 10;
    const cols = Math.max(3, Math.min(4, Math.floor((sidebarW - 28) / (cellSize + gapSize))));
    const gridStartX = margin + 14;
    const gridStartY = augmentsY + 36;

    if (!ownedBuffs.length) {
      this.add.text(margin + 14, augmentsY + 52, 'Nenhum augment ainda', {
        fontSize: '12px', color: '#888',
        wordWrap: { width: panelTextWidth }
      });
    }

    ownedBuffs.forEach((buff, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cx = gridStartX + col * (cellSize + gapSize) + cellSize / 2;
      const cy = gridStartY + row * (cellSize + gapSize) + cellSize / 2;

      const icon = buff.icon === 'circle'
        ? this.add.circle(cx, cy, cellSize / 2, 0xffffff).setStrokeStyle(1, 0x222222)
        : this.add.text(cx, cy, buff.icon || '•', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);

      icon.setInteractive({ useHandCursor: true });
      this.createBuffTooltip(buff, icon);
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

  getNextPaymentRound() {
    for (let round = this.round + 1; round <= 30; round++) {
      if (getPaymentCost(round) > 0) return round;
    }
    return null;
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
      this.scene.restart({
        playerCharacterId: this.playerCharacterId,
        score: this.score,
        upgrades: this.upgrades,
        round: this.round
      });
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
