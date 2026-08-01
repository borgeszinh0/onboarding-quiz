import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://192.168.1.2:3001', { waitUntil: 'networkidle0' });
  
  console.log("Done checking /");
  await browser.close();
})();
