# Gate de liberação — candidata de homologação 2027

**Decisão atual: NÃO LIBERADO PARA MERGE OU PRODUÇÃO.**

Escopo: PR Draft #108, branch `integration/candidata-revisada-107`, com as correções pré-merge dos PRs #104, #105 e #106. Referência: Issue #109.

## Evidência técnica já obtida

| Comprovação | Situação | Limitação |
| --- | --- | --- |
| Actions do PR #108, run #43448777792 | PASSOU | Verificações executadas no runner, não no servidor corporativo |
| TypeScript, testes de regras e build estático GitHub Pages | PASSOU | Não garante deploy ou segurança da infraestrutura real |
| Testes SQL de autorizações e gatilhos | PASSOU | PostgreSQL/Supabase locais descartáveis, não Supabase Cloud |
| E2E HTTP Auth/PostgREST/RLS com fixtures fictícias | PASSOU | Autorização apenas nos casos testados |
| Regressões visuais | PASSOU | Não equivalem à aceitação operacional da empresa |

O status `success` não implica aprovação de dados reais, premiação, homologação RH, fechamento de Segurança nem autorização de merge.

## Pendências obrigatórias, mantidas abertas

- [ ] **Revisão humana da diferença integral contra `main`** e autorização explícita para integrar; PR #108 permanece Draft
- [ ] **SQL/RLS:** revisão independente dos grants, funções `SECURITY DEFINER`, política de filial e isolamento de perfis, com plano aprovado para migração
- [ ] **Banco Cloud:** confirmar esquema e divergências do projeto alvo, executar dry-run autorizado e planejar rollback/backup antes de qualquer aplicação; nenhuma migração desta pilha foi executada no Cloud por este trabalho
- [ ] **Servidor:** validar recursos, serviço na porta corporativa 3107, segregação de Compose, portas, redes, volumes e secrets antes de qualquer implantação
- [ ] **Deploy:** manter GitHub Pages como demo estática, sem rotas Node de homologação persistidas; habilitação Node somente depois de revisão do runtime, HTTPS, sessão SSR, autorização e logs
- [ ] **RH:** homologar origem, data de admissão, situação funcional, vínculos e regras de férias e histórico de categorias, inclusive casos temporais
- [ ] **Segurança:** comprovar separadamente o fechamento das fontes de **advertências** e **acidentes**; ausência de penalização não concede 100 automaticamente
- [ ] **Abrangência:** comprovar universo global de colaboradores, filiais e competências; RLS de filiais autorizadas não constitui classificação da empresa inteira
- [ ] **Operação e recuperação:** testar backup, restauração, auditoria, rollback, monitoramento e plano de incidentes com responsáveis
- [ ] **Aceite funcional:** supervisor validar regras e evidências em homologação sem dados sensíveis nas Issues

## Proibições enquanto o gate permanecer bloqueado

1. Não mesclar na `main`, não marcar PR Draft como pronto para merge e não fazer deploy em produção.
2. Não aplicar migrations em Supabase Cloud, não modificar servidor corporativo e não usar dados reais nesta candidata.
3. Não gerar posições oficiais, premiações ou Top 20 a partir de prévias com RLS parcial.
4. Não converter a ausência de penalizações em Segurança 100 nem interpretar contrato de RH como homologação da fonte.

## Caminho de decisão posterior

Os responsáveis por segurança, infraestrutura e regra de negócio devem revisar as evidências, apontar pendências e autorizar explicitamente as ações cabíveis. Este documento é registro de **bloqueio** e não uma autorização implícita. A futura aprovação exigirá outra decisão documentada, verificações sobre a revisão final da candidata e plano de implantação separado.
