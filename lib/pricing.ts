export const MEMBER_FREE_SHIPPING_THRESHOLD = 55;
export const NON_MEMBER_FREE_SHIPPING_THRESHOLD = 75;
export const SHIPPING_COST_CENTS = 695;

export function getFreeShippingThreshold(isMember: boolean): number {
  return isMember ? MEMBER_FREE_SHIPPING_THRESHOLD : NON_MEMBER_FREE_SHIPPING_THRESHOLD;
}

export function qualifiesForFreeShipping(cartTotal: number, isMember: boolean): boolean {
  return cartTotal >= getFreeShippingThreshold(isMember);
}

export function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateSavings(regularPrice: number, memberPrice: number | null | undefined): number {
  if (!memberPrice) return 0;
  return Math.max(0, regularPrice - memberPrice);
}

export function calculateSavingsFromCents(regularPriceCents: number, memberPriceCents: number | null | undefined): number {
  if (!memberPriceCents) return 0;
  return Math.max(0, regularPriceCents - memberPriceCents);
}

export function formatSavings(savingsCents: number): string {
  if (savingsCents <= 0) return '';
  return `Save ${formatCents(savingsCents)}`;
}

export function getMemberPriceRange(variants: Array<{ price: number; member_price_cents: number | null }>) {
  const memberPrices = variants
    .map(v => v.member_price_cents)
    .filter((price): price is number => price !== null && price !== undefined);

  if (memberPrices.length === 0) return null;

  const min = Math.min(...memberPrices);
  const max = Math.max(...memberPrices);

  if (min === max) {
    return { min, max, single: true };
  }

  return { min, max, single: false };
}

export function getSavingsRange(variants: Array<{ price: number; member_price_cents: number | null }>) {
  const savings = variants
    .map(v => v.member_price_cents ? calculateSavingsFromCents(Math.round(v.price * 100), v.member_price_cents) : 0)
    .filter(s => s > 0);

  if (savings.length === 0) return null;

  const min = Math.min(...savings);
  const max = Math.max(...savings);

  if (min === max) {
    return { min, max, single: true };
  }

  return { min, max, single: false };
}
