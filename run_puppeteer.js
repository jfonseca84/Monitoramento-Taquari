const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Click on the fluviologico tab
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fluviologicoBtn = btns.find(b => b.textContent.includes('FLUVIOLÓGICO'));
      if (fluviologicoBtn) {
         console.log('Clicking FLUVIOLÓGICO');
         fluviologicoBtn.click();
      } else {
         console.log('Could not find FLUVIOLÓGICO tab');
      }
    });
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.log('Error clicking:', e.message);
  }

  await browser.close();
})();
