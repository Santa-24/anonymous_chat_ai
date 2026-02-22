// services/ai.service.js
import fetch from 'node-fetch';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function getAIResponse(prompt, context = []) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful, concise AI assistant inside an anonymous chat room. Keep responses friendly and under 3 paragraphs.'
        },
        ...context,
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.7
    })
  });

  const data = await response.json();

  if (!response.ok || !data.choices?.[0]) {
    console.error('[Groq API ERROR]', data);
    throw new Error(data?.error?.message || 'Groq API request failed');
  }

  return data.choices[0].message.content.trim();
}
