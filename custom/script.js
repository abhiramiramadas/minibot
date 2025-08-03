// minibot-forked/custom/script.js
import * as ui from '../core/ui.js';

window.onload = () => {
    loadCustomSettings();
    setupEventListeners();
};

function setupEventListeners() {
    const saveCustomThemeButton = document.getElementById('save-custom-theme-button');
    if (saveCustomThemeButton) {
        saveCustomThemeButton.addEventListener('click', saveCustomTheme);
    }
    
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            ui.setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

function saveCustomTheme() {
    const customMainColor = document.getElementById('custom-main-color').value;
    const customBgColor = document.getElementById('custom-bg-color').value;
    const customFontUrl = document.getElementById('custom-font-url').value.trim();
    const customFontName = document.getElementById('custom-font-name').value.trim();

    localStorage.setItem('customMainColor', customMainColor);
    localStorage.setItem('customBgColor', customBgColor);
    localStorage.setItem('customFontUrl', customFontUrl);
    localStorage.setItem('customFontName', customFontName);
    localStorage.setItem('theme', 'custom');

    applyCustomSettings();
    
    // Show success message
    showSuccessMessage('Custom theme saved and applied!');
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

function loadCustomSettings() {
    const customMainColor = localStorage.getItem('customMainColor');
    const customBgColor = localStorage.getItem('customBgColor');
    const customFontUrl = localStorage.getItem('customFontUrl');
    const customFontName = localStorage.getItem('customFontName');

    if (customMainColor) {
        document.getElementById('custom-main-color').value = customMainColor;
    }
    if (customBgColor) {
        document.getElementById('custom-bg-color').value = customBgColor;
    }
    if (customFontUrl) {
        document.getElementById('custom-font-url').value = customFontUrl;
    }
    if (customFontName) {
        document.getElementById('custom-font-name').value = customFontName;
    }

    // Apply settings immediately if theme is custom
    if (localStorage.getItem('theme') === 'custom') {
        applyCustomSettings();
    }
}

function applyCustomSettings() {
    const customMainColor = localStorage.getItem('customMainColor');
    const customBgColor = localStorage.getItem('customBgColor');
    const customFontUrl = localStorage.getItem('customFontUrl');
    const customFontName = localStorage.getItem('customFontName');

    const root = document.documentElement;

    if (customMainColor) {
      root.style.setProperty('--light-primary-color', customMainColor);
    }
    if (customBgColor) {
      root.style.setProperty('--light-bg-color', customBgColor);
      root.style.setProperty('--light-container-bg', customBgColor);
      root.style.setProperty('--light-message-bg', customBgColor);
    }

    if (customFontUrl && customFontName) {
        const oldLink = document.getElementById('custom-font-link');
        if (oldLink) {
            oldLink.remove();
        }

        const link = document.createElement('link');
        link.id = 'custom-font-link';
        link.href = customFontUrl;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        document.body.style.fontFamily = customFontName;
        localStorage.setItem('font', customFontName);
    }
}