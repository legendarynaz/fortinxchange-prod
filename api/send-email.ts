import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const templates: Record<string, { subject: string; html: (params: Record<string, string | number>) => string }> = {
  welcome: {
    subject: 'Welcome to FortinXchange!',
    html: (params) => `
      <h1>Welcome to FortinXchange!</h1>
      <p>Hello,</p>
      <p>We're thrilled to have you join FortinXchange!</p>
      <p>Your account has been created successfully with email: <strong>${params.email}</strong></p>
      <p>Happy trading,<br/>The FortinXchange Team</p>
    `
  },
  transactionPending: {
    subject: 'Your Transaction is Pending Approval',
    html: (params) => `
      <h1>Transaction Pending</h1>
      <p>Hello,</p>
      <p>Your ${params.type} of <strong>${params.amount} ${params.asset}</strong> has been submitted and is pending manual approval.</p>
      <p>We will notify you once it has been processed.</p>
      <p>Thanks,<br/>The FortinXchange Team</p>
    `
  },
  depositSuccess: {
    subject: 'Deposit Confirmation',
    html: (params) => `
      <h1>Deposit Successful</h1>
      <p>Hello,</p>
      <p>Your deposit of <strong>${params.amount} ${params.asset}</strong> has been successfully processed.</p>
      <p>Transaction ID: ${params.txId}</p>
      <p>Thanks,<br/>The FortinXchange Team</p>
    `
  },
  depositFailed: {
    subject: 'Deposit Failed',
    html: (params) => `
      <h1>Deposit Failed</h1>
      <p>Hello,</p>
      <p>Your deposit of <strong>${params.amount} ${params.asset}</strong> has failed.</p>
      <p>Reason: ${params.reason}</p>
      <p>Please contact support if you need assistance.</p>
      <p>Thanks,<br/>The FortinXchange Team</p>
    `
  },
  withdrawalSuccess: {
    subject: 'Withdrawal Processed',
    html: (params) => `
      <h1>Withdrawal Successful</h1>
      <p>Hello,</p>
      <p>Your withdrawal of <strong>${params.amount} ${params.asset}</strong> has been processed.</p>
      <p>Destination: ${params.address}</p>
      <p>Transaction ID: ${params.txId}</p>
      <p>Thanks,<br/>The FortinXchange Team</p>
    `
  },
  withdrawalFailed: {
    subject: 'Withdrawal Failed',
    html: (params) => `
      <h1>Withdrawal Failed</h1>
      <p>Hello,</p>
      <p>Your withdrawal of <strong>${params.amount} ${params.asset}</strong> has failed.</p>
      <p>Reason: ${params.reason}</p>
      <p>Please contact support if you need assistance.</p>
      <p>Thanks,<br/>The FortinXchange Team</p>
    `
  },
  kycRequired: {
    subject: 'Action Required: Verify Your Identity',
    html: (params) => `
      <h1>Identity Verification Required</h1>
      <p>Hello,</p>
      <p>To continue with transactions over <strong>$${params.threshold}</strong>, you need to complete identity verification.</p>
      <p>Please log in to your account and follow the prompts to verify your identity.</p>
      <p>Thanks,<br/>The FortinXchange Team</p>
    `
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, template, params } = req.body;

  if (!to || !template) {
    return res.status(400).json({ error: 'Missing required fields: to, template' });
  }

  const emailTemplate = templates[template];
  if (!emailTemplate) {
    return res.status(400).json({ error: `Unknown template: ${template}` });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'FortinXchange <onboarding@resend.dev>',
      to: [to],
      subject: emailTemplate.subject,
      html: emailTemplate.html(params || {}),
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
