import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://urbanspaninfra.co.in/portal', { waitUntil: 'networkidle' });

  // Login
  await page.locator('input[type="email"]').fill('sourabh.khandelwal@khandelwalinfra.com');
  await page.locator('input[type="password"]').fill('Password123!');
  await page.locator('button[type="submit"]').click();

  await page.locator('span:has-text("Verified Client Account")').waitFor({ state: 'visible' });

  // Switch to orders tab
  await page.locator('button:has-text("Active Supply Contracts")').click();
  await page.waitForTimeout(1000);

  // Inspect all contracts
  const contracts = await page.$$eval('div.bg-slate-50.border.border-slate-200', (cards) => {
    return cards.map(c => {
      const title = c.querySelector('div.text-base.font-extrabold')?.textContent?.trim();
      const statusPill = c.querySelector('span.rounded-full.bg-blue-100')?.textContent?.trim();
      const stages = Array.from(c.querySelectorAll('div.grid.grid-cols-5 > div')).map(st => {
        const circle = st.querySelector('div.rounded-full');
        const label = st.querySelector('span')?.textContent?.trim();
        return {
          label,
          className: circle?.className
        };
      });
      return { title, statusPill, stages };
    }).filter(c => c.title);
  });

  console.log('Inspected Contracts from DOM:', JSON.stringify(contracts, null, 2));

  await browser.close();
})();
