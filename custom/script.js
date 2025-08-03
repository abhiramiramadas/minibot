// minibot-forked/custom/script.js
import * as ui from '../core/ui.js';

window.onload = () => {
    loadCustomSettings();

    const saveCustomThemeButton = document.getElementById('save-custom-theme-button');
    if (saveCustomThemeButton) {
        saveCustomThemeButton.addEventListener('click', saveCustomTheme);
    }
};

function saveCustomTheme() {
    const customMainColor = document.getElementById('custom-main-color').value;
    const customBgColor = document.getElementById('custom-bg-color').value;
    const customFontUrl = document.getElementById('custom-font-url').value;
    const customFontName = document.getElementById('custom-font-name').value;

    localStorage.setItem('customMainColor', customMainColor);
    localStorage.setItem('customBgColor', customBgColor);
    localStorage.setItem('customFontUrl', customFontUrl);
    localStorage.setItem('customFontName', customFontName);
    localStorage.setItem('theme', 'custom');

    applyCustomSettings();
    alert('Custom theme saved!');
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