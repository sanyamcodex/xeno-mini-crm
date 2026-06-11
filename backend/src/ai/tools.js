const { SchemaType } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { sendCampaign } = require('../services/campaignSender');

const segmentQueries = {
  active: "last_purchase_date >= CURRENT_DATE - INTERVAL '15 days'",
  at_risk:
    "last_purchase_date < CURRENT_DATE - INTERVAL '15 days' AND last_purchase_date >= CURRENT_DATE - INTERVAL '60 days'",
  lapsed: "last_purchase_date < CURRENT_DATE - INTERVAL '60 days'",
  all: 'TRUE'
};

const functionDeclarations = [
  {
    name: 'get_customer_stats',
    description: 'Get overview stats of the customer base',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'get_customers',
    description:
      "Fetch customers matching a segment. Use segment parameter like 'active', 'at_risk', 'lapsed', or 'all'",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        segment: {
          type: SchemaType.STRING,
          description: "Customer segment: 'active', 'at_risk', 'lapsed', or 'all'"
        }
      },
      required: ['segment']
    }
  },
  {
    name: 'create_campaign',
    description: 'Creates a NEW campaign. Only call this when the user explicitly wants to CREATE a new campaign, not when asking about existing ones.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        segment: {
          type: SchemaType.STRING,
          description: "Customer segment: 'active', 'at_risk', 'lapsed', or 'all'"
        },
        channel: {
          type: SchemaType.STRING,
          description: "Channel: 'whatsapp', 'sms', or 'email'"
        },
        message_template: {
          type: SchemaType.STRING,
          description: 'Personalized message template. May use {{name}}, {{city}}, {{total_spent}}, {{last_purchase_date}}.'
        }
      },
      required: ['name', 'segment', 'channel', 'message_template']
    }
  },
  {
    name: 'launch_campaign',
    description: 'Launch a created campaign — sends messages to all segment customers',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        campaign_id: { type: SchemaType.STRING }
      },
      required: ['campaign_id']
    }
  },
  {
    name: 'get_campaign_stats',
    description: 'Get performance stats for a campaign',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        campaign_id: { type: SchemaType.STRING }
      },
      required: ['campaign_id']
    }
  }
];

function getSegmentQuery(segment) {
  return segmentQueries[segment] || null;
}

async function getCustomerStats() {
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

    return result.rows[0];
  } catch (error) {
    console.error('AI tool get_customer_stats failed:', error);
    return { error: 'Could not fetch customer stats' };
  }
}

async function getCustomers({ segment }) {
  try {
    const segmentQuery = getSegmentQuery(segment);

    if (!segmentQuery) {
      return { error: "Invalid segment. Use 'active', 'at_risk', 'lapsed', or 'all'." };
    }

    const result = await query(
      `
        SELECT id, name, phone, city, total_spent, last_purchase_date
        FROM customers
        WHERE ${segmentQuery}
        ORDER BY last_purchase_date DESC
      `
    );

    return result.rows;
  } catch (error) {
    console.error('AI tool get_customers failed:', error);
    return { error: 'Could not fetch customers' };
  }
}

async function createCampaign({ name, segment, channel, message_template }) {
  try {
    const segmentQuery = getSegmentQuery(segment);
    const validChannels = ['whatsapp', 'sms', 'email'];

    if (!segmentQuery) {
      return { error: "Invalid segment. Use 'active', 'at_risk', 'lapsed', or 'all'." };
    }

    if (!validChannels.includes(channel)) {
      return { error: "Invalid channel. Use 'whatsapp', 'sms', or 'email'." };
    }

    const reachResult = await query(
      `SELECT COUNT(*)::int AS estimated_reach FROM customers WHERE ${segmentQuery}`
    );

    const id = uuidv4();
    const result = await query(
      `
        INSERT INTO campaigns (
          id, name, segment_description, segment_query, channel, message_template, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'draft')
        RETURNING id, name
      `,
      [id, name, segment, segmentQuery, channel, message_template]
    );

    return {
      campaign_id: result.rows[0].id,
      name: result.rows[0].name,
      segment,
      estimated_reach: reachResult.rows[0].estimated_reach
    };
  } catch (error) {
    console.error('AI tool create_campaign failed:', error);
    return { error: 'Could not create campaign' };
  }
}

async function launchCampaign({ campaign_id }) {
  try {
    const sendResult = await sendCampaign(campaign_id);

    if (sendResult.error) {
      return { error: sendResult.error };
    }

    return {
      launched: true,
      total_sent: sendResult.total_sent,
      campaign_name: sendResult.campaign.name
    };
  } catch (error) {
    console.error('AI tool launch_campaign failed:', error);
    return { error: 'Could not launch campaign' };
  }
}

async function getCampaignStats({ campaign_id }) {
  try {
    const result = await query(
      `
        SELECT
          name,
          status,
          total_sent,
          total_delivered,
          total_opened,
          total_clicked,
          total_failed
        FROM campaigns
        WHERE id = $1
      `,
      [campaign_id]
    );

    if (result.rowCount === 0) {
      return { error: 'Campaign not found' };
    }

    const campaign = result.rows[0];
    const openRate =
      campaign.total_delivered > 0
        ? Number(((campaign.total_opened / campaign.total_delivered) * 100).toFixed(2))
        : 0;
    const clickRate =
      campaign.total_opened > 0
        ? Number(((campaign.total_clicked / campaign.total_opened) * 100).toFixed(2))
        : 0;

    return {
      name: campaign.name,
      status: campaign.status,
      total_sent: campaign.total_sent,
      total_delivered: campaign.total_delivered,
      total_opened: campaign.total_opened,
      total_clicked: campaign.total_clicked,
      total_failed: campaign.total_failed,
      open_rate: openRate,
      click_rate: clickRate
    };
  } catch (error) {
    console.error('AI tool get_campaign_stats failed:', error);
    return { error: 'Could not fetch campaign stats' };
  }
}

const implementations = {
  get_customer_stats: getCustomerStats,
  get_customers: getCustomers,
  create_campaign: createCampaign,
  launch_campaign: launchCampaign,
  get_campaign_stats: getCampaignStats
};

async function executeTool(name, args = {}) {
  const implementation = implementations[name];

  if (!implementation) {
    return { error: `Unknown tool: ${name}` };
  }

  return implementation(args);
}

module.exports = {
  functionDeclarations,
  executeTool
};
