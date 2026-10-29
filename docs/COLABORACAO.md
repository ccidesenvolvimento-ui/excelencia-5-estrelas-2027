# Colaboração durante o desenvolvimento

Inicialmente os três integrantes programarão juntos nas chamadas. Mesmo trabalhando em grupo, cada mudança deve ser rastreada:

1. Registrar a alteração numa **Issue** do GitHub.
2. Criar branch `feat/issue-<numero>-descricao` a partir da `main`.
3. Commitar somente código sem senhas, sem RH0034 real e sem notas reais.
4. Abrir PR ligado à Issue, conferir migrações e testes.
5. Outro integrante revisa e aprova antes do merge.
6. Nunca alterar o banco de produção diretamente pelo SQL Editor sem registro versionado e aprovação.

Para a primeira etapa, trabalhar numa mesma tela/chamada e evitar alterações paralelas no mesmo arquivo.
