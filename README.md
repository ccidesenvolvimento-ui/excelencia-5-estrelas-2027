# Programa Excelência 5 Estrelas 2027

**Versão 0.9 — Central de Pendências redesenhada e fonte da Dirigibilidade prevista na planilha de importação, para testes.** Projeto Next.js 16 / React 19 / TypeScript, visualização de regras com dados inteiramente **fictícios**.

## O que funciona nesta versão

- Visão Geral com filtros e gráficos fictícios; sidebar flutuante/fixa com ícones modernos e rolagem discreta.
- Menu consolidado: Visão Geral, Ranking, Pendências, Importações, RH0034, Configurações e Testes.
- Dashboard ilustrativo, ranking mensal / ciclos / anual por oito categorias, filtro de filial e ordenação.
- Cálculo ilustrativo com cinco estrelas e regra de inelegibilidade por zero, pendência sem nota e posições por categoria.
- Central de Pendências com cinco tipos de ausência (Segurança, Produtividade, Dirigibilidade, Jornada e Treinamentos), filtros combinados, paginação, visualização individual e exportação **CSV** de dados fictícios.
- Download dos seis modelos oficiais XLSX em **Importações**. Verificação local de nome/extensão/tamanho (não lê nem importa as linhas do Excel).
- RH0034 fictícia e simulação de classificação local (`localStorage`), sem afetar a base de notas ou persistir no servidor.
- Relatório integrado ao Ranking, respeitando período, segmento, filial, pesquisa, ordenação e posições oficiais Top N (CSV e PDF direto no navegador, com prévia em páginas).
- Configurações com abas Regras, Usuários e Acessos e Segurança; simulação LOCAL de perfis, permissões, filiais (não são parâmetros corporativos reais).
- Testes básicos da lógica + relato de erros baixável ou abertura de Issue no GitHub.
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

## Organização visual consolidada v0.6

- **Visão Geral (`/`)**: painel executivo e filtros.
- **Ranking (`/ranking`)**: notas, posição, filtros e botão `Gerar relatório`. Top N preserva a colocação original por categoria, mesmo ao filtrar filial. CSV abre no Excel; PDF é obtido por impressão do navegador (não há geração automatizada no servidor).
- **Pendências (`/pendencias`)**: filtros, pesquisa, resumo e exportação CSV fictícia.
- **Importações (`/importacoes`)**: seis modelos XLSX e pré-verificação local sem envio.
- **RH0034 (`/rh0034`)**: prévia e classificação fictícia local (não altera ranking).
- **Configurações (`/configuracoes`)**: metodologia, categorias e ciclos; aba **Usuários e acessos** com perfis de teste, permissões e filiais; requisitos de autenticação e auditoria.
- **Testes (`/diagnostico`)**: verificações e relato de erros.

As URLs antigas `/painel`, `/relatorios` e `/usuarios` encaminham para `/visao-geral`, `/ranking` e `/configuracoes#usuarios` para evitar links quebrados. Não aparecem mais no menu.

### Como atualizar por upload no GitHub

1. Criar branch `feat/interface-unificada-v06` a partir de `main`.
2. Baixar/extrair o ZIP de atualização v0.6 e enviar o conteúdo da pasta `src` para a raiz do repositório (substituir os arquivos existentes). **Não enviar uma pasta externa adicional**.
3. Abrir PR para `main`, conferir o workflow Actions (typecheck/test/build), revisar e realizar merge.
4. O workflow existente publica automaticamente a versão de demonstração no GitHub Pages.

**Segurança:** ambiente público somente com dados fictícios. Não colocar arquivos corporativos reais, e-mails pessoais ou credenciais em formulários de teste.

## Atualização da Central de Pendências v0.9

Consulte `docs/INTERFACE_V09.md`. Nenhum arquivo de Ranking ou geração de PDF é substituído por esta atualização.

### Entrada institucional e acesso corporativo (Issue #10)

A rota `/` apresenta a entrada do programa, com caminhos para `/login` (Área
Corporativa) e `/motorista` (portal independente). A Visão Geral demonstrativa
permanece disponível em `/visao-geral`; `/painel` encaminha para esse destino.
O login corporativo é apenas uma interface de preparação: os campos e o botão
permanecem desabilitados, nenhuma credencial é coletada e nenhuma sessão é
simulada. O acesso à demonstração é explícito e usa somente dados fictícios.
Dados reais exigirão autenticação e autorização no backend em uma etapa futura.
A implantação estática no GitHub Pages continua sem API routes ou middleware.
A composição visual usa os ativos oficiais e a descrição conceitual do teaser;
o vídeo não foi inspecionado nesta implementação.

O refinamento visual da segunda versão mantém a arte oficial sem alteração de
forma, cores ou proporções. A profundidade vem de gradientes e iluminação da silhueta em CSS.
Os cards têm spotlight para mouse, foco de teclado e reflexo breve na borda;
o CTA da demonstração tem brilho ao hover. Não há animações infinitas, WebGL
ou dependências adicionais. `prefers-reduced-motion` desativa animações,
transições e o rastreamento do cursor. O login continua desabilitado.

Para verificar as cinco larguras após o build estático, execute
`npm run test:entrada` com Playwright e Chromium disponíveis. O executável local
pode ser indicado por `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; as capturas são
salvas em `artifacts/entrada` (ou no diretório `ENTRADA_SCREENSHOTS`). O teste
verifica também spotlight, foco visível, movimento reduzido e navegação.


A home inclui uma abertura cinematográfica de 2 segundos: aproximação lateral,
passagem com clarão único difuso e recuo até a caixa exata da estrela no layout.
O clone temporário e a camada de luz não interceptam eventos. O estado final não
usa polígonos, órbitas ou feixes. O login mantém somente uma entrada discreta.
A abertura usa `sessionStorage` para ocorrer uma vez por sessão/aba; sem acesso
a esse armazenamento, pode repetir em uma nova montagem. Rolagem, resize,
desmontagem ou ativação de movimento reduzido encerram a abertura imediatamente.
O hover da estrela usa perspectiva limitada a 5 graus e retorna suavemente ao
sair. Movimento reduzido desativa flyby, clarão e inclinação. Para validar essa
sequência no Chromium, execute `npm run test:cinema` após o build estático.


No refinamento de escala, a estrela da home mede 500 px no desktop amplo
(antes 360 px), com tamanhos menores por breakpoint. O hover amplia 7,5%,
aumenta o halo em 18% e mantém a inclinação limitada a 5 graus. O fundo passou
a azul-marinho quase preto, sem linhas decorativas e com luz concentrada no
símbolo. O pico do flyby foi ampliado; no celular, a largura da passagem é
limitada proporcionalmente à viewport. Os testes de cinema verificam escala,
retorno, iluminação e ausência de sobreposição permanente com o título.
