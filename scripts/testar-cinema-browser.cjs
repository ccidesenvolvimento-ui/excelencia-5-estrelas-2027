/* eslint-disable @typescript-eslint/no-require-imports */
// Executar após o build GitHub Pages: node scripts/testar-entrada-browser.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const base = '/excelencia-5-estrelas-2027';
const root = path.resolve('out');
const output = process.env.CINEMA_OUTPUT || 'artifacts/cinema';
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
  await new Promise(resolve => server.listen(4175, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    fs.mkdirSync(output, { recursive: true });
    const url = `http://127.0.0.1:4175${base}`;
    for (const width of [320, 390, 768, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 1000 }, reducedMotion: 'no-preference' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${url}/`);
      await page.waitForSelector('[data-flyby]');
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-flyby], [data-clarao]')) {
          const anim = el.getAnimations()[0]; anim.pause(); anim.currentTime = 960;
        }
      });
      assert.equal(await page.locator('[data-flyby]').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
      assert.equal(await page.locator('[data-clarao]').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
      const glow = await page.locator('[data-clarao]').evaluate(el => Number(getComputedStyle(el).opacity));
      assert.ok(glow > .3 && glow < .65, 'Clarão único com intensidade limitada');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(output, `passagem-${width}.png`) });
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('[data-flyby], [data-clarao]')) el.getAnimations()[0].finish();
      });
      await page.waitForFunction(() => !document.querySelector('[data-flyby]'));
      assert.equal(await page.locator('img[alt=""]').first().evaluate(el => getComputedStyle(el).visibility), 'visible');
      const estrela = page.locator('[data-estrela-interativa]');
      const foto = estrela.locator('img');
      const bounds = await foto.boundingBox();
      const texto = await page.locator('h1').boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, 'Estrela final dentro da viewport');
      if (width >= 768) assert.ok(bounds.x >= texto.x + texto.width - 1, 'Sem sobreposição permanente com título');

      if (width === 1440) {
        await estrela.hover({ position: { x: 330, y: 40 } });
        assert.ok(await estrela.evaluate(el => el.style.getPropertyValue('--tilt-y')));
        const y = await estrela.evaluate(el => parseFloat(el.style.getPropertyValue('--tilt-y')));
        assert.ok(Math.abs(y) <= 5);
        await page.waitForTimeout(500);
        const matrix = await estrela.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m44);
        assert.ok(matrix > 0, 'Transformação 3D válida');
        const scale = await estrela.evaluate(el => {
          const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
          return Math.hypot(m.m11, m.m12, m.m13);
        });
        assert.ok(scale >= 1.06 && scale <= 1.09, 'Hover amplia entre 6 e 9%');
        const halo = estrela.locator('..').locator('div').first();
        const luz = await halo.evaluate(el => ({ opacity: Number(getComputedStyle(el).opacity), scale: new DOMMatrixReadOnly(getComputedStyle(el).transform).m11 }));
        assert.ok(luz.opacity > .99 && luz.scale > 1.17, 'Halo amplia e intensifica no hover');
        await page.screenshot({path:path.join(output, 'hover-1440.png')});
        await page.mouse.move(0, 0);
        assert.equal(await estrela.evaluate(el => el.style.getPropertyValue('--tilt-y')), '');
        await page.waitForTimeout(500);
        const reset = await estrela.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11);
        assert.equal(reset, 1, 'Retorno à escala original');
        assert.equal(await halo.evaluate(el => Number(getComputedStyle(el).opacity)), .65, 'Halo retorna à iluminação original');
      }
      await page.screenshot({ path: path.join(output, `final-${width}.png`) });
      await page.reload();
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('[data-flyby], [data-clarao]').count(), 0, 'Uma abertura por sessão');
      await page.goto(`${url}/login/`);
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('[data-flyby], [data-clarao]').count(), 0, 'Login sem flyby');
      assert.deepEqual(errors, []);
      console.log(`✓ Cinema ${width}px: passagem, clarão limitado, posição final, sessão única e login sem repetição.`);
      await page.close();
    }
    const reduced = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await reduced.goto(`${url}/`); await reduced.waitForLoadState('networkidle');
    assert.equal(await reduced.locator('[data-flyby], [data-clarao]').count(), 0);
    await reduced.locator('[data-estrela-interativa]').hover();
    assert.equal(await reduced.locator('[data-estrela-interativa]').evaluate(el => getComputedStyle(el).transform), 'none');
    await reduced.close();
    const clickable = await browser.newPage({ reducedMotion: 'no-preference' });
    await clickable.goto(`${url}/`); await clickable.waitForSelector('[data-flyby]');
    await clickable.getByRole('link', { name: /01.*Área Corporativa/ }).click();
    await clickable.waitForURL('**/login/');
    assert.equal(await clickable.locator('[data-flyby], [data-clarao]').count(), 0);
    await clickable.close();
    console.log('✓ Movimento reduzido sem flyby/clarão/tilt; navegação disponível durante a abertura.');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
