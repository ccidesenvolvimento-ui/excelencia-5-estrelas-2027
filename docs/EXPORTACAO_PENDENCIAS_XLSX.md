# Central de Pendências — exportação .xlsx (v1.0)

## Objetivo

Substituir **somente** o CSV da Central de Pendências por um relatório Excel formatado. Não altera Ranking, geração de PDF, regras de cálculo, cadastro RH0034, nem banco de dados.

## Conteúdo do Excel

- **Resumo:** competência, segmento, filial, tipo de pendência, pesquisa, ordenação, número de colaboradores e contagem por cinco pilares.
- **Pendências:** uma linha por colaborador encontrado pelos filtros, todas as páginas incluídas. Nome, matrícula como texto, filial, segmento, competência, lista de pendências, quantidade, fonte configurada de Dirigibilidade quando aplicável e situação.
- Tabela colorida com filtro de cabeçalho do Excel, cabeçalho fixo e larguras apropriadas.
- O arquivo é gerado **no navegador**, sem transferir dados ao servidor.
- Exportação produz um `.xlsx` genuíno (arquivos XML OOXML compactados por `jszip`), **não** um CSV renomeado.

## Regras e limitações

- O relatório respeita competência + tipo de pendência + segmento + filial + pesquisa e ordenação.
- Um colaborador pode ter várias estrelas ausentes, mas aparece uma vez; contagem por estrela considera cada pessoa naquela estrela.
- `IDT`, `Gobrax` e `Maxtrack` são parâmetros por filial, não tipos de pendência.
- Matrículas são textos para preservar zeros à esquerda.
- Base atual é fictícia; não importar RH0034 real nem dados corporativos neste ambiente público.
- O resumo usa fórmulas do Excel (COUNTA / COUNTIF) com valores em cache, para que as contagens sejam atualizadas ao alterar as linhas na planilha detalhada.

## Publicação sem terminal

1. Criar branch `feat/relatorio-pendencias-xlsx-v10` da branch principal.
2. Enviar `src/app/pendencias/page.tsx`, `src/app/pendencias/exportacao-xlsx.css`, `src/lib/exportar-pendencias-xlsx.ts`, `package.json` e este documento, preservando os caminhos originais.
3. Abrir Pull Request e conferir o GitHub Actions, incluindo instalação de `jszip` e `npm run typecheck`.
4. Somente após checks passarem, fazer merge e baixar um relatório de demonstração para verificar filtros e fórmulas em Excel.

**Teste obrigatório:** abrir XLSX em Excel e LibreOffice, filtrar Bebidas/Contagem/Sem Dirigibilidade, conferir matrícula e testar uma competência sem registros.
