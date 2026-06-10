const express = require('express');
const { query } = require('../db');

const router = express.Router();

const counterByStatus = {
  delivered: 'total_delivered',
  opened: 'total_opened',
  clicked: 'total_clicked',
  failed: 'total_failed'
};

router.post('/', async (req, res) => {
  try {
    const { communication_id, status } = req.body;

    if (!communication_id || !status) {
      return res.status(400).json({ error: 'communication_id and status are required' });
    }

    const communicationResult = await query(
      `
        UPDATE communications
        SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING campaign_id
      `,
      [communication_id, status]
    );

    if (communicationResult.rowCount === 0) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    const counter = counterByStatus[status];

    if (counter) {
      await query(
        `UPDATE campaigns SET ${counter} = ${counter} + 1 WHERE id = $1`,
        [communicationResult.rows[0].campaign_id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to ingest receipt:', error);
    res.status(500).json({ error: 'Failed to ingest receipt' });
  }
});

module.exports = router;
