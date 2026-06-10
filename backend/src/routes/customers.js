const express = require('express');
const { query } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM customers ORDER BY last_purchase_date DESC NULLS LAST'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE last_purchase_date >= CURRENT_DATE - INTERVAL '15 days')::int AS active,
        COUNT(*) FILTER (
          WHERE last_purchase_date < CURRENT_DATE - INTERVAL '15 days'
            AND last_purchase_date >= CURRENT_DATE - INTERVAL '60 days'
        )::int AS at_risk,
        COUNT(*) FILTER (WHERE last_purchase_date < CURRENT_DATE - INTERVAL '60 days')::int AS lapsed
      FROM customers
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer stats' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customerResult = await query('SELECT * FROM customers WHERE id = $1', [
      req.params.id
    ]);

    if (customerResult.rowCount === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const ordersResult = await query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY purchased_at DESC',
      [req.params.id]
    );

    res.json({
      ...customerResult.rows[0],
      orders: ordersResult.rows
    });
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

module.exports = router;
