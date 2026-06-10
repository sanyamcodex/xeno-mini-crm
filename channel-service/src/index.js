require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3002;
const crmUrl = process.env.CRM_URL || 'http://localhost:3001';

app.use(cors());
app.use(express.json());

function randomDelay(min, max) {
  return Math.floor((Math.random() * (max - min) + min) * 1000);
}

async function callbackReceipt(communicationId, status) {
  try {
    await fetch(`${crmUrl}/api/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communication_id: communicationId,
        status
      })
    });
  } catch (error) {
    // CRM may be restarting during local demos; delivery simulation should not crash.
  }
}

function scheduleCallback(communicationId, status, delayMs) {
  setTimeout(() => {
    callbackReceipt(communicationId, status);
  }, delayMs);
}

function simulateLifecycle(communication) {
  const isFailed = Math.random() < 0.05;
  const deliveryDelay = randomDelay(2, 4);

  if (isFailed) {
    scheduleCallback(communication.id, 'failed', deliveryDelay);
    return;
  }

  scheduleCallback(communication.id, 'delivered', deliveryDelay);

  const isOpened = Math.random() < 0.6;

  if (!isOpened) {
    return;
  }

  const openedDelay = deliveryDelay + randomDelay(8, 15);
  scheduleCallback(communication.id, 'opened', openedDelay);

  const isClicked = Math.random() < 0.25;

  if (!isClicked) {
    return;
  }

  const clickedDelay = openedDelay + randomDelay(20, 30);
  scheduleCallback(communication.id, 'clicked', clickedDelay);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'channel-service' });
});

app.post('/send', async (req, res) => {
  try {
    const { campaign_id, communications } = req.body;

    if (!campaign_id || !Array.isArray(communications)) {
      return res.status(400).json({
        error: 'campaign_id and communications array are required'
      });
    }

    for (const communication of communications) {
      if (communication.id) {
        simulateLifecycle(communication);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to receive send batch:', error);
    res.status(500).json({ error: 'Failed to receive send batch' });
  }
});

app.listen(port, () => {
  console.log(`Channel Service ready on port ${port}`);
});
