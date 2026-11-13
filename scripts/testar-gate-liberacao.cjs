const assert=require("node:assert/strict"),fs=require("node:fs");
const gate=fs.readFileSync("docs/homologacao/gate-liberacao-etapa-17.md","utf8");
const obrigatorios=[
 "NÃO LIBERADO PARA MERGE OU PRODUÇÃO","PR #108","#43448777792",
 "SECURITY DEFINER","Supabase Cloud","GitHub Pages","data de admissão",
 "advertências","acidentes","3107","rollback","RLS","main",
 "ausência de penalização","autorização explícita"
];
for(const item of obrigatorios)assert.ok(gate.includes(item),"Gate sem item obrigatório: "+item);
assert.match(gate,/^- \[ \] \*\*RH:/m);
assert.match(gate,/^- \[ \] \*\*Segurança:/m);
assert.match(gate,/^- \[ \] \*\*SQL\/RLS:/m);
assert.match(gate,/^- \[ \] \*\*Deploy:/m);
assert.ok(!/^- \[x\]/mi.test(gate),"Gate não pode marcar pendências como concluídas automaticamente");
assert.ok(!/\b(?:GATE LIBERADO|APROVADO PARA PRODUÇÃO|MERGE AUTORIZADO)\b/i.test(gate),
 "Gate não pode declarar autorização de produção");
const next=fs.readFileSync("next.config.ts","utf8");
assert.match(next,/output:\s*"export"/);
assert.equal(fs.existsSync("src/app/api/ranking-efetivo/route.ts"),false);
assert.equal(fs.existsSync("src/app/api/ajustes-notas/route.ts"),false);
console.log("✓ Gate de liberação permanece bloqueado e isolado");
