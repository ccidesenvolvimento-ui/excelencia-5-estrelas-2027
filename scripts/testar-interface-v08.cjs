/* Testes simples da interface demonstrativa v0.8; não substituem o build Next.js. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.join(__dirname, '..');
const ler = p => fs.readFileSync(path.join(raiz, p), 'utf8');
let n = 0;
function checar(nome, fn) { fn(); n++; console.log('OK:', nome); }
const page = ler('src/app/rh0034/page.tsx');
const nav = ler('src/components/Navegacao.tsx');
const css = ler('src/app/globals.css');
const lib = ler('src/lib/validar-rh0034.ts');
checar('seletor RH0034 aceita XLSX',()=>assert.match(page,/accept="\.xlsx"/));
checar('suporte a arrastar arquivos',()=>assert.match(page,/onDrop=\{aoSoltar\}/));
checar('arquivo e conteudo nao enviados no demo',()=>assert.ok(!/fetch\(|FileReader|arrayBuffer\(|\.text\(/.test(page)));
checar('confirmacao de importacao desabilitada',()=>assert.match(page,/disabled title="Será habilitado somente/));
checar('nao existe modelo RH0034 para download',()=>assert.ok(!/href=.*RH0034.*xlsx/i.test(page)));
checar('filtros de classificacao presentes',()=>['rh-filial','rh-funcao','rh-situacao','rh-categoria'].forEach(f=>assert.ok(page.includes(f))));
checar('somente botao altera modo',()=>assert.match(nav,/function alternarModo\(\)/));
checar('simbolo oficial usado',()=>assert.match(nav,/estrela-oficial-5-estrelas\.png/));
checar('simbolo oficial existe',()=>assert.ok(fs.existsSync(path.join(raiz,'public/estrela-oficial-5-estrelas.png'))));
checar('abas ativas reconhecidas mesmo com barra final',()=>assert.ok(nav.includes('usePathname() || "/").replace')));
checar('halo igual em cada aba',()=>assert.match(css,/\.menu a\[aria-current="page"\]/));
checar('animação reduzida',()=>assert.match(css,/prefers-reduced-motion/));
// Execução da função TS pura via compilador typescript, quando disponível.
let ts;
try { ts=require('typescript'); } catch { try { ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); } catch {} }
if(ts){
 const vm=require('node:vm');
 const js=ts.transpileModule(lib,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};vm.runInNewContext(js,{exports});
 const validar=exports.conferirSelecaoRh0034;
 checar('xlsx valido',()=>assert.equal(validar('RH0034.xlsx',1800).tipo,'ok'));
 checar('extensao invalida',()=>assert.equal(validar('rh.csv',1800).tipo,'erro'));
 checar('arquivo vazio',()=>assert.equal(validar('RH0034.xlsx',0).tipo,'erro'));
 checar('limite de tamanho',()=>assert.equal(validar('RH0034.xlsx',16*1024*1024).tipo,'erro'));
 for(const file of ['src/app/rh0034/page.tsx','src/components/Navegacao.tsx','src/lib/validar-rh0034.ts']){
  const src=ler(file);const res=ts.transpileModule(src,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX, module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}});
  checar('sintaxe TypeScript '+file,()=>assert.equal((res.diagnostics||[]).length,0));
 }
}
console.log(`${n} verificações concluídas.`);
