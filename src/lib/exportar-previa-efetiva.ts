/**
 * Exportação da prévia autenticada — NÃO É RANKING OFICIAL.
 * Recebe somente a resposta autorizada da API opt-in; nunca busca dados demo.
 */
import type { PreviaRanking, LinhaPrevia } from "./projecao-ranking-efetivo";
import { criarPDFDireto } from "./relatorio-ranking-pdf";

const ESTRELAS=["seguranca","produtividade","dirigibilidade","jornada","treinamentos"] as const;
const TITULOS=["Segurança","Produtividade","Dirigibilidade","Jornada","Treinamentos"];
const MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type DocumentoPrevia={competencia:string;linhas:LinhaPrevia[];avisos:string[];escopo:"filiais-autorizadas";rankingOficial:false};
export function prepararDocumento(preview:PreviaRanking):DocumentoPrevia{
 if(preview.rankingOficial!==false||preview.escopo!=="filiais-autorizadas"||!Number.isInteger(preview.mes)||preview.mes<0||preview.mes>11)
  throw new Error("Exportação exige uma prévia autorizada e não oficial");
 const competencia="2027-"+String(preview.mes+1).padStart(2,"0");
 if(!Array.isArray(preview.linhas)||!Array.isArray(preview.avisos))throw new Error("Prévia incompleta");
 for(const linha of preview.linhas){
  if(linha.posicao!==null||linha.competencia!==competencia+"-01"||!linha.id||!linha.filialId||
    !linha.matricula||!linha.nome||!linha.categoria||!linha.notas||!["Elegível","Inelegível","Pendente"].includes(linha.status))
   throw new Error("Prévia inconsistente ou com posição indevida");
  for(const estrela of ESTRELAS){
   const nota=linha.notas[estrela];
   if(!nota)continue;
   for(const n of [nota.original,nota.efetiva]){
    if(typeof n!=="number"||!Number.isFinite(n)||n<0||n>100)throw new Error("Nota inválida na exportação");
   }
   if(estrela==="seguranca"&&(nota.original!==nota.efetiva||nota.ajustada))throw new Error("Segurança não admite ajuste manual");
  }
  if(linha.score!==null&&(typeof linha.score!=="number"||!Number.isFinite(linha.score)||linha.score<0||linha.score>100))
   throw new Error("Score inválido");
 }
 return {competencia,linhas:preview.linhas,avisos:preview.avisos,escopo:"filiais-autorizadas",rankingOficial:false};
}
function textoSeguro(v:string):string{
 // Escapa valores originados do banco para evitar fórmulas injetadas no Excel.
 return /^[\s\u0000-\u001f]*[=+@\-]/.test(v)?"'"+v:v;
}
function valor(n:number|null|undefined){return n===null||n===undefined?"—":n.toFixed(2).replace(".",",")}

/** Sem escrever arquivos temporários nem usar chamadas de rede. */
export async function criarBufferPreviaXlsx(preview:PreviaRanking):Promise<Uint8Array>{
 const p=prepararDocumento(preview);
 const ExcelJS=(await import("exceljs")).default;
 const workbook=new ExcelJS.Workbook();
 workbook.creator="Programa Excelência 5 Estrelas 2027 - Homologação";
 const ws=workbook.addWorksheet("Prévia mensal",{views:[{state:"frozen",ySplit:5}]});
 ws.columns=[
  {width:30},{width:20},{width:20},{width:35},{width:18},{width:18},
  ...Array.from({length:ESTRELAS.length*3},()=>({width:19})),
  {width:15},{width:21},{width:55}
 ];
 const TOTAL=24;
 ws.mergeCells(1,1,1,TOTAL);ws.getCell("A1").value="PRÉVIA DE SCORES EFETIVOS — HOMOLOGAÇÃO";
 ws.mergeCells(2,1,2,TOTAL);ws.getCell("A2").value="NÃO OFICIAL · SEM POSIÇÕES · NÃO UTILIZAR PARA PREMIAÇÃO OU DECISÕES DE RH";
 ws.mergeCells(3,1,3,TOTAL);ws.getCell("A3").value="Competência: "+p.competencia+" | Escopo: somente filiais autorizadas por RLS";
 ws.getRow(1).height=38;ws.getRow(2).height=27;ws.getRow(3).height=25;
 for(const linha of [1,2,3]){
  const cell=ws.getCell("A"+linha);cell.font={name:"Aptos",bold:true,size:linha===1?17:11,color:{argb:"FFFFFFFF"}};
  cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:linha===2?"FF7B2629":"FF113B5B"}};
  cell.alignment={vertical:"middle",indent:1};
 }
 const cabecalho=[
  "Colaborador","Matrícula","ID filial","Segmento","Competência","ID colaborador",
  ...TITULOS.flatMap(t=>[t+" original",t+" efetiva",t+" ajustada"]),
  "Score efetivo","Situação provisória","Pendências"
 ];
 const header=ws.getRow(5);header.values=[...cabecalho];header.height=33;
 header.eachCell(cell=>{cell.font={name:"Aptos",bold:true,color:{argb:"FFFFFFFF"}};
  cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF174E73"}};
  cell.alignment={vertical:"middle",wrapText:true};});
 p.linhas.forEach((l,i)=>{
  const values:(string|number|boolean|null)[]=[
   textoSeguro(l.nome),textoSeguro(l.matricula),textoSeguro(l.filialId),textoSeguro(l.categoria),
   l.competencia,textoSeguro(l.id),
   ...ESTRELAS.flatMap(e=>{
    const nota=l.notas[e];return nota?[nota.original,nota.efetiva,nota.ajustada]:[null,null,false];
   }),l.score,l.status,textoSeguro(l.faltantes.join("; "))
  ];
  const row=ws.addRow(values);row.height=25;
  row.eachCell({includeEmpty:true},cell=>{
   cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:i%2?"FFE9F3FA":"FFFFFFFF"}};
   cell.alignment={vertical:"middle",wrapText:true};
  });
  for(const col of [7,10,13,16,19,22]) {
   const cel=row.getCell(col);cel.numFmt="0.00";row.getCell(col+1).numFmt="0.00";
  }
 });
 ws.autoFilter={from:{row:5,column:1},to:{row:5+p.linhas.length,column:TOTAL}};
 ws.pageSetup={paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0};
 const avisos=workbook.addWorksheet("Limitações");
 avisos.columns=[{width:115}];
 avisos.addRow(["HOMOLOGAÇÃO — PRÉVIA NÃO OFICIAL"]);
 avisos.addRow(["Não corresponde ao ranking global e não contém posições ou Top 20."]);
 avisos.addRow(["Notas originais permanecem preservadas; notas efetivas podem refletir ajustes auditados."]);
 avisos.addRow(["Notas não recebidas ficam em branco; zero é uma nota válida."]);
 for(const aviso of p.avisos)avisos.addRow([textoSeguro(aviso)]);
 avisos.getCell("A1").font={bold:true,size:16,color:{argb:"FFB4232C"}};
 return new Uint8Array(await workbook.xlsx.writeBuffer());
}

/** PDF A4 paisagem paginado, construído somente no navegador autenticado. */
export function criarPaginasPreviaPdf(preview:PreviaRanking):HTMLCanvasElement[]{
 const p=prepararDocumento(preview);
 if(typeof document==="undefined")throw new Error("PDF disponível somente no navegador");
 const paginas:HTMLCanvasElement[]=[];
 const max=8;
 const total=Math.max(1,Math.ceil(p.linhas.length/max));
 for(let indice=0;indice<total;indice++){
  const canvas=document.createElement("canvas");canvas.width=1684;canvas.height=1190;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas indisponível");
  ctx.scale(2,2);
  ctx.fillStyle="#FFFFFF";ctx.fillRect(0,0,842,595);
  ctx.fillStyle="#113B5B";ctx.fillRect(0,0,842,104);
  ctx.fillStyle="#FFFFFF";ctx.font="bold 19px Arial";ctx.fillText("PRÉVIA DE SCORES EFETIVOS",28,38);
  ctx.fillStyle="#FFD2D5";ctx.font="bold 12px Arial";
  ctx.fillText("HOMOLOGAÇÃO — NÃO OFICIAL — SEM POSIÇÕES",28,63);
  ctx.fillStyle="#FFFFFF";ctx.font="11px Arial";ctx.fillText("Competência: "+p.competencia+"  |  Somente filiais autorizadas",28,85);
  ctx.fillStyle="#17314C";ctx.font="bold 10px Arial";
  ctx.fillText("Colaborador / matrícula",28,130);ctx.fillText("Filial",252,130);
  ctx.fillText("Segmento",335,130);ctx.fillText("Score",606,130);ctx.fillText("Situação",682,130);
  ctx.strokeStyle="#9DAAB7";ctx.beginPath();ctx.moveTo(28,139);ctx.lineTo(814,139);ctx.stroke();
  const pageRows=p.linhas.slice(indice*max,(indice+1)*max);
  pageRows.forEach((l,i)=>{
   const y=159+i*42;
   if(i%2===0){ctx.fillStyle="#EFF6FA";ctx.fillRect(25,y-18,791,40)}
   ctx.font="10px Arial";ctx.fillStyle="#142A41";
   const cortar=(v:string,max:number)=>v.length>max?v.slice(0,max-1)+"…":v;
   ctx.fillText(cortar(l.nome+" / "+l.matricula,36),28,y);
   ctx.fillText(cortar(l.filialId,12),252,y);
   ctx.fillText(cortar(l.categoria,38),335,y);
   ctx.fillText(valor(l.score),606,y);
   ctx.fillText(cortar(l.status,17),682,y);
   // Rastreabilidade por pilar: sempre exibir original e efetiva, inclusive zero.
   const detalhe=ESTRELAS.map((e,k)=>{
    const n=l.notas[e];return TITULOS[k].slice(0,4)+": "+(n?valor(n.original)+" → "+valor(n.efetiva)+(n.ajustada?" *":""):"ausente");
   }).join("   ");
   ctx.font="8px Arial";ctx.fillStyle="#4A5C70";ctx.fillText(cortar(detalhe,125),33,y+15);
  });
  ctx.fillStyle="#B4232C";ctx.font="bold 10px Arial";
  ctx.fillText("Sem posições oficiais, pódio ou classificação global.",28,510);
  ctx.fillStyle="#334E67";ctx.font="9px Arial";
  ctx.fillText("* Nota corrigida; os valores originais e efetivos constam acima. Pendências completas no XLSX.",28,530);
  ctx.fillText("Não utilizar para premiações ou decisões de RH.",28,547);
  ctx.fillText("Página "+(indice+1)+" de "+total,730,570);
  paginas.push(canvas);
 }
 return paginas;
}
export function criarPreviaPdf(preview:PreviaRanking):Blob{
 return criarPDFDireto(criarPaginasPreviaPdf(preview));
}
export function baixarArquivo(blob:Blob,nome:string):void{
 const url=URL.createObjectURL(blob);const a=document.createElement("a");
 a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),4000);
}
export async function baixarPreviaXlsx(preview:PreviaRanking):Promise<void>{
 const bytes=await criarBufferPreviaXlsx(preview);
 baixarArquivo(new Blob([bytes as BlobPart],{type:MIME}),"previa-efetiva-2027-"+String(preview.mes+1).padStart(2,"0")+".xlsx");
}
export function baixarPreviaPdf(preview:PreviaRanking):void{
 baixarArquivo(criarPreviaPdf(preview),"previa-efetiva-2027-"+String(preview.mes+1).padStart(2,"0")+".pdf");
}
