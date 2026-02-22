const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, run, get } = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check for default admin (from env)
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ token, role: 'admin' });
    }

    // Check database
    const admin = get('SELECT * FROM admin_users WHERE username = ?', [username]);
    
    if (!admin || !await bcrypt.compare(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    run('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: admin.role });
  } catch (error) {
    next(error);
  }
});

// Get current admin info
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Create new admin user (requires admin role)
router.post('/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { username, password, role = 'viewer' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    run(`
      INSERT INTO admin_users (username, password_hash, role)
      VALUES (?, ?, ?)
    `, [username, passwordHash, role]);

    res.status(201).json({ success: true, message: 'Admin user created' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    next(error);
  }
});

// Set user tier (premium/vip)
router.post('/user-tier', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { address, tier, durationDays = 30 } = req.body;

    if (!address || !tier) {
      return res.status(400).json({ error: 'Address and tier required' });
    }

    if (!['standard', 'premium', 'vip'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    run(`
      INSERT INTO user_tiers (address, tier, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
        tier = ?,
        expires_at = ?,
        updated_at = CURRENT_TIMESTAMP
    `, [address.toLowerCase(), tier, expiresAt.toISOString(), tier, expiresAt.toISOString()]);

    res.json({ 
      success: true, 
      message: `User ${address} set to ${tier} tier until ${expiresAt.toISOString()}` 
    });
  } catch (error) {
    next(error);
  }
});

// Get all premium users
router.get('/premium-users', requireAuth, async (req, res, next) => {
  try {
    const users = query(`
      SELECT * FROM user_tiers
      WHERE tier != 'standard' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY tier DESC, created_at DESC
    `);

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Record a withdrawal
router.post('/withdrawals', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { chainId, toAddress, tokenAddress, tokenSymbol, amount, amountUsd } = req.body;

    const id = uuidv4();

    run(`
      INSERT INTO withdrawals (id, chain_id, to_address, token_address, token_symbol, amount, amount_usd, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, chainId, toAddress, tokenAddress, tokenSymbol, amount, amountUsd, req.user.username]);

    res.status(201).json({ 
      success: true, 
      id,
      message: 'Withdrawal recorded. Please execute on-chain.' 
    });
  } catch (error) {
    next(error);
  }
});

// Get withdrawal history
router.get('/withdrawals', requireAuth, async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;

    let sql = 'SELECT * FROM withdrawals';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const withdrawals = query(sql, params);
    
    // Get totals
    const totals = get(`
      SELECT 
        COALESCE(SUM(amount_usd), 0) as total_withdrawn_usd,
        COUNT(*) as total_withdrawals
      FROM withdrawals
      WHERE status = 'confirmed'
    `);

    res.json({ 
      withdrawals,
      totals
    });
  } catch (error) {
    next(error);
  }
});

// Update withdrawal status
router.patch('/withdrawals/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, txHash } = req.body;

    let sql = 'UPDATE withdrawals SET status = ?';
    const params = [status];

    if (txHash) {
      sql += ', tx_hash = ?';
      params.push(txHash);
    }

    if (status === 'confirmed') {
      sql += ', confirmed_at = CURRENT_TIMESTAMP';
    }

    sql += ' WHERE id = ?';
    params.push(id);

    run(sql, params);

    res.json({ success: true, message: 'Withdrawal updated' });
  } catch (error) {
    next(error);
  }
});

// Get system settings
router.get('/settings', requireAuth, (req, res) => {
  res.json({
    feeWallet: process.env.FEE_WALLET_ADDRESS,
    swapFeePercent: parseFloat(process.env.SWAP_FEE_PERCENT) || 0.5,
    onrampCommission: parseFloat(process.env.ONRAMP_COMMISSION_PERCENT) || 0.5,
    bridgeFeePercent: parseFloat(process.env.BRIDGE_FEE_PERCENT) || 0.1,
  });
});

module.exports = router;
