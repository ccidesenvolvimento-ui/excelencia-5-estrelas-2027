// Stage 2: consulta autenticada integral (somente fixtures fictícias em memória).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const Module=require("node:module");
const ts=require("typescript");
const originalLoad=Module._load;
const originalTs=Module._extensions[".ts"];
let cliente=null;
Module._extensions[".ts"]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
Module._load=function(name,parent,isMain){
 if(name==="server-only")return {};
 if(name==="@/lib/supabase/sessao-servidor")return {criarClienteAutenticadoServidor:async()=>cliente};
 if(name==="@/lib/calculo-ranking")return originalLoad.call(this,"../lib/calculo-ranking.ts",parent,isMain);
 if(name==="@/lib/dominio-rh-temporal")return originalLoad.call(this,"../lib/dominio-rh-temporal.ts",parent,isMain);
 if(name==="@/lib/conciliacao-seguranca")return originalLoad.call(this,"../lib/conciliacao-seguranca.ts",parent,isMain);
 return originalLoad.call(this,name,parent,isMain);
};
const leitura=require("../src/server/consulta-ranking-efetivo.ts");
Module._load=originalLoad;
const pessoa={id:"p1",empresa_id:"e1",matricula:"TEST001",nome:"Teste fictício",filial_id:"f1",categoria_id:1,funcao:"Motorista",situacao_rh:"Ativo",participa_programa:true,categorizacao_status:"manual",desligado_manual:false,desligado_em:null};
const registro=(id="n1",nota=75,efetiva=90,possui_ajuste=true)=>({id,colaborador_id:"p1",competencia:"2027-10-01",estrela:"produtividade",nota,nota_efetiva:efetiva,possui_ajuste});
let contador=0;
function teste(t,fn){return Promise.resolve().then(fn).then(()=>{contador++;console.log("✓ "+t)})}
function fonteDe(tabelas,{falhar=null}={}){
 return (tabela,colunas)=>({
  order(_col,_op){return this},
  async range(a,b){
   if(tabela===falhar)return {data:null,error:{message:"RLS / falha"}};
   const rows=tabelas[tabela]??[];
   return {data:rows.slice(a,b+1),error:null};
  }
 });
}
async function executar(){
 await teste("Projeção preserva original e efetiva",()=>{
  const [x]=leitura.prepararRegistros([registro()],[pessoa]);
  assert.equal(x.registro.original,75);assert.equal(x.registro.efetiva,90);assert.equal(x.registro.ajustada,true);
 });
 await teste("Zero válido não vira ausência",()=>{
  const [x]=leitura.prepararRegistros([registro("n2",75,0,true)],[pessoa]);
  assert.equal(x.registro.efetiva,0);
 });
 await teste("RLS não pode retornar colaborador inexistente",()=>{
  assert.throws(()=>leitura.prepararRegistros([registro()],[]),/não autorizados/);
 });
 await teste("Duplicação de notas por competência é rejeitada",()=>{
  assert.throws(()=>leitura.prepararRegistros([registro("n1"),registro("n2")],[pessoa]),/duplicada/);
 });
 await teste("Ausência de ajuste não pode mudar a nota",()=>{
  assert.throws(()=>leitura.prepararRegistros([registro("n3",75,80,false)],[pessoa]),/sem ajuste/);
 });
 await teste("Segurança não admite correção nem valor fora de 0 ou 100",()=>{
  assert.throws(()=>leitura.prepararRegistros([{...registro(),estrela:"seguranca"}],[pessoa]),/Segurança/);
  assert.throws(()=>leitura.prepararRegistros([{...registro(),estrela:"seguranca",nota:75,nota_efetiva:75,possui_ajuste:false}],[pessoa]),/Segurança/);
 });
 await teste("Paginação completa com mais de 500 linhas sem truncar",async()=>{
  const rows=Array.from({length:1001},(_,i)=>({id:"n"+i}));
  const all=await leitura.lerTodasPaginas(fonteDe({notas:rows}),"notas","id");
  assert.equal(all.length,1001);
 });
 await teste("Falha na página posterior não produz lista parcial",async()=>{
  const rows=Array.from({length:500},(_,i)=>({id:"n"+i}));
  let chamadas=0;
  const f=()=>({order(){return this},async range(a,b){chamadas++;return chamadas===2?{error:{message:"erro"},data:null}:{data:rows.slice(a,b+1),error:null}}});
  await assert.rejects(()=>leitura.lerTodasPaginas(f,"notas","id"),/incompleta/);
 });
 await teste("Paginação rejeita IDs repetidos",async()=>{
  await assert.rejects(()=>leitura.lerTodasPaginas(fonteDe({notas:[{id:"x"},{id:"x"}]}),"notas","id"),/duplicado/);
 });
 await teste("Bloqueio sem flag é fail closed",async()=>{
  delete process.env.EXCELENCIA_AUTH_GUARD_ENABLED;
  delete process.env.EXCELENCIA_AJUSTES_API_ENABLED;
  await assert.rejects(()=>leitura.consultarBaseRankingEfetivo(),/desabilitada/);
 });
 await teste("SSR autenticado consulta integral RLS, sem ranking global",async()=>{
  process.env.EXCELENCIA_AUTH_GUARD_ENABLED="true";
  process.env.EXCELENCIA_AJUSTES_API_ENABLED="true";
  const tabelas={
   notas_mensais_efetivas:[registro(),{...registro("n2026"),competencia:"2026-10-01"}],
   colaboradores:[pessoa],
   categorias:[{id:1,nome:"Florestal"}]
  };
  cliente={
   auth:{async getUser(){return {data:{user:{id:"fake"}},error:null}}},
   from(tabela){return {select(colunas){return fonteDe(tabelas)(tabela,colunas)}}}
  };
  const result=await leitura.consultarBaseRankingEfetivo();
  assert.equal(result.registros.length,1);
  assert.equal(result.registros[0].registro.efetiva,90);
  assert.equal(result.escopo,"filiais-autorizadas");
  assert.equal(result.rankingOficial,false);
  assert.ok(result.alertas.some(x=>x.includes("admissão")));
 });
 await teste("Sessão ausente bloqueia consulta",async()=>{
  cliente={auth:{async getUser(){return {data:{user:null},error:null}}}};
  await assert.rejects(()=>leitura.consultarBaseRankingEfetivo(),/não autenticada/);
 });
 console.log(contador+" verificações de consulta RLS concluídas.");
}
executar().catch(e=>{console.error(e);process.exitCode=1});
