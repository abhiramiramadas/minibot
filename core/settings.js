import { encode, decode } from './utils.js';
import * as ui from './ui.js';

export function saveApiKey(type, key) {
    if (key) {
        localStorage.setItem(`${type}ApiKey`, encode(key));
        ui.closeModal(`api-key-modal-${type}`);
        ui.addMessage(`Thank you! Your ${type.charAt(0).toUpperCase() + type.slice(1)} API key has been saved. You can now use the chatbot.`, "bot");
    } else {
        ui.addMessage("Please enter a valid API key.", "bot");
    }
}

export function getApiKey(type) {
  const encodedKey = localStorage.getItem(`${type}ApiKey`);
  return encodedKey ? decode(encodedKey) : null;
}

export function setupSettingsToggles(speakBtn) {
    const ttsToggle = document.getElementById("tts-toggle");
    const sttToggle = document.getElementById("stt-toggle");

    if (ttsToggle) {
        const ttsEnabled = localStorage.getItem('ttsEnabled') === 'true';
        ttsToggle.checked = ttsEnabled;
        ttsToggle.addEventListener('change', (e) => {
            localStorage.setItem('ttsEnabled', e.target.checked);
        });
    }

    if (sttToggle) {
        const sttEnabled = localStorage.getItem('sttEnabled') === 'true';
        sttToggle.checked = sttEnabled;
        if (speakBtn) {
            speakBtn.style.display = sttEnabled ? 'block' : 'none';
        }
        sttToggle.addEventListener('change', (e) => {
            localStorage.setItem('sttEnabled', e.target.checked);
            if (speakBtn) {
                speakBtn.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }
}