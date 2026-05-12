import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`CONSOLE ERROR: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });
    
    await page.goto('http://localhost:3000/schedule', { waitUntil: 'networkidle0' });
    
    if (errors.length > 0) {
      console.log("Found errors:");
      console.log(errors.join('\n'));
    } else {
      console.log("No errors found on the page.");
    }
    
    await browser.close();
  } catch (err) {
    console.error("Script error:", err);
  }
})();
