// Teste de segurança sem network, contas ou credenciais reais.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const form = fs.readFileSync("src/components/FormularioLoginSupabase.tsx","utf8");
const page = fs.readFileSync("src/app/login/page.tsx","utf8");
assert.match(form,/NEXT_PUBLIC_SUPABASE_LOGIN_ENABLED/);
assert.match(form,/NEXT_PUBLIC_SUPABASE_URL/);
assert.match(form,/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
assert.match(form,/sb_publishable_/);
assert.match(form,/createBrowserClient\(/);
assert.match(form,/signInWithPassword\(/);
assert.match(form,/auth\.getUser\(/);
assert.match(form,/auth\.signOut\(/);
assert.match(form,/if \(!habilitado\)/);
assert.doesNotMatch(form,/signUp\(|service_role\s*[:=]|sb_secret_/);
assert.match(page,/<FormularioLoginSupabase\s*\/>/);
assert.match(page,/Explorar demonstração/);
console.log("Login Supabase opt-in: verificação estrutural aprovada.");
