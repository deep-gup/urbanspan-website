import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  await page.goto('https://urbanspaninfra.co.in/contact', { waitUntil: 'networkidle' });

  const offending = await page.evaluate(() => {
    const docEl = document.documentElement;
    const clientWidth = docEl.clientWidth;
    let list = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > clientWidth + 2) {
        list.push({
          tag: el.tagName,
          className: el.className,
          right: rect.right,
          width: rect.width,
          text: el.textContent?.slice(0, 40)
        });
      }
    });
    return { clientWidth, list };
  });

  console.log('Offending elements on /contact @ 320x568:', offending);
  await browser.close();
}

main().catch(console.error);
