# `src/scenes`

Contém as cenas Phaser do jogo. Cada cena é um módulo ES com uma `key` própria e precisa ser registrada no array de cenas em `src/main.js`.

## Fluxo atual

- `MenuScene.js` — tela inicial e entrada da campanha.
- `CharacterSelectScene.js` — escolha do personagem do jogador.
- `OpponentSelectScene.js` — escolha entre os inimigos disponíveis na rodada.
- `GameScene.js` — tabuleiro, movimentos, capturas, turnos, IA, promoção e aplicação dos augments.
- `ShopScene.js` — compras entre partidas, pagamento de checkpoints e visual dos augments adquiridos.
- `GameOverScene.js` — encerramento por derrota ou falta de recursos.
- `VictoryScene.js` — encerramento após completar a campanha.

## Estado entre cenas

As cenas passam a progressão por meio de `scene.start()` usando `score`, `upgrades`, `round` e, quando necessário, os IDs dos personagens. `upgrades` é uma lista de IDs definidos em `src/data/buffs.js`. O estado também pode ser persistido em `localStorage` na chave `checkito_state`.

Ao criar uma cena nova, implemente `init(data)` para receber o estado, `create()` para montar a interface e registre a cena em `src/main.js`. Prefira manter regras de dados em `src/data` e deixar nesta pasta apenas fluxo, interação e renderização.
