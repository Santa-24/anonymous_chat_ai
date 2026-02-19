require('dotenv').config();
const fetch = require('node-fetch');

const GROQ_API_KEY = process.env.OPENAI_API_KEY;

async function getAIResponse(prompt, context = []) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ API KEY MISSING');
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful AI assistant in an anonymous chat room.',
            },
            ...context.slice(-5),
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.choices) {
      console.error('[Groq API ERROR]', data);
      throw new Error(data?.error?.message || 'Groq API failed');
    }

    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error('[AI SERVICE ERROR]', err.message);
    throw err;
  }
}

module.exports = { getAIResponse };
