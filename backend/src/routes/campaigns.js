const express = require('express');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');

const router = express.Router();

function renderMessage(template, customer) {
  return template
    .replaceAll('{{name}}', customer.name)
    .replaceAll('{{city}}', customer.city)
    .replaceAll('{{total_spent}}', String(customer.total_spent))
    .replaceAll('{{last_purchase_date}}', String(customer.last_purchase_date));
}

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
    const campaignResult = await query('SELECT * FROM campaigns WHERE id = $1', [
      req.params.id
    ]);

    if (campaignResult.rowCount === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignResult.rows[0];

    // segment_query is an AI-generated SQL WHERE clause controlled by this demo backend.
    const customersResult = await query(
      `SELECT * FROM customers WHERE ${campaign.segment_query} ORDER BY last_purchase_date DESC`
    );

    const communications = [];

    for (const customer of customersResult.rows) {
      const communicationId = uuidv4();
      const message = renderMessage(campaign.message_template, customer);

      const communicationResult = await query(
        `
          INSERT INTO communications (
            id, campaign_id, customer_id, channel, message, status, sent_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, 'sent', NOW(), NOW())
          RETURNING *
        `,
        [communicationId, campaign.id, customer.id, campaign.channel, message]
      );

      communications.push({
        id: communicationResult.rows[0].id,
        customer_name: customer.name,
        phone: customer.phone,
        message,
        channel: campaign.channel
      });
    }

    await query(
      `
        UPDATE campaigns
        SET status = 'running', total_sent = $2
        WHERE id = $1
      `,
      [campaign.id, communications.length]
    );

    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL;

    if (channelServiceUrl && communications.length > 0) {
      try {
        await fetch(`${channelServiceUrl}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaign_id: campaign.id,
            communications
          })
        });
      } catch (error) {
        console.warn('Channel service unreachable; campaign send recorded locally.');
      }
    }

    res.json({
      campaign_id: campaign.id,
      total_sent: communications.length,
      communications
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
