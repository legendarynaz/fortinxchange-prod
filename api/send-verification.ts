import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomInt } from 'crypto';
import { applyApiSecurity, normalizeEmail, normalizeWalletAddress } from './_utils/security';

const resend = new Resend(process.env.RESEND_API_KEY);

// Create Supabase client inline to avoid import issues
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};

// Generate 6-digit verification code
const generateCode = () => randomInt(100000, 1000000).toString();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyApiSecurity(req, res, {
    methods: ['POST'],
    rateLimit: { key: 'send-verification', max: 5, windowMs: 15 * 60 * 1000 },
  })) {
    return;
  }

  const { email, userAddress } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedAddress = userAddress ? normalizeWalletAddress(userAddress) : undefined;

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (userAddress && !normalizedAddress) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const supabase = getSupabase();

    // Delete any existing verification codes for this email
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', normalizedEmail)
      .is('verified_at', null);

    // Store new verification code
    const { error: dbError } = await supabase
      .from('email_verifications')
      .insert({
        email: normalizedEmail,
        code,
        user_address: normalizedAddress,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to store verification code' });
    }

    // Send verification email
    const { error: emailError } = await resend.emails.send({
      from: '4ortin-X <noreply@4ortin-x.com>',
      to: [normalizedEmail],
      subject: 'Verify your email - 4ortin-X',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 16px; padding: 40px; border: 1px solid #333;">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="color: #F0B90B; margin: 0; font-size: 28px; font-weight: bold;">4ortin-X</h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 16px;">
                      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Email Verification</h2>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <p style="color: #a0a0a0; margin: 0; font-size: 14px; line-height: 1.5;">
                        Enter this code in the app to verify your email address:
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <div style="background-color: #0a0a0a; border-radius: 12px; padding: 20px 40px; display: inline-block; border: 2px solid #F0B90B;">
                        <span style="color: #F0B90B; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">${code}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 16px;">
                      <p style="color: #666666; margin: 0; font-size: 12px;">
                        This code expires in <strong style="color: #a0a0a0;">10 minutes</strong>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="border-top: 1px solid #333; padding-top: 24px;">
                      <p style="color: #666666; margin: 0; font-size: 11px; line-height: 1.5;">
                        If you didn't request this code, you can safely ignore this email.<br>
                        Someone may have entered your email by mistake.
                      </p>
                    </td>
                  </tr>
                </table>
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
                  <tr>
                    <td align="center">
                      <p style="color: #444444; margin: 0; font-size: 11px;">
                        © 2026 4ortin-X. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      // Clean up the stored code if email failed
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', normalizedEmail)
        .eq('code', code);

      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code sent',
      expiresAt,
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
