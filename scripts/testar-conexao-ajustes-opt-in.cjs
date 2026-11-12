// Contratos da tela Node opt-in: em nenhum deploy estático deve haver endpoint real.
const fs=require("node:fs"),assert=require("node:assert/strict");
const page=fs.readFileSync("src/server/templates/ajustes-notas-live-page.tsx","utf8");
const modal=fs.readFileSync("src/components/ModalAjusteNotaReal.tsx","utf8");
const demo=fs.readFileSync("src/app/ajustes-notas/page.tsx","utf8");
assert.equal(fs.existsSync("src/app/ajustes-notas-live/page.tsx"),false,"Rota real não pode ser commitada");
assert.equal(fs.existsSync("src/app/api/ajustes-notas/route.ts"),false,"Endpoint não pode ser commitado");
assert.ok(page.includes('fetch("/api/ajustes-notas"'),"Tela real deve usar API com credenciais same-origin");
assert.ok(page.includes('credentials:"same-origin"'),"Sessão SSR deve viajar via cookies");
assert.ok(page.includes('notaEsperada:nota.nota_efetiva'),"Controle de concorrência obrigatório");
assert.ok(modal.includes('validarAjusteNota'),"Modal com validação");
assert.ok(modal.includes('nota.estrela==="seguranca"'),"Bloquear Segurança");
assert.ok(modal.includes('gravando'),"Impedir escrita duplicada");
assert.ok(demo.includes('ModalAjusteNotaDemo'),"Preservar demo estática");
assert.ok(!demo.includes('ModalAjusteNotaReal'),"Demo não usa modal com gravação");
assert.ok(!/fetch\s*\(/.test(demo),"Demo não consulta API");
console.log("✓ UI real apenas opt-in; demo estática, concorrência e Segurança preservadas.");
