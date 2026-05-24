import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { applyApiSecurity, normalizeEmail, normalizeVerificationCode, normalizeWalletAddress } from './_utils/security';

// Create Supabase client inline to avoid import issues
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyApiSecurity(req, res, {
    methods: ['POST'],
    rateLimit: { key: 'verify-code', max: 10, windowMs: 15 * 60 * 1000 },
  })) {
    return;
  }

  const { email, code, userAddress } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = normalizeVerificationCode(code);
  const normalizedAddress = userAddress ? normalizeWalletAddress(userAddress) : undefined;

  if (!normalizedEmail || !normalizedCode) {
    return res.status(400).json({ error: 'Valid email and 6-digit code are required' });
  }
  if (userAddress && !normalizedAddress) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const supabase = getSupabase();

    // Find the verification record
    const { data: verification, error: fetchError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', normalizedCode)
      .is('verified_at', null)
      .single();

    if (fetchError || !verification) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new one.'
      });
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    // Create or update user notification settings
    const { error: notifError } = await supabase
      .from('user_notifications')
      .upsert({
        user_address: normalizedAddress || verification.user_address,
        email: normalizedEmail,
        email_verified: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_address',
      });

    if (notifError) {
      console.error('Notification settings error:', notifError);
      // Don't fail the request, just log the error
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
