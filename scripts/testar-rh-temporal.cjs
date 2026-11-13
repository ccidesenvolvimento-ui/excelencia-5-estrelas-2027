// Etapa 6: validação RH temporal com fixtures fictícias, sem Supabase Cloud.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const Module=require("node:module");
const ts=require("typescript");
const native=Module._load;
require.extensions[".ts"]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,"utf8"),
 {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
Module._load=function(name,parent,isMain){
 if(name==="server-only")return {};
 if(name==="@/lib/supabase/sessao-servidor")return {criarClienteAutenticadoServidor:async()=>null};
 if(name==="@/lib/calculo-ranking")return native.call(this,"../lib/calculo-ranking.ts",parent,isMain);
 if(name==="@/lib/dominio-rh-temporal")return native.call(this,"../lib/dominio-rh-temporal.ts",parent,isMain);
 if(name==="@/lib/conciliacao-seguranca")return native.call(this,"../lib/conciliacao-seguranca.ts",parent,isMain);
 return native.call(this,name,parent,isMain);
};
const rh=require("../src/lib/dominio-rh-temporal.ts");
const leitura=require("../src/server/consulta-ranking-efetivo.ts");
Module._load=native;
const {diagnosticarProntidao}=require("../src/lib/diagnostico-prontidao-ranking.ts");
const pessoa={id:"p",empresa_id:"e",matricula:"001",nome:"Exemplo",filial_id:"f",categoria_id:1,
 funcao:"Motorista",situacao_rh:"Ativo",participa_programa:true,categorizacao_status:"manual",
 desligado_manual:false,desligado_em:null};
const ferias=(id="f1",inicio="2027-10-12",termino="2027-10-20")=>({id,colaborador_id:"p",inicio,termino,dias_gozo:9});
const hist=(id="h1",inicio="2027-02-01",fim=null,categoria_id=1)=>({id,colaborador_id:"p",
 categoria_id,origem:"manual",competencia_inicio:inicio,competencia_fim:fim});
const base=(f=[],h=[],lidas=true)=>({
 escopo:"filiais-autorizadas",rankingOficial:false,colaboradores:[pessoa],
 categorias:[{id:1,nome:"Florestal"},{id:2,nome:"Sucro"}],registros:[],
 ferias:f,historicoCategorias:h,fontesHistoricasLidas:lidas,alertas:[]
});
let n=0;const test=(nome,fn)=>{fn();n++;console.log("✓ "+nome)};
test("Validação cronológica considera meses reais e bissextos",()=>{
 assert.equal(rh.dataValida("2027-02-29"),false);
 assert.equal(rh.dataValida("2028-02-29"),true);
 assert.equal(rh.periodoCompetencia("2027-10-01").termino,"2027-10-31");
 assert.equal(rh.intercepta({inicio:"2027-09-28",termino:"2027-10-01"},
  {inicio:"2027-10-01",termino:"2027-10-31"}),true);
});
test("Férias autorizadas preservam intervalos e detectam datas inválidas",()=>{
 assert.equal(rh.validarFerias([ferias()],[pessoa]).length,1);
 assert.throws(()=>rh.validarFerias([ferias("x","2027-02-29","2027-03-05")],[pessoa]),/inválido/);
 assert.throws(()=>rh.validarFerias([ferias("x","2027-10-20","2027-10-12")],[pessoa]),/inválido/);
 assert.throws(()=>rh.validarFerias([ferias("x"),ferias("x")],[pessoa]),/inválido/);
 assert.throws(()=>rh.validarFerias([{...ferias(),colaborador_id:"outro"}],[pessoa]),/RLS/);
});
test("Histórico valida início, fim, participação e colaborador autorizado",()=>{
 assert.equal(rh.validarHistoricoCategorias([hist()],[pessoa]).length,1);
 assert.throws(()=>rh.validarHistoricoCategorias([hist("x","2027-12-01","2027-03-01")],[pessoa]),/inválido/);
 assert.throws(()=>rh.validarHistoricoCategorias([{...hist(),colaborador_id:"nao-autorizado"}],[pessoa]),/RLS/);
 assert.throws(()=>rh.validarHistoricoCategorias([{...hist(),origem:"nao_participa"}],[pessoa]),/inválido/);
});
test("Férias que interceptam o mês são sinalizadas, sem alterar score",()=>{
 const d=diagnosticarProntidao(base([ferias()], [hist()]),"2027-10-01");
 assert.equal(d.fontesHistoricasLidas,true);
 assert.equal(d.linhas[0].feriasNoMes,1);
 assert.equal(d.linhas[0].categoriasHistoricasNoMes,1);
 assert.equal(d.linhas[0].categoriaHistoricaId,1);
 assert.ok(d.linhas[0].motivos.includes("FERIAS_NO_MES"));
 assert.ok(!d.linhas[0].motivos.includes("CATEGORIA_HISTORICA_AUSENTE"));
 assert.equal(d.rankingOficial,false);
});
test("Sem registros lidos não equivale a fontes não consultadas",()=>{
 const lido=diagnosticarProntidao(base([],[]),"2027-10-01");
 const naoLido=diagnosticarProntidao({...base([],[],false),ferias:undefined,historicoCategorias:undefined},"2027-10-01");
 assert.equal(lido.linhas[0].feriasNoMes,0);
 assert.ok(lido.linhas[0].motivos.includes("CATEGORIA_HISTORICA_AUSENTE"));
 assert.equal(naoLido.linhas[0].feriasNoMes,null);
 assert.ok(naoLido.linhas[0].motivos.includes("FONTE_RH_NAO_CONSULTADA"));
 assert.equal(naoLido.fontesHistoricasLidas,false);
});
test("Detecta sobreposição de períodos e categoria histórica divergente",()=>{
 const d=diagnosticarProntidao(base(
  [ferias("f1"),ferias("f2","2027-10-18","2027-10-24")],
  [hist("h1","2027-01-01",null,2),hist("h2","2027-07-01",null,2)]
 ),"2027-10-01");
 const m=d.linhas[0].motivos;
 assert.ok(m.includes("FERIAS_SOBREPOSTAS"));
 assert.ok(m.includes("HISTORICO_CATEGORIAS_SOBREPOSTO"));
 const apenas=diagnosticarProntidao(base([],[hist("h", "2027-01-01",null,2)]),"2027-10-01");
 assert.ok(apenas.linhas[0].motivos.includes("CATEGORIA_HISTORICA_DIVERGENTE"));
});
test("Férias fora da competência não contaminam o diagnóstico",()=>{
 const d=diagnosticarProntidao(base([ferias("f","2027-09-01","2027-09-15")],
  [hist("h","2027-11-01",null,2)]),"2027-10-01");
 assert.equal(d.linhas[0].feriasNoMes,0);
 assert.equal(d.linhas[0].categoriasHistoricasNoMes,0);
 assert.ok(d.linhas[0].motivos.includes("CATEGORIA_HISTORICA_AUSENTE"));
});
test("Nova consulta SSR inclui as duas fontes RLS sem fallback demonstrativo",()=>{
 const s=fs.readFileSync("src/server/consulta-ranking-efetivo.ts","utf8");
 assert.match(s,/lerTodasPaginas<FeriasRH>/);
 assert.match(s,/lerTodasPaginas<HistoricoCategoriaRH>/);
 assert.match(s,/fontesHistoricasLidas:true/);
 assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|createClient\([^)]*service_role/i.test(s),"Consulta não deve utilizar credenciais elevadas");
});
console.log(n+" verificações de RH temporal aprovadas");
