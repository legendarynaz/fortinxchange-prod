import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { applyApiSecurity, normalizeWalletAddress } from '../_utils/security';

// Create Supabase client inline
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

const FEE_TIERS = { standard: 0.5, premium: 0.3, vip: 0.1 } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyApiSecurity(req, res, {
    methods: ['GET'],
    rateLimit: { key: 'fee-tier', max: 120, windowMs: 60 * 1000 },
  })) {
    return;
  }

  const { address } = req.query;
  const normalizedAddress = normalizeWalletAddress(Array.isArray(address) ? address[0] : address);

  if (!normalizedAddress) {
    return res.status(400).json({ error: 'Valid address is required' });
  }

  try {
    const supabase = getSupabase();

    // Get user tier
    const { data: tier, error } = await supabase
      .from('user_tiers')
      .select('*')
      .eq('address', normalizedAddress)
      .single();

    // Default to standard tier if no tier found or expired
    if (error || !tier || (tier.expires_at && new Date(tier.expires_at) < new Date())) {
      return res.status(200).json({
        tier: 'standard',
        feePercent: FEE_TIERS.standard,
        expiresAt: null,
      });
    }

    return res.status(200).json({
      tier: tier.tier,
      feePercent: FEE_TIERS[tier.tier as keyof typeof FEE_TIERS],
      expiresAt: tier.expires_at,
    });
  } catch (err) {
    console.error('Get tier error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
