import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import { initializeDefaultPersonas } from '../utils/initDatabase.js';

class DatabaseConnection {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const uri = 'mongodb+srv://maliksabatali:maliksabatali@cluster0.nnfvqme.mongodb.net/';
            const dbName = 'persona';

            // Connect using mongoose with modern options
            await mongoose.connect(uri + dbName);

            this.isConnected = true;
            console.log('✅ MongoDB connected successfully');
            console.log(`📊 Database: ${dbName}`);

            // Initialize default personas
            await initializeDefaultPersonas();

            return mongoose.connection;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect() {
        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.disconnect();
                this.isConnected = false;
                console.log('🔌 MongoDB disconnected');
            }
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
        }
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

// Create a singleton instance
const dbConnection = new DatabaseConnection();

export default dbConnection;
