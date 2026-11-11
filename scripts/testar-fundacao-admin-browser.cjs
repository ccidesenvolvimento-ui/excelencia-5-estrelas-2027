// Fase 1 (#22): auditoria visual de todas as áreas do shell administrativo.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const base = '/excelencia-5-estrelas-2027';
const root = path.resolve('out');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server = http.createServer((req,res)=>{
 const u = new URL(req.url, 'http://localhost');
 const clean = decodeURIComponent(u.pathname.replace(new RegExp('^'+base), '') || '/');
 let file = path.resolve(root, '.'+clean);
 if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 if(fs.existsSync(file) && fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});
const pages=[
 ['visao-geral','Visão geral'],['ranking','Ranking'],['pendencias','Pendências'],
 ['importacoes','Importações'],['rh0034','Cadastro RH0034'],['ajustes-notas','Ajustes de notas'],
 ['configuracoes','Configurações'],['diagnostico','Testes e erros']
];
(async()=>{
 await new Promise(resolve=>server.listen(4176,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
 const dir='artifacts/fundacao-admin';
 fs.mkdirSync(dir,{recursive:true});
 try{
  for(const [width,height] of [[1440,900],[1024,850],[768,900],[390,844],[320,740]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
   const failures=[];
   page.on('pageerror',e=>failures.push(e.message));
   for(const [route,name] of pages){
    await page.goto(`http://127.0.0.1:4176${base}/${route}/`);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.app-shell').count(),1,`Shell administrativo em ${route}`);
    if(route==='ajustes-notas') {
      assert.ok(await page.getByRole('heading',{name:'Ajustes administrativos de notas'}).isVisible());
      assert.ok(await page.getByText('não registra alterações',{exact:false}).first().isVisible());
      await page.locator('#aj-mes').selectOption('0');
      await page.locator('#aj-pilar').selectOption('produtividade');
      await page.locator('.ajustes-tabela tbody button').first().click();
      await page.locator('#aj-nova').fill('90');
      await page.locator('#aj-just').fill('Correção de divergência confirmada pelo setor de Produtividade.');
      const preview=page.getByRole('button',{name:'Revisar ajuste (demo)'});
      if(await preview.isEnabled()){
        await preview.click();
        assert.ok(await page.getByRole('dialog',{name:'Conferência do ajuste'}).isVisible());
        await page.getByRole('button',{name:'Concluir pré-visualização (sem salvar)'}).click();
        assert.ok(await page.getByText('Nenhum ajuste foi enviado ou salvo.',{exact:false}).isVisible());
      }
      await page.locator('#aj-pilar').selectOption('seguranca');
      await page.locator('.ajustes-tabela tbody button').first().click();
      assert.ok(await page.getByText('Segurança: edição manual bloqueada.').isVisible());
      assert.equal(await page.locator('#aj-nova').count(),0);
    }

    assert.equal(await page.locator('nav[aria-label="Páginas do sistema"] a').count(),9,'Menu administrativo preservado');
    assert.equal(await page.locator('nav[aria-label="Páginas do sistema"] a[aria-current="page"]').count(),1,`Aba ativa em ${route}`);
    const pageInfo=await page.locator('.app-shell').evaluate(el=>{
      const style=getComputedStyle(el);
      return {color:style.color,family:style.fontFamily,gradient:style.backgroundImage};
    });
    assert.ok(pageInfo.family.includes('Segoe UI'),'Tipografia institucional no shell');
    assert.ok(pageInfo.gradient.includes('radial-gradient'),'Luz institucional no shell');
    if(width===1440 || width===390 || route==='visao-geral'){
     await page.screenshot({path:`${dir}/${route}-${width}.png`,fullPage:true,animations:'disabled'});
    }
    if(width<=768 && route==='visao-geral'){
     const toggle=page.getByRole('button',{name:'Abrir menu',exact:true});
     assert.ok(await toggle.isVisible(),'Menu móvel acessível');
     await toggle.click();
     assert.ok(await page.locator('aside.sidebar.sidebar-aberta').isVisible(),'Menu abre no celular/tablet');
     await page.getByRole('button',{name:'Fechar menu',exact:true}).first().click();
     assert.equal(await page.locator('aside.sidebar.sidebar-aberta').count(),0,'Menu fecha corretamente');
    }
   }
   assert.deepEqual(failures,[],`Sem erros JS a ${width}px`);
   console.log(`✓ Fundação administrativa: oito abas verificadas em ${width}px.`);
   await page.close();
  }
  // Escopo: garantir que as páginas institucionais não recebam .app-shell.
  const page=await browser.newPage();
  for(const route of ['','login/','motorista/']){
   await page.goto(`http://127.0.0.1:4176${base}/${route}`);
   assert.equal(await page.locator('.app-shell').count(),0,`Página pública preservada: ${route||'home'}`);
  }
  await page.close();
 } finally {
  await browser.close();
  server.close();
 }
})().catch(err=>{console.error(err);server.close();process.exitCode=1;});
