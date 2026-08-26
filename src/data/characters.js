// Character presets for player and enemy starting configurations
const files = { A:0, B:1, C:2, D:3, E:4 };
const ROWS = 6;
function pos(file, rank) {
  const x = files[file.toUpperCase()];
  const y = ROWS - rank; // rank 1 -> bottom row (y = ROWS-1)
  return { x, y };
}

export const ENEMY_TIERS = {
  BASIC: 'BASIC',
  ADVANCED: 'ADVANCED',
  BOSS: 'BOSS',
  BOSS_FINAL: 'BOSS_FINAL',
  SPECIAL: 'SPECIAL'
};

export const ENEMY_VALUES = {
  [ENEMY_TIERS.BASIC]: 6,
  [ENEMY_TIERS.ADVANCED]: 8,
  [ENEMY_TIERS.BOSS]: 10,
  [ENEMY_TIERS.BOSS_FINAL]: 15
};

function enemyFormation(rows, idPrefix) {
  const pieces = [];
  rows.forEach((row, y) => {
    row.forEach((pieceType, x) => {
      if (pieceType.toLowerCase() === 'x') return;
      pieces.push({
        x,
        // The first supplied row is the pawn line (rank 5), followed by rank 6.
        y: y === 0 ? 1 : 0,
        pt: pieceType.toLowerCase(),
        id: `${idPrefix}_${x}_${y}`,
        hasMoved: false
      });
    });
  });
  return pieces;
}

export const playerCharacters = {
  TheSquire: {
    id: 'TheSquire',
    displayName: 'The Squire',
    pieces: [
      // pawns: a2, c2, e2
      (() => { const p = pos('A',2); return { x:p.x, y:p.y, pt:'P', id:'s_p_a2', hasMoved:false }; })(),
      (() => { const p = pos('C',2); return { x:p.x, y:p.y, pt:'P', id:'s_p_c2', hasMoved:false }; })(),
      (() => { const p = pos('E',2); return { x:p.x, y:p.y, pt:'P', id:'s_p_e2', hasMoved:false }; })(),
      // back pieces: rook a1, king c1, bishop d1, knight e1
      (() => { const p = pos('A',1); return { x:p.x, y:p.y, pt:'R', id:'s_r_a1', hasMoved:false }; })(),
      (() => { const p = pos('C',1); return { x:p.x, y:p.y, pt:'K', id:'s_k_c1', hasMoved:false }; })(),
      (() => { const p = pos('D',1); return { x:p.x, y:p.y, pt:'B', id:'s_b_d1', hasMoved:false }; })(),
      (() => { const p = pos('E',1); return { x:p.x, y:p.y, pt:'N', id:'s_n_e1', hasMoved:false }; })(),
    ]
  }
};

// Enemy presets (mirror or full board setups)
export const enemyCharacters = {
  TheAllRounder: {
    id: 'TheAllRounder',
    displayName: 'The All-Rounder',
    tier: ENEMY_TIERS.SPECIAL,
    value: 12,
    // full standard adapted 5x6 setup: back row R N Q K B (lowercase), pawns at rank 5 (y=1)
    pieces: (function(){
      const arr = [];
      const back = ['r','n','q','k','b'];
      for (let x = 0; x < 5; x++) arr.push({ x, y:0, pt: back[x], id:`e_back_${x}`, hasMoved:false });
      for (let x = 0; x < 5; x++) arr.push({ x, y:1, pt: 'p', id:`e_pawn_${x}`, hasMoved:false });
      return arr;
    })()
  },
  ScilianDefender: {
    id: 'ScilianDefender',
    displayName: 'Scilian Defender',
    tier: ENEMY_TIERS.BASIC,
    value: ENEMY_VALUES[ENEMY_TIERS.BASIC],
    pieces: enemyFormation([
      ['x', 'p', 'x', 'p', 'p'],
      ['x', 'q', 'k', 'x', 'n']
    ], 'scilian_defender')
  },
  FrenchDefender: {
    id: 'FrenchDefender',
    displayName: 'French Defender',
    tier: ENEMY_TIERS.BASIC,
    value: ENEMY_VALUES[ENEMY_TIERS.BASIC],
    pieces: enemyFormation([
      ['x', 'p', 'p', 'p', 'x'],
      ['x', 'q', 'k', 'x', 'n']
    ], 'french_defender')
  },
  ItalianStarter: {
    id: 'ItalianStarter',
    displayName: 'Italian Starter',
    tier: ENEMY_TIERS.ADVANCED,
    value: ENEMY_VALUES[ENEMY_TIERS.ADVANCED],
    pieces: enemyFormation([
      ['p', 'p', 'p', 'x', 'x'],
      ['x', 'q', 'k', 'b', 'n']
    ], 'italian_starter')
  },
  ViennaEnjoyer: {
    id: 'ViennaEnjoyer',
    displayName: 'Vienna Enjoyer',
    tier: ENEMY_TIERS.BOSS,
    value: ENEMY_VALUES[ENEMY_TIERS.BOSS],
    pieces: enemyFormation([
      ['x', 'x', 'p', 'p', 'p'],
      ['n', 'q', 'k', 'b', 'x']
    ], 'vienna_enjoyer')
  },
  QueensGambit: {
    id: 'QueensGambit',
    displayName: "Queen's Gambit",
    tier: ENEMY_TIERS.BOSS_FINAL,
    value: ENEMY_VALUES[ENEMY_TIERS.BOSS_FINAL],
    pieces: enemyFormation([
      ['p', 'p', 'x', 'p', 'p'],
      ['q', 'q', 'k', 'q', 'q']
    ], 'queens_gambit')
  }
};

export default { playerCharacters, enemyCharacters };
