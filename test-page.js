import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  await page.goto('http://192.168.1.2:3001', { waitUntil: 'networkidle0' });
  await browser.close();
})();
