// Testes estruturais sem credenciais, e-mails ou acesso ao banco.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ler = nome => fs.readFileSync(nome, "utf8");
const senha = ler("src/components/FluxoSenhaSupabase.tsx");
const callback = ler("src/components/ConfirmarLinkSupabase.tsx");
const proxy = ler("src/server/proxy-autenticacao.ts");
const cliente = ler("src/lib/supabase/cliente-browser.ts");
const login = ler("src/components/FormularioLoginSupabase.tsx");

assert.match(senha, /resetPasswordForEmail/);
assert.match(senha, /updateUser/);
assert.match(senha, /Se o e-mail estiver cadastrado/);
assert.match(callback, /verifyOtp/);
assert.match(callback, /"invite"/);
assert.match(callback, /"recovery"/);
assert.match(callback, /getUser/);
assert.match(proxy, /"\/auth\/confirm"/);
assert.match(proxy, /"\/recuperar-senha"/);
assert.match(proxy, /"\/definir-senha"/);
assert.match(cliente, /NEXT_PUBLIC_SUPABASE_LOGIN_ENABLED/);
assert.doesNotMatch(cliente + senha + callback, /sb_secret_|service_role|auth\.admin\./);
assert.match(login, /Esqueci minha senha/);
assert.match(proxy, /EXCELENCIA_AUTH_GUARD_ENABLED/);
for (const rota of ["recuperar-senha", "definir-senha", "auth/confirm"]) {
  assert.ok(fs.existsSync("src/app/" + rota + "/page.tsx"));
}
console.log("Fluxos Auth preparados: testes estruturais aprovados.");
