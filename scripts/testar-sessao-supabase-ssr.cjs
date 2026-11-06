// Verificações de código sem rede, usuários, secrets ou banco remoto.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const source = fs.readFileSync("src/lib/supabase/sessao-servidor.ts", "utf8");
assert.match(source, /import ["']server-only["']/);
assert.match(source, /from ["']next\/headers["']/);
assert.match(source, /from ["']@supabase\/ssr["']/);
assert.match(source, /createServerClient\(/);
assert.match(source, /cookieStore\.getAll\(\)/);
assert.match(source, /cookieStore\.set\(/);
assert.match(source, /supabase\.auth\.getUser\(\)/);
assert.doesNotMatch(source, /\.auth\.getSession\(/);
// Verificar uso de credenciais na execução, não menções em mensagens de erro.
assert.doesNotMatch(source, /process\.env\.NEXT_PUBLIC_/);
assert.doesNotMatch(source, /process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)/);
assert.match(source, /createServerClient\(url, chavePublicavel,/);
assert.match(source, /chavePublicavel\.startsWith\(["']sb_publishable_["']\)/);
console.log("Sessão SSR Supabase: verificações estáticas aprovadas.");
