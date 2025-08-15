// personaModel.js
import mongoose from "mongoose";

const personaSchema = new mongoose.Schema({
    personaUser: {
        type: String,
        required: true,
        unique: true
    },
    model: {
        type: String,
        required: true
    },
    systemPrompt: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    totalMessages: {
        type: Number,
        default: 0
    },
    totalTokens: {
        type: Number,
        default: 0
    },
    lastActive: {
        type: Date,
        default: Date.now
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

personaSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Persona', personaSchema);
