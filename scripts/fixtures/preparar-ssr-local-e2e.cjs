// #75 — Nunca executar fora do runner de CI com Supabase local descartável.
// Aplica uma substituição TEMPORÁRIA e verificável ao cliente SSR, sem relaxar produção.
const fs=require("node:fs");
const p="src/lib/supabase/sessao-servidor.ts";
let src=fs.readFileSync(p,"utf8");
const antesUrl='if (parsed.protocol !== "https:" || parsed.username || parsed.password) {';
const depoisUrl='if ((parsed.protocol !== "https:" && !(process.env.E5_E2E_LOCAL_ONLY === "true" && parsed.href === "http://127.0.0.1:54321/")) || parsed.username || parsed.password) {';
const antesKey='if (!chavePublicavel.startsWith("sb_publishable_")) {';
const depoisKey='if (!chavePublicavel.startsWith("sb_publishable_") && !(process.env.E5_E2E_LOCAL_ONLY === "true" && process.env.SUPABASE_URL === "http://127.0.0.1:54321" && chavePublicavel === process.env.SUPABASE_ANON_KEY)) {';
for(const [a,b] of [[antesUrl,depoisUrl],[antesKey,depoisKey]]){
 if(!src.includes(a))throw new Error("Contrato SSR mudou, abortando substituição local.");
 src=src.replace(a,b);
}
fs.writeFileSync(p,src);
console.log("✓ Adaptador SSR restrito ao URL e à chave pública Supabase local (temporário no runner).");
