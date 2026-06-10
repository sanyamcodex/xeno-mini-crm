const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function parseResponse(response) {
  let body = null;

  try {
    body = await response.json();
  } catch (error) {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error || 'Unable to connect to backend');
  }

  return body;
}

export async function sendMessage(message, history) {
  const response = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });

  return parseResponse(response);
}

export async function getCampaigns() {
  const response = await fetch(`${BASE}/api/campaigns`, {
    cache: 'no-store'
  });

  return parseResponse(response);
}

export async function getCampaignStats(id) {
  const response = await fetch(`${BASE}/api/campaigns/${id}/stats`, {
    cache: 'no-store'
  });

  return parseResponse(response);
}

export async function getCustomerStats() {
  const response = await fetch(`${BASE}/api/customers/stats`, {
    cache: 'no-store'
  });

  return parseResponse(response);
}
