import { encoding_for_model } from 'tiktoken';

// Token counting utility for different AI models
export const countTokens = (text, model = 'gpt-4') => {
    try {
        // Map our model names to OpenAI model names for tiktoken
        const modelMap = {
            'gpt-4o': 'gpt-4o',
            'gpt-5-mini': 'gpt-4', // Use gpt-4 encoding as fallback
            'gemini-2.0-flash-exp': 'gpt-4' // Use gpt-4 encoding as fallback
        };

        const targetModel = modelMap[model] || 'gpt-4';
        const encoder = encoding_for_model(targetModel);
        const tokens = encoder.encode(text);
        const tokenCount = tokens.length;

        // Clean up encoder
        encoder.free();

        return tokenCount;
    } catch (error) {
        console.warn('⚠️ Token counting failed, falling back to character-based estimation:', error.message);
        // Fallback: rough estimation (1 token ≈ 4 characters for English text)
        return Math.ceil(text.length / 4);
    }
};

// Count tokens for a conversation (user + AI messages)
export const countConversationTokens = (userMessage, aiResponse, model = 'gpt-4') => {
    const userTokens = countTokens(userMessage, model);
    const aiTokens = countTokens(aiResponse, model);

    return {
        userTokens,
        aiTokens,
        totalTokens: userTokens + aiTokens
    };
};

// Get token cost estimation (approximate)
export const estimateTokenCost = (tokenCount, model = 'gpt-4') => {
    const costs = {
        'gpt-4o': { input: 0.000005, output: 0.000015 }, // $5 per 1M input, $15 per 1M output
        'gpt-5-mini': { input: 0.00000015, output: 0.0000006 }, // $0.15 per 1M input, $0.6 per 1M output
        'gemini-2.0-flash-exp': { input: 0.000000075, output: 0.0000003 } // $0.075 per 1M input, $0.3 per 1M output
    };

    const modelCosts = costs[model] || costs['gpt-4o'];
    const estimatedCost = (tokenCount * modelCosts.input) + (tokenCount * modelCosts.output);

    return {
        estimatedCost: estimatedCost.toFixed(6),
        costPer1K: ((modelCosts.input + modelCosts.output) * 1000).toFixed(6)
    };
};
