// #75 — E2E HTTP do handler Next.js contra GoTrue/PostgREST/RPC PostgreSQL reais.
// Restrito ao Supabase local em GitHub Actions, com quatro usuários fictícios.
const fs=require("node:fs");
const assert=require("node:assert/strict");
const {execFileSync}=require("node:child_process");
assert.equal(process.env.SUPABASE_URL,"http://127.0.0.1:54321");
assert.equal(process.env.E5_E2E_LOCAL_ONLY,"true");
const fixture=JSON.parse(fs.readFileSync("/tmp/e5-ajustes-e2e-fixture.json","utf8"));
const origem="http://127.0.0.1:3197";
const justificativa="Correção de divergência de planilha fictícia aprovada em conferência.";
async function login(papel){
 const user=fixture.usuarios[papel];
 const r=await fetch(origem+"/api/ci-login",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({email:user.email,password:fixture.senha}),
  signal:AbortSignal.timeout(15000)
 });
 assert.equal(r.status,200,"Login local "+papel);
 const setCookies=r.headers.getSetCookie();
 assert.ok(setCookies.length>0,"Login deve emitir cookie SSR "+papel);
 const cookies=setCookies.map(c=>c.split(";")[0]).join("; ");
 assert.ok(cookies.includes("auth-token"),"Cookie de autenticação Supabase presente");
 return cookies;
}
async function req(metodo,cookies,payload,query=""){
 const headers={origin:origem,"content-type":"application/json"};
 if(cookies)headers.cookie=cookies;
 const response=await fetch(origem+"/api/ajustes-notas"+query,{
  method:metodo,headers,...(payload?{body:JSON.stringify(payload)}:{}),redirect:"manual",signal:AbortSignal.timeout(15000)
 });
 assert.equal(response.headers.get("cache-control"),"private, no-store, max-age=0");
 return {status:response.status,body:await response.json()};
}
const id=fixture.ids;
const payload={notaId:id.nota,novaNota:90,notaEsperada:75,justificativa};
async function execute(){
 assert.equal((await req("GET",null)).status,401,"Sem sessão = 401");
 const cookies={};
 for(const papel of ["adminA","comum","adminB","inativo"]) cookies[papel]=await login(papel);
 assert.equal((await req("GET",cookies.comum)).status,403);
 assert.equal((await req("GET",cookies.inativo)).status,403);
 const outra=await req("GET",cookies.adminB);
 assert.equal(outra.status,200,"Admin B autenticado");
 assert.equal(outra.body.notas.length,0,"Admin B não vê filial A");
 assert.equal((await req("POST",cookies.adminB,payload)).status,403,"Admin B não modifica filial A");
 assert.equal((await req("POST",cookies.comum,payload)).status,403);
 assert.equal((await req("POST",cookies.inativo,payload)).status,403);
 assert.equal((await req("POST",null,payload)).status,401);
 const antes=await req("GET",cookies.adminA,null,"?competencia=2027-10-01");
 assert.equal(antes.status,200);
 assert.equal(antes.body.notas.length,2);
 assert.equal(antes.body.notas.find(n=>n.id===id.nota).nota_efetiva,75);
 assert.equal((await req("POST",cookies.adminA,{...payload,notaId:id.seguranca,novaNota:100,notaEsperada:0})).status,422);
 const alterado=await req("POST",cookies.adminA,payload);
 assert.equal(alterado.status,201,"Ajuste autorizado via HTTP");
 assert.equal(alterado.body.registrado,true);
 assert.ok(alterado.body.ajusteId);
 assert.equal((await req("POST",cookies.adminA,{...payload,novaNota:80})).status,409,"Conflito no banco");
 const depois=await req("GET",cookies.adminA,null,"?competencia=2027-10-01");
 assert.equal(depois.status,200);
 const nota=depois.body.notas.find(n=>n.id===id.nota);
 assert.equal(nota.nota,75);
 assert.equal(nota.nota_efetiva,90);
 assert.equal(nota.possui_ajuste,true);
 const hist=depois.body.historico.filter(h=>h.nota_mensal_id===id.nota);
 assert.equal(hist.length,1);
 assert.equal(hist[0].usuario_id,fixture.usuarios.adminA.id);
 assert.equal(hist[0].nota_anterior,75);
 assert.equal(hist[0].nota_nova,90);
 assert.equal(hist[0].justificativa,justificativa);
 const nomes=execFileSync("docker",["ps","--filter","name=supabase_db_","--format","{{.Names}}"],{encoding:"utf8"}).trim().split("\n");
 const container=nomes.find(s=>s.includes("excelencia-5-estrelas-2027"));
 assert.ok(container);
 const sql="SELECT count(*) FROM public.auditoria WHERE registro_id='"+id.nota+"' AND acao='ajuste_administrativo_nota'";
 const total=execFileSync("docker",["exec",container,"psql","-X","-U","postgres","-d","postgres","-At","-c",sql],{encoding:"utf8"}).trim();
 assert.equal(total,"1","Auditoria real no PostgreSQL");
 console.log("✓ Next HTTP → SSR cookie → GoTrue real → RLS/PostgREST → RPC → histórico e auditoria PostgreSQL local: aprovado.");
}
execute().catch(e=>{console.error(e);process.exitCode=1;});
