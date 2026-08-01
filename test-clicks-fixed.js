import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://192.168.1.2:3001/inbox', { waitUntil: 'networkidle0' });
  
  await page.type('input', 'My test task');
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.getAttribute('aria-label'), btn);
    if (text === 'Capturar') {
      console.log("Found Capturar button, clicking!");
      await btn.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 500));
  
  const mainHTML = await page.evaluate(() => document.querySelector('main').innerHTML);
  if (mainHTML.includes('My test task')) {
    console.log('BUTTON WORKS!');
  } else {
    console.log('BUTTON BROKEN!');
  }
  
  await browser.close();
})();
