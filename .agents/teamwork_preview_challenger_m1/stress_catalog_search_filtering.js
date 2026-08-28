import { chromium } from 'playwright';

// Excerpt cleaner helper from ProductCatalog.jsx
function getCleanDescriptionExcerpt(text, maxLength = 140) {
  if (!text) return 'Premium BIS-certified structural steel engineered for heavy infrastructure and construction demands.';
  const clean = text
    .replace(/^#+\s+/gm, '') // Remove heading starts
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italics
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/^[-*•]\s+/gm, '') // Remove list bullets
    .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
    .replace(/\|/g, ' ') // Remove table pipes
    .replace(/-{3,}/g, ' ') // Remove hr lines
    .replace(/>\s+/g, '') // Remove blockquotes
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  if (clean.length > maxLength) {
    return clean.substring(0, maxLength).trim() + '...';
  }
  return clean || 'Premium BIS-certified structural steel engineered for heavy infrastructure and construction demands.';
}

// Catalog filter logic from ProductCatalog.jsx
function filterProducts(products, selectedCategory, searchQuery) {
  return products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || 
      (p.category && p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
    const matchesSearch = 
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (Array.isArray(p.tags) && p.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });
}

const MOCK_PRODUCTS = [
  { id: 'p1', sku: 'US-TMT-550D', name: 'Fe-550D TMT Steel Rebars (8mm - 32mm)', category: 'Rebars', tags: ['Rebars', 'In Stock & Ready', 'Fe-550D', 'IS 1786:2008'], description: '### IS 1786 Certified\nHigh tensile **earthquake-resistant** TMT rebars.' },
  { id: 'p2', sku: 'US-STR-ISMB', name: 'Heavy Structural ISMB I-Beams & Columns', category: 'Structural Steel', tags: ['Structural Steel', 'ISMB', 'Primary Mill'], description: '# Heavy Beams\nPrimary structural steel sections [ISMB 100 to 600](https://urbanspaninfra.co.in).' },
  { id: 'p3', sku: 'US-COIL-HR', name: 'Hot Rolled (HR) Steel Coils & Sheets (2mm - 12mm)', category: 'Coils & Sheets', tags: ['HR Coils', 'Stock'], description: '> Industrial hot rolled coil stock with *uniform gauge* control.' },
  { id: 'p4', sku: 'US-PIPE-ERW', name: 'ERW & Seamless Heavy Steel Piping (1/2" to 14" NB)', category: 'Piping & Tubes', tags: ['ERW Pipes', 'Galvanized'], description: '| Spec | Value |\n|---|---|\n| Size | 1/2" - 14" |' }
];

async function runCatalogStressTests() {
  console.log('========================================================================');
  console.log('CHALLENGER STRESS SUITE 3: CATALOG SEARCH, FILTER & SANITIZER STRESS');
  console.log('Target: ProductCatalog Filtering Invariants, AST Sanitizer & Edge Cases');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} - Details: ${details}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Excerpt Sanitizer Defensive Stress Testing
  // ---------------------------------------------------------------------------
  console.log('--- 1. AST Excerpt Sanitizer Robustness ---');
  {
    // Test A: Null / undefined / empty string
    assert(getCleanDescriptionExcerpt(null).length > 0, 'Null description yields fallback description');
    assert(getCleanDescriptionExcerpt(undefined).length > 0, 'Undefined description yields fallback description');
    assert(getCleanDescriptionExcerpt('').length > 0, 'Empty string description yields fallback description');
    assert(getCleanDescriptionExcerpt('   ').length > 0, 'Whitespace-only description yields fallback description');

    // Test B: Heavy Markdown (headings, bold, italics, tables, links, quotes, bullets)
    const heavyMarkdown = `# Main Title\n## Subtitle\n### Section\n**Bold Text** and *Italic Text* and __Underline__\n[Link text](https://example.com)\n> Blockquote text\n- Bullet 1\n* Bullet 2\n1. Numbered 1\n| Col1 | Col2 |\n|---|---|\n| Val1 | Val2 |`;
    const clean = getCleanDescriptionExcerpt(heavyMarkdown);
    assert(!clean.includes('#'), 'Headings stripped from excerpt');
    assert(!clean.includes('**'), 'Bold markers stripped from excerpt');
    assert(!clean.includes('['), 'Link brackets stripped from excerpt');
    assert(!clean.includes('|'), 'Table pipes stripped from excerpt');
    assert(!clean.includes('>'), 'Blockquotes stripped from excerpt');
    assert(clean.length <= 143, `Excerpt length capped at max length + ellipsis (${clean.length} <= 143)`);
    console.log(`     Sanitized Excerpt: "${clean}"`);

    // Test C: Extremely Long Text (10,000 characters)
    const longText = 'Steel Product Description. '.repeat(500);
    const longClean = getCleanDescriptionExcerpt(longText, 140);
    assert(longClean.endsWith('...'), 'Long text properly truncated with ellipsis');
    assert(longClean.length <= 143, `Truncated length within bounds (${longClean.length})`);
  }

  // ---------------------------------------------------------------------------
  // 2. Search Filter Invariants (Case-Insensitivity & Tag/SKU matching)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Search & Category Filter Pure Logic Audit ---');
  {
    // Test A: Case Insensitivity
    const queries = ['tmt', 'TMT', 'Tmt', 'tMt', '550d', '550D', 'ismb', 'ISMB', 'IsMb', 'eRw', 'hOt RoLLeD'];
    queries.forEach(q => {
      const results = filterProducts(MOCK_PRODUCTS, 'All', q);
      assert(results.length > 0, `Search query "${q}" returns matching products (${results.length} found)`);
    });

    // Test B: Non-existent queries
    const nonExistent = ['XYZ999NONEXISTENT', '!!!@@@###', 'random_unmatched_term_123', '   '];
    const r1 = filterProducts(MOCK_PRODUCTS, 'All', 'XYZ999NONEXISTENT');
    assert(r1.length === 0, 'Non-existent keyword returns 0 items without throwing error');

    // Test C: Category filtering
    const rebars = filterProducts(MOCK_PRODUCTS, 'Rebars', '');
    assert(rebars.length === 1 && rebars[0].sku === 'US-TMT-550D', 'Filtering by "Rebars" category returns 1 Rebar item');

    const structural = filterProducts(MOCK_PRODUCTS, 'Structural Steel', '');
    assert(structural.length === 1 && structural[0].sku === 'US-STR-ISMB', 'Filtering by "Structural Steel" category returns 1 structural item');

    // Test D: Category + Search conjunction
    const conjunction1 = filterProducts(MOCK_PRODUCTS, 'Rebars', 'ISMB');
    assert(conjunction1.length === 0, 'Searching for "ISMB" within "Rebars" category returns 0 (proper AND logic)');

    const conjunction2 = filterProducts(MOCK_PRODUCTS, 'Structural Steel', 'ISMB');
    assert(conjunction2.length === 1, 'Searching for "ISMB" within "Structural Steel" category returns 1 item');
  }

  // ---------------------------------------------------------------------------
  // 3. Playwright In-Browser Rapid Category Switching & Search Interaction Stress
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Playwright In-Browser Rapid Filter Switching & Zero-Result Recovery ---');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('gtag') && !text.includes('429')) {
        consoleErrors.push(text);
      }
    }
  });

  try {
    await page.goto('https://urbanspaninfra.co.in/products', { waitUntil: 'networkidle', timeout: 30000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });

    // Step A: Rapid typing & clearing
    console.log('   Stress typing rapid search queries in browser...');
    await searchInput.fill('NONEXISTENT_STEEL_PRODUCT_9999');
    await page.waitForTimeout(400);
    let cardCount = await page.locator('h3').count();
    console.log(`   Cards visible after non-existent query: ${cardCount}`);
    assert(cardCount === 0, 'Non-existent search query shows 0 product cards');

    // Step B: Backspace / Clear
    await searchInput.fill('');
    await page.waitForTimeout(400);
    cardCount = await page.locator('h3').count();
    console.log(`   Cards visible after clearing search: ${cardCount}`);
    assert(cardCount > 0, `Clearing search immediately restored product cards (${cardCount} items)`);

    // Step C: Rapid Category Switching (30 cycles)
    console.log('   Performing 30 rapid category tab switch cycles...');
    const categoryButtons = await page.locator('button').filter({ hasText: /All|Rebars|Structural|Coils|Piping|Plates/i }).all();
    
    if (categoryButtons.length >= 2) {
      for (let i = 0; i < 15; i++) {
        const btn1 = categoryButtons[i % categoryButtons.length];
        const btn2 = categoryButtons[(i + 1) % categoryButtons.length];
        await btn1.click();
        await page.waitForTimeout(50);
        await btn2.click();
        await page.waitForTimeout(50);
      }
      // Reset to All
      const allBtn = page.locator('button:has-text("All")').first();
      await allBtn.click();
      await page.waitForTimeout(500);

      const finalCount = await page.locator('h3').count();
      assert(finalCount > 0, `Catalog fully responsive after rapid category switching (${finalCount} cards rendered)`);
    }

    assert(consoleErrors.length === 0, `0 JavaScript console errors during stress filtering`);
  } catch (err) {
    console.error('Playwright catalog test error:', err);
    assert(false, 'Catalog browser stress test threw error', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n========================================================================');
  console.log(`SUITE 3 RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  return { passed, failed };
}

runCatalogStressTests();
