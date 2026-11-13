const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {preparar}=require("./preparar-ajustes-node.cjs");
const Dockerfile=fs.readFileSync("Dockerfile","utf8");
assert.match(Dockerfile,/ARG EXCELENCIA_NODE_AJUSTES_ENABLED=false/);
assert.match(Dockerfile,/node scripts\/preparar-ajustes-node\.cjs/);
const root=fs.mkdtempSync(path.join(os.tmpdir(),"excelencia-ajustes-node-"));
try{
 const pagina="src/app/ajustes-notas/page.tsx";
 const api="src/app/api/ajustes-notas/route.ts";
 for(const [file,content] of [
  ["src/server/templates/ajustes-notas-live-page.tsx","PAGINA REAL"],
  ["src/server/templates/ajustes-notas-route.ts","ROTA NODE"],
  [pagina,"DEMO PRESERVADA"]
 ]){
  const dst=path.join(root,file);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.writeFileSync(dst,content);
 }
 const disabled=preparar({root,habilitado:"false",deployTarget:""});
 assert.equal(disabled.instalado,false);
 assert.equal(fs.readFileSync(path.join(root,pagina),"utf8"),"DEMO PRESERVADA");
 assert.equal(fs.existsSync(path.join(root,api)),false);
 assert.throws(()=>preparar({root,habilitado:"true",deployTarget:"github-pages"}),/incompatíveis/);
 assert.equal(fs.readFileSync(path.join(root,pagina),"utf8"),"DEMO PRESERVADA");
 const enabled=preparar({root,habilitado:"true",deployTarget:""});
 assert.equal(enabled.instalado,true);
 assert.equal(fs.readFileSync(path.join(root,pagina),"utf8"),"PAGINA REAL");
 assert.equal(fs.readFileSync(path.join(root,api),"utf8"),"ROTA NODE");
 assert.throws(()=>preparar({root,habilitado:"true",deployTarget:""}),/recusando substituição/);
 console.log("✓ Ativação opt-in Node, export estático intocado e duplicação bloqueada");
}finally{fs.rmSync(root,{recursive:true,force:true});}
