/**
 * Relatório visual do Programa Excelência 5 Estrelas.
 * Renderiza páginas A4 paisagem em Canvas e grava um PDF válido diretamente
 * no navegador, sem janela de impressão nem dependências externas.
 * Os dados e notas são recebidos da lógica existente do ranking.
 */
export type LinhaRankingPDF = {
  posicao: number;
  nome: string;
  filial: string;
  matricula: string;
  notas: (number | null)[];
  score: number | null;
};

export type DadosRankingPDF = {
  categoria: string;
  periodo: string;
  filial: string;
  ordenacao: string;
  top: number;
  colunas: string[];
  registros: LinhaRankingPDF[];
  geradoEm: string;
};

const LARGURA = 842;
const ALTURA = 595;
const ESCALA = 2.5;
const FUNDO = "#071526";
const PAINEL = "#0d2943";
const BORDA = "#2b5573";
const AZUL = "#61d2ff";
const BRANCO = "#f2faff";
const MUTED = "#b9d7e7";
const PALE = "#9bcbe3";
const VERDE = "#71e2b7";

function caixa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string, borda?: string, raio = 0): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, raio);
  ctx.fillStyle = cor;
  ctx.fill();
  if (borda) { ctx.strokeStyle = borda; ctx.lineWidth = 0.9; ctx.stroke(); }
}

function texto(ctx: CanvasRenderingContext2D, conteudo: string, x: number, y: number, tamanho: number, cor = BRANCO, peso = 400, alinhamento: CanvasTextAlign = "left", larguraMax?: number): void {
  ctx.font = `${peso} ${tamanho}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = cor;
  ctx.textBaseline = "middle";
  ctx.textAlign = alinhamento;
  let textoFinal = String(conteudo);
  if (larguraMax && ctx.measureText(textoFinal).width > larguraMax) {
    while (textoFinal.length > 1 && ctx.measureText(textoFinal + "…").width > larguraMax) textoFinal = textoFinal.slice(0, -1);
    textoFinal += "…";
  }
  ctx.fillText(textoFinal, x, y);
}

function linha(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, cor = BORDA, largura = 0.8): void {
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.strokeStyle = cor; ctx.lineWidth = largura; ctx.stroke();
}

function imagemProporcional(ctx: CanvasRenderingContext2D, imagem: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const fator = Math.min(w / imagem.naturalWidth, h / imagem.naturalHeight);
  const iw = imagem.naturalWidth * fator;
  const ih = imagem.naturalHeight * fator;
  ctx.drawImage(imagem, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error(`Não foi possível carregar a imagem do relatório: ${url}`));
    imagem.src = url;
  });
}

function notaFormatada(nota: number | null): string {
  return nota === null || !Number.isFinite(nota) ? "—" : nota.toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function desenharFundo(ctx: CanvasRenderingContext2D, simbolo: HTMLImageElement): void {
  ctx.fillStyle = FUNDO; ctx.fillRect(0, 0, LARGURA, ALTURA);
  const gradiente = ctx.createLinearGradient(0, 0, 0, 160);
  gradiente.addColorStop(0, "#0b2e50"); gradiente.addColorStop(1, FUNDO);
  ctx.fillStyle = gradiente; ctx.fillRect(0, 0, LARGURA, 165);
  ctx.save();
  ctx.globalAlpha = 0.09; ctx.strokeStyle = AZUL; ctx.lineWidth = 17;
  ctx.beginPath(); ctx.moveTo(-45, 106); ctx.bezierCurveTo(190, 25, 370, 42, 895, 161); ctx.stroke();
  ctx.globalAlpha = 0.05; imagemProporcional(ctx, simbolo, 685, 10, 126, 126);
  ctx.restore();
  ctx.fillStyle = "#0878bc"; ctx.fillRect(0, ALTURA - 5, LARGURA, 5);
  ctx.fillStyle = "#4fcaff"; ctx.fillRect(0, ALTURA - 5, LARGURA * 0.43, 5);
}

function desenharCabecalho(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, dados: DadosRankingPDF, indice: number, total: number): void {
  imagemProporcional(ctx, logo, 28, 24, 206, 67);
  caixa(ctx, 244, 27, 2, 65, AZUL);
  texto(ctx, "RELATÓRIO DE RANKING", 265, 39, 20, BRANCO, 700);
  texto(ctx, `${dados.categoria.toUpperCase()}  /  ${dados.periodo.toUpperCase()}  /  TOP ${dados.top}`, 265, 68, 10.1, AZUL, 700, "left", 420);
  texto(ctx, indice === 0 ? "Programa de reconhecimento operacional" : `Continuação da classificação  ·  Página ${indice + 1} de ${total}`, 265, 86, 9.2, MUTED);
  caixa(ctx, 687, 29, 126, 24, "#3b3226", "#987747", 12);
  texto(ctx, "DEMONSTRAÇÃO", 750, 42, 9.1, "#f2c477", 700, "center");
  linha(ctx, 28, 108, LARGURA - 28, "#317fa9", 1.1);
}

function desenharContexto(ctx: CanvasRenderingContext2D, dados: DadosRankingPDF, pagina: number, total: number): void {
  const informacao = `${dados.periodo}  ·  ${dados.filial}  ·  ${dados.ordenacao}`;
  texto(ctx, "CLASSIFICAÇÃO OFICIAL", 28, 128, 9.3, AZUL, 700);
  texto(ctx, informacao, 28, 148, 10.1, BRANCO, 500, "left", 610);
  texto(ctx, `${pagina}/${total}`, 813, 143, 10, MUTED, 700, "right");
}

function desenharPodio(ctx: CanvasRenderingContext2D, registros: LinhaRankingPDF[]): void {
  const podium = registros.filter(r => r.posicao <= 3).sort((a, b) => a.posicao - b.posicao);
  texto(ctx, "PÓDIO DO TOP", 28, 176, 12, BRANCO, 700);
  texto(ctx, "Destaques da classificação", 814, 176, 9, MUTED, 400, "right");
  const largura = (LARGURA - 56 - 20) / 3;
  const tons = ["#f2c477", "#b7def1", "#dba27b"];
  for (let i = 0; i < 3; i++) {
    const pessoa = podium[i];
    const x = 28 + i * (largura + 10);
    caixa(ctx, x, 191, largura, 76, PAINEL, BORDA, 10);
    caixa(ctx, x + 2, 194, 3, 70, tons[i], undefined, 1);
    if (pessoa) {
      caixa(ctx, x + 13, 204, 37, 26, "#173b53", "#316784", 6);
      texto(ctx, `${pessoa.posicao}º`, x + 31.5, 217, 13, tons[i], 700, "center");
      texto(ctx, pessoa.nome, x + 60, 210, 11, BRANCO, 700, "left", largura - 73);
      texto(ctx, `${pessoa.filial}  ·  ${pessoa.matricula}`, x + 60, 228, 8.8, MUTED, 400, "left", largura - 73);
      linha(ctx, x + 13, 244, x + largura - 13, "#2c536b", 0.6);
      texto(ctx, "SCORE", x + 14, 254, 8, PALE, 700);
      texto(ctx, notaFormatada(pessoa.score), x + largura - 14, 254, 14.3, VERDE, 700, "right");
    } else {
      texto(ctx, "Sem classificado", x + 14, 225, 11, MUTED);
    }
  }
}

function desenharTabela(ctx: CanvasRenderingContext2D, dados: DadosRankingPDF, registros: LinhaRankingPDF[], primeiraPagina: boolean): void {
  const topTabela = primeiraPagina ? 309 : 191;
  const tituloY = primeiraPagina ? 289 : 174;
  const titulo = primeiraPagina ? `CLASSIFICAÇÃO DETALHADA  ·  TOP ${dados.top}` : `CONTINUAÇÃO  ·  POSIÇÕES ${registros[0]?.posicao ?? "—"} A ${registros.at(-1)?.posicao ?? "—"}`;
  texto(ctx, titulo, 28, tituloY, 12, BRANCO, 700);
  const largura = LARGURA - 56;
  const n = dados.colunas.length;
  const anual = n > 6;
  const fixas = anual ? [32, 126, 69, 56, 75] : [42, 146, 91, 69, 79];
  const colNotas = (largura - fixas.reduce((a, b) => a + b, 0)) / n;
  const larguras = [fixas[0], fixas[1], fixas[2], fixas[3], ...Array(n).fill(colNotas), fixas[4]];
  const cabecalhos = ["POS.", "COLABORADOR", "FILIAL", "MATRÍCULA", ...dados.colunas.map(t => t.toUpperCase()), "SCORE"];
  const cabH = 26;
  const hLinha = primeiraPagina ? 19.9 : 29.1;
  caixa(ctx, 28, topTabela, largura, cabH, "#123954", "#386b89");
  let x = 28;
  cabecalhos.forEach((col, i) => {
    const w = larguras[i];
    const label = col === "PRODUTIVIDADE" ? "PRODUTIV." : col === "DIRIGIBILIDADE" ? "DIRIGIBILID." : col === "TREINAMENTOS" ? "TREINAMENTOS" : col;
    texto(ctx, label, i <= 3 ? x + 7 : x + w / 2, topTabela + 13, anual ? 7.1 : 7.5, "#e0f4ff", 700, i <= 3 ? "left" : "center", w - 7);
    x += w;
  });
  registros.forEach((r, indice) => {
    const y = topTabela + cabH + indice * hLinha;
    caixa(ctx, 28, y, largura, hLinha, indice % 2 === 0 ? "#0d2d47" : "#091e32");
    const valores = [`${r.posicao}º`, r.nome, r.filial, r.matricula, ...r.notas.map(notaFormatada), notaFormatada(r.score)];
    let cursor = 28;
    valores.forEach((valor, i) => {
      const w = larguras[i];
      const alin = i <= 3 ? (i === 0 ? "center" : "left") : "center";
      const posX = alin === "left" ? cursor + 7 : cursor + w / 2;
      const negrito = i === 0 || i === 1 || i === valores.length - 1 ? 700 : 400;
      const cor = i === 0 ? AZUL : i === valores.length - 1 ? VERDE : i === 1 ? BRANCO : MUTED;
      texto(ctx, valor, posX, y + hLinha / 2, anual ? 7.2 : 9.1, cor, negrito, alin, w - 12);
      cursor += w;
    });
    linha(ctx, 28, y + hLinha, 28 + largura, "#234762", 0.4);
  });
  ctx.strokeStyle = "#386b89"; ctx.lineWidth = 0.7;
  ctx.strokeRect(28, topTabela, largura, cabH + registros.length * hLinha);
  let cursor = 28;
  for (let i = 0; i < larguras.length - 1; i++) {
    cursor += larguras[i];
    ctx.beginPath(); ctx.moveTo(cursor, topTabela); ctx.lineTo(cursor, topTabela + cabH + registros.length * hLinha); ctx.strokeStyle = "#24445e"; ctx.lineWidth = 0.5; ctx.stroke();
  }
  if (!registros.length) texto(ctx, "Nenhum elegível encontrado para os filtros selecionados.", 41, topTabela + 55, 12, MUTED);
}

function desenharRodape(ctx: CanvasRenderingContext2D, dados: DadosRankingPDF, pagina: number, total: number): void {
  linha(ctx, 28, 547, LARGURA - 28, "#367dad", 0.8);
  texto(ctx, "PROGRAMA EXCELÊNCIA 5 ESTRELAS 2027", 28, 560, 8.6, AZUL, 700);
  texto(ctx, "DADOS FICTÍCIOS  ·  DEMONSTRAÇÃO NÃO OFICIAL", 28, 579, 7.9, MUTED);
  texto(ctx, `RANKING ${dados.categoria.toUpperCase()}  ·  TOP ${dados.top}  ·  PÁGINA ${pagina}/${total}`, LARGURA - 28, 568, 8.4, BRANCO, 700, "right");
}

/** Cria 1 página para até 10 posições e páginas adicionais de 10 em 10. */
export async function renderizarPaginasRelatorio(dados: DadosRankingPDF, basePath = ""): Promise<HTMLCanvasElement[]> {
  const [logo, simbolo] = await Promise.all([
    carregarImagem(`${basePath}/marca-programa.png`),
    carregarImagem(`${basePath}/estrela-oficial-5-estrelas.png`)
  ]);
  const paginas: HTMLCanvasElement[] = [];
  const total = Math.max(1, Math.ceil(dados.registros.length / 10));
  for (let indice = 0; indice < total; indice++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(LARGURA * ESCALA);
    canvas.height = Math.round(ALTURA * ESCALA);
    const contexto = canvas.getContext("2d", {alpha: false});
    if (!contexto) throw new Error("Seu navegador não disponibilizou o recurso necessário para criar o PDF.");
    contexto.scale(ESCALA, ESCALA);
    desenharFundo(contexto, simbolo);
    desenharCabecalho(contexto, logo, dados, indice, total);
    desenharContexto(contexto, dados, indice + 1, total);
    if (indice === 0) desenharPodio(contexto, dados.registros);
    desenharTabela(contexto, dados, dados.registros.slice(indice * 10, indice * 10 + 10), indice === 0);
    desenharRodape(contexto, dados, indice + 1, total);
    paginas.push(canvas);
  }
  return paginas;
}

function bytesDeBase64(base64: string): Uint8Array {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/** PDF A4 horizontal com uma imagem JPEG de alta resolução por página, sem margens. */
export function criarPDFDireto(paginas: HTMLCanvasElement[]): Blob {
  if (!paginas.length) throw new Error("O relatório não possui páginas para exportação.");
  const codificador = new TextEncoder();
  const blocos: Uint8Array[] = [];
  const offsets: number[] = [0];
  let tamanho = 0;
  const escrever = (conteudo: string | Uint8Array): void => {
    const bytes = typeof conteudo === "string" ? codificador.encode(conteudo) : conteudo;
    blocos.push(bytes);
    tamanho += bytes.length;
  };
  const objeto = (id: number, corpo: () => void): void => {
    offsets[id] = tamanho;
    escrever(`${id} 0 obj\n`);
    corpo();
    escrever("\nendobj\n");
  };
  escrever("%PDF-1.4\n%PDF-DIRETO\n");
  objeto(1, () => escrever("<< /Type /Catalog /Pages 2 0 R >>"));
  const referenciasPaginas = paginas.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  objeto(2, () => escrever(`<< /Type /Pages /Kids [ ${referenciasPaginas} ] /Count ${paginas.length} >>`));
  paginas.forEach((canvas, i) => {
    const paginaId = 3 + i * 3;
    const conteudoId = paginaId + 1;
    const imagemId = paginaId + 2;
    objeto(paginaId, () => escrever(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGURA} ${ALTURA}] /Resources << /XObject << /Pagina ${imagemId} 0 R >> >> /Contents ${conteudoId} 0 R >>`));
    const comandos = "q\n842 0 0 595 0 0 cm\n/Pagina Do\nQ\n";
    objeto(conteudoId, () => {
      escrever(`<< /Length ${codificador.encode(comandos).length} >>\nstream\n`);
      escrever(comandos);
      escrever("endstream");
    });
    const jpeg = bytesDeBase64(canvas.toDataURL("image/jpeg", 0.96).split(",")[1]);
    objeto(imagemId, () => {
      escrever(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
      escrever(jpeg);
      escrever("\nendstream");
    });
  });
  const inicioXref = tamanho;
  escrever(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let i = 1; i < offsets.length; i++) escrever(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  escrever(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`);
  return new Blob(blocos as BlobPart[], {type: "application/pdf"});
}

export function baixarPDFDireto(paginas: HTMLCanvasElement[], nomeArquivo: string): void {
  const blob = criarPDFDireto(paginas);
  const url = URL.createObjectURL(blob);
  const ancora = document.createElement("a");
  ancora.href = url;
  ancora.download = nomeArquivo;
  document.body.appendChild(ancora);
  ancora.click();
  ancora.remove();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
}
