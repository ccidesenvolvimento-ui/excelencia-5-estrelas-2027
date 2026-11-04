/* eslint-disable @typescript-eslint/no-require-imports */
// Executar após o build GitHub Pages: node scripts/testar-entrada-browser.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const base = '/excelencia-5-estrelas-2027';
const root = path.resolve('out');
const output = process.env.ENTRADA_SCREENSHOTS || 'artifacts/entrada';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith(base + '/')) { res.writeHead(404); return res.end(); }
  let file = path.resolve(root, '.' + pathname.slice(base.length));
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(4174, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    fs.mkdirSync(output, { recursive: true });
    for (const width of [320, 390, 768, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 1000 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      const url = `http://127.0.0.1:4174${base}`;
      await page.goto(`${url}/`);
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('#hover-audit, #cursor-video').count(), 0, 'Sem tarja ou cursor de gravação na aplicação');
      assert.ok(await page.getByRole('heading', { name: 'A excelência será reconhecida!' }).isVisible());
      assert.equal(await page.getByRole('navigation', { name: 'Páginas do sistema' }).count(), 0);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').innerText(), 'Pular para o conteúdo');
      await page.locator(':focus').evaluate(el => el.blur());
      const acesso = page.getByRole('link', { name: /01.*Área Corporativa/ });
      const cartao = await acesso.boundingBox();
      console.log(`  Primeiro acesso em ${width}px: y=${Math.round(cartao.y)}px.`);
      if (width < 768) assert.ok(cartao.y < 720, 'Acesso próximo no mobile');
      assert.equal(await page.locator('img[alt=""]').first().evaluate(el => getComputedStyle(el).animationName), 'none');
      await acesso.hover();
      assert.equal(await acesso.evaluate(el => el.style.getPropertyValue('--spot-x')), '', 'Reduced motion desativa rastreamento');
      await page.mouse.move(0, 0);
      for (const route of ['entrada', 'login']) {
        if (route === 'login') {
          await page.getByRole('link', { name: /01.*Área Corporativa/ }).click();
          await page.waitForURL('**/login/');
          assert.ok(await page.getByRole('button', { name: 'Acesso ainda indisponível' }).isDisabled());
          assert.ok(await page.getByLabel('E-mail corporativo').isDisabled());
          assert.ok(await page.getByLabel('Senha', { exact: true }).isDisabled());
          assert.equal(await page.getByRole('navigation', { name: 'Páginas do sistema' }).count(), 0);
          assert.equal(await page.evaluate(() => document.cookie), '');
          assert.equal(await page.locator('form, #hover-audit, #cursor-video').count(), 0, 'Login sem envio de credenciais ou elementos de gravação');
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Sem overflow em ${width}, ${route}`);
        assert.ok(await page.locator('img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0)));
        await page.screenshot({ path: path.join(output, `${route}-${width}.png`), fullPage: true });
      }
      await page.getByRole('link', { name: 'Explorar demonstração' }).click();
      await page.waitForURL('**/visao-geral/');
      assert.ok(await page.getByRole('heading', { name: 'Visão geral da excelência.' }).isVisible());
      assert.ok(await page.getByRole('navigation', { name: 'Páginas do sistema' }).count());
      if (width === 1440) {
        for (const [nome, rota] of [['Ranking', '/ranking'], ['Pendências', '/pendencias'], ['Importações', '/importacoes'], ['Cadastro RH0034', '/rh0034'], ['Configurações', '/configuracoes'], ['Testes e erros', '/diagnostico'], ['Visão geral', '/visao-geral']]) {
          await page.getByRole('link', { name: nome, exact: true }).click();
          await page.waitForURL(`**${rota}/`);
          assert.ok(await page.getByRole('heading', { level: 1 }).isVisible(), nome);
          assert.equal(await page.getByRole('link', { name: nome, exact: true }).getAttribute('aria-current'), 'page');
        }
        await page.goto(`${url}/relatorios/`); await page.waitForURL('**/ranking/');
        await page.goto(`${url}/usuarios/`); await page.waitForURL('**/configuracoes/#usuarios');
      }
      await page.goto(`${url}/painel/`);
      await page.waitForURL('**/visao-geral/');
      await page.goto(`${url}/`);
      await page.getByRole('link', { name: /02.*Área do Motorista/ }).click();
      await page.waitForURL('**/motorista/');
      assert.equal(await page.getByRole('navigation', { name: 'Páginas do sistema' }).count(), 0);
      assert.deepEqual(errors, []);
      console.log(`✓ ${width}px: entrada, login indisponível, demo, redirecionamento, motorista, imagens e ausência de overflow/erros.`);
      await page.close();
    }
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await desktop.goto(`http://127.0.0.1:4174${base}/`);
    const card = desktop.getByRole('link', { name: /01.*Área Corporativa/ });
    await card.hover({ position: { x: 100, y: 70 } });
    assert.ok(await card.evaluate(el => el.style.getPropertyValue('--spot-x')), 'Spotlight acompanha mouse');
    await desktop.screenshot({ path: path.join(output, 'entrada-spotlight-1440.png'), fullPage: true, animations: 'disabled' });
    await desktop.mouse.move(0, 0);
    assert.equal(await card.evaluate(el => el.style.getPropertyValue('--spot-x')), '', 'Spotlight limpa posição ao sair');
    await card.focus();
    assert.notEqual(await card.evaluate(el => getComputedStyle(el).outlineStyle), 'none', 'Foco de teclado visível');
    await desktop.waitForFunction(() => !document.querySelector('[data-flyby]'));
    console.log('✓ Spotlight, limpeza ao sair, foco por teclado e entrada finita da estrela.');
    await desktop.close();
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
