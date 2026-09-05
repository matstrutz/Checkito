# `assets`

Contém sprites, tilesets, sons e outros recursos carregados pelo Phaser.

## Estrutura atual

- `16x32 pieces/` — sprites das peças brancas e pretas, carregados por `GameScene.preload()`.

## Convenções de carregamento

Os caminhos usados em `preload()` são relativos à página que carrega o jogo. Ao adicionar um recurso:

- mantenha o nome do arquivo e a chave Phaser documentados na cena que o carrega;
- atualize o caminho em `preload()` antes de usá-lo em `create()` ou durante o jogo;
- prefira nomes de arquivos sem espaços em novos recursos. A pasta existente usa `%20` no caminho por compatibilidade.

Recursos visuais podem ser associados a personagens ou augments futuramente sem alterar seus IDs de gameplay.
