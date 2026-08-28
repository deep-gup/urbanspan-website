import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Going to /products');
  await page.goto('https://urbanspaninfra.co.in/products', { waitUntil: 'networkidle' });
  
  console.log('2. Clicking first product...');
  await page.locator('h3').first().click();
  await page.waitForTimeout(2000);
  console.log('Product URL:', page.url());

  const stepper = page.locator('input[type="number"]').first();
  await stepper.fill('-100');
  console.log('Stepper value after fill -100:', await stepper.inputValue());

  console.log('3. Clicking Add to Cart...');
  const addBtn = page.locator('button:has-text("Add")').first();
  await addBtn.click();
  await page.waitForTimeout(1500);

  console.log('4. Navigating to /cart...');
  await page.goto('https://urbanspaninfra.co.in/cart', { waitUntil: 'networkidle' });
  console.log('Cart URL:', page.url());

  const cartInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      value: i.value,
      placeholder: i.placeholder
    }));
  });
  console.log('Cart inputs:', cartInputs);

  const cartButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
  });
  console.log('Cart buttons:', cartButtons);

  const bodyText = await page.innerText('body');
  console.log('Cart body contains Clear Cart?', bodyText.includes('Clear Cart'));
  console.log('Cart body contains Consignment Valuation?', bodyText.includes('Consignment Valuation'));

  await browser.close();
}

main().catch(console.error);
