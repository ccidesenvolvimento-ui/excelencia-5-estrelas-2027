const assert=require("node:assert/strict");
const fs=require("node:fs");
const sql=fs.readFileSync("db/homologacao/50_preflight_cloud_somente_leitura.sql","utf8");
const doc=fs.readFileSync("docs/homologacao/preflight-cloud-etapa-21.md","utf8");
// O preflight nunca deve executar DDL/DML em banco corporativo.
const semComentarios=sql.replace(/--[^\n]*/g,"").trim();
const statements=semComentarios.split(";").map(s=>s.trim()).filter(Boolean);
assert.ok(statements.length>=4,"Preflight incompleto");
for(const statement of statements){
 assert.match(statement,/^SELECT\b/i,"Somente consultas SELECT no preflight");
 assert.doesNotMatch(statement,/\b(?:INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|CALL|DO|COPY)\b/i,"Preflight contém mutação");
}
assert.match(doc,/NÃO EXECUTAR DDL CLOUD/);
assert.match(doc,/2 contas de teste/);
assert.match(doc,/duas existentes são de \*\*consulta\/teste\*\*/);
assert.match(doc,/rls_auto_enable/);
assert.match(doc,/ensure_rls/);
assert.match(doc,/backup verificável/);
assert.match(doc,/testar restauração/);
assert.match(doc,/20261111000100_admin_importacoes_autorizacao/);
assert.match(doc,/20261111000200_ajustes_administrativos_notas/);
console.log("✓ Preflight somente leitura; contas de teste preservadas; gate de migração documentado");
