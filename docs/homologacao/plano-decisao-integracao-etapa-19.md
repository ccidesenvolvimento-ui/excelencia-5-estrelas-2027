# Etapa 19 — Plano de decisão de integração, sem autorização de merge

**Estado:** REVISÃO PENDENTE — NÃO EXECUTAR MERGE, DEPLOY NEM MIGRAÇÕES CLOUD.  
**Issue:** #113. **Candidata:** PR #112 (`integration/candidata-final-111` → `main`).  
**Referência:** 13/11/2026.

## 1. Inventário verificado

| Informação | Evidência |
| --- | --- |
| Diferença `main...integration/candidata-final-111` | 223 commits à frente, 0 atrás, 92 arquivos |
| Head de `main` na revisão | `28fc8ee519cb4a51ab000ba345dc953cce76ce33` |
| CI da candidata #112 | GitHub Actions #43465760265: `success` |
| CI do gate de liberação #110 | GitHub Actions #43451850149: `success` |
| PRs técnicos e de revisão | #102, #104, #105, #106, #108, #110 e #112: abertos como Draft |

Esses testes demonstram o comportamento verificado no CI, **não** abrangem homologação de dados reais ou autorização de produção.

## 2. Estratégia para evitar integração duplicada

A **única candidata de merge da pilha**, caso seja autorizada expressamente em outra decisão, é o **PR #112**. Ele já descende das correções de #104–#106 e incorpora o gate de #110. Não mesclar individualmente #102, #104, #105, #106, #108 ou #110 na `main` depois de mesclar #112: as mudanças já estarão contidas no histórico ou no conteúdo consolidado.

Nenhum PR deve ser convertido de Draft ou mesclado nesta etapa. Os PRs intermediários devem permanecer como registros de revisão até a decisão humana; eventual fechamento por redundância precisa ser deliberado e documentado **depois** de integração autorizada. Não realizar merge automático de branches dependentes.

## 3. Gate GO / NO-GO independente por tipo de decisão

| Decisão | Estado agora | Para liberar |
| --- | --- | --- |
| Integração de código na `main` | **NO-GO: autorização expressa ausente** | Revisão humana dos 92 arquivos, validação de ausência de mudanças na `main`, CI verde na revisão final, aprovação explícita |
| Implantação no servidor corporativo | **NO-GO** | Plano de mudança com janela, portas, recursos, backups e rollback aprovados; proteção Cloudflare/SSR/RLS verificada no destino |
| Migrações no Supabase Cloud | **NO-GO** | Revisão independente SQL e permissões, inventário do schema alvo, backup/restore, dry-run e autorização própria |
| Ranking ou premiação oficial | **NO-GO** | Homologação RH, admissão, situação, férias/categorias, advertências e acidentes fechados separadamente, escopo global comprovado |

A aprovação para integrar código não concede automaticamente nenhum dos outros três tipos de liberação.

## 4. Verificações obrigatórias imediatamente antes de um merge autorizado

1. Confirmar que o commit de `main` ainda corresponde ao verificado na revisão (SHA acima). Caso tenha mudado, refazer comparação e testes na candidata.
2. Inspecionar a diferença completa de **92 arquivos**, especialmente SQL `SECURITY DEFINER`, grants, RLS, Docker, build estático, autenticação e importações; obter revisão independente.
3. Confirmar Actions verde no **head exato** que seria integrado. Conferir que o CI executou PostgreSQL local, E2E Auth/PostgREST/RLS, gate, build GitHub Pages e regressão visual.
4. Garantir que `src/app/api/ranking-efetivo/route.ts` e `src/app/api/ajustes-notas/route.ts` não estejam versionados na exportação estática e que nenhum segredo ou dado corporativo esteja nos arquivos.
5. Revalidar que `docs/homologacao/gate-liberacao-etapa-17.md` continua indicando **NÃO LIBERADO PARA MERGE OU PRODUÇÃO** até assinatura humana e que bloqueios de RH/Segurança não sejam indevidamente removidos.
6. Pedir aprovação explícita e inequívoca para o **merge específico do PR #112**. Se recusada ou ausente, não executar merge e manter Draft.

## 5. Depois do merge, somente se aprovado e executado em outra etapa

Conferir diff e CI da `main`, registrar o SHA integrado, informar responsáveis e decidir como fechar/retargetar PRs ancestrais sem duplicar alterações. Não fazer deploy automaticamente. Plano de aplicação de migrations e de ativação de serviços devem ser separados do merge, com autorizações próprias.

## 6. Pendências externas que o CI não certifica

- **RH:** data de admissão, situação funcional, férias, histórico e vínculo no mês avaliado.
- **Segurança:** fechamento e qualidade das fontes **Advertências** e **Acidentes**; não inferir nota 100 na ausência de registros.
- **Cobertura:** permissão RLS por filial não prova universo completo para ranking global.
- **Infraestrutura:** não alterar porta 3107 nem Compose em servidor corporativo, Cloudflare Access ou Supabase Cloud sem aprovação.
- **Recuperação e operação:** backups restauráveis, permissões, monitoramento, rollback e plano de incidentes.

**Resultado desta etapa: plano documentado, sem merge ou alterações de ambientes.**
