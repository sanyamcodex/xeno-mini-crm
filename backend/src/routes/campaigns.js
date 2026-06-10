const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { sendCampaign } = require('../services/campaignSender');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM campaigns ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaignResult = await query('SELECT * FROM campaigns WHERE id = $1', [
      req.params.id
    ]);

    if (campaignResult.rowCount === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const communicationsResult = await query(
      `
        SELECT communications.*, customers.name AS customer_name, customers.email, customers.phone, customers.city
        FROM communications
        JOIN customers ON customers.id = communications.customer_id
        WHERE communications.campaign_id = $1
        ORDER BY communications.sent_at DESC NULLS LAST, communications.updated_at DESC
      `,
      [req.params.id]
    );

    res.json({
      ...campaignResult.rows[0],
      communications: communicationsResult.rows
    });
  } catch (error) {
    console.error('Failed to fetch campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, segment_description, segment_query, channel, message_template } = req.body;

    if (!name || !segment_description || !segment_query || !channel || !message_template) {
      return res.status(400).json({
        error: 'name, segment_description, segment_query, channel, and message_template are required'
      });
    }

    const id = uuidv4();
    const result = await query(
      `
        INSERT INTO campaigns (
          id, name, segment_description, segment_query, channel, message_template, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'draft')
        RETURNING *
      `,
      [id, name, segment_description, segment_query, channel, message_template]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const sendResult = await sendCampaign(req.params.id);

    if (sendResult.error) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      campaign_id: sendResult.campaign.id,
      total_sent: sendResult.total_sent,
      communications: sendResult.communications
    });
  } catch (error) {
    console.error('Failed to send campaign:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const result = await query(
      `
        SELECT
          total_sent,
          total_delivered,
          total_opened,
          total_clicked,
          total_failed
        FROM campaigns
        WHERE id = $1
      `,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch campaign stats:', error);
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
});

module.exports = router;
