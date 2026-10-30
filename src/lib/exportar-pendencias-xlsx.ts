"use client";

/** Exportação Excel offline: gera um XLSX real, sem enviar dados ao servidor.
 * Mantém nome/matrícula como TEXTO e usa somente dados já filtrados na interface.
 * O pacote jszip é carregado somente quando o usuário pede o arquivo.
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

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const TIPOS: readonly { id: TipoEstrela; nome: string }[] = [
  { id: "seguranca", nome: "Segurança" },
  { id: "produtividade", nome: "Produtividade" },
  { id: "dirigibilidade", nome: "Dirigibilidade" },
  { id: "jornada", nome: "Jornada" },
  { id: "treinamentos", nome: "Treinamentos" },
];
const COLUNAS = ["Nome do colaborador", "Matrícula", "Filial", "Segmento", "Competência", "Pendências identificadas", "Quantidade", "Fonte da Dirigibilidade", "Situação"];

function xml(valor: string | number): string {
  return String(valor)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function celula(coluna: string, indice: number, valor: string | number, estilo = 0): string {
  const referencia = `${coluna}${indice}`;
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return `<c r="${referencia}" s="${estilo}"><v>${valor}</v></c>`;
  }
  // inlineStr sempre é interpretado como texto (inclusive matrículas com zeros iniciais).
  return `<c r="${referencia}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${xml(valor)}</t></is></c>`;
}
function formula(coluna: string, indice: number, expressao: string, valorCalculado: number, estilo = 0): string {
  return `<c r="${coluna}${indice}" s="${estilo}"><f>${xml(expressao)}</f><v>${valorCalculado}</v></c>`;
}
function linhaExcel(indice: number, celulas: string[], altura = 23): string {
  return `<row r="${indice}" ht="${altura}" customHeight="1">${celulas.join("")}</row>`;
}
function larguraColunas(larguras: number[]): string {
  return `<cols>${larguras.map((largura, i) => `<col min="${i + 1}" max="${i + 1}" width="${largura}" customWidth="1"/>`).join("")}</cols>`;
}
function folhaBase(nome: string, largura: string, conteudo: string, mesclagens: string[], filtro?: string, congelar?: number): string {
  const freeze = congelar ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${congelar}" topLeftCell="A${congelar + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${congelar + 1}" sqref="A${congelar + 1}"/></sheetView></sheetViews>` : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="${nome}"/>${freeze}<sheetFormatPr defaultRowHeight="18"/>${largura}<sheetData>${conteudo}</sheetData>
${mesclagens.length ? `<mergeCells count="${mesclagens.length}">${mesclagens.map(ref => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>` : ""}
${filtro ? `<autoFilter ref="${filtro}"/>` : ""}
<printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.45" bottom="0.45" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1"/>
</worksheet>`;
}

// Paleta corporativa e estilos (índices de s usados nas células).
const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="8">
<font><sz val="10"/><name val="Aptos"/><color rgb="FF17314C"/></font>
<font><b/><sz val="18"/><name val="Aptos Display"/><color rgb="FFFFFFFF"/></font>
<font><b/><sz val="10"/><name val="Aptos"/><color rgb="FFFFFFFF"/></font>
<font><b/><sz val="11"/><name val="Aptos"/><color rgb="FF104569"/></font>
<font><sz val="10"/><name val="Aptos"/><color rgb="FFB7DDF2"/></font>
<font><sz val="10"/><name val="Aptos"/><color rgb="FF51708B"/></font>
<font><b/><sz val="10"/><name val="Aptos"/><color rgb="FF0D6196"/></font>
<font><b/><sz val="10"/><name val="Aptos"/><color rgb="FFAD552B"/></font>
</fonts>
<fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF071B34"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0C3758"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE7F4FB"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF4F9FD"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2E2"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="hair"><color rgb="FFDFEAF1"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="4" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="7" fillId="7" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="5" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function criarFolhaPendencias(linhas: LinhaPendenciaExcel[], filtros: ParametrosRelatorioPendencias["filtros"]): string {
  const linhasXml: string[] = [];
  const last = Math.max(8, 8 + linhas.length);
  linhasXml.push(linhaExcel(1, [celula("A", 1, "CENTRAL DE PENDÊNCIAS  |  PROGRAMA EXCELÊNCIA 5 ESTRELAS 2027", 1)], 30));
  linhasXml.push(linhaExcel(2, [], 15));
  linhasXml.push(linhaExcel(3, [celula("A", 3, "RELATÓRIO DE AVALIAÇÕES INCOMPLETAS · DADOS DE DEMONSTRAÇÃO", 2)], 25));
  linhasXml.push(linhaExcel(4, [], 12));
  linhasXml.push(linhaExcel(5, [celula("A", 5, `COMPETÊNCIA  ${filtros.competencia}      |      SEGMENTO  ${filtros.segmento}      |      FILIAL  ${filtros.filial}`, 4)], 26));
  linhasXml.push(linhaExcel(6, [celula("A", 6, `PENDÊNCIA  ${filtros.tipo}      |      BUSCA  ${filtros.pesquisa}      |      TOTAL  ${linhas.length}`, 4)], 26));
  linhasXml.push(linhaExcel(7, [], 12));
  linhasXml.push(linhaExcel(8, COLUNAS.map((titulo, i) => celula("ABCDEFGHI"[i], 8, titulo, 3)), 33));
  linhas.forEach((linha, index) => {
    const r = 9 + index;
    const estilo = index % 2 ? 6 : 5;
    const vals: Array<string | number> = [linha.nome, linha.matricula, linha.filial, linha.segmento, linha.competencia, linha.pendencias.join(" · "), linha.tipos.length, linha.fonteDirigibilidade, linha.situacao];
    linhasXml.push(linhaExcel(r, vals.map((v, i) => celula("ABCDEFGHI"[i], r, v, i === 5 ? 8 : i === 6 ? 7 : estilo)), linha.tipos.length > 1 ? 40 : 29));
  });
  return folhaBase(`A1:I${last}`, larguraColunas([31, 17, 20, 35, 17, 51, 15, 28, 17]), linhasXml.join(""), ["A1:I2", "A3:I3", "A5:I5", "A6:I6"], `A8:I${last}`, 8);
}

function criarFolhaResumo(parametros: ParametrosRelatorioPendencias): string {
  const { filtros, linhas } = parametros;
  const contadores = TIPOS.map(tipo => ({ ...tipo, total: linhas.filter(l => l.tipos.includes(tipo.id)).length }));
  const ultima = Math.max(9, 8 + linhas.length);
  const baseFormula = `'Pendências'!$F$9:$F$${ultima}`;
  const linhasXml: string[] = [];
  linhasXml.push(linhaExcel(1, [celula("A", 1, "RELATÓRIO DE PENDÊNCIAS", 1)], 31));
  linhasXml.push(linhaExcel(2, [], 17));
  linhasXml.push(linhaExcel(3, [celula("A", 3, "PROGRAMA EXCELÊNCIA 5 ESTRELAS 2027  ·  AMBIENTE DE DEMONSTRAÇÃO", 2)], 24));
  linhasXml.push(linhaExcel(4, [], 13));
  linhasXml.push(linhaExcel(5, [celula("A", 5, "FILTROS APLICADOS", 3)], 29));
  const pares = [
    ["Competência", filtros.competencia], ["Segmento", filtros.segmento], ["Filial", filtros.filial],
    ["Tipo de pendência", filtros.tipo], ["Busca", filtros.pesquisa], ["Ordenação", filtros.ordenacao],
  ];
  pares.forEach(([rotulo, valor], i) => linhasXml.push(linhaExcel(i + 6, [celula("A", i + 6, rotulo, 4), celula("C", i + 6, valor, 5)], 26)));
  linhasXml.push(linhaExcel(12, [], 13));
  linhasXml.push(linhaExcel(13, [celula("A", 13, "RESUMO DAS PENDÊNCIAS", 3)], 30));
  linhasXml.push(linhaExcel(14, [celula("A", 14, "Colaboradores encontrados", 4), formula("C", 14, `COUNTA('Pendências'!$B$9:$B$${ultima})`, linhas.length, 7)], 27));
  linhasXml.push(linhaExcel(15, [], 12));
  linhasXml.push(linhaExcel(16, [celula("A", 16, "Pilar", 3), celula("C", 16, "Pessoas pendentes", 3)], 26));
  contadores.forEach((item, i) => {
    const row = i + 17;
    const label = `Sem ${item.nome}`;
    // COUNTIF acompanha edições na planilha detalhada. Cada pessoa conta uma vez por pilar.
    linhasXml.push(linhaExcel(row, [celula("A", row, label, i % 2 ? 6 : 5), formula("C", row, `COUNTIF(${baseFormula},"*${label}*")`, item.total, 7)], 25));
  });
  linhasXml.push(linhaExcel(23, [], 14));
  linhasXml.push(linhaExcel(24, [celula("A", 24, "ORIENTAÇÕES DE LEITURA", 3)], 30));
  linhasXml.push(linhaExcel(25, [celula("A", 25, "Uma linha representa um colaborador. Quem tiver mais de uma estrela ausente continuará em uma única linha.", 9)], 27));
  linhasXml.push(linhaExcel(26, [celula("A", 26, "A aba Pendências apresenta todas as pessoas que atendem aos filtros, independentemente da paginação no sistema.", 9)], 27));
  linhasXml.push(linhaExcel(27, [celula("A", 27, "Nota ausente é pendência; nota zero é inelegibilidade. Esta planilha contém somente dados fictícios.", 9)], 27));
  linhasXml.push(linhaExcel(28, [celula("A", 28, "Dirigibilidade: IDT, Gobrax ou Maxtrack são parâmetros configurados por filial, não tipos adicionais de pendência.", 9)], 27));
  return folhaBase("A1:F28", larguraColunas([27, 3, 23, 17, 17, 17]), linhasXml.join(""), ["A1:F2", "A3:F3", "A5:F5", "C6:F6", "C7:F7", "C8:F8", "C9:F9", "C10:F10", "C11:F11", "A13:F13", "A24:F24", "A25:F25", "A26:F26", "A27:F27", "A28:F28"]);
}

export async function exportarPendenciasXlsx(parametros: ParametrosRelatorioPendencias): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
  zip.folder("_rels")?.file(".rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.folder("xl")?.file("workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Resumo" sheetId="1" r:id="rId1"/><sheet name="Pendências" sheetId="2" r:id="rId2"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
  zip.folder("xl/_rels")?.file("workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
  zip.folder("xl")?.file("styles.xml", ESTILOS);
  zip.folder("xl/worksheets")?.file("sheet1.xml", criarFolhaResumo(parametros));
  zip.folder("xl/worksheets")?.file("sheet2.xml", criarFolhaPendencias(parametros.linhas, parametros.filtros));
  const arquivo = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 }, mimeType: XLSX_MIME });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = parametros.nomeArquivo.endsWith(".xlsx") ? parametros.nomeArquivo : `${parametros.nomeArquivo}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 8000);
}
