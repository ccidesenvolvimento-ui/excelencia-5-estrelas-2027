// Etapa 11 — invariantes estáticas para evitar deploy inadvertido de homologação.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
let ok=0;
function teste(nome,fn){fn();ok++;console.log("✓ "+nome)}
const ler=file=>fs.readFileSync(file,"utf8");
teste("Deploy oficial mantém exportação estática explícita",()=>{
 const config=ler("next.config.ts");
 assert.match(config,/NEXT_PUBLIC_DEPLOY_TARGET\s*===\s*"github-pages"/);
 assert.match(config,/output:\s*"export"/);
 assert.match(config,/\/excelencia-5-estrelas-2027/);
});
teste("Templates Node de homologação não aparecem como rotas persistentes",()=>{
 for(const file of [
  "src/app/api/ranking-efetivo/route.ts",
  "src/app/ranking-efetivo-live/page.tsx",
  "src/app/api/ajustes-notas/route.ts",
  "src/app/ajustes-notas-live/page.tsx",
  "src/app/api/ci-login/route.ts"
 ])assert.equal(fs.existsSync(file),false,"Rota opt-in foi adicionada: "+file);
 const route=ler("src/server/templates/ranking-efetivo-route.ts");
 assert.match(route,/export const runtime\s*=\s*"nodejs"/);
});
teste("Endpoint da prévia exige as três flags e sessão autorizada",()=>{
 const api=ler("src/server/api-ranking-efetivo.ts");
 for(const nome of ["EXCELENCIA_AUTH_GUARD_ENABLED","EXCELENCIA_AJUSTES_API_ENABLED","EXCELENCIA_RANKING_PREVIA_ENABLED"])
  assert.ok(api.includes(nome),"Flag obrigatória ausente: "+nome);
 assert.match(api,/consultarBaseRankingEfetivo\(/);
 const leitura=ler("src/server/consulta-ranking-efetivo.ts");
 assert.match(leitura,/cliente\.auth\.getUser\(\)/);
 assert.match(leitura,/lerTodasPaginas/);
 assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|createClient\([^)]*service_role/i.test(leitura),
  "Consulta não pode usar credencial privilegiada");
});
teste("Classificação oficial permanece indisponível na prévia",()=>{
 const previa=ler("src/lib/projecao-ranking-efetivo.ts");
 const matriz=ler("src/lib/matriz-bloqueios-homologacao.ts");
 const resumo=ler("src/lib/sumario-homologacao.ts");
 assert.match(previa,/posicao:null/);
 assert.match(previa,/rankingOficial:false/);
 assert.match(matriz,/situacao:"BLOQUEADO"/);
 assert.match(resumo,/rankingOficial:false/);
 assert.match(resumo,/SUMARIO_AGREGADO_NAO_OFICIAL/);
});
teste("Compose de homologação exige WEB_PORT explícita e não usa 3107 por padrão",()=>{
 const compose=ler("compose.homologacao.yml");
 const exemplo=ler(".env.homologacao.example");
 assert.match(compose,/127\\.0\\.0\\.1:\\$\\{WEB_PORT:\?/);
 assert.ok(!compose.includes("WEB_PORT:-3107"),"Porta corporativa não pode ser o default");
 assert.ok(!/^WEB_PORT=3107$/m.test(exemplo),"Exemplo não deve sugerir porta corporativa");
 assert.match(exemplo,/^WEB_PORT=3117$/m);
 const docs=ler("docs/HOMOLOGACAO_LOCAL_2026.md");
 assert.ok(docs.includes("WEB_PORT"));
 assert.ok(docs.includes("NUNCA reutilizar 3107"));
});
teste("Build CI de GitHub Pages e testes de segurança são mantidos",()=>{
 const ci=ler(".github/workflows/validar-pr.yml");
 assert.match(ci,/NEXT_PUBLIC_DEPLOY_TARGET:\s*github-pages/);
 for(const cmd of ["test:conciliacao-seguranca","test:matriz-bloqueios","test:sumario-homologacao","test:contrato-rh"])
  assert.ok(ci.includes(cmd),"CI não executa "+cmd);
});
teste("Documentação mantém as barreiras e não declara homologação",()=>{
 const doc=ler("docs/homologacao/auditoria-integracao-etapa-11.md");
 assert.ok(doc.includes("#98"));
 assert.ok(doc.includes("#76"));
 assert.match(doc,/sem merge/i);
 assert.match(doc,/não.*liberação para produção/i);
 assert.match(doc,/RH/);
 assert.match(doc,/Segurança/);
});
console.log(ok+" proteções de integração aprovadas.");
