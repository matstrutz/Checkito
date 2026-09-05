# `src/data`

Esta pasta concentra os dados estáticos e as regras configuráveis do jogo. Os módulos daqui são importados pelas cenas e não devem depender da interface gráfica do Phaser.

## Arquivos

- `characters.js` — personagens do jogador, presets de inimigos, formações iniciais e tiers/recompensas dos inimigos.
- `buffs.js` — augments disponíveis, raridade, preço, descrição, ícone e hooks de comportamento.
- `progression.js` — limite da campanha, intervalo entre pagamentos e custos por rodada.

## Personagens e peças

Cada personagem possui `id`, nome de exibição e `pieces`. Cada peça deve informar:

- `x` e `y`: posição no tabuleiro 5x6, com `x` entre 0 e 4 e `y` entre 0 e 5.
- `pt`: tipo da peça. Jogadores usam letras maiúsculas (`P`, `N`, `B`, `R`, `Q`, `K`) e inimigos usam minúsculas.
- `id`: identificador estável da peça, usado em regras de movimento e augments.
- `hasMoved`: indica se a peça já se moveu, importante para roque e outras regras.

As formações de inimigos devem usar `enemyFormation(rows, idPrefix)`. A primeira linha representa a fileira de peões (`y: 1`) e a segunda representa a fileira traseira (`y: 0`); use `x` para uma casa vazia.

## Augments e hooks

Cada augment em `buffs.js` possui `id`, `name`, `description`, `icon`, `rarity`, `price` e, quando necessário, `hooks`. Os hooks são funções passivas chamadas por `GameScene`:

- `onCapture(gameScene, piece, targetPiece, baseValue)` — altera a pontuação de uma captura. Deve retornar o novo valor.
- `onMove(gameScene, piece, moveNumber)` — reage a um movimento do jogador. Pode retornar `{ keepTurn: true }` e, opcionalmente, `allowedPieceId` ou `excludedPieceId` para controlar um movimento extra.
- `onPathBlocked(gameScene, movingPiece, blockingPiece)` — decide se uma peça pode atravessar um bloqueador. Deve retornar `true` somente quando a passagem for permitida.
- `onShopRarityWeights(weights)` — altera os pesos de raridade das ofertas da loja e retorna o novo objeto de pesos.
- `onCanMove(gameScene, piece, toX, toY)` — adiciona uma regra especial de movimento. Deve retornar `true` somente para movimentos extras válidos.
- `onRoundEnd(gameScene)` — reage ao fim da rodada de combate, antes da progressão para a próxima rodada.
- `onSwap(gameScene, firstPiece, secondPiece)` — valida uma troca especial entre duas peças aliadas.

Hooks sem efeito devem retornar `null` ou preservar o valor recebido. O `id` salvo em `upgrades` é a referência persistente; os dados completos são recuperados por `BUFFS_MAP`.
