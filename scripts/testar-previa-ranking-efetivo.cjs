// Testes do contrato e da projeção mensal: exclusivamente dados fictícios.
const assert=require("node:assert/strict");
const fs=require("node:fs"),ts=require("typescript"),Module=require("node:module");
Module._extensions[".ts"]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const proj=require("../src/lib/projecao-ranking-efetivo.ts");
const dados=require("../src/lib/calculo-ranking.ts");
const c={id:"p1",empresa_id:"e",matricula:"F-01",nome:"Motorista Teste",filial_id:"a",categoria_id:1,funcao:"Motorista",situacao_rh:"Ativo",participa_programa:true,categorizacao_status:"manual",desligado_manual:false,desligado_em:null};
const base=()=>({escopo:"filiais-autorizadas",rankingOficial:false,
 colaboradores:[c],categorias:[{id:1,nome:"Florestal"}],registros:[],alertas:[]});
const registro=(estrela,original,efetiva=original,ajustada=false)=>({
 colaboradorId:"p1",competencia:"2027-10-01",estrela,
 registro:{id:estrela,original,efetiva,ajustada}
});
let n=0;const teste=(nome,fn)=>{fn();n++;console.log("✓ "+nome)};
teste("Sem notas é pendente, não nota zero",()=>{
 const p=proj.projetarPreviaEfetiva(base(),9);
 assert.equal(p.linhas[0].score,null);assert.equal(p.linhas[0].status,"Pendente");
 assert.equal(p.linhas[0].posicao,null);assert.equal(p.rankingOficial,false);
});
teste("Scores corrigidos usam somente nota efetiva, original é preservada",()=>{
 const b=base();
 b.registros=[registro("seguranca",100),registro("produtividade",75,90,true),
 registro("dirigibilidade",80),registro("jornada",90),registro("treinamentos",100)];
 const p=proj.projetarPreviaEfetiva(b,9);
 assert.equal(p.linhas[0].score,92);
 assert.equal(p.linhas[0].notas.produtividade.original,75);
 assert.equal(p.linhas[0].notas.produtividade.efetiva,90);
 assert.equal(p.linhas[0].posicao,null);
});
teste("Zero efetivo produz inelegibilidade, não pendência",()=>{
 const b=base();b.registros=[registro("seguranca",0),registro("produtividade",75,90,true),
 registro("dirigibilidade",80),registro("jornada",90),registro("treinamentos",100)];
 const p=proj.projetarPreviaEfetiva(b,9);
 assert.equal(p.linhas[0].status,"Inelegível");assert.equal(p.linhas[0].score,62);
});
teste("Sucro não é considerado fora de março a novembro",()=>{
 const b=base();b.colaboradores=[{...c,categoria_id:2}];b.categorias=[{id:2,nome:"Sucro"}];
 assert.equal(proj.projetarPreviaEfetiva(b,0).linhas.length,0);
});
teste("Não participantes nunca entram na prévia",()=>{
 const b=base();b.colaboradores=[{...c,participa_programa:false}];
 assert.equal(proj.projetarPreviaEfetiva(b,9).linhas.length,0);
});
teste("Escopo global ou oficial é explicitamente rejeitado",()=>{
 assert.throws(()=>proj.projetarPreviaEfetiva({...base(),rankingOficial:true},9),/Escopo/);
 assert.throws(()=>proj.projetarPreviaEfetiva(base(),12),/Competência/);
});
teste("Documentos públicos não ativam as rotas reais",()=>{
 for(const file of ["src/app/api/ranking-efetivo/route.ts","src/app/ranking-efetivo-live/page.tsx"])
  assert.equal(fs.existsSync(file),false,file);
 const route=fs.readFileSync("src/server/templates/ranking-efetivo-route.ts","utf8");
 const page=fs.readFileSync("src/server/templates/ranking-efetivo-page.tsx","utf8");
 const api=fs.readFileSync("src/server/api-ranking-efetivo.ts","utf8");
 assert.ok(route.includes('from "@/server/api-ranking-efetivo"'));
 assert.ok(page.includes('credentials:"same-origin"'));
 assert.ok(page.includes("não atribui posições"));
 assert.ok(api.includes('EXCELENCIA_RANKING_PREVIA_ENABLED'));
 assert.ok(api.includes('"Cache-Control":"private, no-store, max-age=0"'));
 assert.ok(api.includes("consultarBaseRankingEfetivo"));
 assert.ok(!page.includes("dados-demo"));
});
console.log(n+" testes da prévia aprovados");
