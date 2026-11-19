// Teste estático sem rede, dados reais nem credenciais.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const caminho = "src/lib/supabase/server.ts";
const texto = fs.readFileSync(caminho, "utf8");
assert.match(texto, /import ["']server-only["']/);
assert.match(texto, /process\.env\.SUPABASE_URL/);
assert.match(texto, /process\.env\.SUPABASE_PUBLISHABLE_KEY/);
assert.match(texto, /sb_publishable_/);
assert.match(texto, /persistSession:\s*false/);
assert.match(texto, /autoRefreshToken:\s*false/);
assert.doesNotMatch(texto, /process\.env\.NEXT_PUBLIC_/);
assert.doesNotMatch(texto, /service_role|sb_secret_/);
console.log("Cliente Supabase server-only: verificações estáticas aprovadas.");
