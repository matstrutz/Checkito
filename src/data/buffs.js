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
  // Placeholder para futuros buffs
  /*
  {
    id: 'knight_mastery',
    name: 'Knight Mastery',
    description: 'Capturas de Cavalo geram +2 pontos adicionais',
    rarity: BUFF_RARITIES.UNCOMMON,
    price: 20,
    hooks: {
      onCapture: (gameScene, piece, targetPiece, baseValue) => {
        const attackerIsKnight = (piece.pt || '').toUpperCase() === 'N';
        if (attackerIsKnight) {
          return baseValue + 2;
        }
        return baseValue;
      }
    }
  },
  */
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
