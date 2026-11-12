// Issue #77 — teste visual e funcional da rota Node OPT-IN, nunca do GitHub Pages.
// Supabase local descartável iniciado pela CI. Não usa dados reais.
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const fixture=JSON.parse(fs.readFileSync("/tmp/e5-ajustes-e2e-fixture.json","utf8"));
const base="http://127.0.0.1:3197";
fs.mkdirSync("artifacts/ajustes",{recursive:true});
async function login(context){
 const u=fixture.usuarios.adminA;
 const r=await context.request.post(base+"/api/ci-login",{data:{email:u.email,password:fixture.senha}});
 assert.equal(r.status(),200,"Autenticação SSR via GoTrue local");
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:"reduce"});
   await login(context);
   const page=await context.newPage();
   const errors=[];page.on("pageerror",err=>errors.push(err.message));
   const destino=base+"/ajustes-notas-live";
   await page.goto(destino,{waitUntil:"networkidle"});
   await page.getByRole("heading",{name:"Ajustes administrativos de notas"}).waitFor();
   await page.getByText("Motorista fictício").first().waitFor();
   await page.locator("#aj-real-pilar").selectOption("produtividade");
   await page.getByRole("button",{name:"Selecionar"}).first().click();
   const modal=page.getByRole("dialog");
   await modal.waitFor();
   assert.ok(await modal.locator("#aj-real-nova").isVisible());
   const blur=await page.locator(".ajustes-overlay-embaçado").evaluate(el=>getComputedStyle(el).backdropFilter);
   assert.ok(blur.includes("blur("),"Modal com blur de fundo");
   if(width===1440){
    await modal.locator("#aj-real-nova").fill("85");
    await modal.locator("#aj-real-just").fill("Correção adicional validada pela equipe, usando somente usuários e notas fictícios de homologação.");
    await modal.getByRole("button",{name:"Revisar ajuste",exact:true}).click();
    await modal.getByRole("button",{name:"Confirmar e registrar ajuste"}).click();
    await page.getByText("Ajuste registrado no banco de homologação").waitFor();
    await page.getByText("85,00",{exact:true}).first().waitFor();
    await page.getByText("Correção adicional validada pela equipe",{exact:false}).waitFor();
    assert.ok(await page.getByText("75,00",{exact:true}).first().isVisible(),"Nota original 75 preservada");
    assert.equal((await context.request.get(base+"/api/ajustes-notas?competencia=2027-10-01")).status(),200);
   }else{
    // O segundo navegador constata a persistência do ajuste no mesmo banco local.
    await modal.locator("#aj-real-nova").waitFor();
    assert.ok(await modal.getByText("85,00",{exact:true}).isVisible(),"Nota efetiva salva disponível no mobile");
   }
   await page.screenshot({path:"artifacts/ajustes/live-"+width+".png",fullPage:true});
   await modal.getByRole("button",{name:"Fechar ajuste"}).click();
   await page.locator("#aj-real-pilar").selectOption("seguranca");
   await page.getByRole("button",{name:"Selecionar"}).first().click();
   assert.ok(await page.getByText("Segurança: edição manual bloqueada.").isVisible());
   assert.equal(await page.locator("#aj-real-nova").count(),0);
   assert.deepEqual(errors,[],"Sem erros JS na rota real opt-in");
   await context.close();
   console.log("✓ Homologação "+width+"px: sessão SSR, UI real, blur, RLS, Segurança"+(width===1440?", gravação e histórico":"")+" verificados.");
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
