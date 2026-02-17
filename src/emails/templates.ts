
// A centralized file for all user-facing email templates.
// In a real app, these would be processed by a backend service.

interface EmailTemplate {
  subject: string;
  body: (params: Record<string, string | number>) => string;
}

export const emailTemplates: Record<string, EmailTemplate> = {
  // --- Authentication ---
  welcome: {
    subject: 'Welcome to FortinXchange!',
    body: params => `Hello,\n\nWelcome to FortinXchange! We are thrilled to have you.\n\nYour new User ID is: ${params.userId}\n\nPlease keep it safe. You will use this User ID to log in to your account.\n\nHappy trading,\nThe FortinXchange Team`
  },
  verifyEmail: {
    subject: 'Verify Your Email for FortinXchange',
    body: params => `Hello,\n\nPlease click the link below to verify your email address and complete your registration.\n\nVerification Link: ${params.verificationLink}\n\nIf you did not sign up for FortinXchange, please ignore this email.\n\nThanks,\nThe FortinXchange Team`
  },
  passwordReset: {
    subject: 'Your FortinXchange Password Reset Request',
    body: params => `Hello,\n\nWe received a request to reset the password for the account associated with User ID: ${params.userId}.\n\nPlease click the link below to set a new password:\n\nReset Link: ${params.resetLink}\n\nIf you did not request a password reset, please secure your account and contact support immediately.\n\nThanks,\nThe FortinXchange Team`
  },
  accountLocked: {
    subject: 'Security Alert: Your FortinXchange Account Has Been Locked',
    body: params => `Hello,\n\nYour FortinXchange account associated with User ID: ${params.userId} has been temporarily locked for 24 hours due to multiple failed login attempts.\n\nIf this was you, please wait for the lockout period to expire before trying again.\n\nIf this was not you, your account may be at risk. Please contact our support team immediately.\n\nThanks,\nThe FortinXchange Team`
  },

  // --- Transactions ---
  transactionPending: {
    subject: 'Your Transaction is Pending Approval',
    body: params => `Hello,\n\nYour ${params.type} of ${params.amount} ${params.asset} has been submitted successfully and is now pending manual approval from our team.\n\nWe will notify you again once the transaction has been processed.\n\nThanks,\nThe FortinXchange Team`
  },
  depositSuccess: {
    subject: 'Deposit Confirmation',
    body: params => `Hello,\n\nYour deposit of ${params.amount} ${params.asset} has been successfully processed and credited to your account.\n\nTransaction ID: ${params.txId}\n\nThanks,\nThe FortinXchange Team`
  },
  depositFailed: {
    subject: 'Deposit Failed',
    body: params => `Hello,\n\nUnfortunately, your recent deposit of ${params.amount} ${params.asset} has failed.\n\nReason: ${params.reason}\n\nPlease contact support if you believe this is an error.\n\nThanks,\nThe FortinXchange Team`
  },
  withdrawalSuccess: {
    subject: 'Withdrawal Processed',
    body: params => `Hello,\n\nYour withdrawal of ${params.amount} ${params.asset} to the address ${params.address} has been successfully processed.\n\nTransaction ID: ${params.txId}\n\nThanks,\nThe FortinXchange Team`
  },
  withdrawalFailed: {
    subject: 'Withdrawal Failed',
    body: params => `Hello,\n\nUnfortunately, your recent withdrawal of ${params.amount} ${params.asset} has failed.\n\nReason: ${params.reason}\n\nPlease contact support if you believe this is an error.\n\nThanks,\nThe FortinXchange Team`
  },
  
  // --- KYC & Region ---
  kycRequired: {
    subject: 'Action Required: Verify Your Identity',
    body: params => `Hello,\n\nTo continue using all features of FortinXchange, including transactions over ${params.threshold} USD, you need to complete identity verification.\n\nPlease log in to your account and follow the prompts to start the verification process.\n\nThanks,\nThe FortinXchange Team`
  },
  kycSubmitted: {
    subject: 'Your Documents Have Been Received',
    body: _params => `Hello,\n\nWe have received your identity verification documents. Our team will review them, and we will notify you of the result, usually within 24 hours.\n\nYou can check your verification status in your account profile.\n\nThanks,\nThe FortinXchange Team`
  },
  kycApproved: {
    subject: 'Verification Successful!',
    body: _params => `Hello,\n\nCongratulations! Your identity has been successfully verified. You now have full access to all features and limits on FortinXchange.\n\nHappy trading,\nThe FortinXchange Team`
  },
  kycRejected: {
    subject: 'Identity Verification Failed',
    body: params => `Hello,\n\nUnfortunately, we were unable to approve your recent identity verification submission.\n\nReason: ${params.reason}\n\nPlease log in to your account to restart the process. Make sure to use a clear, valid government-issued ID.\n\nIf you have any questions, please contact our support team.\n\nThanks,\nThe FortinXchange Team`
  },
  regionNotSupported: {
    subject: 'Service Notice for Your Region',
    body: _params => `Hello,\n\nThank you for your interest in FortinXchange. Unfortunately, our services are not currently available in your region.\n\nWe are working to expand our services and hope to support your region in the future.\n\nThanks,\nThe FortinXchange Team`
  },

  // --- Bank Accounts ---
  bankAccountAdded: {
    subject: 'New Bank Account Added',
    body: params => `Hello,\n\nA new bank account (${params.bankName} ending in ${params.last4}) has been successfully linked to your FortinXchange account.\n\nIf you did not authorize this, please contact support immediately.\n\nThanks,\nThe FortinXchange Team`
  },
  bankAccountRemoved: {
    subject: 'Bank Account Removed',
    body: params => `Hello,\n\nYour bank account (${params.bankName} ending in ${params.last4}) has been removed from your FortinXchange account.\n\nIf you did not authorize this, please contact support immediately.\n\nThanks,\nThe FortinXchange Team`
  }
};

/**
 * Sends a real email via the Resend API.
 * @param templateName The key of the template.
 * @param params The parameters to inject into the template.
 * @param toEmail The recipient email address.
 */
export const sendEmail = async (
  templateName: string,
  params: Record<string, string | number>,
  toEmail: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toEmail,
        template: templateName,
        params,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Email send failed:', data.error);
      return { success: false, error: data.error };
    }

    console.log('Email sent successfully:', data.id);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
};

/**
 * Fallback function that logs to console (for development/testing).
 * @param templateName The key of the template in emailTemplates.
 * @param params The parameters to inject into the template.
 */
export const simulateSendEmail = (templateName: keyof typeof emailTemplates, params: Record<string, string | number>) => {
    const template = emailTemplates[templateName];
    if (!template) {
        console.error(`Email template "${templateName}" not found.`);
        return;
    }

    console.log(`
--- EMAIL (console only) ---
Template: ${templateName}
Params: ${JSON.stringify(params)}
--- END ---
    `);
};
