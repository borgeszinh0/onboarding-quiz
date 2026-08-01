import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  // Inject script to monitor React roots
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded');
    });
  });

  await page.goto('http://192.168.1.2:3001', { waitUntil: 'networkidle0' });
  await browser.close();
})();
