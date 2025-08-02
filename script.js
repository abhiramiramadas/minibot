import * as ui from "./core/ui.js";
import * as api from "./core/api.js";
import * as speech from "./core/speech.js";
import * as settings from "./core/settings.js";

const userInput = document.getElementById("userInput");
const systemInstructionDropdown = document.getElementById("systemInstruction");
const customPromptModal = document.getElementById("custom-prompt-modal");
const customPromptInput = document.getElementById("customPromptInput");
const geminiApiKeyModal = document.getElementById("api-key-modal-gemini");
const geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
const huggingfaceApiKeyModal = document.getElementById("api-key-modal-huggingface");
const huggingfaceApiKeyInput = document.getElementById("huggingfaceApiKeyInput");
const speakBtn = document.getElementById("stt-button");

let currentSystemInstruction = "";
let conversationHistory = [];

window.onload = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  ui.setTheme(savedTheme);
  
  if (localStorage.getItem('ttsEnabled') === null) {
      localStorage.setItem('ttsEnabled', 'true');
  }
  if (localStorage.getItem('sttEnabled') === null) {
      localStorage.setItem('sttEnabled', 'true');
  }
  
  if (userInput && speakBtn) {
    ui.addMessage("Hi there! I'm your Mini AI Chatbot. Please enter your Gemini API Key to begin.", "bot");
    ui.showApiKeyModal('gemini');
    ui.setupEventListeners(sendMessage);
    settings.setupSettingsToggles(speakBtn);
    speech.initSpeechApis(handleSpeechResult);
    speech.registerToggleSTTCallback(() => {
      speakBtn.classList.toggle('listening', speech.isListening);
    });
  } else {
    settings.setupSettingsToggles(speakBtn);
  }
};

function handleSpeechResult(transcript) {
  userInput.value = transcript;
  sendMessage();
}

if (systemInstructionDropdown) {
  systemInstructionDropdown.addEventListener('change', (event) => {
    if (event.target.value === 'custom') {
      customPromptModal.style.display = 'flex';
    }
  });
}

function saveCustomPrompt() {
  const customPrompt = customPromptInput.value.trim();
  if (customPrompt) {
    currentSystemInstruction = customPrompt;
    setSystemInstruction();
    ui.closeModal('custom-prompt-modal');
    systemInstructionDropdown.value = '';
  } else {
    ui.addMessage("Please enter a custom personality or cancel.", "bot");
  }
}

function setSystemInstruction() {
  const instruction = systemInstructionDropdown.value || currentSystemInstruction;
  if (instruction === 'custom') {
    return;
  }

  if (instruction) {
    currentSystemInstruction = instruction;
  } else {
    currentSystemInstruction = "";
  }

  conversationHistory = [];
  if (currentSystemInstruction) {
    ui.addMessage(`AI personality has been set to "${currentSystemInstruction}".`, "bot");
  } else {
    ui.addMessage(`AI personality has been reset to "Default Assistant".`, "bot");
  }
  document.getElementById('chatbox').innerHTML = '';
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  speech.stopSpeaking();
  ui.addMessage(message, "user");
  userInput.value = "";

  if (message.toLowerCase().startsWith('/generate ')) {
    const imagePrompt = message.substring('/generate '.length);
    const huggingfaceKey = settings.getApiKey('huggingface');
    if (!huggingfaceKey) {
      ui.showErrorModal("Hugging Face API key is not set. Please enter your key to generate images.");
      huggingfaceApiKeyModal.style.display = 'flex';
      return;
    }
    try {
      const imageUrl = await api.callHuggingFaceApi(imagePrompt, huggingfaceKey);
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          ui.addMessage(img, "bot");
        };
        img.onerror = () => {
          ui.addMessage("Failed to load generated image.", "bot");
        };
      } else {
        ui.addMessage("Sorry, I received an unexpected response from the image generation AI.", "bot");
      }
    } catch (error) {
      console.error("Image generation API call failed:", error);
      ui.showErrorModal(`Unable to generate image right now. Details: ${error.message}`);
    }
  } else {
    const geminiKey = settings.getApiKey('gemini');
    if (!geminiKey) {
      ui.showErrorModal("Gemini API key is not set. Please enter your key to continue the conversation.");
      geminiApiKeyModal.style.display = 'flex';
      return;
    }

    conversationHistory.push({
      "role": "user",
      "parts": [
        {"text": message}
      ]
    });

    try {
      const botResponse = await api.callGeminiApi(conversationHistory, currentSystemInstruction);

      if (botResponse) {
        ui.addMessage(botResponse, "bot");
        conversationHistory.push({
          "role": "model",
          "parts": [
            {"text": botResponse}
          ]
        });
        if (localStorage.getItem('ttsEnabled') === 'true') {
            speech.speakText(botResponse);
        }
      } else {
        ui.addMessage("Sorry, I received an unexpected response from the AI.", "bot");
      }
    } catch (error) {
      console.error("API call failed:", error);
      ui.showErrorModal(`Unable to connect to the AI right now. Details: ${error.message}`);
    }
  }
}

function resetChat() {
  conversationHistory = [];
  document.getElementById('chatbox').innerHTML = '';
  ui.addMessage("The conversation has been reset.", "bot");
}

window.saveGeminiApiKey = () => settings.saveApiKey('gemini', geminiApiKeyInput.value.trim());
window.saveHuggingFaceApiKey = () => settings.saveApiKey('huggingface', huggingfaceApiKeyInput.value.trim());
window.closeModal = ui.closeModal;
window.saveCustomPrompt = saveCustomPrompt;
window.setSystemInstruction = setSystemInstruction;
window.sendMessage = sendMessage;
window.resetChat = resetChat;
window.toggleSpeechToText = speech.toggleSpeechToText;
window.showApiKeyModal = ui.showApiKeyModal;
window.forceShowApiKeyModal = ui.forceShowApiKeyModal; // Expose the new function globally