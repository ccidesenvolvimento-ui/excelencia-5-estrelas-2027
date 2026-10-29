# Programa Excelência 5 Estrelas 2027

Fundação técnica **v0.1** para o sistema aprovado da Expresso Nepomuceno. Interface em português com a identidade do programa e download real dos seis modelos Excel.

**Escopo entregue**: projeto Next.js/TypeScript, estrutura inicial do Supabase, migração SQL com oito categorias, documentação e página `/importacoes` com seis links funcionais.

**Ainda não implementado**: login, importação de arquivos para o banco, classificação automática RH0034, pontuação/rankings, relatórios e permissões operacionais. Não usar com dados reais nesta etapa.

## Requisitos

- Node.js 22 LTS ou versão suportada pelo Next.js 16;
- pnpm (ou npm adaptando os comandos);
- Docker Desktop/compatível para executar Supabase local, se desejado.

## Como executar no Windows (PowerShell)

```powershell
corepack enable
pnpm install
pnpm dev
```

Acesse http://localhost:3000 e depois http://localhost:3000/importacoes.

A rota de downloads funciona **sem configurar o Supabase**. Confira os seis arquivos presentes em `public/modelos/`.

## Configurar o Supabase em desenvolvimento

1. Crie um projeto de **desenvolvimento** no Supabase. Não use produção nesse primeiro teste.
2. Copie `.env.example` para `.env.local` e preencha a URL e chave PUBLICÁVEL; nunca compartilhe segredos.
3. Instale/execute Docker e rode `pnpm exec supabase start` para testar o banco local (a migração já está em `supabase/migrations/`).
4. Rode `pnpm exec supabase db reset` **somente em banco local de testes**, pois reseta os dados locais.
5. NÃO execute a migração diretamente no banco de produção antes da revisão da equipe.

O aplicativo ainda não consulta o banco: o primeiro teste é verificar que o banco local aceita a migração e que os modelos são baixados no navegador.

## Estrutura

```text
src/app/                 Páginas Next.js (início, importações)
src/components/          Componentes compartilhados
src/lib/                 Catálogo dos seis modelos
public/modelos/          Modelos XLSX baixáveis
supabase/migrations/     Banco e regras estruturais versionadas
docs/                    Regras, arquitetura e colaboração
```

## Próxima Issue sugerida

**Implementar pré-validação de importação RH0034**: ler coligada, matrícula, nome, filial, seção, função, férias e situação; fazer comparação sem gravação; mostrar inclusões/atualizações, ambiguidades, classificações pendentes e exclusão automática de empilhadeiras. Só depois habilitar a confirmação transacional.

## Segurança

Nunca commitar planilhas RH reais ou relatórios de penalizações. Trabalhar com dados fictícios. A migração cria tabelas com RLS habilitado, sem políticas gerais de leitura/escrita de colaboradores; é intencional até a implementação da autenticação e dos escopos de filial.
