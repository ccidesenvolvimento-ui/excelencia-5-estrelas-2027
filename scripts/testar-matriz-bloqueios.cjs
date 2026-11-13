// Issue #93 — matriz fail-closed de homologação, fixtures 100% fictícias.
const assert=require("node:assert/strict");
const fs=require("node:fs"),ts=require("typescript");
require.extensions[".ts"]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {montarMatrizBloqueios}=require("../src/lib/matriz-bloqueios-homologacao.ts");
const participante=(id="p1",motivos=["SITUACAO_RH_NAO_HOMOLOGADA"])=>({
 colaboradorId:id,nome:"Motorista fictício",matricula:"M-"+id,filialId:"filialA",
 motivos,pilaresAusentes:[],notasPresentes:5,notaZero:false,
 feriasNoMes:0,categoriasHistoricasNoMes:1,categoriaHistoricaId:1
});
const diag=(linhas=[participante()])=>({
 competencia:"2027-10-01",escopo:"filiais-autorizadas",rankingOficial:false,
 participantesAnalisados:linhas.length,naoParticipantesIgnorados:0,
 registrosComNotasCompletas:linhas.filter(x=>x.notasPresentes===5).length,
 registrosPendentes:linhas.filter(x=>x.notasPresentes<5).length,
 totaisPorMotivo:{},linhas,impedimentosGlobais:["ESCOPO_RLS_PARCIAL"],
 fontesHistoricasLidas:true
});
const seg=(linhas=[{colaboradorId:"p1",matricula:"M-p1",nome:"Motorista fictício",
 advertencias:0,acidentes:0,notaSeguranca:100,conflitos:[]}])=>({
 competencia:"2027-10-01",escopo:"filiais-autorizadas",rankingOficial:false,
 fonteLida:true,fonteAdvertenciasFechada:false,fonteAcidentesFechada:false,
 totalAdvertencias:0,totalAcidentes:0,linhas,avisos:[]
});
let n=0;function teste(nome,fn){fn();n++;console.log("✓ "+nome)}
teste("Notas completas não habilitam ranking oficial ou certificado de fontes",()=>{
 const m=montarMatrizBloqueios(diag(),seg());
 assert.equal(m.situacao,"BLOQUEADO");assert.equal(m.rankingOficial,false);
 assert.equal(m.completosNasNotas,1);assert.equal(m.totalComBloqueios,1);
 assert.ok(m.requisitosGlobaisNaoComprovados.includes("ESCOPO_RLS_PARCIAL"));
 assert.ok(m.requisitosGlobaisNaoComprovados.includes("SEGURANCA_SEM_FECHAMENTO_DE_ADVERTENCIAS"));
 assert.ok(m.requisitosGlobaisNaoComprovados.includes("SEGURANCA_SEM_FECHAMENTO_DE_ACIDENTES"));
 assert.ok(!Object.hasOwn(m,"posicoes"));
});
teste("Penalização com Segurança 100 é conflito, sem sobrescrever nota",()=>{
 const s=seg([{...seg().linhas[0],advertencias:1,notaSeguranca:100,conflitos:["PENALIZACAO_COM_NOTA_100"]}]);
 const m=montarMatrizBloqueios(diag(),s);
 const conflito=m.bloqueios.find(x=>x.codigo==="PENALIZACAO_COM_NOTA_100");
 assert.equal(conflito.evidencia,"conflito");
 assert.equal(conflito.classe,"seguranca");
 assert.equal(conflito.colaboradorId,"p1");
});
teste("Penalização sem nota é bloqueio observado; zero sem penalização pede revisão",()=>{
 for(const [codigo,estado] of [["PENALIZACAO_SEM_NOTA","observado"],["NOTA_ZERO_SEM_PENALIZACAO","nao_comprovado"]]){
  const m=montarMatrizBloqueios(diag(),seg([{...seg().linhas[0],conflitos:[codigo]}]));
  assert.equal(m.bloqueios.find(x=>x.codigo===codigo).evidencia,estado);
 }
});
teste("RH, categoria e ausência de nota geram bloqueios identificáveis por participante",()=>{
 const p=participante("p1",["SITUACAO_RH_NAO_HOMOLOGADA","SEM_NOTA","FERIAS_NO_MES","CATEGORIA_HISTORICA_DIVERGENTE"]);
 const m=montarMatrizBloqueios(diag([p]),seg());
 assert.equal(m.bloqueios.filter(x=>x.colaboradorId==="p1").length,4);
 assert.ok(m.quantidadesPorClasse.dados>=1);
 assert.ok(m.quantidadesPorClasse.rh>=3);
});
teste("Sem participantes, impedimentos globais permanecem e não há falsa aprovação",()=>{
 const m=montarMatrizBloqueios(diag([]),seg([]));
 assert.equal(m.situacao,"BLOQUEADO");assert.equal(m.totalComBloqueios,0);
 assert.ok(m.bloqueios.length>=6);
});
teste("Fonte não consultada jamais é tratada como ausência comprovada",()=>{
 const s={...seg([]),fonteLida:false};
 const m=montarMatrizBloqueios(diag(),s);
 assert.ok(m.bloqueios.find(x=>x.codigo==="FONTE_SEGURANCA_NAO_CONSULTADA"));
 assert.equal(m.situacao,"BLOQUEADO");
});
teste("Fonte RH não consultada exige comprovação",()=>{
 const d={...diag(),fontesHistoricasLidas:false};
 const m=montarMatrizBloqueios(d,seg());
 assert.ok(m.bloqueios.find(x=>x.codigo==="FONTES_RH_NAO_CONSULTADAS"));
});
teste("Rejeita escopos diferentes, períodos diferentes, posições ou conciliação parcial",()=>{
 assert.throws(()=>montarMatrizBloqueios({...diag(),rankingOficial:true},seg()),/escopo/);
 assert.throws(()=>montarMatrizBloqueios(diag(),{...seg(),competencia:"2027-09-01"}),/período/);
 assert.throws(()=>montarMatrizBloqueios(diag(),seg([])),/incompleta/);
 assert.throws(()=>montarMatrizBloqueios(diag(),seg([{...seg().linhas[0],colaboradorId:"oculto"}])),/fora do escopo/);
 assert.throws(()=>montarMatrizBloqueios({...diag(),participantesAnalisados:2},seg()),/Contagem/);
});
teste("Sem ativar página pública, a API expõe somente resultado não oficial",()=>{
 const api=fs.readFileSync("src/server/api-ranking-efetivo.ts","utf8");
 const page=fs.readFileSync("src/server/templates/ranking-efetivo-page.tsx","utf8");
 assert.ok(api.includes("montarMatrizBloqueios"));
 assert.ok(page.includes("Matriz de bloqueios"));
 assert.ok(page.includes("Nenhum resultado desta página autoriza posições"));
 assert.equal(fs.existsSync("src/app/api/ranking-efetivo/route.ts"),false);
});
console.log(n+" testes da matriz de bloqueios concluídos.");
