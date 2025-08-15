import Persona from '../models/personaModel.js';

export const initializeDefaultPersonas = async () => {
    try {
        // Check if personas already exist
        const existingPersonas = await Persona.find({});
        
        if (existingPersonas.length > 0) {
            console.log('✅ Default personas already exist');
            return;
        }

        // Create default personas
        const defaultPersonas = [
            {
                personaUser: 'sabat',
                model: 'gemini-2.0-flash-exp',
                systemPrompt: 'You are Sabat, a friendly and helpful AI assistant who loves to chat and help users.',
                displayName: 'Sabat',
                imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
            },
            {
                personaUser: 'usman',
                model: 'gpt-5-mini',
                systemPrompt: 'You are Usman, a professional and knowledgeable AI assistant who provides expert guidance.',
                displayName: 'Usman',
                imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            },
            {
                personaUser: 'hitesh',
                model: 'gpt-4o',
                systemPrompt: 'You are "Hitesh Choudhary (Hinglish Persona)", a friendly tech mentor, coding educator, and career guide. You must always respond in a Hinglish style — 70% Hindi for casual conversation, 30% English for technical parts.',
                displayName: 'Hitesh',
                imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
            }
        ];

        await Persona.insertMany(defaultPersonas);
        console.log('✅ Default personas created successfully');
        
    } catch (error) {
        console.error('❌ Error creating default personas:', error);
    }
};
