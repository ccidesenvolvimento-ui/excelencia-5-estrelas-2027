# Ajuste Administrativo de Notas — Issue #57

## Escopo implementado nesta etapa
Fundação SQL e testes para correções por administradores ativos **da filial autorizada**, preservando `notas_mensais.nota` sem modificação. A implantação remota e a interface de usuário **não fazem parte deste PR**.

### Modelo
- `notas_mensais`: mantém nota importada, origem e importação de referência.
- `ajustes_notas`: histórico imutável dos ajustes, com nota efetiva anterior, nova nota, administrador, justificativa e data, sempre vinculado à nota original.
- `auditoria`: registro transacional de cada correção, com valores anterior e posterior.
- `notas_mensais_efetivas`: view `security_invoker=true` que apresenta `nota` original, `nota_efetiva` e `possui_ajuste`. Respeita a RLS de notas e do histórico.
- `registrar_ajuste_nota(id, nova, esperada, justificativa)`: função RPC autenticada. Exige administrador ativo e autorização de leitura da filial; bloqueia concorrência com `FOR UPDATE` e compara a nota efetiva esperada; ajusta somente a camada de histórico, nunca o valor de origem.

### Exemplo fictício
Nota de Produtividade em outubro de 2027: **75,00 → 90,00**, justificativa: `Correção de divergência confirmada pelo setor de Produtividade.`.
A nota importada permanece 75,00. A view efetiva retorna 90,00. Uma correção posterior usa 90,00 como nota anterior e registra novo evento.

### Segurança
- Sem acesso para usuário comum, admin inativo, admin sem vínculo com a filial e pessoa não autenticada.
- Justificativa entre 15 e 1000 caracteres, não vazia; nota entre 0 e 100 com até duas casas decimais; valor deve diferir da nota efetiva.
- Nota de **Segurança** não pode receber ajuste manual, incluindo 0→100. Revisões devem corrigir dados e processos de advertência/acidente na origem mediante fluxo próprio e auditado. Isso impede que a nota 0 decorrente de penalização seja simplesmente removida.
- Reimportação que tente `UPDATE` ou `DELETE` de nota já ajustada é bloqueada por trigger, inclusive em operações com `ON CONFLICT DO UPDATE`, até resolução explícita futura. Reimportações precisam analisar os conflitos em etapa de pré-visualização, ao invés de descartar o ajuste.
- Histórico de ajustes impede `UPDATE` e `DELETE` por trigger; papéis anônimos/autenticados não recebem INSERT/UPDATE/DELETE diretos.
- Migração é de criação, executa em transação e não altera registros existentes.
- Sem uso de `service_role` no navegador, sem SQL aplicado à instância Cloud, sem alteração no Vostro.

### Limitações e próximas entregas
1. **Interface administrativa e endpoint seguro**: criar tela de pesquisa, formulário de justificativa, confirmação e histórico, usando a sessão Auth; ainda não implementados.
2. **Ranking/relatórios**: atualmente utilizam dados demonstrativos; a view está pronta para futura integração. Não afirmar que rankings agora consumam a nota efetiva.
3. **Fluxo de importação**: ainda não implementado contra Supabase Cloud. O trigger bloqueia substituição/exclusão; o frontend de importação deverá identificar conflitos e solicitar decisão administrativa, sem bypass do trigger nem edição do histórico.
4. **Reversão**: uma correção equivocada deve gerar um **novo ajuste de compensação** com nova justificativa, nunca apagar o anterior.
5. **Privacidade**: decisões sobre quais gestores verão justificativas e nomes dos administradores precisam ser validadas antes da publicação. O histórico ora exposto por RLS aos usuários que já leem a nota é uma proposta técnica sujeita à revisão.

## Validação
Testes CI `db/homologacao/41_testar_ajustes_notas.sql` executam exclusivamente em banco PostgreSQL descartável, com dados fictícios e `ROLLBACK`. Cobrem 75→90, preservação da origem, visão efetiva, auditoria, valores e justificativas inválidos, Segurança, administrador de outra filial, usuário comum, admin inativo, sessão ausente, tentativa de overwrite por reimportação, exclusão e mutação do histórico.

## Não fazer
- Não aplicar esta migração ao Supabase Cloud até revisão técnica, execução bem sucedida do CI e aprovação explícita.
- Não conceder permissões genéricas de UPDATE/DELETE em `notas_mensais`, `ajustes_notas` ou `auditoria`.
- Não divulgar dados reais nem credenciais durante os testes.
