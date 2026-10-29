# Programa Excelência 5 Estrelas 2027

**Versão 0.2 — demonstração navegável para testes.** Projeto Next.js 16 / React 19 / TypeScript, visualização de regras com dados inteiramente **fictícios**.

## O que funciona nesta versão

- Página inicial e menu responsivo com todos os módulos previstos.
- Dashboard ilustrativo, ranking mensal / ciclos / anual por oito categorias, filtro de filial e ordenação.
- Cálculo ilustrativo com cinco estrelas e regra de inelegibilidade por zero, pendência sem nota e posições por categoria.
- Prévia de Central de Pendências, exportação **CSV** de dados fictícios.
- Download dos seis modelos oficiais XLSX em **Importações**. Verificação local de nome/extensão/tamanho (não lê nem importa as linhas do Excel).
- RH0034 fictícia e simulação de classificação local (`localStorage`), sem afetar a base de notas ou persistir no servidor.
- Relatório demonstrativo com Top N, exportação CSV e impressão/salvar PDF pelo navegador.
- Telas de permissões (somente desenho), configurações e testes básicos da lógica + relato de erros baixável ou abertura de Issue no GitHub.
- Compilação para **GitHub Pages** com workflow `.github/workflows/github-pages.yml`.
- Migração **inicial, ainda não aplicada**, de Supabase/PostgreSQL com RLS fechado por padrão.

## O que NÃO funciona (não utilizar dados reais)

- Importação/leitura/validação completa de Excel e RH0034.
- Login, usuários reais, acesso por filial, controle de segurança/RLS do aplicativo.
- Gravação de notas, auditoria, fechamento de ciclos, estimativa de férias ou geração oficial de relatórios.
- Operação financeira/corporativa de qualquer tipo. **Esta é somente uma maquete de testes.**

A migração contém uma base de tabelas que precisa passar por revisão de nomenclatura de estrelas dos operadores, criação de políticas RLS e testes antes de qualquer ligação a dados reais. Não publicar segredos, arquivos RH0034 reais ou dados de colaboradores.

## Desenvolvimento no Codespaces

```bash
npm install
npm run dev
```

Abra a porta 3000. Para conferir tipos:

```bash
npm run typecheck
```

## Publicação no GitHub Pages

1. Envie os arquivos do projeto para a **raiz** do repositório `ccidesenvolvimento-ui/excelencia-5-estrelas-2027` (com pastas `src`, `.github` e `public`).
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**, **não** `Deploy from a branch`.
3. No GitHub, abra **Actions → Publicar demonstração no GitHub Pages → Run workflow** ou faça um push na `main`.
4. Confirme que os jobs `build` e `deploy` passaram; a URL **depois da publicação** será semelhante a `https://ccidesenvolvimento-ui.github.io/excelencia-5-estrelas-2027/`.
5. Toda mudança posterior na `main` dispara nova publicação automaticamente. Em branches/PRs, não publicar alterações sem revisão.

O `next.config.ts` ativa `output: "export"` e `basePath` apenas quando `NEXT_PUBLIC_DEPLOY_TARGET=github-pages`. O workflow define automaticamente esta variável e `NEXT_PUBLIC_BASE_PATH=/excelencia-5-estrelas-2027`. **Não** usar API routes, middleware ou autenticação de servidor nessa implantação estática.

### Domínio próprio

O GitHub Pages aceita domínio próprio, com ajustes DNS em **Settings → Pages → Custom domain**, incluindo verificação de domínio e HTTPS. Se o objetivo for um **sistema de produção com autenticação e lógica de servidor**, migrar o deployment para infraestrutura compatível com Next.js (p. ex., Vercel com plano adequado à organização) ou manter operações no Supabase com Edge Functions e RLS aprovado; GitHub Pages pode continuar servindo uma apresentação/demonstração.

## Colaboração e segurança

- Registrar mudança como **GitHub Issue**, desenvolver em branch `feat/*` ou `fix/*`, abrir **Pull Request**, revisar e só então juntar à `main`.
- Não habilitar entradas de dados reais nem conectar Supabase em site público até autenticação, políticas RLS, autorização por filial e segurança dos arquivos estarem verificadas.
- `.env.local` e arquivos de segredos ficam fora do Git. Nunca usar `service_role` no navegador ou em variáveis `NEXT_PUBLIC_*`.
- O código pode ficar em repositório privado e **o site público**, caso a estratégia de hospedagem permita. O endereço/dominio público não exige que se publiquem dados corporativos.
- Ver regras e arquitetura em `docs/`. Checklist de publicação em `docs/PUBLICACAO_GITHUB_PAGES.md`.
