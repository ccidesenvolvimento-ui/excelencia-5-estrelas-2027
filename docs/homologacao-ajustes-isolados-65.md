# Homologação isolada dos ajustes administrativos — Issue #65

## Estado e dependências
- PR #58: fundação PostgreSQL (migration não aplicada no Cloud).
- PR #60: interface demonstrativa.
- PR #62: API Node SSR autenticada, em branch paralela à do modal e não montada como rota pública.
- PR #64: modal aprovado visualmente, Actions #61 aprovado.
- Este PR: somente testes de contrato e preparação. Não integra sozinho as branches paralelas.

## Limites de segurança
- Não usar dados reais, URLs ou chaves do Supabase Cloud.
- Não modificar main, porta 3107, Docker oficial ou Cloudflare Access.
- Não habilitar flags de API/Auth no ambiente oficial.
- A página de ajustes no build estático permanece demo, sem gravação.
- Criar runtime Next.js Node separado, PostgreSQL descartável e autenticação de testes antes de ativar qualquer endpoint.
- Ranking e relatórios ainda precisam consumir notas efetivas explicitamente: a existência da view não basta.

## Matriz mínima de cenários E2E pendentes
| Cenário | Resultado esperado |
|---|---|
| API sem flags | 503; nenhuma consulta ou gravação |
| Não autenticado | 401 |
| Usuário comum ou admin inativo | 403 |
| Admin de filial autorizada | acesso limitado à filial |
| Admin de outra filial | não consultar nem modificar nota |
| Pilar Segurança | recusar ajuste |
| Justificativa fora de 15–1000 caracteres | 422 |
| Nota fora de 0–100 ou mais de duas casas | 422 |
| Nota modificada por outra sessão | 409, sem alteração |
| Ajuste válido | RPC auditada, original preservada, efetiva refletida |
| Auditoria e histórico | autor, justificativa, valores, histórico imutável |
| Reimportação de nota ajustada | bloquear até resolução explícita |
| Demo estática | nenhuma escrita nem dados reais |

## Próximas etapas
1. Executar npm run test:contratos-ajustes e CI da branch.
2. Combinar API do PR #62 com modal do PR #64 em nova branch de integração, sem merge em main.
3. Montar rota Node autenticada somente em ambiente descartável e com proteção fail-closed.
4. Validar GET/POST, RLS e auditoria com usuários e notas fictícios.
5. Validar fluxo UI → API → banco e propagação da nota efetiva no ranking e relatórios.
6. Exigir revisão e aprovação antes de qualquer migração, ativação ou deploy.

> O teste de contrato confirma invariantes de código; não substitui testes E2E nem prova a segurança em runtime.
## Integração de código — Issue #67
- A branch `feat/integracao-isolada-ajustes-67` incorpora o handler e template Node originalmente preparados no PR #62.
- O PR #68 é comparado contra `feat/modal-ajustes-notas-63` para permitir a CI do projeto; inclui os commits de contrato da Issue #65 e a API isolada.
- A rotina CI testa contratos da API, SQL/RLS em PostgreSQL descartável e compilação da rota Node somente no runner.
- Ainda **não** existe conexão de interface com a API, sessão de teste E2E HTTP ou recálculo do ranking com nota efetiva; isso depende de fase posterior.
