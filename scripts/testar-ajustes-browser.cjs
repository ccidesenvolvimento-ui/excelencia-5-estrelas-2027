// Regressão de navegador sobre o build estático, somente dados fictícios.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const ExcelJS = require('exceljs');
const base = '/excelencia-5-estrelas-2027';
const root = path.resolve('out');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server = http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname.replace(new RegExp('^'+base),'')||'/'));
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 fs.mkdirSync('artifacts/ajustes',{recursive:true});
 try{
 for(const [nome,width,height] of [['desktop',1440,1000],['celular',390,844],['celular-320',320,740]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(page.url()+': '+e.message));
  await page.goto(`http://127.0.0.1:4173${base}/`);await page.waitForLoadState('networkidle');
  const chart=page.locator('section[aria-labelledby="evolucaoTitulo"]');
  const labels=chart.locator('svg text');
  const original=await labels.allTextContents();
  assert.equal(original.length,12);assert.ok(original.every(x=>/^\d+,\d{2}$/.test(x)));
  const boxes=await labels.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
  for(let i=1;i<boxes.length;i++)assert.ok(boxes[i].left>boxes[i-1].right,'Rótulos não se sobrepõem');
  const scores=await page.locator('[class*="segmentoGrafico"] > strong').allTextContents();
  const values=scores.filter(x=>x!=='—').map(x=>Number(x.replace(',','.')));
  assert.deepEqual(values,[...values].sort((a,b)=>b-a));
  await page.screenshot({path:`artifacts/ajustes/${nome}-visao.png`,fullPage:true});
  await chart.screenshot({path:`artifacts/ajustes/${nome}-grafico.png`});
  await page.locator('label').filter({has:page.getByText('Segmento',{exact:true})}).locator('select').selectOption('Florestal');
  await page.locator('label').filter({has:page.getByText('Filial',{exact:true})}).locator('select').selectOption('Lavras');
  await page.locator('label').filter({has:page.getByText('Mês',{exact:true})}).locator('select').selectOption('0');
  await page.locator('label').filter({has:page.getByText('Período',{exact:true})}).locator('select').selectOption('anual');
  assert.deepEqual(await labels.allTextContents(),original,'Série geral não muda com filtros');
  await page.locator('label').filter({has:page.getByText('Segmento',{exact:true})}).locator('select').selectOption('Todas');
  await page.locator('label').filter({has:page.getByText('Período',{exact:true})}).locator('select').selectOption('mensal');
  const jan=await page.locator('[class*="listaSegmentos"] > div').allTextContents();
  assert.ok(jan.at(-1).includes('Sucro')&&jan.at(-1).includes('—'));
  await page.goto(`http://127.0.0.1:4173${base}/configuracoes/`);await page.waitForLoadState('networkidle');
  assert.equal(await page.getByRole('heading',{name:'Fonte da Dirigibilidade',exact:true}).count(),0);
  assert.ok(await page.getByRole('heading',{name:'Pesos dos cinco pilares'}).isVisible());
  await page.screenshot({path:`artifacts/ajustes/${nome}-configuracoes.png`,fullPage:true});
  await page.getByRole('tab',{name:'Usuários e acessos'}).click();
  assert.ok(await page.getByRole('heading',{name:'Usuários e permissões',exact:true}).isVisible());
  await page.getByRole('tab',{name:'Segurança e auditoria'}).click();
  assert.ok(await page.getByRole('heading',{name:'Requisitos antes de habilitar dados reais'}).isVisible());
  await page.goto(`http://127.0.0.1:4173${base}/pendencias/`);await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('a[href*="fontes-dirigibilidade"]').count(),0);
  await page.getByRole('button',{name:'Ver pendências de Henrique Rocha',exact:true}).click();
  assert.ok((await page.getByRole('dialog').innerText()).includes('Não informada'));
  await page.screenshot({path:`artifacts/ajustes/${nome}-pendencias.png`,fullPage:true});
  await page.getByRole('button',{name:'Fechar',exact:true}).click();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Exportar Excel (.xlsx)',exact:true}).click();
  const download=await downloadPromise;
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.readFile(await download.path());
  assert.deepEqual(workbook.worksheets.map(x=>x.name),['Resumo','Pendências']);
  const ws=workbook.getWorksheet('Pendências');
  assert.equal(ws.getCell('A9').value,'Diego Alves');assert.equal(ws.getCell('B9').type,ExcelJS.ValueType.String);
  assert.equal(ws.getCell('H9').value,'Não informada');
  assert.deepEqual(errors,[]);
  console.log(`✓ ${nome} ${width}x${height}: filtros, ordem, rótulos sem colisão, configurações, detalhes e XLSX.`);
  await page.close();
 }
 const modelo=new ExcelJS.Workbook();await modelo.xlsx.readFile('public/modelos/Modelo_Dirigibilidade_2027.xlsx');
 assert.ok(modelo.worksheets.some(ws=>JSON.stringify(ws.getSheetValues()).includes('TIPO DE DADO')));
 console.log('✓ Modelo Dirigibilidade mantém coluna TIPO DE DADO.');
  }catch(error){
  // Em falhas de hidratação, a versão de desenvolvimento fornece o diff real.
  const {spawn}=require('node:child_process');
  const dev=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','-p','4175'],{env:{...process.env,NEXT_PUBLIC_DEPLOY_TARGET:'github-pages',NEXT_PUBLIC_BASE_PATH:base},stdio:'pipe'});
  try{
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Timeout no diagnóstico')),30000);dev.stdout.on('data',b=>{if(b.toString().includes('Ready')){clearTimeout(timer);resolve();}});dev.once('error',reject);});
   const diagnostic=await browser.newPage();
   diagnostic.on('console',m=>{if(m.type()==='error')console.error('DIAGNÓSTICO',m.text());});
   diagnostic.on('pageerror',e=>console.error('DIAGNÓSTICO',diagnostic.url(),e.message));
   for(const route of ['/','/configuracoes/','/pendencias/']){await diagnostic.goto(`http://127.0.0.1:4175${base}${route}`);await diagnostic.waitForLoadState('networkidle');}
  }catch(diagnosticError){console.error(diagnosticError);}finally{dev.kill();}
  throw error;
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
