/**
 * Sistema de Buffs/Aprimoramentos com raridades e hooks
 */

export const BUFF_RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare'
};

export const SHOP_RARITY_WEIGHTS = {
  [BUFF_RARITIES.COMMON]: 75,
  [BUFF_RARITIES.UNCOMMON]: 20,
  [BUFF_RARITIES.RARE]: 5
};

/**
 * Definição de buffs disponíveis
 * Cada buff tem: id, name, description, rarity, price, hooks
 * 
 * Hooks são callbacks que modificam comportamento do jogo:
 * - onCapture(gameScene, piece, targetPiece, baseValue) => newValue
 */
export const BUFFS = [
  {
    id: 'pawns_game',
    name: "Pawn's Game",
    description: 'Capturar um peão com seu peão gera +1 ponto adicional',
    rarity: BUFF_RARITIES.COMMON,
    price: 10,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        // Se o atacante é um peão e o alvo também é um peão, +1
        const attackerIsPawn = (piece.pt || '').toUpperCase() === 'P';
        const targetIsPawn = (targetPiece.pt || '').toUpperCase() === 'P';
        if (attackerIsPawn && targetIsPawn) {
          return baseValue + 1;
        }
        return baseValue;
      }
    }
  },
  {
    id: 'luck_move',
    name: 'Luck Move',
    description: 'Aumenta a chance de aprimoramentos mais raros aparecerem',
    rarity: BUFF_RARITIES.UNCOMMON,
    price: 20,
    hooks: {
      onShopRarityWeights: (weights) => ({
        ...weights,
        [BUFF_RARITIES.COMMON]: weights[BUFF_RARITIES.COMMON] - 15,
        [BUFF_RARITIES.UNCOMMON]: weights[BUFF_RARITIES.UNCOMMON] + 10,
        [BUFF_RARITIES.RARE]: weights[BUFF_RARITIES.RARE] + 5
      })
    }
  },
  {
    id: 'worth_challenger',
    name: 'Worth Challenger',
    description: 'Os reis que voce captura geram mais 3 pontos',
    rarity: BUFF_RARITIES.COMMON,
    price: 8,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        if (gameScene.captureSide === 'player' && (targetPiece.pt || '').toUpperCase() === 'K') {
          return baseValue + 3;
        }
        return baseValue;
      }
    }
  },
  {
    id: 'double_pawns',
    name: 'Double Pawns',
    description: 'No seu primeiro turno, até 2 peões diferentes podem ser movidos',
    rarity: BUFF_RARITIES.UNCOMMON,
    price: 8,
    hooks: {
      onMove: (gameScene, piece, moveNumber) => {
        if (gameScene.turnRound === 1 && moveNumber === 1 && (piece.pt || '').toUpperCase() === 'P') {
          return { keepTurn: true, excludedPieceId: piece.id };
        }
        return null;
      }
    }
  },
  {
    id: 'double_jump',
    name: 'Double Jump',
    description: 'No seu primeiro turno, seu cavalo pode se mover até 2 vezes seguidas',
    rarity: BUFF_RARITIES.RARE,
    price: 8,
    hooks: {
      onMove: (gameScene, piece, moveNumber) => {
        if (gameScene.turnRound === 1 && moveNumber === 1 && (piece.pt || '').toUpperCase() === 'N') {
          return { keepTurn: true, allowedPieceId: piece.id };
        }
        return null;
      }
    }
  },
  {
    id: 'ghost_bishops',
    name: 'Ghost Bishops',
    description: 'Seu bispo pode atravessar peças aliadas',
    rarity: BUFF_RARITIES.RARE,
    price: 12,
    hooks: {
      onPathBlocked: (gameScene, movingPiece, blockingPiece) => {
        const pathSide = gameScene.pathSide;
        const isPlayerBishop = pathSide === 'player' && (movingPiece.pt || '').toUpperCase() === 'B';
        const blockingSide = blockingPiece && typeof blockingPiece.x === 'number' && typeof blockingPiece.y === 'number'
          ? gameScene.getPieceAt(blockingPiece.x, blockingPiece.y)?.side || null
          : null;
        return isPlayerBishop && blockingSide === 'player';
      }
    }
  },
  {
    id: 'honorable_sacrifice',
    name: 'Honorable Sacrifice',
    description: 'Quando uma rainha captura um de seus peões, você ganha 1 ponto',
    rarity: BUFF_RARITIES.COMMON,
    price: 10,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        const enemyQueen = gameScene.captureSide === 'enemy'
          && (piece.pt || '').toUpperCase() === 'Q';
        const playerPawn = gameScene.captureSide === 'enemy'
          && (targetPiece.pt || '').toUpperCase() === 'P';
        if (enemyQueen && playerPawn) {
          gameScene.score += 1;
          if (gameScene.scoreText) gameScene.scoreText.setText(`Pontuação: ${gameScene.score}`);
        }
        return baseValue;
      }
    }
  }
];

// Mapa de ID -> Buff para acesso rápido
export const BUFFS_MAP = {};
BUFFS.forEach(buff => {
  BUFFS_MAP[buff.id] = buff;
});

/**
 * Obter informações de um buff
 */
export function getBuffInfo(buffId) {
  return BUFFS_MAP[buffId] || null;
}

/**
 * Listar buffs por raridade
 */
export function getBuffsByRarity(rarity) {
  return BUFFS.filter(b => b.rarity === rarity);
}

export function getShopRarityWeights(ownedBuffIds = []) {
  let weights = { ...SHOP_RARITY_WEIGHTS };

  for (const buffId of ownedBuffIds) {
    const buff = BUFFS_MAP[buffId];
    const hook = buff && buff.hooks && buff.hooks.onShopRarityWeights;
    if (typeof hook === 'function') {
      weights = hook(weights);
    }
  }

  return weights;
}

/**
 * Gera ofertas da loja sem incluir buffs já adquiridos.
 * O sorteio de cada oferta usa os pesos 75/20/5 por raridade.
 */
export function getShopBuffs(ownedBuffIds = [], amount = 3) {
  const owned = new Set(ownedBuffIds);
  const available = BUFFS.filter(buff => !owned.has(buff.id));
  const offers = [];
  const rarityWeights = getShopRarityWeights(owned);

  while (offers.length < amount && available.length > 0) {
    const availableRarities = Object.keys(SHOP_RARITY_WEIGHTS)
      .filter(rarity => available.some(buff => buff.rarity === rarity));
    const totalWeight = availableRarities.reduce(
      (total, rarity) => total + rarityWeights[rarity],
      0
    );

    let roll = Math.random() * totalWeight;
    const selectedRarity = availableRarities.find(rarity => {
      roll -= rarityWeights[rarity];
      return roll < 0;
    });
    const rarityPool = available.filter(buff => buff.rarity === selectedRarity);
    const selected = rarityPool[Math.floor(Math.random() * rarityPool.length)];

    offers.push(selected);
    available.splice(available.indexOf(selected), 1);
  }

  return offers;
}
