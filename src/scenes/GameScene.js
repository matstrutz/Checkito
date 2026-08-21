import chars from '../data/characters.js';
import { BUFFS_MAP } from '../data/buffs.js';

const COLS = 5;
const ROWS = 6;
const TILE_SIZE = 80;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.boardOffsetX = (this.scale.width - COLS * TILE_SIZE) / 2;
    this.boardOffsetY = 80;
    this.playerPieces = [];
    this.enemyPieces = [];
    this.selected = null;
    this.score = 0;
    // turnRound: in-match turn counter (player+enemy turns). campaignRound: meta progression across matches.
    this.turnRound = 1;
    this.campaignRound = data && data.round ? data.round : 1;
    this.captureValue = 1; // points per capture
    this.maxRounds = 8; // player has 8 rounds (player+enemy = 1 round)
    this.turnPhase = 'player'; // 'player' or 'enemy'
    this.lastMove = null; // { pieceId, fromX, fromY, toX, toY, pieceType }
    // load character selection data from menu (if provided)
    this.playerCharacterId = data && data.playerCharacterId ? data.playerCharacterId : null;
    this.enemyCharacterId = data && data.enemyCharacterId ? data.enemyCharacterId : null;
    this.playerCharacterConfig = this.playerCharacterId ? (chars.playerCharacters[this.playerCharacterId] || null) : null;
    this.enemyCharacterConfig = this.enemyCharacterId ? (chars.enemyCharacters[this.enemyCharacterId] || null) : null;
    // meta progression state
    console.log('[GameScene] init data=', data);
    // load progression state from data, falling back to localStorage if not provided
    if (data && typeof data.score === 'number') {
      this.score = data.score;
      this.upgrades = data && Array.isArray(data.upgrades) ? data.upgrades.slice() : [];
      this.campaignRound = data && data.round ? data.round : this.campaignRound;
    } else {
      try {
        const raw = localStorage.getItem('checkito_state');
        if (raw) {
          const s = JSON.parse(raw);
          this.score = typeof s.score === 'number' ? s.score : 0;
          this.upgrades = Array.isArray(s.upgrades) ? s.upgrades.slice() : [];
          this.campaignRound = s.round || this.campaignRound;
        } else {
          this.score = 0;
          this.upgrades = [];
        }
      } catch (e) {
        this.score = 0;
        this.upgrades = [];
      }
    }
    this.paymentInterval = data && data.paymentInterval ? data.paymentInterval : 3; // default every 3 rounds
  }

  create() {
    this.graphics = this.add.graphics();
    this.drawBoard();

    // initial pieces
    this.placeInitialPieces();
    this.highlightGraphics = this.add.graphics();
    this.renderPieces();

    // UI
    this.scoreText = this.add.text(10, 10, `Pontuação: ${this.score}`, { fontSize: '18px', color: '#fff' });
    this.roundText = this.add.text(10, 34, `Turno: ${this.turnRound} / ${this.maxRounds}`, { fontSize: '16px', color: '#fff' });
    this.turnText = this.add.text(10, 56, `Turno: Jogador`, { fontSize: '16px', color: '#fff' });

    // selection indicator
    this.selectionGraphics = this.add.graphics();

    // controls
    this.input.on('pointerdown', this.onPointerDown, this);
  }

  /**
   * Apply hooks from active buffs to a capture event
   * @param {string} hookName - name of the hook (e.g., 'onCapture')
   * @param {Object} piece - attacking piece
   * @param {Object} targetPiece - target piece being captured
   * @param {number} baseValue - base points for the capture
   * @returns {number} modified value after applying all buff hooks
   */
  applyBuffHooks(hookName, piece, targetPiece, baseValue) {
    let result = baseValue;
    if (!this.upgrades || !Array.isArray(this.upgrades)) return result;
    
    for (const buffId of this.upgrades) {
      const buff = BUFFS_MAP[buffId];
      if (buff && buff.hooks && typeof buff.hooks[hookName] === 'function') {
        result = buff.hooks[hookName](this, piece, targetPiece, result);
      }
    }
    return result;
  }

  preload() {
    // load piece images from assets (folder name contains space so encode it)
    const base = 'assets/16x32%20pieces/';
    const map = {
      P: 'Pawn',
      N: 'Knight',
      B: 'Bishop',
      R: 'Rook',
      Q: 'Queen',
      K: 'King'
    };
    Object.keys(map).forEach(k => {
      const suffix = map[k];
      this.load.image(`W_${suffix}`, `${base}W_${suffix}.png`);
      this.load.image(`B_${suffix}`, `${base}B_${suffix}.png`);
    });
  }

  drawBoard() {
    this.graphics.clear();
    const g = this.graphics;
    g.lineStyle(2, 0x666666);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const rx = this.boardOffsetX + x * TILE_SIZE;
        const ry = this.boardOffsetY + y * TILE_SIZE;
        g.fillStyle((x + y) % 2 === 0 ? 0x28303a : 0x1b2228, 1);
        g.fillRect(rx, ry, TILE_SIZE - 2, TILE_SIZE - 2);
        g.strokeRect(rx, ry, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }

    // draw coordinate annotations (files A.., ranks 1..)
    if (this.coordGroup) {
      try {
        if (typeof this.coordGroup.clear === 'function') this.coordGroup.clear(true, true);
        if (typeof this.coordGroup.destroy === 'function') this.coordGroup.destroy(true);
      } catch (err) {
        console.warn('coordGroup safe destroy failed', err);
      }
      this.coordGroup = null;
    }
    this.coordGroup = this.add.group();
    const files = ['A','B','C','D','E'];
    // files (A..E) below the board
    for (let x = 0; x < COLS; x++) {
      const tx = this.boardOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
      const ty = this.boardOffsetY + ROWS * TILE_SIZE + 12; // below board
      const t = this.add.text(tx, ty, files[x], { fontSize: '12px', color: '#888' }).setOrigin(0.5);
      this.coordGroup.add(t);
    }
    // ranks (1..6) to the left of the board
    for (let y = 0; y < ROWS; y++) {
      const rank = ROWS - y; // top row is highest rank
      const tx = this.boardOffsetX - 12; // left of board
      const ty = this.boardOffsetY + y * TILE_SIZE + TILE_SIZE / 2;
      const t = this.add.text(tx, ty, `${rank}`, { fontSize: '12px', color: '#888' }).setOrigin(0.5);
      this.coordGroup.add(t);
    }
  }

  placeInitialPieces() {
    // If a player character config exists, load it; otherwise use default full setup
    this.playerPieces = [];
    this.enemyPieces = [];
    if (this.playerCharacterConfig && Array.isArray(this.playerCharacterConfig.pieces)) {
      for (const p of this.playerCharacterConfig.pieces) this.playerPieces.push({ ...p });
    } else {
      // default player setup
      const backRow = ['R', 'N', 'Q', 'K', 'B'];
      for (let x = 0; x < COLS; x++) this.playerPieces.push({ x, y: ROWS - 1, id: `p_back_${x}`, pt: backRow[x], hasMoved: false });
      for (let x = 0; x < COLS; x++) this.playerPieces.push({ x, y: ROWS - 2, id: `p_pawn_${x}`, pt: 'P', hasMoved: false });
    }

    if (this.enemyCharacterConfig && Array.isArray(this.enemyCharacterConfig.pieces)) {
      for (const p of this.enemyCharacterConfig.pieces) this.enemyPieces.push({ ...p });
    } else {
      // default enemy setup (mirror)
      for (let x = 0; x < COLS; x++) this.enemyPieces.push({ x, y: 1, id: `e_pawn_${x}`, pt: 'p', hasMoved: false });
      const backRow = ['r','n','q','k','b'];
      for (let x = 0; x < COLS; x++) this.enemyPieces.push({ x, y: 0, id: `e_back_${x}`, pt: backRow[x], hasMoved: false });
    }
  }

  getAllPositions() {
    const arr = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) arr.push({ x, y });
    return arr;
  }

  renderPieces() {
    if (!this.pieceGroup) this.pieceGroup = this.add.group();
    try {
      if (this.pieceGroup && typeof this.pieceGroup.clear === 'function') this.pieceGroup.clear(true, true);
    } catch (err) {
      console.warn('pieceGroup clear failed, recreating group', err);
      this.pieceGroup = this.add.group();
    }
    // helper to draw one piece using loaded sprites (white for player, black for enemy)
    const typeMap = { P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook', Q: 'Queen', K: 'King' };
    const draw = (p, isPlayer) => {
      const { rx, ry } = this.tileToPixel(p.x, p.y);
      const t = (p.pt || (isPlayer ? 'P' : 'p')).toUpperCase();
      const prefix = isPlayer ? 'W_' : 'B_';
      const key = `${prefix}${typeMap[t]}`;
      // if texture not loaded, fallback to colored circle
      if (!this.textures.exists(key)) {
        const color = isPlayer ? 0x0047ab : 0x8b0000;
        const bg = this.add.rectangle(rx + TILE_SIZE / 2 - 1, ry + TILE_SIZE / 2 - 1, TILE_SIZE - 12, TILE_SIZE - 12, color);
        const label = this.add.text(rx + 10, ry + 18, t, { fontSize: '20px', color: '#fff' });
        label.setDepth(10);
        this.pieceGroup.addMultiple([bg, label]);
        return;
      }

      // try to use loaded texture; fallback to simple rectangle+label if texture data is missing
      try {
        const img = this.add.image(rx + TILE_SIZE / 2, ry + TILE_SIZE / 2, key);
        const texSrc = this.textures.get(key) && this.textures.get(key).getSourceImage && this.textures.get(key).getSourceImage();
        if (!texSrc || !texSrc.height) throw new Error('texture-missing');
        const desiredH = TILE_SIZE - 12;
        const scale = desiredH / texSrc.height;
        if (!Number.isFinite(scale)) throw new Error('bad-scale');
        img.setScale(scale);
        img.setData('pos', { x: p.x, y: p.y, side: isPlayer ? 'player' : 'enemy', id: p.id, pt: p.pt });
        img.setInteractive({ useHandCursor: true });
        this.pieceGroup.add(img);
      } catch (err) {
        // fallback drawing to avoid uncaught errors from missing textures
        const color = isPlayer ? 0x0047ab : 0x8b0000;
        const bg = this.add.rectangle(rx + TILE_SIZE / 2 - 1, ry + TILE_SIZE / 2 - 1, TILE_SIZE - 12, TILE_SIZE - 12, color);
        const label = this.add.text(rx + 10, ry + 18, t, { fontSize: '20px', color: '#fff' });
        label.setDepth(10);
        this.pieceGroup.addMultiple([bg, label]);
      }
    };

    this.enemyPieces.forEach(p => draw(p, false));
    this.playerPieces.forEach(p => draw(p, true));
  }

  // show highlighted tiles for possible moves of a selected piece
  showHighlightsFor(piece) {
    this.highlightGraphics.clear();
    this.highlightGraphics.fillStyle(0xffff00, 0.25);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const side = this.isEnemyPiece(piece) ? 'enemy' : 'player';
        if (this.canMove(piece, x, y) && !this.moveLeavesKingInCheckForSide(piece, x, y, side)) {
          const { rx, ry } = this.tileToPixel(x, y);
          this.highlightGraphics.fillRect(rx + 2, ry + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
      }
    }
  }

  clearHighlights() {
    if (this.highlightGraphics) this.highlightGraphics.clear();
  }

  // return piece & side at coordinate
  getPieceAt(x, y) {
    const p = this.playerPieces.find(i => i.x === x && i.y === y);
    if (p) return { piece: p, side: 'player' };
    const e = this.enemyPieces.find(i => i.x === x && i.y === y);
    if (e) return { piece: e, side: 'enemy' };
    return null;
  }

  clonePieces(arr) {
    return arr.map(p => ({ ...p }));
  }

  getPieceAtFromArrays(x, y, playerArr, enemyArr) {
    const p = playerArr.find(i => i.x === x && i.y === y);
    if (p) return { piece: p, side: 'player' };
    const e = enemyArr.find(i => i.x === x && i.y === y);
    if (e) return { piece: e, side: 'enemy' };
    return null;
  }

  isSquareAttacked(x, y, bySide, playerArr, enemyArr) {
    const attackers = bySide === 'enemy' ? enemyArr : playerArr;
    for (const p of attackers) {
      if (this.canAttack(p, x, y, playerArr, enemyArr)) return true;
    }
    return false;
  }

  canAttack(piece, toX, toY, playerArr, enemyArr) {
    // similar to movement rules but based on provided arrays and not considering checks
    if (piece.x === toX && piece.y === toY) return false;

    // determine side
    const isEnemy = enemyArr.includes(piece);
    const obst = this.getPieceAtFromArrays(toX, toY, playerArr, enemyArr);
    if (obst) {
      const pieceSide = isEnemy ? 'enemy' : 'player';
      if (obst.side === pieceSide) return false;
    }

    const dx = toX - piece.x;
    const dy = toY - piece.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const pt = piece.pt ? piece.pt.toUpperCase() : 'P';

    if (pt === 'P') {
      const dir = isEnemy ? 1 : -1;
      // pawn attacks diagonally one forward — for attack detection we consider diagonal squares regardless of occupancy
      if (Math.abs(dx) === 1 && dy === dir) return true;
      // pawns don't attack straight ahead
      return false;
    }

    if (pt === 'R') {
      if (dx !== 0 && dy !== 0) return false;
      return this.isPathClearBoard(piece.x, piece.y, toX, toY, playerArr, enemyArr);
    }

    if (pt === 'B') {
      if (adx !== ady) return false;
      return this.isPathClearBoard(piece.x, piece.y, toX, toY, playerArr, enemyArr);
    }

    if (pt === 'Q') {
      if (dx === 0 || dy === 0 || adx === ady) return this.isPathClearBoard(piece.x, piece.y, toX, toY, playerArr, enemyArr);
      return false;
    }

    if (pt === 'K') {
      // normal one-square king move
      if (Math.max(adx, ady) === 1) return true;
      // castling: king moves two squares horizontally
      if (dy === 0 && Math.abs(dx) === 2 && !piece.hasMoved) {
        const dir = dx > 0 ? 1 : -1;
        const rookX = dir > 0 ? COLS - 1 : 0;
        const rookArr = isEnemy ? enemyArr : playerArr;
        const rook = rookArr.find(r => (r.pt || '').toUpperCase() === 'R' && r.x === rookX && r.y === piece.y && !r.hasMoved);
        if (!rook) return false;
        // path between king and rook must be clear
        for (let cx = piece.x + dir; cx !== rookX; cx += dir) if (this.getPieceAtFromArrays(cx, piece.y, playerArr, enemyArr)) return false;
        // king must not be in check and must not pass through or land on attacked squares
        const opponentSide = isEnemy ? 'player' : 'enemy';
        if (this.isSquareAttacked(piece.x, piece.y, opponentSide, playerArr, enemyArr)) return false;
        if (this.isSquareAttacked(piece.x + dir, piece.y, opponentSide, playerArr, enemyArr)) return false;
        if (this.isSquareAttacked(piece.x + 2 * dir, piece.y, opponentSide, playerArr, enemyArr)) return false;
        return true;
      }
      return false;
    }

    if (pt === 'N') {
      return (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
    }

    return false;
  }

  isPathClearBoard(fromX, fromY, toX, toY, playerArr, enemyArr) {
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    let cx = fromX + dx;
    let cy = fromY + dy;
    while (cx !== toX || cy !== toY) {
      if (this.getPieceAtFromArrays(cx, cy, playerArr, enemyArr)) return false;
      cx += dx;
      cy += dy;
    }
    return true;
  }

  // Execute a move and handle special rules: en passant, castling, promotion
  applyMove(piece, toX, toY, side) {
    const fromX = piece.x;
    const fromY = piece.y;

    // detect en passant: pawn moves diagonally to empty square capturing pawn behind
    const pt = (piece.pt || '').toUpperCase();
    if (pt === 'P') {
      const isEnemy = this.isEnemyPiece(piece);
      const dir = isEnemy ? 1 : -1;
      const dx = toX - fromX;
      const dy = toY - fromY;
      // en passant capture
      if (Math.abs(dx) === 1 && dy === dir && !this.getPieceAt(toX, toY)) {
        // lastMove must be opponent pawn that moved two squares to adjacent file
        if (this.lastMove && (this.lastMove.pieceType || '').toUpperCase() === 'P') {
          if (this.lastMove.toX === toX && this.lastMove.toY === fromY) {
            // remove that pawn
            const captured = this.enemyPieces.find(e => e.x === this.lastMove.toX && e.y === this.lastMove.toY);
            const capturedPlayer = this.playerPieces.find(p => p.x === this.lastMove.toX && p.y === this.lastMove.toY);
            if (captured) Phaser.Utils.Array.Remove(this.enemyPieces, captured);
            if (capturedPlayer) Phaser.Utils.Array.Remove(this.playerPieces, capturedPlayer);
            // award points if player captured enemy by en-passant
            if (side === 'player') {
              const values = { P:1, N:3, B:3, R:5, Q:8, K:10 };
              const capturedPiece = captured || capturedPlayer;
              let gain = values['P']; // pawn value
              // apply buff hooks
              gain = this.applyBuffHooks('onCapture', piece, capturedPiece, gain);
              this.score += gain;
              if (this.scoreText) this.scoreText.setText(`Pontuação: ${this.score}`);
            }
          }
        }
      }
    }

    // castling: king moves two squares
    if ((pt === 'K') && Math.abs(toX - fromX) === 2) {
      // find rook on that side
      const dir = toX - fromX > 0 ? 1 : -1; // right or left
      // rook should be at far side
      const rookX = dir > 0 ? COLS - 1 : 0;
      const rookArr = this.isEnemyPiece(piece) ? this.enemyPieces : this.playerPieces;
      const rook = rookArr.find(r => (r.pt || '').toUpperCase() === 'R' && r.x === rookX && r.y === fromY);
      if (rook) {
        // move rook next to king
        const newRookX = fromX + dir;
        rook.x = newRookX;
        rook.hasMoved = true;
      }
    }

    // normal capture on square
    const target = this.getPieceAt(toX, toY);
    if (target) {
      if (target.side === 'enemy') Phaser.Utils.Array.Remove(this.enemyPieces, target.piece);
      if (target.side === 'player') Phaser.Utils.Array.Remove(this.playerPieces, target.piece);
      // award points if player captures enemy
      if (side === 'player' && target.side === 'enemy') {
        const capType = (target.piece.pt || 'P').toUpperCase();
        const values = { P:1, N:3, B:3, R:5, Q:8, K:10 };
        let gain = values[capType] || 1;
        // apply buff hooks
        gain = this.applyBuffHooks('onCapture', piece, target.piece, gain);
        this.score += gain;
        if (this.scoreText) this.scoreText.setText(`Pontuação: ${this.score}`);
      }
    }

    // move the piece
    piece.x = toX;
    piece.y = toY;
    piece.hasMoved = true;

    // record lastMove (before promotion decision)
    this.lastMove = { pieceId: piece.id, fromX, fromY, toX, toY, pieceType: (piece.pt || '').toUpperCase() };

    // promotion: pawn reaches last rank
    if ((piece.pt || '').toUpperCase() === 'P') {
      const isEnemy = this.isEnemyPiece(piece);
      if ((!isEnemy && piece.y === 0) || (isEnemy && piece.y === ROWS - 1)) {
        if (side === 'enemy') {
          piece.pt = 'Q'; // AI auto-promotes
        } else {
          // player promotion: show UI and wait for choice
          this.promotionPending = { pieceId: piece.id };
          this.showPromotionUI(piece);
          return;
        }
      }
    }
  }
  moveLeavesKingInCheckForSide(piece, toX, toY, side) {
    // side: 'player' or 'enemy' - simulate move and check whether that side's king is attacked after the move
    const playerClone = this.clonePieces(this.playerPieces);
    const enemyClone = this.clonePieces(this.enemyPieces);

    const targetArr = side === 'player' ? playerClone : enemyClone;
    const opponentArr = side === 'player' ? enemyClone : playerClone;

    // find the piece in the appropriate clone by id
    const pClone = targetArr.find(p => p.id === piece.id);
    if (!pClone) return false;

    // remove any captured piece in opponent clone
    const capturedIndex = opponentArr.findIndex(e => e.x === toX && e.y === toY);
    if (capturedIndex >= 0) opponentArr.splice(capturedIndex, 1);

    // move the cloned piece
    pClone.x = toX;
    pClone.y = toY;

    // handle en passant in simulation: if pawn moved diagonally to empty square, remove opponent pawn behind
    const pt = (piece.pt || '').toUpperCase();
    if (pt === 'P') {
      const dx = toX - piece.x;
      const dy = toY - piece.y;
      const dir = side === 'player' ? -1 : 1;
      const targetAtTo = this.getPieceAtFromArrays(toX, toY, playerClone, enemyClone);
      if (Math.abs(dx) === 1 && dy === dir && !targetAtTo) {
        // remove pawn at (toX, piece.y) from opponentArr
        const capIndex = opponentArr.findIndex(e => e.x === toX && e.y === piece.y && (e.pt || '').toUpperCase() === 'P');
        if (capIndex >= 0) opponentArr.splice(capIndex, 1);
      }
    }

    // handle castling in simulation: move rook accordingly
    if ((piece.pt || '').toUpperCase() === 'K' && Math.abs(toX - piece.x) === 2) {
      const dir = toX - piece.x > 0 ? 1 : -1;
      const rookX = dir > 0 ? COLS - 1 : 0;
      const rookIndex = targetArr.findIndex(r => (r.pt || '').toUpperCase() === 'R' && r.x === rookX && r.y === piece.y);
      if (rookIndex >= 0) {
        const rook = targetArr[rookIndex];
        rook.x = piece.x + dir;
        rook.hasMoved = true;
      }
    }

    // find the king for the side
    const king = targetArr.find(p => (p.pt || '').toUpperCase() === 'K');
    if (!king) return false;

    // check if opponent attacks the king
    const attackerSide = side === 'player' ? 'enemy' : 'player';
    return this.isSquareAttacked(king.x, king.y, attackerSide, playerClone, enemyClone);
  }

  showPromotionUI(piece) {
    // simple UI: modal with four buttons Q,R,B,N
    const { width, height } = this.scale;
    const w = 300;
    const h = 120;
    const x = (width - w) / 2;
    const y = (height - h) / 2;
    this.promoGroup = this.add.group();
    const bg = this.add.rectangle(width/2, height/2, w, h, 0x111111, 0.95);
    bg.setStrokeStyle(2, 0xffffff);
    this.promoGroup.add(bg);

    this.add.text(width/2, y + 20, 'Escolha promoção', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);

    const options = ['Q','R','B','N'];
    const btnW = 60;
    for (let i = 0; i < options.length; i++) {
      const cx = width/2 - (options.length/2)*btnW + i*btnW + btnW/2;
      const btn = this.add.rectangle(cx, y + 70, btnW-8, 40, 0x333333).setInteractive({useHandCursor:true});
      const lbl = this.add.text(cx, y + 70, options[i], { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
      this.promoGroup.addMultiple([btn, lbl]);
      btn.on('pointerup', () => this.completePromotion(options[i]));
    }
  }

  completePromotion(choice) {
    if (!this.promotionPending) return;
    const pid = this.promotionPending.pieceId;
    const p = this.playerPieces.find(pp => pp.id === pid);
    if (p) p.pt = choice;
    this.promotionPending = null;
    if (this.promoGroup) {
      try {
        if (typeof this.promoGroup.clear === 'function') this.promoGroup.clear(true, true);
        if (typeof this.promoGroup.destroy === 'function') this.promoGroup.destroy(true);
      } catch (err) {
        console.warn('promoGroup destroy failed', err);
      }
      this.promoGroup = null;
    }
    this.refreshBoard();

    // after promotion selection, proceed to enemy turn
    this.turnPhase = 'enemy';
    this.turnText.setText('Turno: Inimigo');
    this.time.delayedCall(300, () => this.startEnemyTurn());
  }

  tileToPixel(tx, ty) {
    return { rx: this.boardOffsetX + tx * TILE_SIZE, ry: this.boardOffsetY + ty * TILE_SIZE };
  }

  findPieceAt(x, y) {
    const p = this.playerPieces.find(i => i.x === x && i.y === y);
    if (p) return { piece: p, type: 'player' };
    const e = this.enemyPieces.find(i => i.x === x && i.y === y);
    if (e) return { piece: e, type: 'enemy' };
    return null;
  }

  onPointerDown(pointer) {
    if (this.turnPhase !== 'player') return; // ignore clicks when not player's turn
    if (this.promotionPending) return; // block input while promotion UI open
    const x = Math.floor((pointer.x - this.boardOffsetX) / TILE_SIZE);
    const y = Math.floor((pointer.y - this.boardOffsetY) / TILE_SIZE);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;

    const found = this.getPieceAt(x, y);

    if (found && found.side === 'player') {
      // select player's piece
      this.selected = found.piece;
      this.showHighlightsFor(this.selected);
      // draw selection rectangle
      this.selectionGraphics.clear();
      this.selectionGraphics.lineStyle(3, 0x00ff00, 1);
      const { rx, ry } = this.tileToPixel(this.selected.x, this.selected.y);
      this.selectionGraphics.strokeRect(rx + 2, ry + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      return;
    }

    if (this.selected) {
      // attempt move from selected to (x,y)
      const from = this.selected;
      if (this.canMove(from, x, y) && !this.moveLeavesKingInCheckForSide(from, x, y, 'player')) {
        // captures handled inside applyMove

        // apply move (handles en passant, castling, promotion)
        this.applyMove(from, x, y, 'player');
        this.selected = null;
        this.clearHighlights();
        this.selectionGraphics.clear();
        this.refreshBoard();
        this.checkGameOver();

        // after player move, if promotion pending we wait for player choice
        if (!this.promotionPending) {
          this.turnPhase = 'enemy';
          this.turnText.setText('Turno: Inimigo');
          this.time.delayedCall(300, () => this.startEnemyTurn());
        }
      } else {
        // invalid move: deselect
        this.selected = null;
        this.clearHighlights();
        this.selectionGraphics.clear();
      }
    }
  }

  isEnemyPiece(piece) {
    return this.enemyPieces.includes(piece);
  }

  startEnemyTurn() {
    // compute one move for enemy, execute it, then return turn to player and advance round
    this.enemyMakeMove();
  }

  enemyMakeMove() {
    // gather legal moves for enemies that don't leave their king in check
    const legalMoves = [];
    for (const piece of this.enemyPieces) {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (this.canMove(piece, x, y)) {
            // skip moves that would leave enemy king in check
            if (this.moveLeavesKingInCheckForSide(piece, x, y, 'enemy')) continue;
            const target = this.getPieceAt(x, y);
            legalMoves.push({ piece, toX: x, toY: y, capture: target && target.side === 'player' });
          }
        }
      }
    }

    if (legalMoves.length === 0) {
      // no legal moves: pass turn
      this.finishEnemyTurn();
      return;
    }

    // if enemy is currently in check, further prefer moves that remove check (already enforced by legalMoves),
    // so just pick among legal moves, prioritizing captures
    const captures = legalMoves.filter(m => m.capture);
    const choice = (captures.length ? Phaser.Utils.Array.GetRandom(captures) : Phaser.Utils.Array.GetRandom(legalMoves));

    // execute chosen move (use applyMove for correctness)
    this.applyMove(choice.piece, choice.toX, choice.toY, 'enemy');
    // update visuals immediately so the move is visible
    this.refreshBoard();

    // small delay before returning to player
    this.time.delayedCall(300, () => this.finishEnemyTurn());
  }

  finishEnemyTurn() {
    // check if player lost all pieces
    if (this.playerPieces.length === 0) {
      this.scene.start('GameOverScene', { score: this.score, round: this.campaignRound });
      return;
    }

    // advance in-match turn counter
    this.turnRound++;
    this.roundText.setText(`Turno: ${Math.min(this.turnRound, this.maxRounds)} / ${this.maxRounds}`);

    // if match end conditions met (enemy defeated or turn limit reached), go to shop (end of match)
    if (this.enemyPieces.length === 0 || this.turnRound > this.maxRounds) {
      // increment campaign round and decide payment based on campaignRound
      this.campaignRound++;
      const paymentRequired = (this.paymentInterval > 0) && ((this.campaignRound % this.paymentInterval) === 0);
      this.scene.start('ShopScene', {
        playerCharacterId: this.playerCharacterId,
        round: this.campaignRound,
        score: this.score,
        upgrades: this.upgrades,
        paymentRequired
      });
      return;
    }

    // otherwise continue to player's turn
    this.turnPhase = 'player';
    this.turnText.setText('Turno: Jogador');
  }

  // Basic movement rules for chess-like pieces
  canMove(piece, toX, toY) {
    // No move
    if (piece.x === toX && piece.y === toY) return false;

    // Can't capture own pieces
    const obst = this.getPieceAt(toX, toY);
    if (obst) {
      const pieceSide = this.isEnemyPiece(piece) ? 'enemy' : 'player';
      if (obst.side === pieceSide) return false;
    }

    const dx = toX - piece.x;
    const dy = toY - piece.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const pt = piece.pt ? piece.pt.toUpperCase() : 'P';

    // Pawn: direction depends on side (player moves up, enemy moves down)
    if (pt === 'P') {
      const isEnemy = this.isEnemyPiece(piece);
      const dir = isEnemy ? 1 : -1;
      // move forward one
      if (dx === 0 && dy === dir && !this.getPieceAt(toX, toY)) return true;
      // initial double move (two squares)
      const startRank = isEnemy ? 1 : ROWS - 2;
      if (dx === 0 && dy === 2 * dir && !piece.hasMoved && piece.y === startRank) {
        // path must be clear
        const midY = piece.y + dir;
        if (!this.getPieceAt(toX, midY) && !this.getPieceAt(toX, toY)) return true;
      }

      // capture diag (normal)
      const target = this.getPieceAt(toX, toY);
      if (Math.abs(dx) === 1 && dy === dir && target && target.side === (isEnemy ? 'player' : 'enemy')) return true;

      // en passant capture: diagonal to empty square when opponent just moved pawn two squares
      if (Math.abs(dx) === 1 && dy === dir && !target && this.lastMove && (this.lastMove.pieceType || '').toUpperCase() === 'P') {
        // lastMove must be opponent pawn that moved two squares to adjacent file
        if (this.lastMove.toX === toX && this.lastMove.toY === piece.y) {
          if (Math.abs(this.lastMove.toY - this.lastMove.fromY) === 2) return true;
        }
      }

      return false;
    }

    if (pt === 'R') {
      if (dx !== 0 && dy !== 0) return false;
      return this.isPathClear(piece.x, piece.y, toX, toY);
    }

    if (pt === 'B') {
      if (adx !== ady) return false;
      return this.isPathClear(piece.x, piece.y, toX, toY);
    }

    if (pt === 'Q') {
      if (dx === 0 || dy === 0 || adx === ady) return this.isPathClear(piece.x, piece.y, toX, toY);
      return false;
    }

    if (pt === 'K') {
      // normal one-square king move
      if (Math.max(adx, ady) === 1) return true;
      // allow castling: two-square horizontal move if rook present and path clear and not in/through check
      if (dy === 0 && Math.abs(dx) === 2 && !piece.hasMoved) {
        const dir = dx > 0 ? 1 : -1;
        const rookX = dir > 0 ? COLS - 1 : 0;
        const rookArr = this.isEnemyPiece(piece) ? this.enemyPieces : this.playerPieces;
        const rook = rookArr.find(r => (r.pt || '').toUpperCase() === 'R' && r.x === rookX && r.y === piece.y && !r.hasMoved);
        if (!rook) return false;
        // path must be clear
        for (let cx = piece.x + dir; cx !== rookX; cx += dir) if (this.getPieceAt(cx, piece.y)) return false;
        // cannot be in check or pass through attacked squares
        const opponentSide = this.isEnemyPiece(piece) ? 'player' : 'enemy';
        if (this.isSquareAttacked(piece.x, piece.y, opponentSide, this.playerPieces, this.enemyPieces)) return false;
        if (this.isSquareAttacked(piece.x + dir, piece.y, opponentSide, this.playerPieces, this.enemyPieces)) return false;
        if (this.isSquareAttacked(piece.x + 2 * dir, piece.y, opponentSide, this.playerPieces, this.enemyPieces)) return false;
        return true;
      }
      return false;
    }

    if (pt === 'N') {
      return (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
    }

    return false;
  }

  // check if straight/diagonal path between from and to is clear (excluding endpoints)
  isPathClear(fromX, fromY, toX, toY) {
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    let cx = fromX + dx;
    let cy = fromY + dy;
    while (cx !== toX || cy !== toY) {
      if (this.getPieceAt(cx, cy)) return false;
      cx += dx;
      cy += dy;
    }
    return true;
  }

  captureEnemy(enemy) {
    // (unused) kept for compatibility
    Phaser.Utils.Array.Remove(this.enemyPieces, enemy);
    this.score += this.captureValue;
    this.scoreText.setText(`Pontuação: ${this.score}`);
    this.refreshBoard();
    this.checkGameOver();
  }

  refreshBoard() {
    this.drawBoard();
    this.renderPieces();
  }

  nextRound() {
    this.turnRound++;
    this.roundText.setText(`Turno: ${this.turnRound}`);

    // spawn new enemies procedurally
    const free = this.getAllPositions().filter(pos => !this.findPieceAt(pos.x, pos.y));
    Phaser.Utils.Array.Shuffle(free);
    const toSpawn = Phaser.Math.Between(1, 3);
    for (let i = 0; i < toSpawn && free.length; i++) {
      const pos = free.pop();
      this.enemyPieces.push({ x: pos.x, y: pos.y, id: `e_r${this.turnRound}_${i}` });
    }

    // give small reward each round
    this.score += 0;
    this.scoreText.setText(`Pontuação: ${this.score}`);
    this.refreshBoard();
  }

  checkGameOver() {
    if (this.playerPieces.length === 0) {
      this.scene.start('GameOverScene', { score: this.score, round: this.campaignRound });
    }
  }
}
