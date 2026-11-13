# Etapa 11 — Auditoria de integração da pilha de homologação (Issue #99)

**Estado:** inventário e plano de integração, sem merge. **Não equivale a liberação para produção.**  
**Data de referência:** 12/11/2026. **Base técnica:** `feat/contrato-rh-97` (PR #98).

## 1. Cadeia de dependências

Os PRs a seguir foram observados abertos como **Draft**. Sua aprovação no GitHub Actions é um sinal de teste na branch e **não** demonstra que tenham sido integrados à `main`:

| Ordem | PR | Branch da mudança | Branch base | Responsabilidade |
|---|---|---|---|---|
| Pré-requisito | #76 | `test/api-http-supabase-local-75` | `feat/integracao-isolada-ajustes-67` | E2E HTTP/Supabase local |
| Pré-requisito | #78 | `feat/modal-api-homologacao-77` | `feat/integracao-isolada-ajustes-67` | Modal e API de ajustes opt-in |
| 1 | #79 | `feat/motor-calculo-ranking-79` | `feat/modal-api-homologacao-77` | Motor puro de cálculo |
| 2 | #80 | `feat/leitura-efetiva-ranking-80` | `feat/motor-calculo-ranking-79` | Leitura autenticada e paginada RLS |
| 3 | #81 | `feat/previa-notas-efetivas-81` | `feat/leitura-efetiva-ranking-80` | Prévia Node não oficial |
| 4 | #86 | `feat/exportacao-previa-85` | `feat/previa-notas-efetivas-81` | PDF e XLSX não oficiais |
| 5 | #88 | `feat/diagnostico-prontidao-87` | `feat/exportacao-previa-85` | Diagnóstico de completude |
| 6 | #90 | `feat/ferias-historico-89` | `feat/diagnostico-prontidao-87` | Férias e histórico sob RLS |
| 7 | #92 | `feat/conciliacao-seguranca-91` | `feat/ferias-historico-89` | Penalizações vs. notas Segurança |
| 8 | #94 | `feat/matriz-bloqueios-93` | `feat/conciliacao-seguranca-91` | Bloqueios de homologação |
| 9 | #96 | `feat/sumario-homologacao-95` | `feat/matriz-bloqueios-93` | Sumário agregado sem dados individuais |
| 10 | #98 | `feat/contrato-rh-97` | `feat/sumario-homologacao-95` | Contrato puro de RH |

**Atenção:** #76 e #78 são ramos paralelos sob o mesmo ancestral, **não** há relação de base direta entre eles. O ancestral `feat/integracao-isolada-ajustes-67` precisa ser auditado antes de qualquer estratégia de integração. Não se deve presumir a existência de um PR #67: esse número é parte do nome de uma branch.

## 2. Limites que NÃO podem ser ultrapassados

1. **Deploy:** o build oficial GitHub Pages é estático (`output: export`). Não incluir rotas Next Node, sessão de homologação, segredos ou endpoints opt-in no artefato estático.
2. **Segurança:** a leitura de notas, RH, férias, categorias e penalizações exige autenticação Supabase SSR e RLS por filial; nunca substituir a sessão do usuário por `service_role`. O fato de uma filial ser visível não garante abrangência global.
3. **Ranking:** nenhum diagnóstico ou sumário aprova ranking global, colocações, Top 20 ou premiação. Os textos e campos `rankingOficial:false` e `situacao:BLOQUEADO` são deliberados.
4. **Segurança (pilar):** ausência de penalização não constitui fechamento das fontes Advertências e Acidentes nem concede nota 100. Nota zero não é ausência de dado.
5. **RH:** data de admissão, situação funcional e vínculo precisam de fonte auditada; contrato técnico sozinho não certifica dados corporativos. Férias e categorias históricas ainda exigem validação de regras de negócio.
6. **Isolamento:** CI usa Supabase e PostgreSQL locais descartáveis, sem Supabase Cloud, sem servidor corporativo e sem tocar na porta 3107.

## 3. Plano de integração recomendado para aprovação humana

1. Congelar a pilha de PRs como está; confirmar `main`, ancestral `feat/integracao-isolada-ajustes-67`, dependências e diferenças reais entre branches. Verificar separadamente #76 e #78.
2. Executar verificações por branch e, sobretudo, em uma **branch candidata de integração** baseada na `main` atual; não assumir que CI verde de PR empilhado garante sucesso contra `main`.
3. Revisar mudanças por arquivo, migrations, efeitos de build e escopo de autenticação. Rever guardrails de acesso RLS e proteger segredos.
4. Validar que GitHub Pages permanece funcional e que recursos Node ficam indisponíveis no deploy oficial. Confirmar a ausência de dados reais nos fixtures, logs e artefatos.
5. Revisar a estratégia de merge com responsável técnico e supervisor. Fazer merge **somente após autorização explícita** e nova execução de CI na branch candidata.
6. Realizar homologação real e documental de RH, fechamento das duas fontes de Segurança e escopo global **em outra entrega** antes de qualquer ranking oficial.

## 4. Verificações automáticas

`npm run test:integracao-guardrails` valida invariantes da branch contra regressões óbvias: ausência de rotas Node opt-in persistidas em `src/app`, configurações de exportação estática, flags de homologação, e proibição de colocação oficial na prévia.

**Limitação:** esses testes são análise estática de código-fonte, não auditoria de segurança completa. Não substituem revisão manual, auditoria de dependências, RLS no banco, validação de artefatos ou teste de integração sobre `main`.

## 5. Situação

- **Implementação da Etapa 11:** revisão e registro da pilha, com testes de proteção.
- **Produção:** não alterada.
- **Merge:** não autorizado e não realizado.
- **Liberação do ranking oficial:** bloqueada até comprovações de RH, fontes de Segurança e abrangência global.
