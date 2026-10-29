# Interface v0.6 — Consolidação das páginas

Documento de design e comportamento. **Apenas demonstração estática com dados fictícios.**

## Menu principal (sete itens)

1. Visão Geral `/`
2. Ranking `/ranking` — inclui geração de relatórios
3. Pendências `/pendencias`
4. Importações `/importacoes`
5. Cadastro RH0034 `/rh0034`
6. Configurações `/configuracoes` — inclui usuários e acessos
7. Testes e erros `/diagnostico`

As rotas legadas continuam existindo apenas como encaminhamento para preservar favoritos, sem aparecer na navegação.

## Padrão visual

A paleta, os gradientes, a tipografia, os indicadores, botões, formulários e tabelas seguem a linguagem da Visão Geral v0.3. O menu mantém as preferências da v0.5 (flutuante por padrão, fixo mediante botão superior), com rolagem discreta, incluindo versão móvel.

## Ranking + relatórios

- Mesmos filtros para tabela e relatório: período, competência, segmento, filial, pesquisa por nome/matrícula e ordenação.
- Ranking exibe elegíveis e inelegíveis; pendentes permanecem exclusivamente na Central de Pendências.
- Relatório inclui **somente elegíveis** com posição oficial **menor ou igual ao Top N** e respeita os filtros visíveis.
- Ordenação inversa modifica a ordem exibida, **não** a posição original.
- Preview em modal com campo Top N, CSV e impressão/salvar PDF pelo navegador.
- Excel `.xlsx` e geração automática PDF no backend: **não implementados**. CSV pode ser aberto pelo Excel.

## Configurações + usuários

- Três abas: Regras e ciclos; Usuários e acessos; Segurança e auditoria.
- Usuários e acessos oferecem simulação de perfis, seleção de filiais e matriz de permissões por área/operação. As mudanças são salvas apenas no `localStorage` deste navegador, **não** criam contas, convites nem autenticação real.
- Três perfis administrativos fictícios têm permissões globais fixas no protótipo.
- Segurança exige autenticação, RLS, backend, logs imutáveis e verificação da autorização nas exportações antes de qualquer dado real.

## Demais páginas

- Pendências: mesmos elementos visuais e filtros; CSV mantém os filtros aplicados.
- Importações: seis modelos XLSX mantidos, pré-verificação meramente local.
- RH0034: lista/indicadores fictícios; categorização salva localmente, sem alterar ranking.
- Diagnóstico: testes e abertura de Issues existentes, atualização dos nomes das áreas.

## Verificações

- `npm run test:rules`: testes de regras da base fictícia.
- `npm run test:ui`: testes estáticos da integração v0.6.
- `npm run typecheck` e `npm run build`: obrigatórios no Codespaces/GitHub Actions antes de integrar a branch à `main`.

A versão pública no GitHub Pages não deve receber planilhas corporativas, dados pessoais reais ou credenciais.
