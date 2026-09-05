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
 * Definicao de buffs disponiveis.
 * Cada buff tem: id, name, description, icon, rarity, price, hooks.
 */
export const BUFFS = [
  {
    id: 'pawns_game',
    name: "Pawn's Game",
    description: 'Capturar um peao com seu peao gera +1 ponto adicional',
    icon: 'circle',
    rarity: BUFF_RARITIES.COMMON,
    price: 10,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        const attackerIsPawn = (piece.pt || '').toUpperCase() === 'P';
        const targetIsPawn = (targetPiece.pt || '').toUpperCase() === 'P';
        return attackerIsPawn && targetIsPawn ? baseValue + 1 : baseValue;
      }
    }
  },
  {
    id: 'luck_move',
    name: 'Luck Move',
    description: 'Aumenta a chance de aprimoramentos mais raros aparecerem',
    icon: 'circle',
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
    description: 'Capturar o rei inimigo concede o dobro dos pontos',
    icon: 'circle',
    rarity: BUFF_RARITIES.COMMON,
    price: 8,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        if (gameScene.captureSide === 'player' && (targetPiece.pt || '').toUpperCase() === 'K') return baseValue * 2;
        return baseValue;
      }
    }
  },
  {
    id: 'double_pawns',
    name: 'Double Pawns',
    description: 'No seu primeiro turno, ate 2 peoes diferentes podem ser movidos',
    icon: 'circle',
    rarity: BUFF_RARITIES.UNCOMMON,
    price: 8,
    hooks: {
      onMove: (gameScene, piece, moveNumber) => {
        const isFirstMove = typeof moveNumber === 'number' && moveNumber === 0;
        if (gameScene.turnRound === 1 && isFirstMove && (piece.pt || '').toUpperCase() === 'P') {
          return { keepTurn: true, excludedPieceId: piece.id };
        }
        return null;
      }
    }
  },
  {
    id: 'double_jump',
    name: 'Double Jump',
    description: 'No seu primeiro turno, seu cavalo pode se mover ate 2 vezes seguidas',
    icon: 'circle',
    rarity: BUFF_RARITIES.RARE,
    price: 8,
    hooks: {
      onMove: (gameScene, piece, moveNumber) => {
        const isFirstMove = typeof moveNumber === 'number' && moveNumber === 0;
        if (gameScene.turnRound === 1 && isFirstMove && (piece.pt || '').toUpperCase() === 'N') {
          return { keepTurn: true, allowedPieceId: piece.id };
        }
        return null;
      }
    }
  },
  {
    id: 'ghost_bishops',
    name: 'Ghost Bishops',
    description: 'Seu bispo pode atravessar pecas aliadas',
    icon: 'circle',
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
    description: 'Quando uma rainha captura um de seus peoes, voce ganha 1 ponto',
    icon: 'circle',
    rarity: BUFF_RARITIES.COMMON,
    price: 10,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        const enemyQueen = gameScene.captureSide === 'enemy' && (piece.pt || '').toUpperCase() === 'Q';
        const playerPawn = gameScene.captureSide === 'enemy' && (targetPiece.pt || '').toUpperCase() === 'P';
        if (enemyQueen && playerPawn) {
          gameScene.score += 1;
          if (gameScene.scoreText) gameScene.scoreText.setText(`Pontuacao: ${gameScene.score}`);
        }
        return baseValue;
      }
    }
  },
  {
    id: 'the_roooook',
    name: 'The Roooook',
    description: 'Quando uma de suas torres e capturada, voce ganha 1 ponto',
    icon: 'circle',
    rarity: BUFF_RARITIES.UNCOMMON,
    price: 8,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        if (gameScene.captureSide === 'enemy' && (targetPiece.pt || '').toUpperCase() === 'R') {
          gameScene.score += 1;
          if (gameScene.scoreText) gameScene.scoreText.setText(`Pontuacao: ${gameScene.score}`);
        }
        return baseValue;
      }
    }
  },
  {
    id: 'accepting_defeat',
    name: 'Accepting Defeat',
    description: 'Terminar a rodada sem nenhum peao concede 2 pontos',
    icon: 'circle',
    rarity: BUFF_RARITIES.COMMON,
    price: 6,
    hooks: {
      onRoundEnd: (gameScene) => {
        const hasPawn = gameScene.playerPieces.some(piece => (piece.pt || '').toUpperCase() === 'P');
        if (!hasPawn) {
          gameScene.score += 2;
          if (gameScene.scoreText) gameScene.scoreText.setText(`Pontuacao: ${gameScene.score}`);
        }
      }
    }
  },
  {
    id: 'en_passant_master',
    name: 'En Passant Master',
    description: 'Capturas en passant concedem 2 pontos adicionais',
    icon: 'circle',
    rarity: BUFF_RARITIES.COMMON,
    price: 5,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        if (gameScene.captureSide === 'player' && gameScene.captureType === 'en_passant') return baseValue + 2;
        return baseValue;
      }
    }
  },
  {
    id: 'catapult',
    name: 'Catapult',
    description: 'Peoes a frente de torres podem capturar a duas casas e se sacrificar',
    icon: 'circle',
    rarity: BUFF_RARITIES.RARE,
    price: 8,
    hooks: {
      onCanMove: (gameScene, piece, toX, toY) => {
        if (!gameScene.upgrades.includes('catapult') || gameScene.isEnemyPiece(piece)) return false;
        if ((piece.pt || '').toUpperCase() !== 'P' || toX !== piece.x || toY !== piece.y - 2) return false;
        const rookBehind = gameScene.playerPieces.some(other =>
          (other.pt || '').toUpperCase() === 'R' && other.x === piece.x && other.y === piece.y + 1
        );
        const middle = gameScene.getPieceAt(piece.x, piece.y - 1);
        const target = gameScene.getPieceAt(toX, toY);
        return rookBehind && !middle && target && target.side === 'enemy';
      }
    }
  },
  {
    id: 'pacifist',
    name: 'Pacifist',
    description: 'Se nenhum peao for perdido, ganha 1 ponto por peao vivo',
    icon: 'circle',
    rarity: BUFF_RARITIES.COMMON,
    price: 7,
    hooks: {
      onRoundEnd: (gameScene) => {
        const pawnCount = gameScene.playerPieces.filter(piece => (piece.pt || '').toUpperCase() === 'P').length;
        if (pawnCount === gameScene.initialPlayerPawnCount) {
          gameScene.score += pawnCount;
          if (gameScene.scoreText) gameScene.scoreText.setText(`Pontuacao: ${gameScene.score}`);
        }
      }
    }
  },
  {
    id: 'swap',
    name: 'Swap',
    description: 'Bispos e cavalos podem trocar de lugar uma vez por rodada',
    icon: 'circle',
    rarity: BUFF_RARITIES.UNCOMMON,
    price: 4,
    hooks: {
      onSwap: (gameScene, firstPiece, secondPiece) => {
        if (gameScene.swapUsedThisRound) return false;
        const firstType = (firstPiece.pt || '').toUpperCase();
        const secondType = (secondPiece.pt || '').toUpperCase();
        return !gameScene.isEnemyPiece(firstPiece)
          && !gameScene.isEnemyPiece(secondPiece)
          && (firstType === 'B' || firstType === 'N')
          && firstType === secondType;
      }
    }
  },
  {
    id: 'rooket',
    name: 'Rooket',
    description: 'Sua torre pode capturar uma fileira consecutiva de peoes',
    icon: 'circle',
    rarity: BUFF_RARITIES.UNCOMMON,
    price: 5,
    hooks: {
      onCanMove: (gameScene, piece, toX, toY) => gameScene.isRooketMove(piece, toX, toY)
    }
  },
  {
    id: 'for_the_king',
    name: 'For the King',
    description: 'Seus peoes podem se sacrificar para capturar peoes inimigos a frente',
    icon: 'circle',
    rarity: BUFF_RARITIES.RARE,
    price: 8,
    hooks: {
      onCanMove: (gameScene, piece, toX, toY) => gameScene.isForTheKingMove(piece, toX, toY)
    }
  }
];

export const BUFFS_MAP = {};
BUFFS.forEach(buff => {
  BUFFS_MAP[buff.id] = buff;
});

export function getBuffInfo(buffId) {
  return BUFFS_MAP[buffId] || null;
}

export function getBuffsByRarity(rarity) {
  return BUFFS.filter(buff => buff.rarity === rarity);
}

export function getShopRarityWeights(ownedBuffIds = []) {
  let weights = { ...SHOP_RARITY_WEIGHTS };
  for (const buffId of ownedBuffIds) {
    const buff = BUFFS_MAP[buffId];
    const hook = buff && buff.hooks && buff.hooks.onShopRarityWeights;
    if (typeof hook === 'function') weights = hook(weights);
  }
  return weights;
}

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
