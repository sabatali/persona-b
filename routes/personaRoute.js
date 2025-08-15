import { genPersona, getAllSessions, getSessionById, getChatHistory, getAllPersonas, getSessionSummary } from "../controllers/PersonaController.js";
import express from "express";
const personaRoute = express.Router();

// GET route to show persona API info
personaRoute.get('/', (req, res) => {
    res.json({
        message: "Persona API is working! 🚀",
        endpoints: {
            "POST /genPersona": "Generate persona with AI",
            "GET /sessions": "Get all persona sessions",
            "GET /session/:sessionId": "Get specific session",
            "GET /chatHistory": "Get chat history for session and persona",
            "GET /personas": "Get all available personas",
            "GET /sessionSummary": "Get session summary",
            "GET /": "This info page"
        },
        usage: {
            method: "POST",
            url: "/api/persona/genPersona",
            body: {
                model: "gemini-2.0-flash-exp | gpt-5-mini | gpt-4o",
                persona_user: "sabat | usman | hitesh",
                user_message: "Your message here"
            }
        }
    });
});

// Get all sessions
personaRoute.get('/sessions', getAllSessions);

// Get specific session by ID
personaRoute.get('/session/:sessionId', getSessionById);

// Get chat history for session and persona
personaRoute.get('/chatHistory', getChatHistory);

// Get all personas (always visible in sidebar)
personaRoute.get('/personas', getAllPersonas);

// Get session summary
personaRoute.get('/sessionSummary', getSessionSummary);

// Generate persona
personaRoute.post('/genPersona', genPersona);

export default personaRoute;
