import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://192.168.1.2:3001', { waitUntil: 'networkidle0' });
  
  // Find "Agenda" button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Agenda')) {
      console.log("Clicking Agenda button");
      await btn.click();
      break;
    }
  }
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 500));
  
  // Check if ScheduleRuler is in the DOM
  const mainHTML = await page.evaluate(() => document.querySelector('main').innerHTML);
  if (mainHTML.includes('ScheduleRuler') || mainHTML.includes('09:00')) {
    console.log("Agenda view is visible!");
  } else {
    console.log("Agenda view is NOT visible! Click failed.");
  }
  
  await browser.close();
})();
