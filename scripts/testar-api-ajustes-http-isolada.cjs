// Issue #69. Testes HTTP da API isolada, apenas no loopback do runner efêmero.
const assert = require("node:assert/strict");
const modo = process.env.AJUSTES_HTTP_MODO;
const porta = Number(process.env.AJUSTES_HTTP_PORTA || "3199");
assert.ok(["desativado","ativado"].includes(modo));
assert.ok(Number.isInteger(porta) && porta > 1024 && porta < 65536);
const origem = "http://127.0.0.1:" + porta;
const rota = origem + "/api/ajustes-notas";
async function requisicao(metodo,opcoes={}) {
  const resposta = await fetch(rota,{method:metodo,redirect:"manual",...opcoes,signal:AbortSignal.timeout(10000)});
  assert.equal(resposta.headers.get("cache-control"),"private, no-store, max-age=0","Resposta sem cache");
  const corpo=await resposta.json();
  assert.equal(typeof corpo.erro,"string","Não expor dados internos");
  return resposta.status;
}
(async()=>{
  if(modo==="desativado"){
    assert.equal(await requisicao("GET"),503,"GET com flags desligadas");
    assert.equal(await requisicao("POST",{headers:{"content-type":"application/json"},body:"{}"}),503,"POST com flags desligadas");
    console.log("✓ API desligada: GET e POST bloqueados com 503.");
  } else {
    // Flags de teste, sem URL/credenciais de Supabase: nenhum acesso externo.
    assert.equal(await requisicao("GET"),503,"GET sem configuração Supabase");
    assert.equal(await requisicao("POST",{headers:{"content-type":"application/json"},body:"{}"}),403,"POST sem Origin");
    assert.equal(await requisicao("POST",{headers:{"origin":"https://exemplo.invalid","content-type":"application/json"},body:"{}"}),403,"Origem externa");
    assert.equal(await requisicao("POST",{headers:{"origin":origem,"content-type":"text/plain"},body:"{}"}),415,"Formato não JSON");
    assert.equal(await requisicao("POST",{headers:{"origin":origem,"content-type":"application/json"},body:"{invalido"}),422,"JSON inválido");
    assert.equal(await requisicao("POST",{headers:{"origin":origem,"content-type":"application/json"},body:"{}"}),422,"Campos inválidos");
    console.log("✓ API sem credenciais: validou origem, formato e payload; GET indisponível.");
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
