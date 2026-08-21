// Character presets for player and enemy starting configurations
const files = { A:0, B:1, C:2, D:3, E:4 };
const ROWS = 6;
function pos(file, rank) {
  const x = files[file.toUpperCase()];
  const y = ROWS - rank; // rank 1 -> bottom row (y = ROWS-1)
  return { x, y };
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
    // full standard adapted 5x6 setup: back row R N Q K B (lowercase), pawns at rank 5 (y=1)
    pieces: (function(){
      const arr = [];
      const back = ['r','n','q','k','b'];
      for (let x = 0; x < 5; x++) arr.push({ x, y:0, pt: back[x], id:`e_back_${x}`, hasMoved:false });
      for (let x = 0; x < 5; x++) arr.push({ x, y:1, pt: 'p', id:`e_pawn_${x}`, hasMoved:false });
      return arr;
    })()
  }
};

export default { playerCharacters, enemyCharacters };
