# Autorizações de importação por setor — Issue #55

## Regra de negócio corrigida

- **Administradores** (usuário e colegas administradores): importam **somente a planilha de motoristas RH0034**, além de futuras operações administrativas que exigirão autorização própria.
- **Responsáveis setoriais**: um ou dois designados de cada setor importam **somente as planilhas que alimentam as notas sob sua responsabilidade**.
- **Usuários de consulta/gestores**: não importam arquivos.
- A condição `administrador=true` NÃO concede, por si só, acesso para importar avaliações. A matriz foi separada por tipo.

| Tipo no banco | Quem poderá importar | Permissão específica |
|---|---|---|
| `rh0034` | Administradores ativos | `perfis.administrador=true` |
| `advertencias` | Responsável autorizado por Segurança | `importar:advertencias` |
| `acidentes` | Responsável autorizado por Segurança | `importar:acidentes` |
| `produtividade` | Responsável autorizado por Produtividade | `importar:produtividade` |
| `dirigibilidade` | Responsável autorizado por Dirigibilidade | `importar:dirigibilidade` |
| `jornada` | Responsável autorizado por Jornada | `importar:jornada` |
| `treinamentos` | Responsável autorizado por Treinamentos | `importar:treinamentos` |

Uma pessoa pode receber mais de uma permissão setorial **somente se designada expressamente**. A quantidade de um ou dois responsáveis por setor será controlada no cadastro administrativo posteriormente (não é aplicada automaticamente nesta migração).

## Implementação deste PR

`public.eh_administrador_ativo()` verifica `auth.uid()`, `perfis.ativo` e `perfis.administrador`.

`public.pode_importar_tipo(p_tipo text)` exige administrador ativo para `rh0034`. Para os tipos de avaliação, exige perfil ativo **não administrador** e a permissão explícita `importar:<tipo>` na tabela `permissoes_usuario`. Nenhum argumento de ID do usuário ou filial é confiado ao cliente.

As funções são `SECURITY DEFINER`, `search_path=''`, e retiram `EXECUTE` de `PUBLIC` e `anon`. A função fornece uma verificação de autorização, **não concede acesso direto às tabelas**, não cria upload e não altera RLS existente.

**Atenção:** a autorização por tipo não determina, sozinha, o escopo de filiais ou a validade do arquivo. Endpoints futuros devem validar filial, origem, competência, estrutura, limites de tamanho, idempotência, staging, confirmação e auditoria antes de gravar dados.

Nenhum usuário está sendo promovido a administrador, e as contas de teste existentes continuam como usuários comuns.

## Testes CI

PostgreSQL descartável com cinco identidades fictícias: administrador ativo, responsável de Segurança, administrador inativo, usuário de consulta e responsável inativo, além de sessão ausente. Os testes verificam permissão somente ao RH0034 para administrador, advertências/acidentes apenas para responsável setorial autorizado, negação dos outros tipos, e ausência de gravação direta na API.

## Segurança operacional

Migração ainda não aplicada ao Supabase Cloud. PR permanece Draft; nada foi feito no Vostro, Cloudflare, contêineres ou banco remoto. Requer revisão/CI e aprovação antes de `db push --remote`.

Para operações administrativas reais, exigir MFA e endpoints server-side auditados; não expor `service_role` nem `sb_secret_` no navegador. Administradores não recebem bypass automático do isolamento de leitura por filial.
