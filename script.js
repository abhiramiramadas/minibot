// minibot-forked/script.js
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
const fileInput = document.getElementById("fileInput");

const fontSelect = document.getElementById("font-select");
const themeSelect = document.getElementById("theme-select");

let currentSystemInstruction = "";
let conversationHistory = [];

window.onload = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  ui.setTheme(savedTheme);
  const savedFont = localStorage.getItem('font') || `'Courier New', monospace`;
  document.body.style.fontFamily = savedFont;

  if (localStorage.getItem('ttsEnabled') === null) {
      localStorage.setItem('ttsEnabled', 'true');
  }
  if (localStorage.getItem('sttEnabled') === null) {
      localStorage.setItem('sttEnabled', 'true');
  }

  const savedHistory = localStorage.getItem('conversationHistory');
  if (savedHistory) {
    try {
      conversationHistory = JSON.parse(savedHistory);
      conversationHistory.forEach(historyItem => {
        if (historyItem.role === 'user' || historyItem.role === 'model') {
            const part = historyItem.parts[0];
            if (part.text) {
                ui.addMessage(part.text, historyItem.role);
            } else if (part.url) {
                const fileType = part.mime_type.split('/')[0];
                ui.addMessage({ type: fileType, data: part.url, fileName: part.url.split('/').pop() }, historyItem.role);
            }
        }
      });
    } catch (e) {
      console.error("Failed to parse conversation history from localStorage", e);
      conversationHistory = [];
    }
  }

  if (userInput && speakBtn) {
    if (conversationHistory.length === 0) {
      ui.addMessage("Hi there! I'm your Mini AI Chatbot. Please enter your Gemini API Key to begin.", "bot");
    }
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

  if (fontSelect) {
    fontSelect.value = savedFont;
    fontSelect.addEventListener('change', (e) => {
      localStorage.setItem('font', e.target.value);
      document.body.style.fontFamily = e.target.value;
    });
  }

  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener('change', (e) => {
      ui.setTheme(e.target.value);
      localStorage.setItem('theme', e.target.value);
    });
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
  localStorage.removeItem('conversationHistory');
  if (currentSystemInstruction) {
    ui.addMessage(`AI personality has been set to "${currentSystemInstruction}".`, "bot");
  } else {
    ui.addMessage(`AI personality has been reset to "Default Assistant".`, "bot");
  }
  document.getElementById('chatbox').innerHTML = '';
}

async function sendMessage() {
  const message = userInput.value.trim();
  const file = fileInput.files[0];

  if (message.toLowerCase() === '/reset') {
      resetChat();
      userInput.value = "";
      return;
  }

  if (message === "" && !file) return;

  speech.stopSpeaking();
  userInput.value = "";
  ui.hideFilePreview();
  fileInput.value = null;

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
        ui.addMessage({ type: 'image', data: imageUrl }, "bot");
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

    const newHistoryItem = {
      "role": "user",
      "parts": []
    };

    if (message) {
      newHistoryItem.parts.push({ "text": message });
    }

    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async function(e) {
          const base64Data = e.target.result.split(',')[1];
          newHistoryItem.parts.push({
            "inline_data": {
              "mimeType": file.type,
              "data": base64Data
            }
          });
          const fileType = file.type.split('/')[0];
          ui.addMessage({ type: fileType, data: URL.createObjectURL(file), fileName: file.name }, "user");

          conversationHistory.push(newHistoryItem);

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
          localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("File processing failed:", error);
        ui.showErrorModal(`File processing failed: ${error.message}`);
        return;
      }
    } else {
      if (message) {
        ui.addMessage(message, "user");
        conversationHistory.push(newHistoryItem);
      }

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
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    }
  }
}

function resetChat() {
  conversationHistory = [];
  localStorage.removeItem('conversationHistory');
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
window.forceShowApiKeyModal = ui.forceShowApiKeyModal;