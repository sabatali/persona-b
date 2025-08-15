import OpenAI from "openai";
import { personaPrompts } from "../public/Prompts/personaPrompts.js";

import dotenv from 'dotenv'

dotenv.config()

const OPENAIapiKey = process.env.OPENAI_API_KEY;
console.log("🚀 ~ apiKey:", OPENAIapiKey);

const chatwithPersona = async (
    model,
    persona_user,
    user_message,
    conversationContext = []
) => {
    const modelConfigs = {
        "gemini-2.0-flash-exp": {
            apiKey: "",
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
            model: "gemini-2.0-flash-exp",
        },
        "gpt-4.1-mini": {
            apiKey: OPENAIapiKey,
            baseURL: "https://api.openai.com/v1",
            model: "gpt-4.1-mini",
        },
        "gpt-5-mini": {
            apiKey: OPENAIapiKey,
            model: "gpt-5-mini",
        },
        "gpt-4o": {
            apiKey: OPENAIapiKey,
            baseURL: "https://api.openai.com/v1",
            model: "gpt-4o",
        },
    };

    const config = modelConfigs[model];
    const systemPrompt = personaPrompts[persona_user];

    const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
    });

    try {
        // Build messages array with context
        const messages = [{ role: "system", content: systemPrompt }];

        // Add conversation context (last 5 messages)
        if (conversationContext && conversationContext.length > 0) {
            messages.push(...conversationContext);
        }

        // Add current user message
        messages.push({ role: "user", content: user_message });

        console.log(
            `🤖 Generating response with ${conversationContext.length} context messages`
        );
        if (conversationContext.length > 0) {
            console.log(
                "📝 Context messages:",
                conversationContext.map((msg) => ({
                    role: msg.role,
                    content: msg.content.substring(0, 50) + "...",
                }))
            );
        }

        const response = await client.chat.completions.create({
            model: config.model,
            messages: messages,
        });

        console.log(response.choices[0].message.content);
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};

export default chatwithPersona;

// chatwithPersona('gemini-2.0-flash-exp', 'sabat', 'Hey Who are you?');
