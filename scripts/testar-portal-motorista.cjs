/** Testes do portal do motorista sem serviços externos nem escrita no repositório. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const raiz=path.join(__dirname,'..');
const cache=new Map();
function carregar(relativo){
 const local=path.join(raiz,'src/lib',relativo+'.ts');
 if(cache.has(local))return cache.get(local).exports;
 const original=fs.readFileSync(local,'utf8');
 const js=ts.transpileModule(original,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};cache.set(local,mod);
 const localRequire=(nome)=>nome.startsWith('./')?carregar(nome.slice(2)):require(nome);
 new Function('require','module','exports',js)(localRequire,mod,mod.exports);
 return mod.exports;
}
const dados=carregar('dados-demo');
const {buscarMotorista,normalizarMatricula,avaliacaoDaMatricula,periodoDisponivel}=carregar('consulta-motorista');
let passou=0;
function teste(titulo,fn){fn();passou++;console.log('✓ '+titulo)}
teste('Normalização de matrícula',()=>assert.equal(normalizarMatricula('  f 004 '),'F004'));
teste('Busca por matrícula fictícia',()=>assert.equal(buscarMotorista('f004').pessoa.nome,'Thiago Moraes'));
teste('Matrícula desconhecida não expõe outro perfil',()=>assert.equal(buscarMotorista('naoexiste').tipo,'nao-encontrado'));
teste('Matrícula em branco não entra',()=>assert.equal(buscarMotorista(' ').tipo,'nao-encontrado'));
teste('Posição e score iguais ao ranking principal',()=>{
 const pessoa=buscarMotorista('F004').pessoa;
 const perfil=avaliacaoDaMatricula(pessoa,'mensal',3);
 const original=dados.ranking('mensal',3).find(r=>r.pessoa.matricula===pessoa.matricula);
 assert.deepEqual(perfil,original);
 assert.equal(perfil.status,'Elegível');
 assert.ok(perfil.posicao>0);
});
teste('Cinco notas do perfil são exatamente as notas do ranking',()=>{
 const pessoa=buscarMotorista('F004').pessoa;
 const perfil=avaliacaoDaMatricula(pessoa,'mensal',3);
 for(const estrela of dados.estrelas)assert.equal(perfil.notas[estrela],dados.ranking('mensal',3).find(r=>r.pessoa.id===pessoa.id).notas[estrela]);
});
teste('Pendências não viram nota zero ou posição',()=>{
 const pessoa=buscarMotorista('F003').pessoa;
 const perfil=avaliacaoDaMatricula(pessoa,'mensal',3);
 assert.equal(perfil.status,'Pendente');assert.equal(perfil.score,null);assert.equal(perfil.posicao,null);
});
teste('Mês fora do calendário Sucro não gera resultado',()=>{
 const pessoa=buscarMotorista('S001').pessoa;
 assert.equal(periodoDisponivel(pessoa,'mensal',0),false);
 assert.equal(avaliacaoDaMatricula(pessoa,'mensal',0),null);
});
teste('A rota tem metadados PWA e escopo isolado',()=>{
 const manifest=fs.readFileSync(path.join(raiz,'src/app/motorista/manifest.ts'),'utf8');
 assert.match(manifest,/standalone/);assert.match(manifest,/motorista\//);assert.match(manifest,/maskable/);
});
teste('Service worker não armazena notas ou matrículas',()=>{
 const sw=fs.readFileSync(path.join(raiz,'public/motorista/sw.js'),'utf8');
 assert.match(sw,/no-store/);assert.doesNotMatch(sw,/caches\.open|localStorage|indexedDB/);
});
teste('A rota não exibe o menu administrativo',()=>{
 const nav=fs.readFileSync(path.join(raiz,'src/components/Navegacao.tsx'),'utf8');
 assert.match(nav,/caminho === "\/motorista"/);
 assert.match(nav,/Portal do motorista/);
});
console.log(`\n${passou}/${passou} verificações do portal aprovadas`);
