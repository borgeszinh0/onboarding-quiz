import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://192.168.1.2:3001/inbox', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => document.querySelector('input')?.outerHTML);
  console.log("INPUT:", html);
  
  // Try typing
  try {
    await page.type('input', 'Teste de tarefa');
    await page.keyboard.press('Enter');
    const tasks = await page.evaluate(() => document.body.innerHTML);
    if (tasks.includes('Teste de tarefa')) console.log('BUTTON WORKS!');
    else console.log('BUTTON BROKEN!');
  } catch (e) {
    console.log('ERROR TYPING:', e.message);
  }
  
  await browser.close();
})();
