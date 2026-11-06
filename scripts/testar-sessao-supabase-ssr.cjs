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
assert.doesNotMatch(source, /NEXT_PUBLIC_|service_role|sb_secret_/);
console.log("Sessão SSR Supabase: verificações estáticas aprovadas.");
