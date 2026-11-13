const assert=require("node:assert/strict");
const fs=require("node:fs");
const ignore=fs.readFileSync(".gitignore","utf8");
const doc=fs.readFileSync("docs/homologacao/backup-verificavel-supabase-etapa-22.md","utf8");
for(const e of ["backups/","*.dump","*.backup","roles.sql","schema.sql","data.sql"]){
 assert.ok(ignore.includes(e),"Falta ignore: "+e);
}
for(const e of ["--role-only","--data-only","--use-copy","BACKUP_DIR","testar","RLS","Auth","roles.sql","schema.sql","data.sql","NÃO EXECUTADO","não** aplicar migrações"]){
 assert.ok(doc.includes(e),"Falta passo crítico: "+e);
}
assert.match(doc,/fora do repositório/);
assert.match(doc,/Não executar restauração no projeto Cloud ativo/);
assert.match(doc,/sha256sum -c/);
console.log("✓ Backup: procedimento manual, fora do Git e restauração isolada obrigatória");
