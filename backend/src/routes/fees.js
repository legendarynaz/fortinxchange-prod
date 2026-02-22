const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, run, get } = require('../db/database');

const router = express.Router();

// Record a new fee transaction
router.post('/record', async (req, res, next) => {
  try {
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
      metadata
    } = req.body;

    // Validate required fields
    if (!type || !chainId || !grossAmount || !feeAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    
    run(`
      INSERT INTO fee_transactions 
      (id, type, user_address, chain_id, tx_hash, gross_amount, fee_amount, fee_percent, fee_usd, token_symbol, token_address, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, type, userAddress, chainId, txHash, grossAmount, feeAmount, feePercent, feeUsd, tokenSymbol, tokenAddress, JSON.stringify(metadata)]);

    // Update daily aggregates
    const today = new Date().toISOString().split('T')[0];
    run(`
      INSERT INTO daily_revenue (date, chain_id, type, transaction_count, total_volume_usd, total_fees_usd, unique_users)
      VALUES (?, ?, ?, 1, ?, ?, 1)
      ON CONFLICT(date, chain_id, type) DO UPDATE SET
        transaction_count = transaction_count + 1,
        total_volume_usd = total_volume_usd + ?,
        total_fees_usd = total_fees_usd + ?
    `, [today, chainId, type, feeUsd || 0, feeUsd || 0, feeUsd || 0, feeUsd || 0]);

    res.status(201).json({ 
      success: true, 
      id,
      message: 'Fee transaction recorded' 
    });
  } catch (error) {
    next(error);
  }
});

// Confirm a transaction (when it's mined on-chain)
router.post('/confirm/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { txHash } = req.body;

    run(`
      UPDATE fee_transactions 
      SET status = 'confirmed', tx_hash = ?, confirmed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [txHash, id]);

    res.json({ success: true, message: 'Transaction confirmed' });
  } catch (error) {
    next(error);
  }
});

// Get user's fee history
router.get('/user/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0, type } = req.query;

    let sql = `
      SELECT * FROM fee_transactions 
      WHERE user_address = ?
    `;
    const params = [address];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const transactions = query(sql, params);
    
    // Get total count
    const countResult = get(`
      SELECT COUNT(*) as total FROM fee_transactions WHERE user_address = ?
    `, [address]);

    res.json({
      transactions,
      total: countResult.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
});

// Get user tier
router.get('/tier/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    
    const tier = get(`
      SELECT tier, expires_at FROM user_tiers WHERE address = ?
    `, [address.toLowerCase()]);

    if (!tier || (tier.expires_at && new Date(tier.expires_at) < new Date())) {
      return res.json({ tier: 'standard', feePercent: 0.5 });
    }

    const feePercents = { standard: 0.5, premium: 0.3, vip: 0.1 };
    
    res.json({
      tier: tier.tier,
      feePercent: feePercents[tier.tier],
      expiresAt: tier.expires_at
    });
  } catch (error) {
    next(error);
  }
});

// Get recent fees (public, anonymized)
router.get('/recent', async (req, res, next) => {
  try {
    const { chainId, limit = 10 } = req.query;

    let sql = `
      SELECT type, chain_id, fee_amount, fee_usd, token_symbol, created_at
      FROM fee_transactions
      WHERE status = 'confirmed'
    `;
    const params = [];

    if (chainId) {
      sql += ' AND chain_id = ?';
      params.push(parseInt(chainId));
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const transactions = query(sql, params);
    
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
