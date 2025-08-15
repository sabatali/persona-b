import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const messageSchema = new mongoose.Schema({
    personaUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Persona',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    model: {
        type: String,
        required: false
    },
    tokens: {
        type: Number,
        default: 0
    }
});

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4()
    },
    deviceInfo: {
        type: String,
        default: 'Unknown Device'
    },
    messages: {
        type: [messageSchema],
        default: []
    },
    totalTokens: {
        type: Number,
        default: 0
    },
    totalMessages: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

sessionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    // Auto-calculate totals
    this.totalMessages = this.messages.length;
    this.totalTokens = this.messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);
    next();
});

export default mongoose.model('Session', sessionSchema);
