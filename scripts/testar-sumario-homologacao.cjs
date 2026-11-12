// Regressão: relatório agregado e não identificável da matriz (Issue #95).
const assert=require("node:assert/strict"),fs=require("node:fs"),ts=require("typescript");
require.extensions[".ts"]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {montarMatrizBloqueios}=require("../src/lib/matriz-bloqueios-homologacao.ts");
const {gerarSumarioHomologacao,serializarSumarioHomologacao}=require("../src/lib/sumario-homologacao.ts");
const participante=id=>({colaboradorId:id,nome:"NOME SIGILOSO "+id,matricula:"MAT-SIGILOSA-"+id,
 filialId:"filialA",motivos:["SEM_NOTA","SITUACAO_RH_NAO_HOMOLOGADA"],
 pilaresAusentes:["jornada"],notasPresentes:4,notaZero:false,feriasNoMes:0,
 categoriasHistoricasNoMes:0,categoriaHistoricaId:null});
const diagnostico=(ids=["id-sigiloso-01","id-sigiloso-02"])=>({
 competencia:"2027-10-01",escopo:"filiais-autorizadas",rankingOficial:false,
 participantesAnalisados:ids.length,naoParticipantesIgnorados:0,
 registrosComNotasCompletas:0,registrosPendentes:ids.length,
 totaisPorMotivo:{},linhas:ids.map(participante),impedimentosGlobais:["ESCOPO_RLS_PARCIAL"],
 fontesHistoricasLidas:true
});
const seguranca=(ids=["id-sigiloso-01","id-sigiloso-02"])=>({
 competencia:"2027-10-01",escopo:"filiais-autorizadas",rankingOficial:false,
 fonteLida:true,fonteAdvertenciasFechada:false,fonteAcidentesFechada:false,
 totalAdvertencias:1,totalAcidentes:0,
 linhas:ids.map((id,i)=>({colaboradorId:id,matricula:"MAT-SIGILOSA-"+id,
 nome:"NOME SIGILOSO "+id,advertencias:i===0?1:0,acidentes:0,
 notaSeguranca:i===0?100:0,conflitos:i===0?["PENALIZACAO_COM_NOTA_100"]:["NOTA_ZERO_SEM_PENALIZACAO"]})),avisos:[]
});
let passed=0;function teste(nome,fn){fn();passed++;console.log("✓ "+nome)}
teste("Sumário somente com agregados, sem nomes, matrículas, IDs ou notas individuais",()=>{
 const m=montarMatrizBloqueios(diagnostico(),seguranca());
 const antes=JSON.stringify(m);
 const texto=serializarSumarioHomologacao(m);
 const s=JSON.parse(texto);
 assert.deepEqual(Object.keys(s),[
  "versao","tipo","competencia","escopo","rankingOficial","situacao",
  "participantesAnalisados","completosNasNotas","totalComBloqueios",
  "totalOcorrencias","quantidadesPorClasse","quantidadesPorEvidencia",
  "requisitosGlobaisNaoComprovados","avisos"
 ]);
 for(const proibido of ["id-sigiloso","NOME SIGILOSO","MAT-SIGILOSA","colaboradorId","matricula","nome","notaSeguranca","nota_efetiva","posicao"])
  assert.ok(!texto.includes(proibido),'Vazamento: '+proibido);
 assert.equal(s.situacao,"BLOQUEADO");
 assert.equal(s.rankingOficial,false);
 assert.equal(s.escopo,"filiais-autorizadas");
 assert.equal(s.participantesAnalisados,2);
 assert.equal(s.completosNasNotas,0);
 assert.equal(s.totalComBloqueios,2);
 assert.equal(s.quantidadesPorClasse.governanca,8);
 assert.equal(s.quantidadesPorEvidencia.conflito,1);
 assert.equal(JSON.stringify(m),antes,"Matriz original não deve ser modificada");
});
teste("Com zero participantes permanece bloqueado e não revela lista nominal",()=>{
 const m=montarMatrizBloqueios(diagnostico([]),seguranca([]));
 const s=gerarSumarioHomologacao(m);
 assert.equal(s.participantesAnalisados,0);
 assert.equal(s.situacao,"BLOQUEADO");
 assert.ok(s.requisitosGlobaisNaoComprovados.length>0);
});
teste("Recusa período, escopo ou estado adulterados",()=>{
 const m=montarMatrizBloqueios(diagnostico(),seguranca());
 assert.throws(()=>gerarSumarioHomologacao({...m,situacao:"APROVADO"}),/inválida/);
 assert.throws(()=>gerarSumarioHomologacao({...m,rankingOficial:true}),/inválida/);
 assert.throws(()=>gerarSumarioHomologacao({...m,escopo:"global"}),/inválida/);
 assert.throws(()=>gerarSumarioHomologacao({...m,competencia:"2026-10-01"}),/inválida/);
});
teste("Rejeita contagens erradas e requisitos globais removidos",()=>{
 const m=montarMatrizBloqueios(diagnostico(),seguranca());
 assert.throws(()=>gerarSumarioHomologacao({...m,completosNasNotas:3}),/inválida/);
 assert.throws(()=>gerarSumarioHomologacao({...m,quantidadesPorClasse:{...m.quantidadesPorClasse,rh:0}}),/divergente/);
 assert.throws(()=>gerarSumarioHomologacao({...m,requisitosGlobaisNaoComprovados:[]}),/incompletas/);
});
teste("Recusa um bloqueio inventado com tipo fora do contrato",()=>{
 const m=montarMatrizBloqueios(diagnostico(),seguranca());
 assert.throws(()=>gerarSumarioHomologacao({...m,bloqueios:[...m.bloqueios,{codigo:"INVÁLIDO",classe:"dados",evidencia:"observado",colaboradorId:null,descricao:"teste"}]}),/inconsistente/);
});
teste("UI de exportação permanece isolada e exige matriz recebida de API autenticada",()=>{
 const page=fs.readFileSync("src/server/templates/ranking-efetivo-page.tsx","utf8");
 const exporter=fs.readFileSync("src/lib/sumario-homologacao.ts","utf8");
 assert.match(page,/Exportar sumário agregado JSON \(sem dados pessoais\)/);
 assert.match(page,/if\(!dados.matriz\)/);
 assert.match(page,/await import\("@\/lib\/sumario-homologacao"\)/);
 assert.match(exporter,/JSON.stringify\(gerarSumarioHomologacao\(matriz\)/);
 assert.ok(!exporter.includes("dados-demo"));
 assert.equal(fs.existsSync("src/app/api/ranking-efetivo/route.ts"),false);
});
console.log(passed+" verificações do sumário de homologação aprovadas.");
