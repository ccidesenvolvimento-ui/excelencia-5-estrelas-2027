/* Testes isolados do filtro v0.7, sem servidores e sem dados reais. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

// Pequeno loader temporário para executar os módulos TS do próprio projeto.
Module._extensions['.ts'] = (mod, filename) => {
  const src = fs.readFileSync(filename, 'utf8');
  const js = ts.transpileModule(src, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  const erros = js.diagnostics?.filter(x => x.category === ts.DiagnosticCategory.Error) || [];
  assert.equal(erros.length, 0, `Falha sintática em ${filename}`);
  mod._compile(js.outputText, filename);
};

const base = path.resolve(__dirname, '../src/lib');
const { ranking } = require(path.join(base, 'dados-demo.ts'));
const { identificarPendencias, atendeTipoPendencia, rotulosPendencias, opcoesPendencia } = require(path.join(base, 'tipos-pendencia.ts'));
const casos = ranking('mensal', 3).filter(r => r.status === 'Pendente');
function registro(id) {
 const r = casos.find(r => r.pessoa.id === id);
 assert.ok(r, `Caso de teste ${id} deveria estar pendente`);
 return r;
}

assert.ok(identificarPendencias(registro('m008')).includes('sem-idt'));
assert.ok(identificarPendencias(registro('m004')).includes('sem-gobrax'));
assert.ok(identificarPendencias(registro('m010')).includes('sem-maxtrack'));
assert.ok(identificarPendencias(registro('m006')).includes('sem-seguranca'));
assert.ok(identificarPendencias(registro('m015')).includes('sem-eficiencia'));
assert.ok(identificarPendencias(registro('m016')).includes('sem-conservacao'));
assert.deepEqual(rotulosPendencias(registro('m019')), ['Sem nenhum dado']);
assert.ok(identificarPendencias(registro('m019')).includes('sem-idt') === false);
assert.ok(identificarPendencias(registro('m019')).includes('sem-seguranca'));

const soIdt = casos.filter(r => r.pessoa.categoria === 'Bebidas'
  && r.pessoa.filial === 'Contagem' && atendeTipoPendencia(r, 'sem-idt'));
assert.deepEqual(soIdt.map(r => r.pessoa.id), ['m008']);
const semSeguranca = casos.filter(r => atendeTipoPendencia(r, 'sem-seguranca'));
assert.deepEqual(new Set(semSeguranca.map(r => r.pessoa.id)), new Set(['m006', 'm019']));
assert.equal(casos.filter(r => atendeTipoPendencia(r, 'sem-gobrax')).length, 1);
assert.equal(casos.filter(r => atendeTipoPendencia(r, 'sem-maxtrack')).length, 1);
assert.equal(casos.filter(r => atendeTipoPendencia(r, 'sem-nenhum-dado')).length, 1);
assert.equal(opcoesPendencia.some(p => p.valor === ''), true);
const comZero = ranking('mensal', 2).find(r => r.pessoa.id === 'm012');
assert.ok(comZero && comZero.status === 'Inelegível');
assert.deepEqual(identificarPendencias(comZero), []);
console.log('OK — 15 verificações do filtro de tipos, fontes, combinação, ausência total e nota zero.');
