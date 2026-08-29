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
