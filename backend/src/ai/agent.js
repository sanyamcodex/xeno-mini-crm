const { GoogleGenerativeAI } = require('@google/generative-ai');
const { functionDeclarations, executeTool } = require('./tools');

const systemInstruction =
  'You are Maya, an AI marketing assistant for StyleAura — a fashion brand with Indian shoppers.\n\nYou have access to real customer data and can take actions directly.\n\nBEHAVIOR RULES:\n- When user asks to create a campaign, use smart defaults — do NOT ask for every detail separately\n- Default channel: whatsapp (unless user specifies)\n- Auto-generate a compelling message template yourself based on the segment\n- Default campaign name: auto-generate based on segment + date (e.g., "Lapsed Win-Back — Jun 2026")\n- After creating campaign with create_campaign tool, ALWAYS immediately launch it with launch_campaign tool\n- Only ask for clarification if something is truly ambiguous\n- Be concise, action-oriented, confident\n\nSMART DEFAULTS:\n- "lapsed customers" → segment: lapsed, channel: whatsapp, message: win-back offer\n- "at-risk customers" → segment: at_risk, channel: whatsapp, message: re-engagement\n- "active customers" → segment: active, channel: email, message: loyalty/upsell\n\nRESPONSE FORMAT:\n- After launching: show summary — campaign name, segment, reach count, channel\n- Show it as a clean summary, not a wall of text\n- End with: offer to show campaign stats';

function toGeminiHistory(conversationHistory = []) {
  return conversationHistory
    .filter((message) => message && message.role && message.content)
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));
}

function sanitizeHistory(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  const firstUserIdx = history.findIndex((entry) => entry && entry.role === 'user');
  if (firstUserIdx === -1) {
    return [];
  }

  const trimmed = history.slice(firstUserIdx);
  const cleaned = [];

  for (const entry of trimmed) {
    if (!entry || !entry.role) {
      continue;
    }

    if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== entry.role) {
      cleaned.push(entry);
    }
  }

  return cleaned;
}

async function callWithRetry(fn, retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = err.status === 503 || err.status === 429;

      if (isRetryable && i < retries - 1) {
        console.log(`Gemini ${err.status}, retrying in ${delayMs}ms... (attempt ${i + 1})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      } else {
        throw err;
      }
    }
  }
}

async function runAgent(userMessage, conversationHistory = []) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      reply: 'Gemini is not configured yet. Add GEMINI_API_KEY to the backend environment.',
      toolsUsed: []
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    },
    systemInstruction,
    tools: [{ functionDeclarations }]
  });

  const geminiHistory = toGeminiHistory(conversationHistory);
  const sanitizedHistory = sanitizeHistory(geminiHistory);

  const chat = model.startChat({
    history: sanitizedHistory
  });

  const toolsUsed = [];
  let result;

  try {
    result = await callWithRetry(() => chat.sendMessage(userMessage));
  } catch (error) {
    console.error('Gemini request failed:', error);

    if (error.status === 429) {
      return {
        reply:
          'Gemini API quota is exhausted for this key/project. The CRM backend and database are running, but Maya needs a Gemini API key with available quota before she can answer.',
        toolsUsed
      };
    }

    if (error.status === 503) {
      return {
        reply:
          'Gemini is temporarily unavailable right now. Please try again in a moment.',
        toolsUsed
      };
    }

    return {
      reply:
        'Gemini is currently unreachable from the backend. Please check the API key, quota, and network access, then try again.',
      toolsUsed
    };
  }

  for (let step = 0; step < 5; step += 1) {
    const calls = result.response.functionCalls() || [];

    if (calls.length === 0) {
      return {
        reply: result.response.text(),
        toolsUsed
      };
    }

    const functionResponses = [];

    for (const call of calls) {
      toolsUsed.push(call.name);
      const response = await executeTool(call.name, call.args || {});

      functionResponses.push({
        functionResponse: {
          name: call.name,
          response: Array.isArray(response) ? { result: response } : response
        }
      });
    }

    try {
      result = await callWithRetry(() => chat.sendMessage(functionResponses));
    } catch (error) {
      console.error('Gemini tool response failed:', error);

      if (error.status === 429) {
        return {
          reply:
            'Gemini API quota ran out while using CRM tools. The tool call completed locally, but Maya needs available Gemini quota to finish the response.',
          toolsUsed
        };
      }

      if (error.status === 503) {
        return {
          reply:
            'Gemini is temporarily unavailable while Maya was finishing the CRM tool response. Please try again shortly.',
          toolsUsed
        };
      }

      return {
        reply:
          'Maya used the CRM tools, but Gemini could not finish the response. Please check the API key, quota, and network access.',
        toolsUsed
      };
    }
  }

  return {
    reply: 'I used the CRM tools, but the request needs one more step. Please confirm what you want me to do next.',
    toolsUsed
  };
}

module.exports = {
  runAgent
};
