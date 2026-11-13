# Homologação local 2026 — Programa Excelência 5 Estrelas

## Objetivo e restrições

Utilizar o servidor físico do setor somente para **homologação com dados fictícios** em 2026, preparando migração para PostgreSQL gerenciado pelo Supabase em 2027. O projeto atual ainda **não possui login ou APIs corporativas seguras**, nem importação real; esta infraestrutura não os implementa. A publicação estática de demonstração no GitHub Pages permanece intacta.

Issue de planejamento: #39. Este PR cria apenas artefatos versionados; não implanta, não altera contêineres existentes e não cria usuários ou dados.

## Infraestrutura analisada em 03/11/2026 — revalidar ANTES de executar

- Ubuntu 26.04.1 LTS; Docker 29.8.0 + Compose.
- ~7,1 GiB RAM, ~4,2 GiB disponíveis na medição; ~32 GB de disco livre; ~29 contêineres existentes.
- PostgreSQL 16 e 17 existentes, Nginx e Cloudflare Tunnel. **Não reutilizar bancos, portas, volumes ou redes existentes sem autorização.**
- Verificar estado de serviços existentes, especialmente RideCheck/happy_allen, anteriormente com CPU elevada e estado unhealthy.

Solicitar à pessoa responsável pelo servidor uma nova fotografia dos recursos, sem publicar endereços privados, tokens ou informações sensíveis em Issues:

```bash
uname -a
docker version
docker compose version
free -h
df -h
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker stats --no-stream
ss -lnt
```

O arquivo `compose.homologacao.yml` reserva no máximo 768 MiB para a aplicação e 512 MiB para um PostgreSQL exclusivo, **sem garantia de desempenho sob carga**. Banco e aplicação usam uma rede Compose própria; o banco não publica portas no host. A web publica apenas no loopback `127.0.0.1`, uma porta WEB_PORT de escolha explícita; nunca presumir que a porta corporativa 3107 está disponível. Não mapear a interface a `0.0.0.0` para testes administrativos sem autenticação.

## Pré-requisitos

- Autorização da administração do servidor e janela de implantação.
- Confirmação de espaço e CPU livres, além de estratégia de backup.
- Git, Docker Engine com Compose e acesso ao repositório privado em uma máquina autorizada.
- Nenhuma planilha RH0034 real, segredos corporativos ou credenciais reais no protótipo.

## Preparar localmente (somente após aprovação da infraestrutura)

```bash
git clone <URL_PRIVADA_AUTORIZADA_DO_REPOSITORIO>
cd excelencia-5-estrelas-2027
cp .env.homologacao.example .env.homologacao
# Escolher WEB_PORT livre e autorizada (exemplo 3117); NUNCA reutilizar 3107 sem aprovação.
# Substituir DB_PASSWORD por senha longa aleatória; restringir leitura: chmod 600 .env.homologacao
docker compose --env-file .env.homologacao -f compose.homologacao.yml config
docker compose --env-file .env.homologacao -f compose.homologacao.yml up -d --build
curl -I http://127.0.0.1:3117/ # Ajustar para a WEB_PORT aprovada
```

Antes de executar, conferir com `ss -lnt` que a porta WEB_PORT escolhida está livre. Se WEB_PORT estiver ausente, o Compose deve falhar antes de iniciar serviços. Os exemplos de CI usam 3107 apenas em runner descartável, nunca no servidor da empresa.

O arquivo `.env.homologacao` **não pode ser commitado**, enviado ao chat ou anexado a uma Issue. É necessário validar backup, permissões e resolução de imagens no ambiente interno. Para parar:

```bash
docker compose --env-file .env.homologacao -f compose.homologacao.yml down
```

**Nunca usar `down -v`** sem plano explícito: removeria o volume do banco.

## O que esta entrega NÃO faz

- Não conecta a aplicação ao banco: a criação da camada de dados, migrations e autorização será feita em PRs posteriores.
- Não instala Supabase local ou altera os bancos existentes.
- Não ativa autenticação, proteção de API, importações ou persistência.
- Não configura Cloudflare Tunnel, Nginx, DNS, HTTPS ou abertura para outros computadores. **Portal sem login requer desenho de acesso limitado e proteção contra enumeração.**
- Não se destina à produção. A aplicação atual continua mostrando dados demonstrativos.

## Plano 2026 → 2027

1. Inventário e autorização do servidor, testes isolados do Compose.
2. Modelagem PostgreSQL versionada, migrations e testes; avaliar adequação das migrações já existentes em `supabase/migrations`.
3. Implementar autenticação, autorização por filial e APIs privadas antes de importar dados.
4. Implementar RH0034 como fonte oficial de cadastro, validação integral das planilhas, pendências, avaliações e auditoria; começar com dados fictícios.
5. Garantir backups restauráveis, logs, monitoramento e testes de falha antes de homologar.
6. Em 2027, migrar **schema e dados autorizados** ao Supabase PostgreSQL, testar RLS, autenticação e acessos e planejar reversão. Hospedagem do Next.js é uma decisão separada.

## Critérios para promover esta primeira entrega

- Revisão do Dockerfile/Compose por responsável do servidor;
- `docker compose config` válido;
- Build de Next.js no modo servidor passa e smoke test do loopback funciona;
- Testes atuais `npm run typecheck` e `npm run test:rules` preservados;
- Nenhuma porta do banco exposta, nenhuma senha no repositório e nenhuma alteração nos sistemas existentes.

**Risco conhecido:** o repositório não tem `package-lock.json` versionado no momento desta preparação. O build usa `npm install`, portanto as versões transitivas não ficam integralmente travadas. Adicionar lockfile revisado em PR subsequente antes de homologação duradoura.
