import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { applyApiSecurity } from '../_utils/security';

// Create Supabase client inline
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyApiSecurity(req, res, {
    methods: ['GET'],
    rateLimit: { key: 'public-stats', max: 120, windowMs: 60 * 1000 },
  })) {
    return;
  }

  try {
    const supabase = getSupabase();

    // Get total confirmed transactions and unique users
    const { data: stats, error } = await supabase
      .from('fee_transactions')
      .select('user_address', { count: 'exact' })
      .eq('status', 'confirmed');

    if (error) {
      console.error('Stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    // Count unique users
    const uniqueUsers = new Set(stats?.map(s => s.user_address).filter(Boolean)).size;

    return res.status(200).json({
      totalTransactions: stats?.length || 0,
      totalUsers: uniqueUsers,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Public stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
