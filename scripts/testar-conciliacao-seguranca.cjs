const assert=require("node:assert/strict"),fs=require("node:fs"),Module=require("node:module"),ts=require("typescript");
require.extensions[".ts"]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const native=Module._load;
Module._load=function(name,parent,isMain){
 if(name==="server-only")return {};
 if(name==="@/lib/supabase/sessao-servidor")return {criarClienteAutenticadoServidor:async()=>null};
 if(name==="@/lib/calculo-ranking")return native.call(this,"../lib/calculo-ranking.ts",parent,isMain);
 if(name==="@/lib/dominio-rh-temporal")return native.call(this,"../lib/dominio-rh-temporal.ts",parent,isMain);
 if(name==="@/lib/conciliacao-seguranca")return native.call(this,"../lib/conciliacao-seguranca.ts",parent,isMain);
 return native.call(this,name,parent,isMain);
};
const seg=require("../src/lib/conciliacao-seguranca.ts");
const leitura=require("../src/server/consulta-ranking-efetivo.ts");
Module._load=native;
const p={id:"p",nome:"Pessoa fictícia",matricula:"M001",participa_programa:true};
const base=(penalizacoes=[],notas=[],fonteSegurancaLida=true)=>({
 escopo:"filiais-autorizadas",rankingOficial:false,colaboradores:[p],
 categorias:[],registros:notas,penalizacoesSeguranca:penalizacoes,fonteSegurancaLida,alertas:[]
});
const pen=(id="s1",tipo="advertencia")=>({id,colaborador_id:"p",competencia:"2027-10-01",
 tipo,descricao:"Ocorrência fictícia",importacao_id:"import-1"});
const nota=v=>({colaboradorId:"p",competencia:"2027-10-01",estrela:"seguranca",
 registro:{id:"nota1",original:v,efetiva:v,ajustada:false}});
let ok=0;function teste(nome,fn){fn();ok++;console.log("✓ "+nome)}
teste("Penalizações autênticas com identificação validada",()=>{
 assert.equal(seg.validarPenalizacoes([pen()],[p]).length,1);
 assert.throws(()=>seg.validarPenalizacoes([pen(),pen()],[p]),/inválida/);
 assert.throws(()=>seg.validarPenalizacoes([{...pen(),colaborador_id:"outra"}],[p]),/RLS/);
 assert.throws(()=>seg.validarPenalizacoes([{...pen(),tipo:"outro"}],[p]),/inválida/);
 assert.throws(()=>seg.validarPenalizacoes([{...pen(),competencia:"2027-02-29"}],[p]),/inválida/);
});
teste("Penalização com Segurança 100 exige revisão",()=>{
 const d=seg.conciliarSeguranca(base([pen()],[nota(100)]),"2027-10-01");
 assert.deepEqual(d.linhas[0].conflitos,["PENALIZACAO_COM_NOTA_100"]);
 assert.equal(d.totalAdvertencias,1);
 assert.equal(d.rankingOficial,false);
});
teste("Advertência ou acidente com Segurança ausente não cria nota",()=>{
 const d=seg.conciliarSeguranca(base([pen("a","advertencia"),pen("b","acidente")]),"2027-10-01");
 assert.deepEqual(d.linhas[0].conflitos,["PENALIZACAO_SEM_NOTA"]);
 assert.equal(d.linhas[0].notaSeguranca,null);
 assert.equal(d.totalAcidentes,1);
});
teste("Nota zero sem penalização é apenas revisão",()=>{
 const d=seg.conciliarSeguranca(base([],[nota(0)]),"2027-10-01");
 assert.deepEqual(d.linhas[0].conflitos,["NOTA_ZERO_SEM_PENALIZACAO"]);
});
teste("Ausência de penalizações não gera Segurança 100 nem fechamento das fontes",()=>{
 const d=seg.conciliarSeguranca(base([]),"2027-10-01");
 assert.equal(d.linhas[0].notaSeguranca,null);
 assert.equal(d.fonteAdvertenciasFechada,false);
 assert.equal(d.fonteAcidentesFechada,false);
 assert.equal(d.fonteLida,true);
});
teste("Fonte não lida não se confunde com lista vazia",()=>{
 const d=seg.conciliarSeguranca({...base([],[],false),penalizacoesSeguranca:undefined},"2027-10-01");
 assert.equal(d.fonteLida,false);assert.deepEqual(d.linhas,[]);
});
teste("Falha fechada em nota de Segurança corrigida, duplicada ou inválida",()=>{
 const a=nota(100);
 assert.throws(()=>seg.conciliarSeguranca(base([],[a,a]),"2027-10-01"),/duplicada/);
 assert.throws(()=>seg.conciliarSeguranca(base([],[{...a,registro:{...a.registro,efetiva:90}}]),"2027-10-01"),/inconsistente/);
 assert.throws(()=>seg.conciliarSeguranca(base([],[{...a,registro:{...a.registro,ajustada:true}}]),"2027-10-01"),/inconsistente/);
});
teste("A leitura SSR utiliza paginação sob RLS e API não cria ranking",()=>{
 const l=fs.readFileSync("src/server/consulta-ranking-efetivo.ts","utf8");
 const h=fs.readFileSync("src/server/api-ranking-efetivo.ts","utf8");
 assert.match(l,/lerTodasPaginas<PenalizacaoSeguranca>/);
 assert.match(l,/fonteSegurancaLida:true/);
 assert.match(h,/conciliarSeguranca/);
 assert.equal(fs.existsSync("src/app/api/ranking-efetivo/route.ts"),false);
});
console.log(ok+" testes de Segurança concluídos");
