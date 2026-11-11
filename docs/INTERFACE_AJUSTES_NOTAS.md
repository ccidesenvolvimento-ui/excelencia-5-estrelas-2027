# Interface de Ajustes de Notas — Issue #59

Esta etapa implementa somente a interface de demonstração com dados fictícios, como continuação do PR #58.

## Disponível na tela
- Rota `/ajustes-notas` pelo menu lateral.
- Pesquisa por nome/matrícula e filtros de filial, competência e pilar.
- Nota original e efetiva para consulta demonstrativa.
- Conferência de valor novo 0–100, duas casas decimais, justificativa de 15–1000 caracteres e prévia de confirmação.
- Pilar Segurança somente leitura; explicações sobre reimportações, histórico e auditoria.
- Responsividade em desktop, tablet e celular.

## Restrições essenciais
**O botão final da interface não salva notas.** Nenhuma requisição a Supabase é realizada nesta página. Todos os nomes e resultados são fictícios. O histórico é um exemplo explicativo, e não consulta o banco.

Na fase seguinte, integrar a UI a uma rota autenticada server-side (com autorização e conferência de filial), ligada à RPC `registrar_ajuste_nota` e à view `notas_mensais_efetivas` do PR #58. Não expor chaves privilegiadas; revalidar tudo no banco. A resolução de conflitos de reimportação exige fluxo próprio.

## Teste
A regressão visual `scripts/testar-fundacao-admin-browser.cjs` cobre desktop/tablet/celular, filtros, modal de conferência e bloqueio de Segurança. O workflow foi atualizado para aceitar base `feat/**`, pois este PR está empilhado sobre `feat/ajuste-administrativo-notas-57`.

Sem deploy no Vostro, sem banco Cloud, sem merge, sem dados reais.
