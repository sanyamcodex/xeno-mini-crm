const express = require('express');
const { runAgent } = require('../ai/agent');

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const result = await runAgent(message, history);
    res.json(result);
  } catch (error) {
    console.error('Failed to run AI chat:', error);
    res.status(500).json({ error: 'Failed to run AI chat' });
  }
});

module.exports = router;
