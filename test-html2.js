import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://192.168.1.2:3001', { waitUntil: 'networkidle0' });
  const content = await page.evaluate(() => document.querySelector('.flex-1')?.innerHTML);
  console.log("FLEX-1 CONTENT:", content || "NULL");
  await browser.close();
})();
