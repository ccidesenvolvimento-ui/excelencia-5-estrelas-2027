/* Regressão das exportações opt-in: sem dados externos e sem rotas públicas. */
const assert=require("node:assert/strict"),fs=require("node:fs"),ts=require("typescript");
require.extensions[".ts"]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
}).outputText,file);
const ExcelJS=require("exceljs");
const exp=require("../src/lib/exportar-previa-efetiva.ts");
const p=(id,nome,nota,score)=>({
 id,nome,matricula:"F"+id,filialId:"filial-a",categoria:"Florestal",competencia:"2027-10-01",
 notas:{seguranca:{id:"s"+id,original:0,efetiva:0,ajustada:false},
  produtividade:{id:"p"+id,original:75,efetiva:nota,ajustada:nota!==75},
  dirigibilidade:{id:"d"+id,original:80,efetiva:80,ajustada:false},
  jornada:{id:"j"+id,original:90,efetiva:90,ajustada:false},
  treinamentos:{id:"t"+id,original:100,efetiva:100,ajustada:false}},
 score,status:"Inelegível",faltantes:[],posicao:null
});
const previa=(linhas)=>({mes:9,escopo:"filiais-autorizadas",rankingOficial:false,linhas,
 avisos:["Sem ranking global; acesso somente às filiais autorizadas."]});
let qtd=0;async function teste(nome,fn){await fn();qtd++;console.log("✓ "+nome)}
async function executar(){
 await teste("Não aceita ranking oficial nem posições",()=>{
  const a=previa([p("1","Exemplo",90,62)]);
  assert.throws(()=>exp.prepararDocumento({...a,rankingOficial:true}),/prévia autorizada/);
  assert.throws(()=>exp.prepararDocumento({...a,linhas:[{...a.linhas[0],posicao:1}]}),/posição/);
 });
 await teste("Notas ausentes e zero continuam distintos",()=>{
  const a=previa([p("1","Exemplo",90,62)]);
  a.linhas[0].notas.treinamentos=undefined;
  const d=exp.prepararDocumento(a);
  assert.equal(d.linhas[0].notas.seguranca.efetiva,0);
  assert.equal(d.linhas[0].notas.treinamentos,undefined);
 });
 await teste("Não permite edição manual de Segurança na exportação",()=>{
  const a=previa([p("1","Exemplo",90,62)]);
  a.linhas[0].notas.seguranca={id:"s",original:0,efetiva:100,ajustada:true};
  assert.throws(()=>exp.prepararDocumento(a),/Segurança/);
 });
 await teste("XLSX real contém 24 colunas, dados originais e efetivos, escopo, avisos",async()=>{
  const b=await exp.criarBufferPreviaXlsx(previa([p("1","=HIPERLINK(1) [fictício]",90,62),p("2","Pessoa teste",75,58.25)]));
  assert.ok(b.length>2000);
  const x=new ExcelJS.Workbook();await x.xlsx.load(b);
  const ws=x.getWorksheet("Prévia mensal");
  assert.ok(ws);assert.equal(ws.columnCount,24);
  assert.match(ws.getCell("A2").value,/NÃO OFICIAL/);
  assert.ok(String(ws.getCell("A6").value).startsWith("'="),"Célula protege contra formula injection");
  assert.equal(ws.getCell("G6").value,0);
  assert.equal(ws.getCell("H6").value,0);
  assert.equal(ws.getCell("J6").value,75);
  assert.equal(ws.getCell("K6").value,90);
  assert.equal(ws.getCell("L6").value,true);
  assert.equal(ws.getCell("V6").value,62);
  assert.equal(ws.getCell("K7").value,75);
  assert.equal(x.getWorksheet("Limitações").getCell("A2").value,"Não corresponde ao ranking global e não contém posições ou Top 20.");
 });
 await teste("PDF válido e paginado, exibindo notas originais e efetivas",async()=>{
  const textos=[];
  const ctx={
   scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},
   fillText(...args){textos.push(String(args[0]))}
  };
  const original=global.document;
  global.document={createElement(tag){
   assert.equal(tag,"canvas");
   return {width:0,height:0,getContext(){return ctx},
    toDataURL(){return "data:image/jpeg;base64,"+Buffer.from("jpeg-ficticio").toString("base64")}};
  }};
  try{
   const preview=previa(Array.from({length:17},(_,i)=>p(""+(i+1),"Pessoa "+i,90,62)));
   const paginas=exp.criarPaginasPreviaPdf(preview);
   assert.equal(paginas.length,3);
   assert.ok(textos.some(t=>t.includes("75,00 → 90,00")),"PDF deve registrar original e efetiva");
   assert.ok(textos.some(t=>t.includes("NÃO OFICIAL")));
   const blob=exp.criarPreviaPdf(preview);
   assert.equal(blob.type,"application/pdf");
   assert.ok((await blob.text()).startsWith("%PDF-1.4"));
  } finally {global.document=original}
 });
 await teste("A página Node exige sessão e conserva isolamento",()=>{
  const page=fs.readFileSync("src/server/templates/ranking-efetivo-page.tsx","utf8");
  assert.match(page,/credentials:"same-origin"/);
  assert.match(page,/Exportar prévia PDF \(não oficial\)/);
  assert.match(page,/Exportar prévia XLSX \(não oficial\)/);
  assert.equal(fs.existsSync("src/app/ranking-efetivo-live/page.tsx"),false);
  assert.equal(fs.existsSync("src/app/api/ranking-efetivo/route.ts"),false);
 });
 console.log(qtd+" testes de exportação da prévia executados.");
}
executar().catch(e=>{console.error(e);process.exitCode=1});
