"use client";

/**
 * Relatório de pendências em Excel. A serialização do XLSX é feita pelo ExcelJS:
 * não montamos manualmente os arquivos XML internos do formato OOXML.
 * Nenhum dado é enviado para servidores externos.
 */
export type TipoEstrela = "seguranca" | "produtividade" | "dirigibilidade" | "jornada" | "treinamentos";
export type LinhaPendenciaExcel = {
  nome: string;
  matricula: string;
  filial: string;
  segmento: string;
  competencia: string;
  pendencias: string[];
  tipos: TipoEstrela[];
  fonteDirigibilidade: string;
  situacao: string;
};
export type ParametrosRelatorioPendencias = {
  linhas: LinhaPendenciaExcel[];
  filtros: {
    competencia: string;
    segmento: string;
    filial: string;
    tipo: string;
    pesquisa: string;
    ordenacao: string;
  };
  nomeArquivo: string;
};

type Planilha = import("exceljs").Worksheet;
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CORES = {
  fundo: "FF071B34", cabecalho: "FF113B5B", subcabecalho: "FF0C3555",
  azul: "FF1789C6", branco: "FFFFFFFF", claro: "FFF0F7FB",
  azulClaro: "FFE4F3FB", texto: "FF17314C", secundario: "FFAED7EB",
  verde: "FF0B7A56", vermelho: "FFC0464F",
};
const PILARES: readonly { id: TipoEstrela; nome: string }[] = [
  { id: "seguranca", nome: "Segurança" },
  { id: "produtividade", nome: "Produtividade" },
  { id: "dirigibilidade", nome: "Dirigibilidade" },
  { id: "jornada", nome: "Jornada" },
  { id: "treinamentos", nome: "Treinamentos" },
];
const COLUNAS = [
  "Nome do colaborador", "Matrícula", "Filial", "Segmento", "Competência",
  "Pendências identificadas", "Quantidade", "Fonte da Dirigibilidade", "Situação",
];
function cor(codigo: string) { return { argb: codigo }; }
function fundo(codigo: string) {
  return { type: "pattern" as const, pattern: "solid" as const, fgColor: cor(codigo) };
}
function faixa(planilha: Planilha, linha: number, fim: number, corFundo: string, corFonte = CORES.branco, altura = 26) {
  const row = planilha.getRow(linha);
  row.height = altura;
  for (let coluna = 1; coluna <= fim; coluna++) {
    const celula = row.getCell(coluna);
    celula.fill = fundo(corFundo);
    celula.font = { name: "Aptos", size: 11, bold: true, color: cor(corFonte) };
    celula.alignment = { vertical: "middle", wrapText: true };
  }
}
function titulo(planilha: Planilha, linha: number, ultimaColuna: string, valor: string, altura: number, tituloPrincipal = false) {
  planilha.mergeCells(`A${linha}:${ultimaColuna}${linha}`);
  faixa(planilha, linha, ultimaColuna.charCodeAt(0) - 64, tituloPrincipal ? CORES.fundo : CORES.subcabecalho,
    tituloPrincipal ? CORES.branco : CORES.secundario, altura);
  const celula = planilha.getCell(`A${linha}`);
  celula.value = valor;
  celula.font = { name: "Aptos Display", size: tituloPrincipal ? 17 : 10, bold: true, color: cor(tituloPrincipal ? CORES.branco : CORES.secundario) };
  celula.alignment = { vertical: "middle", indent: 1, wrapText: false };
}
function preencherResumo(planilha: Planilha, p: ParametrosRelatorioPendencias) {
  planilha.columns = [
    { width: 30 }, { width: 4 }, { width: 29 }, { width: 17 }, { width: 17 }, { width: 17 },
  ];
  titulo(planilha, 1, "F", "RELATÓRIO DE PENDÊNCIAS", 46, true);
  titulo(planilha, 3, "F", "PROGRAMA EXCELÊNCIA 5 ESTRELAS 2027   ·   DEMONSTRAÇÃO", 29);
  titulo(planilha, 5, "F", "FILTROS APLICADOS", 29);
  const campos: [string, string][] = [
    ["Competência", p.filtros.competencia], ["Segmento", p.filtros.segmento],
    ["Filial", p.filtros.filial], ["Tipo de pendência", p.filtros.tipo],
    ["Pesquisa", p.filtros.pesquisa], ["Ordenação", p.filtros.ordenacao],
  ];
  campos.forEach(([nome, valor], indice) => {
    const numero = 6 + indice;
    planilha.mergeCells(`A${numero}:B${numero}`);
    planilha.mergeCells(`C${numero}:F${numero}`);
    const rotulo = planilha.getCell(`A${numero}`);
    rotulo.value = nome;
    rotulo.font = { name: "Aptos", size: 10, bold: true, color: cor(CORES.cabecalho) };
    rotulo.fill = fundo(CORES.azulClaro);
    const conteudo = planilha.getCell(`C${numero}`);
    conteudo.value = valor;
    conteudo.font = { name: "Aptos", size: 10, color: cor(CORES.texto) };
    conteudo.fill = fundo(CORES.claro);
    planilha.getRow(numero).height = 25;
    rotulo.alignment = conteudo.alignment = { vertical: "middle", indent: 1 };
  });
  titulo(planilha, 13, "F", "RESUMO DAS PENDÊNCIAS", 29);
  planilha.mergeCells("A14:B14");
  planilha.getCell("A14").value = "Colaboradores encontrados";
  planilha.getCell("A14").font = { name: "Aptos", size: 11, bold: true, color: cor(CORES.cabecalho) };
  planilha.getCell("C14").value = p.linhas.length;
  planilha.getCell("C14").font = { name: "Aptos", size: 16, bold: true, color: cor(CORES.azul) };
  planilha.getRow(14).height = 31;
  faixa(planilha, 16, 6, CORES.cabecalho, CORES.branco, 28);
  planilha.getCell("A16").value = "Pilar";
  planilha.getCell("C16").value = "Pessoas pendentes";
  PILARES.forEach((pilar, indice) => {
    const r = 17 + indice;
    faixa(planilha, r, 6, indice % 2 ? CORES.claro : CORES.azulClaro, CORES.texto, 25);
    planilha.getCell(`A${r}`).value = pilar.nome;
    planilha.getCell(`C${r}`).value = p.linhas.filter(linha => linha.tipos.includes(pilar.id)).length;
    planilha.getCell(`C${r}`).font = { name: "Aptos", size: 11, bold: true, color: cor(CORES.azul) };
  });
  titulo(planilha, 24, "F", "ORIENTAÇÕES", 29);
  const notas = [
    "Uma linha na aba Pendências representa um colaborador, mesmo que possua várias notas ausentes.",
    "A exportação inclui todos os resultados filtrados, independentemente da página exibida no sistema.",
    "Nota ausente gera pendência; nota zero gera inelegibilidade. Dados fictícios de demonstração.",
    "IDT, Gobrax ou Maxtrack são fontes configuráveis por filial, não tipos adicionais de pendência.",
  ];
  notas.forEach((nota, indice) => {
    const numero = 25 + indice;
    planilha.mergeCells(`A${numero}:F${numero}`);
    planilha.getCell(`A${numero}`).value = nota;
    planilha.getCell(`A${numero}`).font = { name: "Aptos", size: 10, color: cor(CORES.texto) };
    planilha.getCell(`A${numero}`).alignment = { vertical: "middle", wrapText: true, indent: 1 };
    planilha.getRow(numero).height = 26;
  });
  planilha.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}
function preencherDetalhes(planilha: Planilha, p: ParametrosRelatorioPendencias) {
  planilha.columns = [
    { width: 31 }, { width: 17 }, { width: 19 }, { width: 35 }, { width: 17 },
    { width: 52 }, { width: 15 }, { width: 30 }, { width: 18 },
  ];
  titulo(planilha, 1, "I", "CENTRAL DE PENDÊNCIAS  |  PROGRAMA EXCELÊNCIA 5 ESTRELAS 2027", 45, true);
  titulo(planilha, 3, "I", "RELATÓRIO DE AVALIAÇÕES INCOMPLETAS   ·   DADOS DE DEMONSTRAÇÃO", 29);
  titulo(planilha, 5, "I", `COMPETÊNCIA: ${p.filtros.competencia}    |    SEGMENTO: ${p.filtros.segmento}    |    FILIAL: ${p.filtros.filial}`, 27);
  titulo(planilha, 6, "I", `PENDÊNCIA: ${p.filtros.tipo}    |    BUSCA: ${p.filtros.pesquisa}    |    TOTAL: ${p.linhas.length}`, 27);
  const linhaCabecalho = planilha.getRow(8);
  faixa(planilha, 8, 9, CORES.cabecalho, CORES.branco, 34);
  for (let i = 0; i < COLUNAS.length; i++) {
    linhaCabecalho.getCell(i + 1).value = COLUNAS[i];
    linhaCabecalho.getCell(i + 1).alignment = { vertical: "middle", wrapText: true };
  }
  p.linhas.forEach((linha, indice) => {
    const r = indice + 9;
    const valores: (string | number)[] = [
      linha.nome, String(linha.matricula), linha.filial, linha.segmento,
      linha.competencia, linha.pendencias.join(" · "), linha.tipos.length,
      linha.fonteDirigibilidade, linha.situacao,
    ];
    const row = planilha.getRow(r);
    // As células do ExcelJS começam em 1; preenche sem deslocar as colunas.
    valores.forEach((valor, indiceColuna) => {
      row.getCell(indiceColuna + 1).value = valor;
    });
    row.height = linha.tipos.length > 2 ? 42 : 30;
    row.eachCell({ includeEmpty: true }, (celula, coluna) => {
      celula.fill = fundo(indice % 2 ? CORES.claro : CORES.branco);
      celula.font = { name: "Aptos", size: 10, color: cor(CORES.texto), bold: coluna === 1 };
      celula.alignment = { vertical: "middle", wrapText: coluna === 6, indent: 1 };
      celula.border = { bottom: { style: "hair", color: cor("FFDFEAF1") } };
    });
    // Força matrícula como texto, inclusive quando contém zeros à esquerda.
    row.getCell(2).value = String(linha.matricula);
    row.getCell(2).numFmt = "@";
    row.getCell(7).font = { name: "Aptos", size: 10, bold: true, color: cor(CORES.azul) };
    row.getCell(9).font = { name: "Aptos", size: 10, bold: true, color: cor(CORES.verde) };
  });
  planilha.autoFilter = { from: "A8", to: `I${Math.max(8, 8 + p.linhas.length)}` };
  planilha.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

/** Gera o conteúdo binário do XLSX; separado do download para permitir teste automatizado de leitura. */
export async function criarBufferPendenciasXlsx(parametros: ParametrosRelatorioPendencias) {
  // Dynamic import evita carregar a biblioteca inteira na primeira visita à Central.
  const { default: ExcelJS } = await import("exceljs");
  const livro = new ExcelJS.Workbook();
  livro.creator = "Programa Excelência 5 Estrelas";
  livro.created = new Date();
  livro.modified = new Date();
  const resumo = livro.addWorksheet("Resumo", { views: [{ showGridLines: false }] });
  const pendencias = livro.addWorksheet("Pendências", { views: [{ state: "frozen", ySplit: 8, showGridLines: false }] });
  preencherResumo(resumo, parametros);
  preencherDetalhes(pendencias, parametros);
  return livro.xlsx.writeBuffer();
}

/** Baixa a planilha criada localmente, sem transferir dados fictícios para um servidor. */
export async function exportarPendenciasXlsx(parametros: ParametrosRelatorioPendencias): Promise<void> {
  const arquivo = await criarBufferPendenciasXlsx(parametros);
  const blob = new Blob([new Uint8Array(arquivo)], { type: MIME_XLSX });
  const url = URL.createObjectURL(blob);
  const ancora = document.createElement("a");
  try {
    ancora.href = url;
    ancora.download = parametros.nomeArquivo.toLowerCase().endsWith(".xlsx")
      ? parametros.nomeArquivo : `${parametros.nomeArquivo}.xlsx`;
    document.body.appendChild(ancora);
    ancora.click();
  } finally {
    ancora.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
