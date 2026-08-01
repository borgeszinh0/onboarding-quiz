import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  await page.goto('http://192.168.1.2:3001/inbox', { waitUntil: 'networkidle0' });
  
  await page.type('input', 'My test task');
  console.log("Input value:", await page.evaluate(() => document.querySelector('input').value));
  
  await page.evaluate(() => document.querySelector('button').click());
  
  console.log("HTML after click:", await page.evaluate(() => document.body.innerHTML.substring(0, 500)));
  
  await browser.close();
})();
