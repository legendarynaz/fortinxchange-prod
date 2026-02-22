const express = require('express');
const crypto = require('crypto');
const { run, get } = require('../db/database');

const router = express.Router();

/**
 * Verify webhook signature
 */
const verifySignature = (payload, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

/**
 * MoonPay webhook - on-ramp transaction completed
 */
router.post('/moonpay', express.raw({ type: 'application/json' }), (req, res, next) => {
  try {
    const signature = req.headers['moonpay-signature'];
    const secret = process.env.MOONPAY_WEBHOOK_SECRET;

    if (secret && signature) {
      // Verify signature if secret configured
      const payload = JSON.parse(req.body);
      if (!verifySignature(payload, signature, secret)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = JSON.parse(req.body);
    console.log('MoonPay webhook:', event.type);

    if (event.type === 'transaction_completed') {
      const { externalTransactionId, baseCurrencyAmount, quoteCurrencyAmount, walletAddress } = event.data;
      
      // Record the on-ramp fee (we typically get 0.4-0.5% commission)
      const commission = baseCurrencyAmount * 0.005; // 0.5% estimate
      
      run(`
        INSERT INTO fee_transactions (id, chain_id, tx_hash, fee_type, user_address, amount, amount_usd, token_symbol, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        externalTransactionId,
        1, // Default to Ethereum
        externalTransactionId,
        'onramp',
        walletAddress?.toLowerCase() || 'unknown',
        commission.toString(),
        commission,
        'USD',
        'confirmed'
      ]);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Transak webhook - on-ramp transaction completed
 */
router.post('/transak', (req, res, next) => {
  try {
    const event = req.body;
    console.log('Transak webhook:', event.eventID);

    if (event.eventID === 'ORDER_COMPLETED') {
      const { id, fiatAmount, walletAddress } = event.data;
      
      const commission = fiatAmount * 0.004; // 0.4% estimate
      
      run(`
        INSERT INTO fee_transactions (id, chain_id, tx_hash, fee_type, user_address, amount, amount_usd, token_symbol, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        1,
        id,
        'onramp',
        walletAddress?.toLowerCase() || 'unknown',
        commission.toString(),
        commission,
        'USD',
        'confirmed'
      ]);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Generic blockchain webhook (e.g., from Alchemy, Moralis)
 * Monitors fee wallet for incoming transactions
 */
router.post('/blockchain', (req, res, next) => {
  try {
    const { apiKey } = req.query;
    
    if (apiKey !== process.env.WEBHOOK_API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const event = req.body;
    console.log('Blockchain webhook:', event.type || 'transaction');

    // Handle incoming transaction to fee wallet
    if (event.type === 'ADDRESS_ACTIVITY' || event.event === 'tx') {
      const activities = event.activities || [event];
      
      for (const activity of activities) {
        const toAddress = (activity.toAddress || activity.to)?.toLowerCase();
        const feeWallet = process.env.FEE_WALLET_ADDRESS?.toLowerCase();
        
        if (toAddress === feeWallet) {
          // Update wallet balance tracking
          run(`
            INSERT INTO wallet_balances (chain_id, token_address, token_symbol, balance, last_updated)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(chain_id, token_address) DO UPDATE SET
              balance = balance + ?,
              last_updated = CURRENT_TIMESTAMP
          `, [
            activity.chainId || 1,
            activity.asset?.contractAddress || 'native',
            activity.asset?.symbol || 'ETH',
            activity.value || '0',
            activity.value || '0'
          ]);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Health check for webhook endpoint
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
