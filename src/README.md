# `src`

Contém o código-fonte JavaScript do jogo, organizado como módulos ES para o navegador.

## Organização

- `main.js` — configura o Phaser, define o canvas e registra todas as cenas.
- `scenes/` — fluxo de telas, renderização, input do jogador e regras de partida.
- `data/` — presets, buffs, progressão e demais dados independentes da interface.

## Convenções

- Use imports relativos com extensão `.js`.
- Mantenha IDs de personagens, peças e augments estáveis, pois eles são usados na persistência.
- Passe o estado entre cenas explicitamente (`score`, `upgrades`, `round` e IDs relevantes).
- Para alterações de regras, atualize a documentação correspondente em `src/data/README.md`.
