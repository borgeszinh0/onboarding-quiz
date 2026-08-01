import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://192.168.1.2:3001', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log("HTML:", html.length > 500 ? html.substring(0, 500) + '...' : html);
  const mainContent = await page.evaluate(() => document.querySelector('main')?.innerHTML);
  console.log("MAIN CONTENT:", mainContent ? mainContent.substring(0, 200) : "NULL");
  await browser.close();
})();
