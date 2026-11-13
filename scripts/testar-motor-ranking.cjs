/** Regressão do motor puro: somente participantes e notas fictícias. */ 
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const core=require('../src/lib/calculo-ranking.ts');
const demo=require('../src/lib/dados-demo.ts');
let n=0;
function teste(nome,executar){executar();n++;console.log('✓ '+nome)}
const pessoa=(id,categoria='Florestal',dataAdmissao='2015-01-15')=>({id,nome:id,matricula:id,empresa:'FICTICIA',filial:'X',categoria,funcao:'Motorista',situacao:'Ativo',tipo:'Motorista',dataAdmissao});
const completa={seguranca:100,produtividade:75,dirigibilidade:80,jornada:90,treinamentos:100};
const fornecer=()=>({...completa});
teste('Motor puro preserva pesos e calendário',()=>{
 assert.equal(core.pesos.produtividade,.25);
 assert.deepEqual(core.mesesPeriodo('Sucro','ciclo1',0),[2,3,4]);
 assert.equal(core.mesesPeriodo('Sucro','anual',0).length,9);
 assert.equal(core.mesesPeriodo('Florestal','anual',0).length,12);
});
teste('Paridade exata entre adaptador demo e motor para todos os participantes e períodos',()=>{
 for(const periodo of demo.periodos.map(x=>x.id)){
  for(let mes=0;mes<12;mes++){
   const real=core.classificarComNotas(demo.pessoas,periodo,mes,demo.notasDe);
   assert.deepEqual(real,demo.ranking(periodo,mes));
   for(const p of demo.pessoas) assert.deepEqual(core.avaliarComNotas(p,periodo,mes,demo.notasDe),demo.avaliarPessoa(p,periodo,mes));
  }
 }
});
teste('Nota corrigida altera somente o efetivo e aumenta score em 3,75',()=>{
 const p=pessoa('P1');
 const antes=core.avaliarComNotas(p,'mensal',0,fornecer);
 const registro={id:'nota-1',original:75,efetiva:90,ajustada:true};
 const depois=core.avaliarComNotas(p,'mensal',0,()=>({...completa,...core.notasEfetivas({produtividade:registro})}));
 assert.equal(depois.score-antes.score,3.75);
 assert.equal(registro.original,75);
 assert.equal(registro.efetiva,90);
});
teste('Correções sucessivas usam valor efetivo mais recente quando projetado pelo leitor',()=>{
 const historico=[{id:'1',original:75,efetiva:83,ajustada:true},{id:'2',original:75,efetiva:90,ajustada:true}];
 const ultima=historico.at(-1);
 const notas=core.notasEfetivas({produtividade:ultima});
 assert.equal(notas.produtividade,90);
 assert.equal(historico[0].original,75);
});
teste('Zero não é ausência',()=>{
 const p=pessoa('P0');
 const zerada=core.avaliarComNotas(p,'mensal',0,()=>({...completa,produtividade:0}));
 const ausente=core.avaliarComNotas(p,'mensal',0,()=>{const x={...completa};delete x.produtividade;return x});
 assert.equal(zerada.status,'Inelegível');
 assert.notEqual(zerada.score,null);
 assert.equal(ausente.status,'Pendente');
 assert.equal(ausente.score,null);
 assert.equal(core.notasEfetivas({produtividade:{id:'z',original:75,efetiva:0,ajustada:true}}).produtividade,0);
});
teste('Segurança zero inelegível em ciclo mesmo com média positiva',()=>{
 const p=pessoa('PS');
 const a=core.avaliarComNotas(p,'ciclo1',0,(_,mes)=>({...completa,seguranca:mes===0?0:100}));
 assert.equal(a.status,'Inelegível');
 assert.ok(a.notas.seguranca>0);
});
teste('Segurança ausente nunca vira 100',()=>{
 const p=pessoa('PA');
 const a=core.avaliarComNotas(p,'mensal',0,()=>({produtividade:75,dirigibilidade:80,jornada:90,treinamentos:100}));
 assert.equal(a.status,'Pendente');
 assert.equal(a.score,null);
});
teste('Score anual é média de scores mensais previamente arredondados',()=>{
 const p=pessoa('PY');
 const a=core.avaliarComNotas(p,'anual',0,(_,mes)=>({...completa,produtividade:75+mes}));
 const b=Number((a.mensais.reduce((s,v)=>s+v,0)/12).toFixed(2));
 assert.equal(a.score,b);
});
teste('Ordenação usa score, admissão e chave estável',()=>{
 const a=pessoa('A','Florestal','2011-01-01'),b=pessoa('B','Florestal','2020-01-01');
 const registros=core.classificarComNotas([b,a],'mensal',0,fornecer);
 assert.deepEqual(registros.map(r=>r.pessoa.id),['A','B']);
 assert.deepEqual(registros.map(r=>r.posicao),[1,2]);
});
teste('Posições não são recalculadas após filtro e Top N',()=>{
 const a=pessoa('A'),b=pessoa('B'),c=pessoa('C');
 const lista=core.classificarComNotas([a,b,c],'mensal',0,(p)=>({...completa,produtividade:p.id==='A'?99:p.id==='B'?90:75}));
 const pos=lista.find(r=>r.pessoa.id==='B').posicao;
 const filtrado=lista.filter(r=>r.pessoa.id==='B'&&r.posicao<=2);
 assert.equal(pos,2);
 assert.equal(filtrado[0].posicao,2);
});
console.log(n+' testes do motor puro concluídos');
