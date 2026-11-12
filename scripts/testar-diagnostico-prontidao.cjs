const assert=require("node:assert/strict"),fs=require("node:fs"),ts=require("typescript");
require.extensions[".ts"]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {diagnosticarProntidao}=require("../src/lib/diagnostico-prontidao-ranking.ts");
const pessoa=(id,extra={})=>({id,empresa_id:"e",nome:"Pessoa "+id,matricula:"M"+id,filial_id:"f",
 categoria_id:1,funcao:"Motorista",situacao_rh:"Ativo",participa_programa:true,
 categorizacao_status:"manual",desligado_manual:false,desligado_em:null,...extra});
const estrela=["seguranca","produtividade","dirigibilidade","jornada","treinamentos"];
const registro=(id,e,efetiva=75)=>({colaboradorId:id,competencia:"2027-10-01",estrela:e,
 registro:{id:id+"-"+e,original:efetiva,efetiva,ajustada:false}});
const base=(cs,regs)=>({escopo:"filiais-autorizadas",rankingOficial:false,colaboradores:cs,
 categorias:[{id:1,nome:"Florestal"}],registros:regs,alertas:[]});
let cont=0;function test(desc,fn){fn();cont++;console.log("✓ "+desc)}
test("Zero de Segurança é nota presente e não vira falta",()=>{
 const b=base([pessoa("1")],estrela.map(e=>registro("1",e,e==="seguranca"?0:75)));
 const d=diagnosticarProntidao(b,"2027-10-01");
 assert.equal(d.registrosComNotasCompletas,1);assert.equal(d.registrosPendentes,0);
 assert.equal(d.linhas[0].notaZero,true);assert.equal(d.linhas[0].notasPresentes,5);
 assert.equal(d.rankingOficial,false);
});
test("Ausência detecta pilar certo e não atribui posição",()=>{
 const d=diagnosticarProntidao(base([pessoa("1")],[registro("1","produtividade")]),"2027-10-01");
 assert.equal(d.registrosPendentes,1);assert.equal(d.linhas[0].pilaresAusentes.length,4);
 assert.equal(d.totaisPorMotivo.SEM_NOTA,1);
 assert.equal(Object.hasOwn(d.linhas[0],"posicao"),false);
});
test("Não participantes ignorados; desligados sinalizados",()=>{
 const d=diagnosticarProntidao(base([pessoa("1",{participa_programa:false}),pessoa("2",{desligado_manual:true})],[]),"2027-10-01");
 assert.equal(d.participantesAnalisados,1);assert.equal(d.naoParticipantesIgnorados,1);
 assert.ok(d.linhas[0].motivos.includes("DESLIGADO"));
});
test("Filial e categoria ausentes são impeditivos",()=>{
 const d=diagnosticarProntidao(base([pessoa("1",{filial_id:null,categoria_id:null})],[]),"2027-10-01");
 assert.ok(d.linhas[0].motivos.includes("SEM_FILIAL"));
 assert.ok(d.linhas[0].motivos.includes("SEM_CATEGORIA"));
});
test("Sinaliza limite RLS e metadados não homologados globalmente",()=>{
 const d=diagnosticarProntidao(base([pessoa("1")],[]),"2027-10-01");
 for(const aviso of ["ESCOPO_RLS_PARCIAL","SEM_DATA_ADMISSAO","FERIAS_NAO_HOMOLOGADAS",
 "HISTORICO_CATEGORIA_NAO_VALIDADO","SEGURANCA_SEM_FECHAMENTO"])
  assert.ok(d.impedimentosGlobais.includes(aviso));
});
test("Rejeita escopo oficial, competência errada, duplicação e nota inválida",()=>{
 const b=base([pessoa("1")],[]);
 assert.throws(()=>diagnosticarProntidao({...b,rankingOficial:true},"2027-10-01"),/Escopo/);
 assert.throws(()=>diagnosticarProntidao(b,"2026-01-01"),/Escopo/);
 assert.throws(()=>diagnosticarProntidao(base(b.colaboradores,[registro("1","jornada"),registro("1","jornada")]),"2027-10-01"),/duplicada/);
 assert.throws(()=>diagnosticarProntidao(base(b.colaboradores,[registro("1","jornada",101)]),"2027-10-01"),/inválida/);
});
test("Diagnóstico não é incluído em demo pública, nem cria rota",()=>{
 const handler=fs.readFileSync("src/server/api-ranking-efetivo.ts","utf8");
 const preview=fs.readFileSync("src/server/templates/ranking-efetivo-page.tsx","utf8");
 assert.ok(handler.includes("diagnosticarProntidao"));
 assert.ok(preview.includes("Diagnóstico de prontidão"));
 assert.equal(fs.existsSync("src/app/api/ranking-efetivo/route.ts"),false);
});
console.log(cont+" testes de prontidão aprovados");
