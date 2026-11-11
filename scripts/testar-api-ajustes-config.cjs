// Testes estáticos de isolamento do handler Node para preservar a demo pública.
// Os testes de autorização real permanecem no CI SQL do PR #58.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const server = fs.readFileSync('src/server/api-ajustes-notas.ts','utf8');
const route = fs.readFileSync('src/server/templates/ajustes-notas-route.ts','utf8');
const config = fs.readFileSync('next.config.ts','utf8');
assert.equal(fs.existsSync('src/app/api/ajustes-notas/route.ts'),false,
  'Rota de gravação não pode integrar a exportação estática');
assert.ok(server.includes('import "server-only"'), 'Módulo exclusivo de servidor');
assert.ok(server.includes('EXCELENCIA_AJUSTES_API_ENABLED'), 'Feature flag fail-closed');
assert.ok(server.includes('EXCELENCIA_AUTH_GUARD_ENABLED'), 'Proxy autenticado obrigatório');
assert.ok(server.includes('cliente.auth.getUser()'), 'Identity deve ser validada remotamente');
assert.ok(server.includes('rpc("eh_administrador_ativo")'), 'Checagem de admin no banco');
assert.ok(server.includes('rpc("registrar_ajuste_nota"'), 'Somente escrita por RPC auditada');
assert.ok(server.includes('function origemValida'), 'Proteção de origem contra CSRF');
assert.ok(!/service_role|sb_secret_/.test(server), 'Não usar chaves privilegiadas');
assert.ok(route.includes('export { GET, POST }'), 'Template exporta handlers');
assert.ok(config.includes('output: "export"'), 'GitHub Pages continua estático');
console.log('✓ Isolamento da API de ajustes e flags fail-closed: aprovado.');
