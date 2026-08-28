import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('https://urbanspaninfra.co.in/portal', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const h2 = await page.locator('h2').allTextContents();
  console.log('H2 elements on /portal unauth:', h2);

  const buttons = await page.locator('button').allTextContents();
  console.log('Buttons on /portal unauth:', buttons);

  const hasSignInHeading = await page.locator('h2:has-text("Sign In"), h2:has-text("Client Sign In")').count();
  console.log('hasSignInHeading count:', hasSignInHeading);

  await browser.close();
}

main().catch(console.error);
