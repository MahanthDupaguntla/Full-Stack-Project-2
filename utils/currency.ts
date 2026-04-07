export const USD_TO_INR_RATE = 82.5;

export function toINRString(usd: number, rate: number = USD_TO_INR_RATE) {
  const inr = Math.round((usd || 0) * rate);
  return inr.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export function toINRNumber(usd: number, rate: number = USD_TO_INR_RATE) {
  return Math.round((usd || 0) * rate);
}
