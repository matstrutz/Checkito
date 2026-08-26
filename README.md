# Roguelite Xadrez (Phaser 3)

Projeto experimental: um roguelite inspirado em xadrez, desenvolvido com Phaser 3.

Resumo do que existe agora
- Cena principal do jogo: `src/scenes/GameScene.js` — lógica do tabuleiro, regras de movimento (peças adaptadas ao tabuleiro 5x6), roque, en-passant, promoção (UI para o jogador) e IA simples.
- Menu e fluxo: `src/scenes/MenuScene.js`, `src/scenes/CharacterSelectScene.js` (seletor de personagens), `src/scenes/GameOverScene.js`.
- Progressão roguelite: `src/scenes/OpponentSelectScene.js` e `src/scenes/ShopScene.js` — seleção de oponentes, loja entre partidas e checkpoints de pagamento na campanha.
- Dados de presets de personagem: `src/data/characters.js` (ex.: `TheSquire`, `TheAllRounder`).
- Tiers de inimigos: `BASIC`, `ADVANCED`, `BOSS`, `BOSS_FINAL` e `SPECIAL` já estão disponíveis em `ENEMY_TIERS`. Cada inimigo possui um campo `tier` para controlar futuramente em quais rodadas ele pode aparecer.

Principais mudanças implementadas
- Unificação de recurso: removido `coins/money` — agora existe apenas `score` (pontuação). O jogador começa com 0 pontos.
- Capturas: cada captura adiciona pontos a `score` usando o mapa de valores: P=1, N=3, B=3, R=5, Q=8, K=10. Capturar o rei concede a recompensa indicada no card do oponente.
- Opponent cards: em `OpponentSelectScene` cada card mostra `Recompensa: X pontos`, usando o valor definido no preset do inimigo.
- Inimigos possuem `tier` e `value`: `BASIC` vale 6, `ADVANCED` vale 8, `BOSS` vale 10, `BOSS_FINAL` vale 15 e `TheAllRounder` é um `SPECIAL` que vale 12.
- Buffs disponíveis em `src/data/buffs.js`: `Pawn's Game`, `Luck Move`, `Worth Challenger`, `Double Pawns`, `Double Jump`, `Ghost Bishops` e `Honorable Sacrifice`, usando hooks para modificar capturas, movimentos e ofertas da loja.
- Shop e pagamento: `ShopScene` usa `score` para compras e para pagar a taxa periódica (configurada por `paymentInterval`). Se o jogador não tiver pontos suficientes para pagar, é `GameOver`.
- Persistência: estado de progressão é salvo em `localStorage` sob a chave `checkito_state` com o formato { score, upgrades, round, playerCharacterId }.
- Final de campanha: a campanha tem no máximo 30 rodadas. Ao concluir a rodada 30, o jogador vence.
- Pagamentos: checkpoints acontecem nas rodadas 3, 6, 9, ..., 30, com custos configurados em `src/data/progression.js`: 20, 25, 30, 35, 40, 45, 50, 55, 60 e 80 pontos.

Como rodar (desenvolvimento)
1. Servir arquivos estáticos (Node):

```powershell
npx http-server -c-1 -p 8081
# ou, se preferir via npm script
npm run serve
```

2. Abrir http://127.0.0.1:8081 no navegador.

Testes rápidos sugeridos
- Iniciar jogo → escolher personagem → verificar que `Pontuação` começa em 0 em `OpponentSelect`.
- Jogar uma partida: capturar peças deve aumentar `Pontuação` pelos valores corretos (ex.: Cavalo = +3).
- Ao vencer (capturar o rei inimigo) ganhar a recompensa mostrada no card do oponente.
- Ir para a loja: comprar itens desconta pontos; se for rodada com pagamento obrigatório, pagar deduz pontos ou ocorrer `GameOver` se insuficiente.

Arquivos-chave
- `src/scenes/GameScene.js` — mecânica central do jogo, movimentos e cálculo de `score`.
- `src/scenes/ShopScene.js` — loja entre partidas; compras e pagamento agora usam `score`.
- `src/scenes/OpponentSelectScene.js` — seleção de oponentes e exibição de recompensa em pontos.
- `src/scenes/CharacterSelectScene.js` — seleção inicial do jogador.
- `src/data/characters.js` — presets de personagens (player/enemy).
- `src/data/characters.js` — enum `ENEMY_TIERS` e formações dos inimigos.
- `src/data/progression.js` — limite da campanha, intervalo e tabela de custos de pagamento.

Próximos passos (priorizados)
1. Corrigir a UI do `ShopScene` — tornar layout responsivo, melhorar exibição de itens, botões, e feedback de compra/pagamento.
2. Criar alguns aprimoramentos (upgrades) testáveis na loja:
	- `Bônus +10` — concede +10 pontos instantâneos (para testes).
	- `Buff Turno` — efeito temporário por 1 partida (ex.: aumenta valor de capturas do jogador em +1).
	- `Upgrade Permanente` — adiciona um upgrade persistente que modifica comportamento (ex.: +1 ponto por captura de peões).
3. Balanceamento: ajustar recompensa dos cards de oponente (ex.: `difficulty × baseKingValue`) e custos na loja.
4. Testes de fluxo completo: selecionar oponente → jogar → loja → pagar/recusar → persistência entre scenes.

Se quiser, eu posso: (A) corrigir a UI do `ShopScene` agora, ou (B) implementar os três aprimoramentos de teste listados. Qual prefere que eu faça primeiro?

Como rodar (desenvolvimento)
1. Servir arquivos estáticos (Node):

```bash
npx http-server -c-1 -p 8080
# ou, se preferir via npm script
npm run serve
```

2. Abrir http://localhost:8080 no navegador.

Sugestão de controle de versão
- Recomendo commitar as mudanças com Git antes de encerrar uma sessão:

```bash
git init
git add .
git commit -m "Save progress: session summary and character presets"
```

Arquivos-chave
- `src/scenes/GameScene.js` — mecânica central do jogo.
- `src/scenes/MenuScene.js` — tela inicial.
- `src/scenes/CharacterSelectScene.js` — seleção de personagem antes de iniciar.
- `src/data/characters.js` — presets de personagens (player/enemy).

Próximos passos e itens pendentes
- Testes e correções em movimentos (especialmente en-passant e checagem de xeque em cenários raros).
- Melhorar IA e adicionar shop/roguelite progression.
- Criar previews de personagem na seleção.

Relatórios e histórico
- Cada sessão de trabalho pode gerar um resumo datado em `docs/YYYY-MM-DD_SESSION_SUMMARY.md`.

