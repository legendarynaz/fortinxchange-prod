// Vercel serverless function to proxy CoinGecko API requests (avoids CORS)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyApiSecurity } from './_utils/security';

const COINGECKO_ID_REGEX = /^[a-z0-9-]+(,[a-z0-9-]+)*$/;
const CURRENCY_REGEX = /^[a-z]{3,8}(,[a-z]{3,8})*$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyApiSecurity(req, res, {
    methods: ['GET'],
    rateLimit: { key: 'prices', max: 180, windowMs: 60 * 1000 },
  })) {
    return;
  }

  const { ids, vs_currencies = 'usd', include_24hr_change } = req.query;
  const normalizedIds = Array.isArray(ids) ? ids[0] : ids;
  const normalizedCurrencies = Array.isArray(vs_currencies) ? vs_currencies[0] : vs_currencies;

  if (!normalizedIds || !COINGECKO_ID_REGEX.test(normalizedIds) || normalizedIds.length > 300) {
    return res.status(400).json({ error: 'Invalid ids parameter' });
  }
  if (!normalizedCurrencies || !CURRENCY_REGEX.test(normalizedCurrencies) || normalizedCurrencies.length > 80) {
    return res.status(400).json({ error: 'Invalid vs_currencies parameter' });
  }

  try {
    const params = new URLSearchParams({
      ids: normalizedIds,
      vs_currencies: normalizedCurrencies,
    });

    // Add optional 24hr change parameter
    if (include_24hr_change === 'true') {
      params.set('include_24hr_change', 'true');
    }

    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache for 60 seconds
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Price fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
}
