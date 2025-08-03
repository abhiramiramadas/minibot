// Preferences page functionality
import { sessionManager, updateUserPreference, clearAllSessionData, exportAllUserData } from '../core/session.js';
import * as ui from '../core/ui.js';

window.addEventListener('load', () => {
    initializePreferencesPage();
    setupEventListeners();
});

function initializePreferencesPage() {
    // Load session information
    document.getElementById('session-id').textContent = sessionManager.sessionToken.substring(0, 20) + '...';
    const sessionCreated = localStorage.getItem('sessionCreated');
    if (sessionCreated) {
        const date = new Date(sessionCreated);
        document.getElementById('session-created').textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Load current preferences
    loadPreferencesFromSession();
    
    // Apply current theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    ui.setTheme(savedTheme);
}

function loadPreferencesFromSession() {
    const prefs = sessionManager.userPreferences;
    
    // Personality preferences
    document.getElementById('preferred-personality').value = prefs.preferredPersonality || '';
    document.getElementById('conversation-style').value = prefs.conversationStyle || 'balanced';
    
    // Memory and reminders
    document.getElementById('remember-conversations').checked = prefs.privacySettings.rememberConversations;
    document.getElementById('smart-reminders').checked = prefs.reminderPreferences.enabled;
    document.getElementById('reminder-frequency').value = prefs.reminderPreferences.frequency || 'smart';
    
    // Privacy settings
    document.getElementById('share-personal-info').checked = prefs.privacySettings.sharePersonalInfo;
    document.getElementById('store-context').checked = prefs.privacySettings.rememberConversations;
    
    // Load favorite topics
    loadFavoriteTopics();
}

function loadFavoriteTopics() {
    const topicsContainer = document.getElementById('favorite-topics');
    const existingTags = topicsContainer.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());
    
    const topics = sessionManager.userPreferences.favoriteTopics || [];
    topics.forEach(topic => {
        addTopicTag(topic);
    });
}

function addTopicTag(topic) {
    const topicsContainer = document.getElementById('favorite-topics');
    const addButton = document.getElementById('add-topic-btn');
    
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
        <span>${topic}</span>
        <span class="remove-tag" onclick="removeTopicTag('${topic}')">&times;</span>
    `;
    
    topicsContainer.insertBefore(tag, addButton.previousElementSibling);
}

function removeTopicTag(topic) {
    const topics = sessionManager.userPreferences.favoriteTopics;
    const index = topics.indexOf(topic);
    if (index > -1) {
        topics.splice(index, 1);
        sessionManager.saveUserPreferences();
        loadFavoriteTopics();
    }
}

function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            ui.setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Add topic functionality
    const addTopicBtn = document.getElementById('add-topic-btn');
    const newTopicInput = document.getElementById('new-topic-input');
    
    addTopicBtn.addEventListener('click', addNewTopic);
    newTopicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewTopic();
        }
    });

    // Save preferences button
    document.getElementById('save-preferences-btn').addEventListener('click', saveAllPreferences);
    
    // Export data button
    document.getElementById('export-data-btn').addEventListener('click', exportUserData);
    
    // Clear session button
    document.getElementById('clear-session-btn').addEventListener('click', clearSessionData);
    
    // Auto-save on preference changes
    setupAutoSave();
}

function addNewTopic() {
    const input = document.getElementById('new-topic-input');
    const topic = input.value.trim();
    
    if (topic && topic.length > 0) {
        const topics = sessionManager.userPreferences.favoriteTopics;
        if (!topics.includes(topic)) {
            topics.push(topic);
            sessionManager.saveUserPreferences();
            addTopicTag(topic);
            input.value = '';
        } else {
            alert('Topic already exists!');
        }
    }
}

function setupAutoSave() {
    // Auto-save when preferences change
    const elements = [
        'preferred-personality',
        'conversation-style',
        'remember-conversations',
        'smart-reminders',
        'reminder-frequency',
        'share-personal-info',
        'store-context'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                saveAllPreferences(false); // Don't show success message for auto-save
            });
        }
    });
}

function saveAllPreferences(showMessage = true) {
    // Update preferences object
    const prefs = sessionManager.userPreferences;
    
    prefs.preferredPersonality = document.getElementById('preferred-personality').value;
    prefs.conversationStyle = document.getElementById('conversation-style').value;
    
    prefs.reminderPreferences.enabled = document.getElementById('smart-reminders').checked;
    prefs.reminderPreferences.frequency = document.getElementById('reminder-frequency').value;
    
    prefs.privacySettings.rememberConversations = document.getElementById('remember-conversations').checked;
    prefs.privacySettings.sharePersonalInfo = document.getElementById('share-personal-info').checked;
    
    // Update store-context to match rememberConversations
    document.getElementById('store-context').checked = prefs.privacySettings.rememberConversations;
    
    // Save to localStorage
    sessionManager.saveUserPreferences();
    
    if (showMessage) {
        showSuccessMessage('Preferences saved successfully!');
    }
}

function exportUserData() {
    try {
        const userData = exportAllUserData();
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `minibot-user-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showSuccessMessage('User data exported successfully!');
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export user data. Please try again.');
    }
}

function clearSessionData() {
    if (confirm('Are you sure you want to clear all your session data? This action cannot be undone.')) {
        clearAllSessionData();
        showSuccessMessage('Session data cleared successfully!');
        
        // Reload the page to reflect changes
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}

function showSuccessMessage(message) {
    // Create a temporary success message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--light-secondary-color);
        color: var(--light-bg-color);
        padding: 15px 20px;
        border: 2px solid var(--light-border-color);
        box-shadow: 4px 4px 0px var(--light-shadow-color);
        z-index: 1000;
        font-weight: bold;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Make removeTopicTag available globally
window.removeTopicTag = removeTopicTag;