require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const customersRouter = require('./routes/customers');
const campaignsRouter = require('./routes/campaigns');
const receiptsRouter = require('./routes/receipts');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/customers', customersRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/receipts', receiptsRouter);

async function start() {
  try {
    await initDB();

    app.listen(port, () => {
      console.log(`XenoCRM Backend ready on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start XenoCRM Backend:', error);
    process.exit(1);
  }
}

start();
