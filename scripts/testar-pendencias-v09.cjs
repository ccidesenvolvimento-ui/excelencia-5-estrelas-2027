/* Regressão v0.9: pendências, tipo único e fonte configurada por filial. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
Module._extensions['.ts'] = (mod, file) => {
  const transpile = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName:file,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
    reportDiagnostics:true
  });
  assert.equal((transpile.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,`Erro de sintaxe: ${file}`);
  mod._compile(transpile.outputText,file);
};
const base=path.resolve(__dirname,'../src/lib');
const d=require(path.join(base,'dados-demo.ts'));
const p=require(path.join(base,'tipos-pendencia.ts'));
const fontes=require(path.join(base,'fontes-dirigibilidade.ts'));
const lista=d.ranking('mensal',3).filter(r=>r.status==='Pendente');
const registro=id=>{const v=lista.find(r=>r.pessoa.id===id);assert.ok(v,`Caso ${id} não pendente`);return v;};
const esperado=['Todas as pendências','Sem Segurança','Sem Produtividade','Sem Dirigibilidade','Sem Jornada','Sem Treinamentos'];
assert.deepEqual(p.opcoesPendencia.map(x=>x.titulo),esperado);
assert.equal(new Set(p.opcoesPendencia.map(x=>x.valor)).size,6);
assert.deepEqual(p.rotulosPendencias(registro('m019')),esperado.slice(1));
assert.ok(p.atendeTipoPendencia(registro('m008'),'sem-dirigibilidade'));
assert.ok(p.atendeTipoPendencia(registro('m006'),'sem-seguranca'));
assert.ok(p.atendeTipoPendencia(registro('m016'),'sem-jornada'));
assert.equal(p.identificarPendencias(d.ranking('mensal',2).find(r=>r.pessoa.id==='m012')).length,0);
const filtro=lista.filter(r=>r.pessoa.categoria==='Bebidas'&&r.pessoa.filial==='Contagem'&&p.atendeTipoPendencia(r,'sem-dirigibilidade'));
assert.deepEqual(filtro.map(r=>r.pessoa.id),['m008']);
assert.equal(new Set(lista.map(r=>r.pessoa.id)).size,lista.length);
assert.ok(d.pessoas.every(x=>['Motorista','Operador'].includes(x.tipo)));
assert.equal(d.pessoas.some(x=>x.id==='m018'),false);
assert.equal(d.pessoas.some(x=>x.id==='m038'),true);
assert.equal(d.ranking('mensal',3).filter(r=>r.pessoa.categoria==='Florestal'&&r.posicao!==null&&r.posicao<=20).length,20);
assert.equal(fontes.fonteFilial('Contagem',fontes.FONTES_DEMO_INICIAIS),'IDT');
const alteradas={...fontes.FONTES_DEMO_INICIAIS,Contagem:'Maxtrack'};
assert.equal(fontes.fonteFilial('Contagem',alteradas),'Maxtrack');
assert.equal(fontes.fonteFilial('Contagem',{}),null);
assert.deepEqual(fontes.validarFontes({Contagem:'IDT',Jataí:'Outra',Lavras:'Gobrax'}),{Contagem:'IDT',Lavras:'Gobrax'});
console.log('✓ v0.9: 17 verificações de opções, tipos, filtros, fonte por filial, regressão do Top 20 e elenco.');
