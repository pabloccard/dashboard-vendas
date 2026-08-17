const EXCHANGE_RATE_API = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getUSDtoBRL(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_TTL) {
    return cachedRate.rate;
  }

  try {
    const response = await fetch(EXCHANGE_RATE_API);
    const data = await response.json();
    const rate = parseFloat(data.USDBRL.bid);

    cachedRate = { rate, timestamp: Date.now() };
    return rate;
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    // Fallback rate if API fails
    return cachedRate?.rate ?? 5.5;
  }
}

export async function convertToMBRL(
  value: number,
  currency: string
): Promise<{ valueBRL: number; exchangeRate: number }> {
  if (currency === 'BRL') {
    return { valueBRL: value, exchangeRate: 1.0 };
  }

  if (currency === 'USD') {
    const rate = await getUSDtoBRL();
    return { valueBRL: value * rate, exchangeRate: rate };
  }

  // Fallback for other currencies - treat as BRL
  return { valueBRL: value, exchangeRate: 1.0 };
}
