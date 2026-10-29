# Interface v0.8 — Importação RH0034, navegação e símbolo oficial

## Escopo

### RH0034
- Área de **seleção** de planilha `.xlsx` por clique ou arrastar e soltar.
- Pré-validação demonstrativa de **extensão** e **tamanho** (máximo 15 MB).
- Nenhum arquivo é lido ou transmitido, nenhum registro é criado/alterado.
- Confirmação de importação propositalmente desativada até existir backend autenticado com validação e auditoria.
- Painel de status distingue claramente **nenhuma importação real** dos indicadores calculados a partir de dados fictícios.
- Assistente de classificação mantém dados fictícios com filtros de nome/matrícula/empresa, classificação, filial, função e situação RH.
- Classificações demonstrativas continuam no `localStorage` (não afetam rankings).
- Criar regra automática exige prévia e aprovação futuras; botão desabilitado.
- **Não disponibilizar modelo RH0034 para download.** O arquivo oficial vem do RH da empresa.

### Navegação
- Normalização do caminho atual na determinação da aba selecionada, inclusive URLs com `/` final.
- Mesmo contorno/halo azul em qualquer aba ativa.
- O botão superior mantém a alternância entre **flutuante** e **fixo**, sem alteração ao selecionar páginas.
- Ícone do modo recolhido extraído **da arte original** `marca-programa.png`, sem redesenho. Arquivo: `public/estrela-oficial-5-estrelas.png`.
- Movimento reduzido respeitado (`prefers-reduced-motion`).

## Regra de negócio (não implementada na demonstração)

O importador definitivo deverá autenticar o usuário e verificar permissão de importação por filial, validar a RH0034 como lote antes de gravar, identificar colaboradores por **empresa + matrícula**, atualizar lotação/situação/férias sem duplicar cadastros, classificar somente por regras aprovadas, excluir empilhadeiras e registrar usuário, competência, divergências e auditoria. Planilhas das estrelas não podem cadastrar colaboradores.

## Checklist manual antes do merge
1. Executar `npm run typecheck`, `npm run test:rules`, `npm run build` no workflow.
2. Abrir todas as sete abas; o halo deve acompanhar a aba selecionada.
3. Testar menu flutuante, fixo, hover, navegação e dispositivo móvel.
4. Conferir que o símbolo compacto corresponde à arte oficial.
5. Abrir Cadastro RH0034; verificar upload por clique/arrastar, extensões inválidas, arquivo vazio, arquivo acima de 15 MB.
6. Verificar que o botão de **confirmar importação** permanece desativado e nenhuma requisição contém o arquivo.
7. Testar a classificação da pessoa fictícia sem categoria e os filtros Filial, Função e Situação RH.
8. Confirmar que não há modelo RH0034 nem alterações no banco Supabase.

## Observação de segurança
O site estático do GitHub Pages é público. **Não utilizar arquivos RH0034 reais, matrículas reais ou dados pessoais.** Não habilitar upload efetivo sem autenticação, autorização, tratamento de privacidade, validação completa e auditoria.
