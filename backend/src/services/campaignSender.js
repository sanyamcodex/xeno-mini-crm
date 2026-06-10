const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');

function renderMessage(template, customer) {
  return template
    .replaceAll('{{name}}', customer.name)
    .replaceAll('{{city}}', customer.city)
    .replaceAll('{{total_spent}}', String(customer.total_spent))
    .replaceAll('{{last_purchase_date}}', String(customer.last_purchase_date));
}

async function sendCampaign(campaignId) {
  const campaignResult = await query('SELECT * FROM campaigns WHERE id = $1', [
    campaignId
  ]);

  if (campaignResult.rowCount === 0) {
    return { error: 'Campaign not found' };
  }

  const campaign = campaignResult.rows[0];
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

  return {
    campaign,
    total_sent: communications.length,
    communications
  };
}

module.exports = {
  sendCampaign
};
