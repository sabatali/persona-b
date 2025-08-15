import express from 'express';
import personaRoute from './routes/personaRoute.js';
import dbConnection from './database/connection.js';

const app = express();
const PORT = 3000;

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware for parsing JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/persona', personaRoute);

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 API available at http://localhost:${PORT}/api/persona`);

    try {
        // Initialize database connection
        await dbConnection.connect();
        console.log('✅ Database service initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize database service:', error);
    }
});
