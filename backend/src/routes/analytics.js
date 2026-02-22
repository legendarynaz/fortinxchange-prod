const express = require('express');
const { query, get } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get revenue summary (requires auth)
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    
    let daysBack = 7;
    if (period === '24h') daysBack = 1;
    else if (period === '30d') daysBack = 30;
    else if (period === '90d') daysBack = 90;
    else if (period === 'all') daysBack = 3650;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Total revenue
    const totals = get(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(fee_usd), 0) as total_revenue_usd,
        COALESCE(SUM(CASE WHEN type = 'swap' THEN fee_usd ELSE 0 END), 0) as swap_revenue,
        COALESCE(SUM(CASE WHEN type = 'onramp' THEN fee_usd ELSE 0 END), 0) as onramp_revenue,
        COALESCE(SUM(CASE WHEN type = 'bridge' THEN fee_usd ELSE 0 END), 0) as bridge_revenue,
        COALESCE(SUM(CASE WHEN type = 'nft' THEN fee_usd ELSE 0 END), 0) as nft_revenue,
        COUNT(DISTINCT user_address) as unique_users
      FROM fee_transactions
      WHERE created_at >= ? AND status = 'confirmed'
    `, [startDateStr]);

    // Revenue by chain
    const byChain = query(`
      SELECT 
        chain_id,
        COUNT(*) as transactions,
        COALESCE(SUM(fee_usd), 0) as revenue_usd
      FROM fee_transactions
      WHERE created_at >= ? AND status = 'confirmed'
      GROUP BY chain_id
      ORDER BY revenue_usd DESC
    `, [startDateStr]);

    // Daily breakdown
    const daily = query(`
      SELECT 
        date,
        SUM(transaction_count) as transactions,
        SUM(total_fees_usd) as revenue_usd
      FROM daily_revenue
      WHERE date >= ?
      GROUP BY date
      ORDER BY date ASC
    `, [startDateStr]);

    res.json({
      period,
      totals: {
        transactions: totals.total_transactions,
        revenueUsd: totals.total_revenue_usd,
        byType: {
          swap: totals.swap_revenue,
          onramp: totals.onramp_revenue,
          bridge: totals.bridge_revenue,
          nft: totals.nft_revenue,
        },
        uniqueUsers: totals.unique_users,
      },
      byChain,
      daily,
    });
  } catch (error) {
    next(error);
  }
});

// Get wallet balances (requires auth)
router.get('/balances', requireAuth, async (req, res, next) => {
  try {
    const balances = query(`
      SELECT * FROM wallet_balances
      ORDER BY balance_usd DESC
    `);

    const totalUsd = balances.reduce((sum, b) => sum + (b.balance_usd || 0), 0);

    res.json({
      balances,
      totalUsd,
      updatedAt: balances[0]?.updated_at || null,
    });
  } catch (error) {
    next(error);
  }
});

// Get top users by fees (requires auth)
router.get('/top-users', requireAuth, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const users = query(`
      SELECT 
        user_address,
        COUNT(*) as transaction_count,
        COALESCE(SUM(fee_usd), 0) as total_fees_usd,
        MAX(created_at) as last_transaction
      FROM fee_transactions
      WHERE user_address IS NOT NULL AND status = 'confirmed'
      GROUP BY user_address
      ORDER BY total_fees_usd DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Get revenue trends
router.get('/trends', requireAuth, async (req, res, next) => {
  try {
    // Last 30 days vs previous 30 days
    const current = get(`
      SELECT COALESCE(SUM(fee_usd), 0) as revenue
      FROM fee_transactions
      WHERE created_at >= date('now', '-30 days') AND status = 'confirmed'
    `);

    const previous = get(`
      SELECT COALESCE(SUM(fee_usd), 0) as revenue
      FROM fee_transactions
      WHERE created_at >= date('now', '-60 days') 
        AND created_at < date('now', '-30 days')
        AND status = 'confirmed'
    `);

    const growth = previous.revenue > 0 
      ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
      : current.revenue > 0 ? 100 : 0;

    // Hourly distribution (for timing optimization)
    const hourlyDistribution = query(`
      SELECT 
        strftime('%H', created_at) as hour,
        COUNT(*) as transactions,
        COALESCE(SUM(fee_usd), 0) as revenue_usd
      FROM fee_transactions
      WHERE created_at >= date('now', '-7 days') AND status = 'confirmed'
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `);

    res.json({
      currentPeriodRevenue: current.revenue,
      previousPeriodRevenue: previous.revenue,
      growthPercent: growth.toFixed(2),
      hourlyDistribution,
    });
  } catch (error) {
    next(error);
  }
});

// Public stats (no auth required)
router.get('/public-stats', async (req, res, next) => {
  try {
    const stats = get(`
      SELECT 
        COUNT(*) as total_swaps,
        COUNT(DISTINCT user_address) as total_users
      FROM fee_transactions
      WHERE status = 'confirmed'
    `);

    res.json({
      totalSwaps: stats.total_swaps,
      totalUsers: stats.total_users,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
