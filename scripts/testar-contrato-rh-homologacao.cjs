const assert=require("node:assert/strict");
const fs=require("node:fs"),ts=require("typescript");
require.extensions[".ts"]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const {conferirContratoRH,indicadoresConferenciaRH}=require("../src/lib/contrato-rh-homologacao.ts");
const fonte=(id="p1",extra={})=>({
 colaboradorId:id,competencia:"2027-10-01",dataAdmissao:"2024-05-06",
 situacao:"ativo",fonte:"RH fictício",referenciaFonte:"lote-teste-01",...extra
});
const contexto=(extra={})=>({
 competencia:"2027-10-01",escopo:"filiais-autorizadas",rankingOficial:false,
 evidenciaHomologacao:"confirmada",idsColaboradoresAutorizados:["p1","p2"],...extra
});
let n=0;const teste=(name,fn)=>{fn();n++;console.log("✓ "+name)};
teste("Registro conferido preserva admissão e situação controlada",()=>{
 const r=conferirContratoRH([fonte("p1")],contexto());
 assert.equal(r.situacao,"CONFERENCIA_TECNICA");
 assert.equal(r.registros[0].dataAdmissao,"2024-05-06");
 assert.equal(r.registros[0].situacao,"ativo");
 assert.equal(r.registrosConferidos,1);
 assert.equal(r.registrosSemRH,1);
 assert.equal(r.rankingOficial,false);
 assert.equal(Object.hasOwn(r,"posicoes"),false);
 const resumo=indicadoresConferenciaRH(r);
 assert.equal(resumo.rankingLiberado,false);
 assert.ok(!JSON.stringify(resumo).includes("p1"));
});
teste("Admissão no mesmo mês pode ser conferida sem atribuir classificação",()=>{
 const r=conferirContratoRH([fonte("p1",{dataAdmissao:"2027-10-31"})],contexto());
 assert.equal(r.registrosConferidos,1);
 assert.equal(r.rankingOficial,false);
});
teste("Fonte não comprovada não gera validação tácita",()=>{
 assert.throws(()=>conferirContratoRH([fonte()],contexto({evidenciaHomologacao:"nao_comprovada"})),/Fonte/);
 assert.throws(()=>conferirContratoRH([fonte()],contexto({evidenciaHomologacao:undefined})),/Fonte/);
});
teste("Fora do RLS e lista de autorização inválida são rejeitados",()=>{
 assert.throws(()=>conferirContratoRH([fonte("outra-filial")],contexto()),/RH/);
 assert.throws(()=>conferirContratoRH([],contexto({idsColaboradoresAutorizados:["p1","p1"]})),/autorizados/);
 assert.throws(()=>conferirContratoRH([],contexto({escopo:"global"})),/Fonte/);
});
teste("Data impossível, futura ou incompleta é inválida",()=>{
 for(const data of ["2027-02-29","2027-10-32","2027-11-01","2027-10",""]) {
  assert.throws(()=>conferirContratoRH([fonte("p1",{dataAdmissao:data})],contexto()),/Registro/);
 }
});
teste("Situação livre, campos ausentes e procedência vazia não são aceitos",()=>{
 for(const extra of [{situacao:"Ativo"},{situacao:"licença"},{fonte:""},{referenciaFonte:""},{competencia:"2027-09-01"}]){
  assert.throws(()=>conferirContratoRH([fonte("p1",extra)],contexto()),/Registro/);
 }
});
teste("Não admite registros duplicados nem competência fora de 2027",()=>{
 assert.throws(()=>conferirContratoRH([fonte(),fonte()],contexto()),/Registro/);
 assert.throws(()=>conferirContratoRH([],contexto({competencia:"2028-01-01"})),/Fonte/);
});
teste("Registro original não é mutado, saída é imutável e não cria rota",()=>{
 const input=fonte();const before=JSON.stringify(input);
 const r=conferirContratoRH([input],contexto());
 assert.equal(JSON.stringify(input),before);
 assert.ok(Object.isFrozen(r.registros));
 assert.ok(Object.isFrozen(r.registros[0]));
 assert.equal(fs.existsSync("src/app/api/rh/route.ts"),false);
 assert.equal(fs.existsSync("src/app/ranking-oficial/page.tsx"),false);
});
console.log(n+" testes do contrato RH concluídos");
