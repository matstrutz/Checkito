assets/
- Contém sprites, tilesets, sons e outros recursos usados pelo jogo.
- Estrutura atual (exemplo): `assets/16x32 pieces/` com sprites de peças.

Boas práticas
- Evite espaços em nomes de pasta (o projeto atualmente usa `16x32%20pieces` por compatibilidade), preferir `16x32-pieces`.
- Atualize os caminhos em `preload()` das cenas ao adicionar novos recursos.
