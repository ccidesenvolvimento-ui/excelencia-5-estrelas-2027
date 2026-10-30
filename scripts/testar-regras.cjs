const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/dados-demo.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const moduleObj = {exports:{}};
vm.runInNewContext('(function(module, exports) {'+js+'\n})(moduleObj,moduleObj.exports)', {moduleObj});
const d = moduleObj.exports;
const pessoa = id => d.pessoas.find(p=>p.id===id);
const checks = [
  ['Oito categorias', () => assert.equal(d.categorias.length,8)],
  ['Cinco estrelas', () => assert.equal(d.estrelas.length,5)],
  ['Pesos em 100%', () => assert.ok(Math.abs(Object.values(d.pesos).reduce((a,b)=>a+b,0)-1)<1e-9)],
  ['Empresa + matricula únicas', () => assert.equal(new Set(d.pessoas.map(p=>p.empresa+'/'+p.matricula)).size,d.pessoas.length)],
  ['Zero de Segurança inelegível', () => assert.equal(d.avaliarPessoa(pessoa('m002'),'mensal',0).status,'Inelegível')],
  ['Zero em janeiro afeta anual', () => assert.equal(d.avaliarPessoa(pessoa('m002'),'anual',0).status,'Inelegível')],
  ['Pendente não tem score', () => assert.equal(d.avaliarPessoa(pessoa('m007'),'mensal',0).score,null)],
  ['Pendente fora dos resultados apresentados', () => assert.ok(!d.ranking('mensal',0).filter(r=>r.status!=='Pendente').some(r=>r.pessoa.id==='m007'))],
  ['Inelegível não tem posição', () => assert.equal(d.ranking('mensal',0).find(r=>r.pessoa.id==='m002').posicao,null)],
  ['Sucro mar-mai', () => assert.equal(d.mesesPeriodo('Sucro','ciclo1',0).join(','),'2,3,4')],
  ['Sucro anual 9 meses', () => assert.equal(d.mesesPeriodo('Sucro','anual',0).length,9)],
  ['Sucro fora de janeiro', () => assert.ok(!d.ranking('mensal',0).some(r=>r.pessoa.categoria==='Sucro'))],
  ['Demais ciclos 4 meses', () => assert.equal(d.mesesPeriodo('Florestal','ciclo1',0).length,4)],
  ['Somente funções participantes na amostra', () => assert.ok(d.pessoas.every(p=>p.tipo==='Motorista'||p.tipo==='Operador'))],
  ['Notas 0 a 100', () => assert.ok(d.pessoas.every(p=>Array.from({length:12},(_,mes)=>Object.values(d.notasDe(p,mes)).every(n=>n>=0&&n<=100)).every(Boolean)))],
  ['Top 20 da amostra de abril', () => {const t=d.ranking('mensal',3).filter(r=>r.pessoa.categoria==='Florestal'&&r.posicao!==null&&r.posicao<=20);assert.equal(t.length,20)}],
  ['Posições calculadas por categoria', () => {const a=d.ranking('mensal',0).filter(r=>r.pessoa.categoria==='Florestal'&&r.status==='Elegível');assert.equal(new Set(a.map(r=>r.posicao)).size,a.length)}],
];
let failed=0;for(const [label,run] of checks){try{run();console.log('✓',label)}catch(e){failed++;console.error('✗',label,e.message)}}console.log(`\n${checks.length-failed}/${checks.length} verificações aprovadas`);if(failed)process.exit(1);
