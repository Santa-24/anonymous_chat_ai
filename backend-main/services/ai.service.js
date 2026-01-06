import OpenAI from 'openai';

export class AIService {
    constructor() {
        this.openai = null;
        this.initialize();
    }

    initialize() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
            console.log('✅ OpenAI service initialized');
        } else {
            console.warn('⚠️ OPENAI_API_KEY not found. AI service disabled.');
        }
    }

    async generateResponse(prompt, context = []) {
        if (!this.openai) {
            return "⚠️ AI service is not configured on the server.";
        }

        try {
            const messages = [
                {
                    role: "system",
                    content: "You are a helpful assistant in an anonymous chat room. Keep responses concise (1-2 sentences), friendly, and appropriate. Do not reveal that you are an AI unless asked."
                },
                ...context.slice(-5).map(msg => ({
                    role: msg.sender === 'AI Assistant' ? 'assistant' : 'user',
                    content: msg.text
                })),
                {
                    role: "user",
                    content: prompt
                }
            ];

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 150
            });

            return response.choices[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";
        } catch (error) {
            console.error('AI service error:', error);
            
            // Fallback responses
            const fallbacks = [
                "I'm having trouble processing that right now. Could you try rephrasing?",
                "Hmm, let me think about that... Actually, why don't you ask the room what they think?",
                "That's an interesting question! What do others in the room think about it?",
                "I'm not sure about that one. Maybe someone else in the chat can help!"
            ];
            
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }

    async moderateMessage(message) {
        if (!this.openai) {
            return { safe: true, reason: null };
        }

        try {
            const response = await this.openai.moderations.create({
                input: message
            });

            const result = response.results[0];
            return {
                safe: !result.flagged,
                categories: result.categories,
                scores: result.category_scores
            };
        } catch (error) {
            console.error('Moderation error:', error);
            return { safe: true, reason: 'moderation_failed' };
        }
    }

    async summarizeConversation(messages) {
        if (!this.openai || messages.length < 5) {
            return null;
        }

        try {
            const conversation = messages.slice(-10).map(m => `${m.sender}: ${m.text}`).join('\n');
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Summarize the recent conversation in 1-2 sentences. Focus on key points and questions asked."
                    },
                    {
                        role: "user",
                        content: `Recent conversation:\n${conversation}\n\nPlease provide a brief summary:`
                    }
                ],
                temperature: 0.5,
                max_tokens: 100
            });

            return response.choices[0]?.message?.content?.trim();
        } catch (error) {
            console.error('Summarization error:', error);
            return null;
        }
    }
}

// Singleton instance
export const aiService = new AIService();