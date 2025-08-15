import chatwithPersona from "../config/OpenAi.js";
import Session from "../models/sessionModel.js";
import Persona from "../models/personaModel.js";
import { v4 as uuidv4 } from 'uuid';
import { countConversationTokens } from '../utils/tokenCounter.js';

export const genPersona = async (req, res) => {
    try {
        const { model, persona_user, user_message, sessionId } = req.body;

        if (!model || !persona_user || !user_message) {
            return res.status(400).json({
                error: 'Missing required fields: model, persona_user, user_message'
            });
        }

        // Get persona details
        const persona = await Persona.findOne({ personaUser: persona_user });
        if (!persona) {
            return res.status(400).json({
                error: 'Persona not found'
            });
        }

        let conversationContext = [];
        if (sessionId) {
            const existingSession = await Session.findOne({ sessionId: sessionId });
            if (existingSession) {
                const personaMessages = existingSession.messages.filter(msg =>
                    msg.personaUserId.toString() === persona._id.toString()
                );

                const lastMessages = personaMessages.slice(-5);
                conversationContext = lastMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                console.log(`📚 Sending ${conversationContext.length} context messages to AI`);
            }
        }

        const aiResponse = await chatwithPersona(model, persona_user, user_message, conversationContext);

        // Count tokens for both messages
        const tokenCounts = countConversationTokens(user_message, aiResponse, model);
        const { userTokens, aiTokens, totalTokens } = tokenCounts;

        console.log('🔢 Token counting results:', {
            userMessage: user_message.substring(0, 50) + '...',
            aiResponse: aiResponse.substring(0, 50) + '...',
            userTokens,
            aiTokens,
            totalTokens,
            model
        });

        // Create or get session
        let session = null;
        let sessionIdToReturn = null;

        try {
            if (sessionId) {
                // Check if session exists
                session = await Session.findOne({ sessionId: sessionId });
            }

            if (!session) {
                // Create new session
                const newSessionId = uuidv4();
                sessionIdToReturn = newSessionId;
                session = new Session({
                    sessionId: newSessionId,
                    deviceInfo: req.headers['user-agent'] || 'Unknown Device',
                    messages: []
                });
            } else {
                sessionIdToReturn = session.sessionId;
            }

            // Add messages to session with token counts
            const userMessage = {
                personaUserId: persona._id,
                role: 'user',
                content: user_message,
                timestamp: new Date(),
                model: model,
                tokens: userTokens
            };

            const assistantMessage = {
                personaUserId: persona._id,
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
                model: model,
                tokens: aiTokens
            };

            console.log('💾 Saving messages with tokens:', {
                userMessage: { ...userMessage, content: userMessage.content.substring(0, 30) + '...' },
                assistantMessage: { ...assistantMessage, content: assistantMessage.content.substring(0, 30) + '...' }
            });

            session.messages.push(userMessage, assistantMessage);

            // Save session (auto-calculates totals)
            await session.save();

            // Update persona stats
            persona.totalMessages += 2;
            persona.totalTokens += totalTokens;
            persona.lastActive = new Date();
            await persona.save();

            res.status(200).json({
                success: true,
                persona_res: aiResponse,
                sessionId: sessionIdToReturn,
                totalMessages: session.totalMessages,
                totalTokens: session.totalTokens,
                tokenBreakdown: {
                    userTokens,
                    aiTokens,
                    totalTokens
                },
                dbStatus: 'connected'
            });

        } catch (dbError) {
            console.warn('⚠️ Database operation failed, but AI response generated:', dbError.message);
            // Generate a temporary session ID if DB fails
            if (!sessionIdToReturn) {
                sessionIdToReturn = uuidv4();
            }

            res.status(200).json({
                success: true,
                persona_res: aiResponse,
                sessionId: sessionIdToReturn,
                totalMessages: 0,
                totalTokens: 0,
                tokenBreakdown: {
                    userTokens,
                    aiTokens,
                    totalTokens
                },
                dbStatus: 'disconnected'
            });
        }

    } catch (error) {
        console.error('Error in genPersona:', error);

        // Handle rate limit errors specifically
        if (error.status === 429) {
            return res.status(429).json({
                error: 'Rate limit exceeded. Please wait a moment before sending another message.',
                details: 'You have hit the API rate limit. Try again in a few seconds.',
                retryAfter: 30
            });
        }

        // Handle other errors
        res.status(500).json({
            error: error.message,
            details: 'An error occurred while processing your request.'
        });
    }
};

// Get all sessions
export const getAllSessions = async (req, res) => {
    try {
        const sessions = await Session.find({}).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            sessions: sessions
        });
    } catch (error) {
        console.error('Error getting sessions:', error);
        res.status(500).json({
            error: 'Database not available',
            details: error.message
        });
    }
};

// Get specific session by ID
export const getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await Session.findOne({ sessionId: sessionId });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.status(200).json({
            success: true,
            session: session
        });
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(500).json({
            error: 'Database not available',
            details: error.message
        });
    }
};

// Get chat history for a specific session and persona
export const getChatHistory = async (req, res) => {
    try {
        const { sessionId, personaUser } = req.query;

        if (!sessionId || !personaUser) {
            return res.status(400).json({
                error: 'Missing required fields: sessionId, personaUser'
            });
        }

        // Get persona ID
        const persona = await Persona.findOne({ personaUser: personaUser });
        if (!persona) {
            return res.status(400).json({
                error: 'Persona not found'
            });
        }

        // Get session with messages for this persona
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            return res.status(200).json({
                success: true,
                messages: [],
                sessionId: sessionId,
                personaUser: personaUser
            });
        }

        // Filter messages for this persona
        const personaMessages = session.messages.filter(msg =>
            msg.personaUserId.toString() === persona._id.toString()
        );

        res.status(200).json({
            success: true,
            messages: personaMessages,
            sessionId: sessionId,
            personaUser: personaUser,
            model: persona.model
        });
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({
            error: 'Database not available',
            details: error.message
        });
    }
};

// Get all personas (always visible in sidebar)
export const getAllPersonas = async (req, res) => {
    try {
        const personas = await Persona.find({ isActive: true }).sort({ createdAt: 1 });

        // Calculate real-time stats for each persona from session data
        const personasWithRealStats = await Promise.all(personas.map(async (persona) => {
            try {
                // Get all sessions that have messages from this persona
                const sessions = await Session.find({
                    'messages.personaUserId': persona._id
                });

                let totalMessages = 0;
                let totalTokens = 0;
                let lastActive = persona.lastActive;

                // Calculate totals from all sessions
                sessions.forEach(session => {
                    const personaMessages = session.messages.filter(msg =>
                        msg.personaUserId.toString() === persona._id.toString()
                    );

                    totalMessages += personaMessages.length;
                    totalTokens += personaMessages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);

                    // Find the most recent message timestamp
                    const latestMessage = personaMessages.reduce((latest, msg) =>
                        msg.timestamp > latest ? msg.timestamp : latest,
                        new Date(0)
                    );

                    if (latestMessage > lastActive) {
                        lastActive = latestMessage;
                    }
                });

                return {
                    ...persona.toObject(),
                    totalMessages,
                    totalTokens,
                    lastActive
                };
            } catch (error) {
                console.error(`Error calculating stats for persona ${persona.personaUser}:`, error);
                // Return persona with default stats if calculation fails
                return {
                    ...persona.toObject(),
                    totalMessages: persona.totalMessages || 0,
                    totalTokens: persona.totalTokens || 0,
                    lastActive: persona.lastActive || new Date()
                };
            }
        }));

        res.status(200).json({
            success: true,
            personas: personasWithRealStats
        });
    } catch (error) {
        console.error('Error getting personas:', error);
        res.status(500).json({
            error: 'Database not available',
            details: error.message
        });
    }
};

// Get session summary (total messages, tokens, etc.)
export const getSessionSummary = async (req, res) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Missing required field: sessionId'
            });
        }

        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            return res.status(200).json({
                success: true,
                totalMessages: 0,
                totalTokens: 0,
                sessionId: sessionId
            });
        }

        res.status(200).json({
            success: true,
            totalMessages: session.totalMessages,
            totalTokens: session.totalTokens,
            sessionId: sessionId
        });
    } catch (error) {
        console.error('Error getting session summary:', error);
        res.status(500).json({
            error: 'Database not available',
            details: error.message
        });
    }
};
