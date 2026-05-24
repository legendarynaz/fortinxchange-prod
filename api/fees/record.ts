import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  applyApiSecurity,
  normalizeInteger,
  normalizeNumber,
  normalizeString,
  normalizeWalletAddress,
  safeJsonObject,
} from '../_utils/security';

// Create Supabase client inline
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

const FEE_TIERS = { standard: 0.5, premium: 0.3, vip: 0.1 };
const VALID_TYPES = ['swap', 'onramp', 'bridge', 'nft', 'premium'] as const;
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyApiSecurity(req, res, {
    methods: ['POST'],
    rateLimit: { key: 'fee-record', max: 60, windowMs: 60 * 1000 },
  })) {
    return;
  }

  const {
    type,
    userAddress,
    chainId,
    txHash,
    grossAmount,
    feeAmount,
    feePercent,
    feeUsd,
    tokenSymbol,
    tokenAddress,
    metadata,
  } = req.body;
  const normalizedType = typeof type === 'string' && VALID_TYPES.includes(type as typeof VALID_TYPES[number]) ? type : null;
  const normalizedUserAddress = userAddress ? normalizeWalletAddress(userAddress) : undefined;
  const normalizedChainId = normalizeInteger(chainId, { min: 1, max: 999999999 });
  const normalizedTxHash = txHash ? normalizeString(txHash, 80) : undefined;
  const normalizedGrossAmount = normalizeNumber(grossAmount, { min: 0 });
  const normalizedFeeAmount = normalizeNumber(feeAmount, { min: 0 });
  const normalizedFeePercent = feePercent === undefined ? FEE_TIERS.standard : normalizeNumber(feePercent, { min: 0, max: 5 });
  const normalizedFeeUsd = feeUsd === undefined ? undefined : normalizeNumber(feeUsd, { min: 0 });
  const normalizedTokenSymbol = tokenSymbol ? normalizeString(tokenSymbol, 20)?.toUpperCase() : undefined;
  const normalizedTokenAddress = tokenAddress ? normalizeWalletAddress(tokenAddress) : undefined;
  const normalizedMetadata = safeJsonObject(metadata);

  if (!normalizedType || normalizedChainId === null || normalizedGrossAmount === null || normalizedFeeAmount === null || normalizedFeePercent === null) {
    return res.status(400).json({ error: 'Invalid fee transaction payload' });
  }
  if (userAddress && !normalizedUserAddress) {
    return res.status(400).json({ error: 'Invalid user address' });
  }
  if (tokenAddress && !normalizedTokenAddress) {
    return res.status(400).json({ error: 'Invalid token address' });
  }
  if (normalizedTxHash && !TX_HASH_REGEX.test(normalizedTxHash)) {
    return res.status(400).json({ error: 'Invalid transaction hash' });
  }

  try {
    const supabase = getSupabase();

    // Insert fee transaction
    const { data, error } = await supabase
      .from('fee_transactions')
      .insert({
        type: normalizedType,
        user_address: normalizedUserAddress,
        chain_id: normalizedChainId,
        tx_hash: normalizedTxHash,
        gross_amount: normalizedGrossAmount.toString(),
        fee_amount: normalizedFeeAmount.toString(),
        fee_percent: normalizedFeePercent,
        fee_usd: normalizedFeeUsd,
        token_symbol: normalizedTokenSymbol,
        token_address: normalizedTokenAddress,
        status: 'pending',
        metadata: normalizedMetadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      // Handle unique constraint violation (duplicate tx_hash)
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Transaction already recorded' });
      }
      return res.status(500).json({ error: 'Failed to record transaction' });
    }

    // Update daily aggregates
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('daily_revenue')
      .upsert({
        date: today,
        chain_id: normalizedChainId,
        type: normalizedType,
        transaction_count: 1,
        total_volume_usd: normalizedFeeUsd || 0,
        total_fees_usd: normalizedFeeUsd || 0,
        unique_users: 1,
      }, {
        onConflict: 'date,chain_id,type',
      });

    return res.status(201).json({
      success: true,
      id: data.id,
      message: 'Fee transaction recorded',
    });
  } catch (err) {
    console.error('Record fee error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
