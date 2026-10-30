# Excelência 5 Estrelas — Interface v0.9

## Decisões aprovadas

- **Central de Pendências**: visual azul-marinho com painel de filtros, tabela, etiquetas por pilar, ordenação, paginação, pesquisa, detalhes e exportação CSV.
- **Tipos de pendência** (somente): Segurança, Produtividade, Dirigibilidade, Jornada e Treinamentos. A opção geral "Todas as pendências" permanece.
- Todos os cinco pilares são mostrados como ausentes quando um colaborador não tem qualquer nota. **Nota zero não é pendência**, e não aparece na Central por esse motivo.
- Os filtros por competência, categoria, filial, tipo e nome/matrícula são combinados com lógica **E**. Um colaborador aparece apenas uma vez na tabela, mesmo quando faltam diversas notas.
- **Dirigibilidade**: a fonte a conferir é determinada pela configuração de cada **filial**, e não por uma opção do menu de pendências.
- **Configurações → Regras e ciclos → Fonte da Dirigibilidade**: selects por filial com IDT, Gobrax e Maxtrack. As alterações ficam no `localStorage` até existir backend autenticado.
- **Cadastro RH0034**: nesta fase a amostra e a interface só apresentam motoristas e operadores participantes do programa; futuros importadores devem admitir apenas funções aprovadas antes de criar perfis.
- **Ranking, geração de PDFs e CSVs de ranking**: nenhum arquivo modificado nesta atualização, preservando a implementação mais recente da equipe.

## Segurança e limites

Esta é uma demonstração pública com pessoas fictícias. Os mapeamentos iniciais de filiais são puramente ilustrativos e não comprovam os sistemas reais adotados pela empresa.
Na versão integrada, configurações por filial deverão residir no banco com controle de permissões, histórico, data de vigência e registro do responsável. A importação de Dirigibilidade deverá validar o campo `TIPO DE DADO` em relação à configuração aplicável à competência e à filial. Mudanças futuras não devem alterar retroativamente avaliações fechadas.
O RH0034 definitivo deverá filtrar funções autorizadas **antes** de cadastrar o colaborador. Nenhuma planilha real pode ser enviada para o site público atual.

## Testes

- `npm run test:pendencias`: opções de filtro, agrupamento dos cinco pilares, combinações, mapeamento por filial e regressão de Top 20.
- `npm run test:rules`: testes do programa + testes da interface existente + cenários da v0.9.
- `npm run typecheck` e `npm run build`: conferir no GitHub Actions antes do merge (não executados integralmente na elaboração do pacote).

## Compatibilidade

O arquivo de relatórios `src/lib/relatorio-ranking-pdf.ts` **não** é incluído no pacote; o gerador atual permanece inalterado. O workflow existente do GitHub Pages continua realizando a publicação após o merge.
