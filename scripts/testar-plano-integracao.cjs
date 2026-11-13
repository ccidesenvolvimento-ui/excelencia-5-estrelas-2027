const assert=require("node:assert/strict");
const fs=require("node:fs");
const plano=fs.readFileSync("docs/homologacao/plano-decisao-integracao-etapa-19.md","utf8");
const gate=fs.readFileSync("docs/homologacao/gate-liberacao-etapa-17.md","utf8");
for(const s of ["PR #112","NO-GO","92 arquivos","Advertências","Acidentes","Supabase Cloud","3107","rollback","autorização expressa","Draft","main","28fc8ee519cb4a51ab000ba345dc953cce76ce33"]){
 assert.ok(plano.includes(s),"Plano sem critério: "+s);
}
assert.ok(plano.includes("única candidata de merge"),"Candidata única não definida");
assert.ok(gate.includes("NÃO LIBERADO PARA MERGE OU PRODUÇÃO"),"Gate de produção não deve ser desativado");
assert.ok(!fs.existsSync("src/app/api/ranking-efetivo/route.ts"),"Rota Node de homologação foi persistida");
assert.ok(!fs.existsSync("src/app/api/ajustes-notas/route.ts"),"API Node de homologação foi persistida");
console.log("✓ Plano pré-merge documentado, mantendo bloqueios de produção");
