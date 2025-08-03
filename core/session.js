// Session Token and Long-Term Memory Management
import { encode, decode } from './utils.js';

class SessionManager {
    constructor() {
        this.sessionToken = this.getOrCreateSession();
        this.userPreferences = this.loadUserPreferences();
        this.importantConversations = this.loadImportantConversations();
    }

    // Generate or retrieve session token
    getOrCreateSession() {
        let token = localStorage.getItem('sessionToken');
        if (!token) {
            token = this.generateSessionToken();
            localStorage.setItem('sessionToken', token);
            localStorage.setItem('sessionCreated', new Date().toISOString());
        }
        return token;
    }

    generateSessionToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `session_${timestamp}_${random}`;
    }

    // User Preferences Management
    loadUserPreferences() {
        const saved = localStorage.getItem(`${this.sessionToken}_preferences`);
        return saved ? JSON.parse(saved) : {
            preferredPersonality: '',
            favoriteTopics: [],
            conversationStyle: 'balanced', // casual, formal, balanced
            reminderPreferences: {
                enabled: true,
                frequency: 'smart' // smart, daily, weekly
            },
            privacySettings: {
                rememberConversations: true,
                sharePersonalInfo: false
            }
        };
    }

    saveUserPreferences() {
        localStorage.setItem(`${this.sessionToken}_preferences`, JSON.stringify(this.userPreferences));
    }

    updatePreference(category, value) {
        this.userPreferences[category] = value;
        this.saveUserPreferences();
    }

    // Important Conversations Management
    loadImportantConversations() {
        const saved = localStorage.getItem(`${this.sessionToken}_important_conversations`);
        return saved ? JSON.parse(saved) : [];
    }

    saveImportantConversations() {
        localStorage.setItem(`${this.sessionToken}_important_conversations`, JSON.stringify(this.importantConversations));
    }

    markConversationAsImportant(conversationId, summary, tags = []) {
        const important = {
            id: conversationId,
            summary: summary,
            tags: tags,
            markedAt: new Date().toISOString(),
            relevanceScore: 1.0
        };
        
        this.importantConversations.push(important);
        this.saveImportantConversations();
    }

    getRelevantContext(currentMessage) {
        if (!this.userPreferences.privacySettings.rememberConversations) {
            return null;
        }

        // Simple keyword matching for context relevance
        const keywords = currentMessage.toLowerCase().split(' ').filter(word => word.length > 3);
        const relevantConversations = this.importantConversations.filter(conv => {
            return conv.tags.some(tag => 
                keywords.some(keyword => tag.toLowerCase().includes(keyword))
            ) || keywords.some(keyword => 
                conv.summary.toLowerCase().includes(keyword)
            );
        });

        return relevantConversations.slice(0, 3); // Return top 3 relevant conversations
    }

    // Conversation Analysis and Learning
    analyzeConversation(conversationHistory) {
        if (conversationHistory.length < 2) return;

        // Extract topics and preferences from conversation
        const topics = this.extractTopics(conversationHistory);
        const style = this.detectConversationStyle(conversationHistory);
        
        // Update user preferences based on conversation patterns
        topics.forEach(topic => {
            if (!this.userPreferences.favoriteTopics.includes(topic)) {
                this.userPreferences.favoriteTopics.push(topic);
            }
        });

        // Limit favorite topics to prevent bloat
        if (this.userPreferences.favoriteTopics.length > 20) {
            this.userPreferences.favoriteTopics = this.userPreferences.favoriteTopics.slice(-20);
        }

        this.saveUserPreferences();
    }

    extractTopics(conversationHistory) {
        // Simple topic extraction based on keywords
        const topicKeywords = {
            'technology': ['computer', 'software', 'programming', 'code', 'tech', 'ai', 'machine learning'],
            'science': ['research', 'experiment', 'theory', 'hypothesis', 'study', 'analysis'],
            'creativity': ['art', 'music', 'writing', 'creative', 'design', 'poetry'],
            'health': ['health', 'fitness', 'exercise', 'wellness', 'medical'],
            'education': ['learn', 'study', 'school', 'university', 'education', 'knowledge'],
            'business': ['business', 'market', 'finance', 'money', 'investment', 'career']
        };

        const conversationText = conversationHistory
            .filter(msg => msg.role === 'user')
            .map(msg => msg.parts[0]?.text || '')
            .join(' ')
            .toLowerCase();

        const detectedTopics = [];
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => conversationText.includes(keyword))) {
                detectedTopics.push(topic);
            }
        }

        return detectedTopics;
    }

    detectConversationStyle(conversationHistory) {
        const userMessages = conversationHistory
            .filter(msg => msg.role === 'user')
            .map(msg => msg.parts[0]?.text || '');

        let formalityScore = 0;
        let casualScore = 0;

        userMessages.forEach(message => {
            // Simple heuristics for conversation style
            if (message.includes('please') || message.includes('thank you') || message.includes('could you')) {
                formalityScore++;
            }
            if (message.includes('hey') || message.includes('gonna') || message.includes('btw')) {
                casualScore++;
            }
        });

        if (formalityScore > casualScore) return 'formal';
        if (casualScore > formalityScore) return 'casual';
        return 'balanced';
    }

    // Generate personalized context for AI
    getPersonalizedContext() {
        let context = [];
        
        if (this.userPreferences.preferredPersonality) {
            context.push(`User prefers AI personality: ${this.userPreferences.preferredPersonality}`);
        }

        if (this.userPreferences.favoriteTopics.length > 0) {
            context.push(`User is interested in: ${this.userPreferences.favoriteTopics.join(', ')}`);
        }

        context.push(`Conversation style preference: ${this.userPreferences.conversationStyle}`);

        return context.join('. ');
    }

    // Session cleanup and privacy
    clearSession() {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('sessionCreated');
        localStorage.removeItem(`${this.sessionToken}_preferences`);
        localStorage.removeItem(`${this.sessionToken}_important_conversations`);
        this.sessionToken = this.generateSessionToken();
        this.userPreferences = this.loadUserPreferences();
        this.importantConversations = this.loadImportantConversations();
    }

    exportUserData() {
        return {
            sessionToken: this.sessionToken,
            preferences: this.userPreferences,
            importantConversations: this.importantConversations,
            sessionCreated: localStorage.getItem('sessionCreated')
        };
    }
}

// Global session manager instance
export const sessionManager = new SessionManager();

// Export individual functions for easier use
export function getPersonalizedContext() {
    return sessionManager.getPersonalizedContext();
}

export function updateUserPreference(category, value) {
    return sessionManager.updatePreference(category, value);
}

export function markConversationImportant(conversationId, summary, tags) {
    return sessionManager.markConversationAsImportant(conversationId, summary, tags);
}

export function analyzeCurrentConversation(conversationHistory) {
    return sessionManager.analyzeConversation(conversationHistory);
}

export function getRelevantContext(message) {
    return sessionManager.getRelevantContext(message);
}

export function clearAllSessionData() {
    return sessionManager.clearSession();
}

export function exportAllUserData() {
    return sessionManager.exportUserData();
}