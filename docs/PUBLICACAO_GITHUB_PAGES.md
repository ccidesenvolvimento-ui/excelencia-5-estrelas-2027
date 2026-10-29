# Publicação da demonstração via GitHub Pages

## Objetivo
Publicar **somente interface com dados fictícios**, para revisar navegabilidade, responsividade e regras ilustrativas. Não é ambiente de produção.

## Preparação
- Repositório: `ccidesenvolvimento-ui/excelencia-5-estrelas-2027`.
- Estrutura: `src/app`, `public`, `package.json`, `.github/workflows/github-pages.yml` na raiz.
- Não inserir RH0034 real, credenciais, planilhas preenchidas nem dados de funcionários.
- Abrir a aba **Settings → Pages** e selecionar **GitHub Actions** como fonte de publicação.

## Pipeline automatizado
- Push na branch `main` ativa o workflow.
- Job `build`: instala dependências, valida TypeScript, compila Next.js estático em `out/`.
- Job `deploy`: publica `out/` com GitHub Pages.
- Caso o workflow falhe, verificar logs da aba **Actions**; nunca desligar validações só para forçar publicação.

## Conferência pós-publicação
- [ ] Link público abre a página inicial.
- [ ] Navegação do menu funciona, inclusive em celular.
- [ ] `/importacoes/` oferece os seis downloads `.xlsx` sem erros 404.
- [ ] Ranking: filtro de filial não altera a posição oficial por segmento.
- [ ] Nota zero marca inelegibilidade e não mostra posição.
- [ ] Pessoa pendente aparece na Central, não no Ranking.
- [ ] Relatórios CSV e impressão (PDF pelo navegador) funcionam.
- [ ] Diagnóstico executa checagens e permite exportar relato.
- [ ] Não há dados corporativos reais nem endpoint de gravação aberto ao público.

## Domínio
Domínio poderá ser configurado futuramente em Pages → Custom domain e no provedor DNS, com HTTPS. A rota-base do site usa `/excelencia-5-estrelas-2027` no domínio `github.io`; quando adotar um domínio próprio, revise o `basePath` e o workflow para servir pela raiz, antes de alterar a configuração de DNS.

## Limites
GitHub Pages serve arquivos HTML/CSS/JS estáticos. Next.js App Router com autenticação de servidor, Server Actions, APIs e uploads autenticados requer arquitetura de backend separada. **Não** presumir que uma interface de upload demonstra validação real de arquivos.
