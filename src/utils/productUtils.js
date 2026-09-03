/**
 * Product Unit & Formatting Utilities
 * Resolves dynamic units (kg, MT, Pcs, etc.) across the public website and customer portal
 */

export const getProductUnit = (product) => {
  if (!product) return 'MT';
  const unit = product.unit || product.product_unit;
  if (!unit) return 'MT';
  if (Array.isArray(unit)) {
    return unit.length > 0 ? (unit[0] || 'MT') : 'MT';
  }
  return String(unit);
};

export const getUnitRateLabel = (product) => {
  const u = getProductUnit(product);
  return `/ ${u}`;
};

export const getQuantityPresets = (product) => {
  const unit = getProductUnit(product).toLowerCase();
  if (unit === 'kg') {
    return [25, 50, 100, 500];
  }
  if (unit === 'pcs' || unit === 'nos') {
    return [10, 50, 100, 500];
  }
  return [25, 50, 100, 200];
};

export const isSectionMatrixEligible = (product) => {
  if (!product) return false;
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const unit = getProductUnit(product).toLowerCase();

  return (
    category.includes('rebar') ||
    category.includes('tmt') ||
    category.includes('steel') ||
    category.includes('structural') ||
    name.includes('tmt') ||
    name.includes('rebar') ||
    name.includes('beam') ||
    name.includes('angle') ||
    name.includes('channel') ||
    unit === 'mt' ||
    unit === 'ton' ||
    unit === 'metric ton'
  );
};

export const formatCartTotalQuantities = (cartItems) => {
  if (!cartItems || cartItems.length === 0) return '0 MT';
  const unitTotals = {};
  cartItems.forEach(item => {
    const unit = getProductUnit(item);
    const qty = Number(item.quantity) || 0;
    unitTotals[unit] = (unitTotals[unit] || 0) + qty;
  });
  return Object.entries(unitTotals)
    .map(([u, q]) => `${q} ${u}`)
    .join(' + ');
};

/**
 * Resolves available sizes for a given product dynamically based on:
 * 1. product.available_sizes / product.sizes array
 * 2. product.specs / product.custom_data properties
 * 3. Markdown description table or bullet parsing
 * 4. Product name / category specific defaults
 */
export const getProductAvailableSizes = (product) => {
  if (!product) return ['8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '32mm'];

  // 1. Explicit array on product
  if (Array.isArray(product.available_sizes) && product.available_sizes.length > 0) {
    return product.available_sizes;
  }
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes;
  }

  // 2. Check specs / custom_data object
  const specs = product.specs || product.custom_data?.specs || product.custom_data || {};
  const sizeField = specs['Available Diameters'] || specs['Available Sizes'] || specs['Sizes Available'] || specs['Sizes'] || specs['sizes'] || specs['Diameter'] || specs['Gauges'];
  if (typeof sizeField === 'string' && sizeField.trim()) {
    return sizeField.split(/[,|\/]+/).map(s => s.trim().replace(/\s+/g, '')).filter(Boolean);
  }
  if (Array.isArray(sizeField) && sizeField.length > 0) {
    return sizeField;
  }

  // 3. Check description markdown table / text
  const desc = product.description || '';
  const matchTable = desc.match(/(?:Available Diameters|Available Sizes|Sizes Available|Diameter Range|Diameters)\s*\|?\s*([0-9a-zA-Z\s,.\-\/]+)/i);
  if (matchTable && matchTable[1]) {
    const raw = matchTable[1].split(/[\n|]/)[0];
    const parsed = raw
      .split(/[,/]+/)
      .map(s => s.trim().replace(/\s*mm/i, 'mm').replace(/\s+/g, ''))
      .filter(s => s.length > 0 && !s.includes('---') && !s.toLowerCase().includes('spec'));
    if (parsed.length > 0) return parsed;
  }

  // Check range pattern in name or description e.g. (8mm - 32mm) or (8mm to 25mm)
  const rangeMatch = (product.name + ' ' + desc).match(/\(?(\d+)\s*mm\s*(?:-|to)\s*(\d+)\s*mm\)?/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    const allTmt = ['8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '32mm', '36mm', '40mm'];
    const filtered = allTmt.filter(s => {
      const val = parseInt(s);
      return val >= min && val <= max;
    });
    if (filtered.length > 0) return filtered;
  }

  // 4. Fallbacks based on category / name
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  if (cat.includes('wire') || name.includes('wire')) {
    return ['20 Gauge', '22 Gauge', '18 Gauge', '16 Gauge'];
  }
  if (cat.includes('beam') || name.includes('beam') || name.includes('ismb')) {
    return ['ISMB 150', 'ISMB 200', 'ISMB 250', 'ISMB 300', 'ISMB 350', 'ISMB 400', 'ISMB 450', 'ISMB 500', 'ISMB 600'];
  }
  if (cat.includes('channel') || name.includes('channel') || name.includes('ismc')) {
    return ['ISMC 75', 'ISMC 100', 'ISMC 125', 'ISMC 150', 'ISMC 200', 'ISMC 250', 'ISMC 300'];
  }
  if (cat.includes('angle') || name.includes('angle') || name.includes('isa')) {
    return ['ISA 50x50x5', 'ISA 50x50x6', 'ISA 65x65x6', 'ISA 75x75x6', 'ISA 90x90x6', 'ISA 100x100x8'];
  }

  // Default Standard TMT (standard 7 sizes excluding non-standard 28mm)
  return ['8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '32mm'];
};

export const getProductMatrixTitle = (product) => {
  const sizes = getProductAvailableSizes(product);
  if (!sizes || sizes.length === 0) return '📐 Customize Section Matrix Breakdown';
  if (sizes.length === 1) return `📐 Customize Section Allocation (${sizes[0]})`;
  return `📐 Customize Section Matrix Breakdown (${sizes[0]} – ${sizes[sizes.length - 1]})`;
};

