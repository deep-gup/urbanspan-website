import { chromium } from 'playwright';

(async () => {
  console.log('Testing Playwright Chromium launch...');
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://urbanspaninfra.co.in/portal', { timeout: 15000 });
    const title = await page.title();
    console.log('Successfully loaded page. Title:', title);
    await browser.close();
    console.log('Playwright test successful!');
  } catch (err) {
    console.error('Playwright probe error:', err);
    process.exit(1);
  }
})();
