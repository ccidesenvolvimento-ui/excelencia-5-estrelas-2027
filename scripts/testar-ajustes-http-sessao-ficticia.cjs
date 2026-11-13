// Issue #71 — HTTP de ponta a ponta com sessão e RPC EM MEMÓRIA de teste.
// NÃO valida Supabase Auth real nem PostgREST/RLS runtime: cenário totalmente fictício.
const assert=require("node:assert/strict");
const base="http://127.0.0.1:3198/api/ajustes-notas";
const notaId="62000000-0000-4000-8000-000000000030";
const segurancaId="62000000-0000-4000-8000-000000000031";
const motivo="Correção da planilha fictícia de produtividade, validada em auditoria.";
async function http(metodo,role,payload,url=base){
 const cabecalhos={origin:"http://127.0.0.1:3198","content-type":"application/json"};
 if(role)cabecalhos.cookie="e5_teste_papel="+role;
 const resposta=await fetch(url,{method:metodo,headers:cabecalhos,...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(10000)});
 assert.equal(resposta.headers.get("cache-control"),"private, no-store, max-age=0","Cache privado obrigatório");
 return {status:resposta.status,body:await resposta.json()};
}
async function teste(){
 const basePayload={notaId,novaNota:90,notaEsperada:75,justificativa:motivo};
 assert.equal((await http("GET")).status,401,"Sem sessão: 401");
 assert.equal((await http("GET","comum")).status,403,"Usuário comum: 403");
 assert.equal((await http("GET","inativo")).status,403,"Administrador inativo: 403");
 const outra=await http("GET","admin-filial-b");
 assert.equal(outra.status,200,"Admin de filial B mantém perfil ativo");
 assert.equal(outra.body.notas.length,0,"RLS simulada não revela filial A");
 assert.equal((await http("POST","admin-filial-b",basePayload)).status,403,"Admin filial B não ajusta filial A");
 assert.equal((await http("POST","comum",basePayload)).status,403,"Usuário comum não ajusta");
 assert.equal((await http("POST","inativo",basePayload)).status,403,"Admin inativo não ajusta");
 assert.equal((await http("POST",null,basePayload)).status,401,"Sem sessão não ajusta");
 const antes=await http("GET","admin-filial-a");
 assert.equal(antes.status,200);
 assert.equal(antes.body.notas.find(x=>x.id===notaId).nota_efetiva,75);
 assert.equal((await http("POST","admin-filial-a",{...basePayload,notaId:segurancaId,novaNota:100,notaEsperada:0})).status,422,"Segurança bloqueada");
 assert.equal((await http("POST","admin-filial-a",{...basePayload,novaNota:101})).status,422,"Limite 100");
 assert.equal((await http("POST","admin-filial-a",{...basePayload,justificativa:"curta"})).status,422,"Justificativa obrigatória");
 const escrito=await http("POST","admin-filial-a",basePayload);
 assert.equal(escrito.status,201,"Admin autorizado confirma ajuste");
 assert.equal(escrito.body.registrado,true);
 assert.equal(typeof escrito.body.ajusteId,"number");
 assert.equal((await http("POST","admin-filial-a",{...basePayload,novaNota:80})).status,409,"Versão obsoleta");
 const depois=await http("GET","admin-filial-a");
 const linha=depois.body.notas.find(x=>x.id===notaId);
 assert.equal(linha.nota,75,"Nota original preservada");
 assert.equal(linha.nota_efetiva,90,"Nota efetiva atualizada");
 assert.equal(linha.possui_ajuste,true);
 assert.equal(depois.body.historico.length,1,"Histórico de 1 ajuste");
 assert.equal(depois.body.historico[0].usuario_id,"admin-filial-a");
 assert.equal(depois.body.historico[0].justificativa,motivo);
 assert.equal(depois.body.historico[0].nota_anterior,75);
 assert.equal(depois.body.historico[0].nota_nova,90);
 console.log("✓ HTTP com sessão simulada: 401/403/422/201/409, escopo por filial, Segurança, nota efetiva e histórico fictício.");
}
teste().catch(e=>{console.error(e);process.exitCode=1;});
