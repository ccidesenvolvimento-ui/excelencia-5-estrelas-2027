# API opcional de ajustes administrativos — Issue #61

## Entrega
Implementação Node-only de GET e POST em `src/server/api-ajustes-notas.ts`. Sem rota montada em `src/app` por padrão, preservando a exportação estática demonstrativa. O template de rota encontra-se em `src/server/templates/ajustes-notas-route.ts`.

### GET /api/ajustes-notas?competencia=2027-10-01&estrela=produtividade&offset=0
Exige sessão Supabase SSR validada via `auth.getUser()` e perfil administrador ativo via RPC `eh_administrador_ativo()`. Consulta `notas_mensais_efetivas` e histórico `ajustes_notas` sob o JWT do usuário e as políticas RLS de filial. Paginação limitada a 50 notas por chamada e até 200 eventos de histórico (recorte, não exportação integral).

### POST /api/ajustes-notas
Aceita apenas JSON `{ "notaId": "<uuid>", "novaNota": 90, "notaEsperada": 75, "justificativa": "Correção de divergência confirmada pelo setor de Produtividade." }`. Exige origem correspondente ao Host, sessão Supabase válida, administrador ativo, tamanho limitado e campos estritos. Executa somente RPC `registrar_ajuste_nota` do PR #58. A RPC verifica filial, Segurança e concorrência, preserva a nota original e cria histórico+auditoria transacional.

Erros previstos: 401 sem sessão, 403 sem autorização ou origem inválida, 409 nota concorrente, 422 dados inválidos/Segurança, 503 recurso desativado ou indisponível.

## Ativação restrita
A API **não é instalada automaticamente**. Para um build Node controlado futuro, após aplicar/revisar migrações, configuração de cookies e proxy de autenticação, copiar o template para `src/app/api/ajustes-notas/route.ts` **somente no ambiente de build**, montar o proxy Auth e usar as flags `EXCELENCIA_AJUSTES_API_ENABLED=true` e `EXCELENCIA_AUTH_GUARD_ENABLED=true`. Sem ambas retorna 503 (fail-closed). A integração de interface demo com esta API será uma fase separada com autorização e teste end-to-end antes de habilitar.

Nunca usar chaves de serviço no navegador. Não aplicar a migração nem habilitar a API no Vostro ou no Supabase Cloud apenas por este PR. Requer homologação dos controles de proxy/cookies, RLS e resposta de erros com teste HTTP em ambiente isolado.

## Dependências
PR #58 (SQL e RPC) e PR #60 (UI demonstrativa). O atual PR trata apenas o backend opt-in; o ranking não está integrado.
