const { GoogleGenerativeAI } = require('@google/generative-ai');
const { functionDeclarations, executeTool } = require('./tools');

const systemInstruction =
  'You are Maya, an AI marketing assistant for StyleAura — a fashion brand. You help marketers segment customers, create campaigns, and analyze performance. You have access to real customer data. Always be concise, data-driven, and actionable. When creating campaigns, always confirm details before launching.';

function toGeminiHistory(conversationHistory = []) {
  return conversationHistory
    .filter((message) => message && message.role && message.content)
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));
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
    model: 'gemini-2.0-flash',
    systemInstruction,
    tools: [{ functionDeclarations }]
  });

  const chat = model.startChat({
    history: toGeminiHistory(conversationHistory)
  });

  const toolsUsed = [];
  let result;

  try {
    result = await chat.sendMessage(userMessage);
  } catch (error) {
    console.error('Gemini request failed:', error);

    if (error.status === 429) {
      return {
        reply:
          'Gemini API quota is exhausted for this key/project. The CRM backend and database are running, but Maya needs a Gemini API key with available quota before she can answer.',
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
      result = await chat.sendMessage(functionResponses);
    } catch (error) {
      console.error('Gemini tool response failed:', error);

      if (error.status === 429) {
        return {
          reply:
            'Gemini API quota ran out while using CRM tools. The tool call completed locally, but Maya needs available Gemini quota to finish the response.',
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
