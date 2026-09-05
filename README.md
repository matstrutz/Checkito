# Checkito

Roguelite inspirado em xadrez, desenvolvido com Phaser 3 e módulos ES para o navegador. O tabuleiro usa uma grade adaptada de 5 colunas por 6 linhas, com partidas curtas, progressão entre rodadas e augments permanentes.

## Como executar

Na raiz do projeto, instale ou tenha Node.js disponível e inicie um servidor estático:

```powershell
npm run serve
```

Depois abra `http://127.0.0.1:8080` no navegador. Também é possível usar `npx http-server -c-1 -p 8081` quando a porta padrão estiver ocupada.

## Fluxo do jogo

1. O jogador entra pelo menu e escolhe seu personagem.
2. Escolhe um oponente disponível para a rodada atual.
3. Joga uma partida no tabuleiro, capturando peças e acumulando `score`.
4. Ao vencer, passa pela loja para comprar augments e pagar checkpoints quando necessário.
5. Escolhe o próximo oponente e continua até completar a campanha ou perder.

## Progressão

- A campanha possui até 30 rodadas.
- O estado persistente usa `score`, `upgrades`, `round` e `playerCharacterId`.
- O estado é salvo em `localStorage` com a chave `checkito_state`.
- Pagamentos acontecem nas rodadas 3, 6, 9, ..., 30.
- Os custos dos pagamentos ficam em `src/data/progression.js`.
- A vitória ocorre ao concluir a rodada 30; a derrota ocorre ao perder uma partida ou não conseguir pagar um checkpoint.

## Pontuação

Capturas do jogador usam os valores base abaixo:

| Peça | Pontos |
| --- | ---: |
| Peão | 1 |
| Cavalo | 3 |
| Bispo | 3 |
| Torre | 5 |
| Dama | 8 |
| Rei | 10 ou a recompensa do oponente |

Augments podem modificar esses valores ou reagir a outros eventos do jogo.

## Augments

Os augments ficam definidos em `src/data/buffs.js`. Cada um possui ID, nome, descrição, ícone, raridade, preço e hooks opcionais. Os IDs são armazenados no estado persistente e resolvidos por `BUFFS_MAP`.

Hooks disponíveis:

- `onCapture` modifica o valor de uma captura.
- `onMove` pode manter o turno do jogador e limitar a peça do movimento extra.
- `onPathBlocked` permite ou impede atravessar uma peça durante o caminho.
- `onShopRarityWeights` altera os pesos de raridade das ofertas da loja.

Os augments comprados aparecem no painel lateral da loja. O hover sobre cada ícone mostra seu nome e descrição.

## Estrutura de pastas

- `src/` — código da aplicação.
- `src/scenes/` — cenas Phaser e fluxo de telas.
- `src/data/` — personagens, augments e regras de progressão.
- `assets/` — sprites e outros recursos carregados pelo jogo.

Cada pasta possui um README próprio com detalhes do seu contrato e das convenções locais.

## Arquivos principais

- `src/main.js` — inicialização do Phaser e registro das cenas.
- `src/scenes/GameScene.js` — tabuleiro, movimentos, turnos, IA, promoção e aplicação dos hooks.
- `src/scenes/ShopScene.js` — compras, pagamentos e visual dos augments adquiridos.
- `src/scenes/CharacterSelectScene.js` — seleção do personagem do jogador.
- `src/scenes/OpponentSelectScene.js` — seleção de oponentes por rodada e tier.
- `src/data/characters.js` — formações iniciais e valores dos personagens.
- `src/data/buffs.js` — catálogo e comportamento dos augments.
- `src/data/progression.js` — limite de campanha e custos de pagamento.

## Teste manual rápido

- Confirme que a pontuação inicial é exibida como 0.
- Verifique as posições e tipos das peças após escolher um personagem.
- Capture peças e confirme os valores de pontuação.
- Compre um augment e confirme que ele desaparece das ofertas e aparece no painel lateral.
- Passe o mouse sobre um augment adquirido e confirme o tooltip.
- Avance pelas rodadas e confirme o formato `Rodada: atual / 30`.
- Verifique o pagamento nos checkpoints e a vitória ao concluir a rodada 30.
