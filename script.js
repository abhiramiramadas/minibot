const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const systemInstructionDropdown = document.getElementById("systemInstruction");
const themeToggleBtn = document.getElementById("theme-toggle");
const customPromptModal = document.getElementById("custom-prompt-modal");
const customPromptInput = document.getElementById("customPromptInput");
const geminiApiKeyModal = document.getElementById("api-key-modal-gemini");
const geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
const dalleApiKeyModal = document.getElementById("api-key-modal-dalle");
const dalleApiKeyInput = document.getElementById("dalleApiKeyInput");
const errorModal = document.getElementById("error-modal");
const errorMessageEl = document.getElementById("errorMessage");
const commandSuggestion = document.getElementById("command-suggestion");

const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const IMAGE_GENERATION_API_ENDPOINT = "https://api.openai.com/v1/images/generations";

let currentSystemInstruction = "";
let conversationHistory = [];

function setTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark-mode');
    themeToggleBtn.querySelector('i').className = 'fas fa-sun';
  } else {
    body.classList.remove('dark-mode');
    themeToggleBtn.querySelector('i').className = 'fas fa-moon';
  }
}

function encode(str) {
  return btoa(str);
}

function decode(str) {
  return atob(str);
}

window.onload = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  addMessage("Hi there! I'm your Mini AI Chatbot. Please enter your Gemini API Key to begin.", "bot");
  showApiKeyModal('gemini');
};

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});

function showApiKeyModal(type) {
  const geminiKey = getApiKey('gemini');
  const dalleKey = getApiKey('dalle');
  if (type === 'gemini' && !geminiKey) {
    geminiApiKeyModal.style.display = 'flex';
  } else if (type === 'dalle' && !dalleKey) {
    dalleApiKeyModal.style.display = 'flex';
  }
}

function saveGeminiApiKey() {
  const apiKey = geminiApiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem('geminiApiKey', encode(apiKey));
    closeModal('api-key-modal-gemini');
    addMessage("Thank you! Your Gemini API key has been saved. You can now use the chatbot.", "bot");
  } else {
    addMessage("Please enter a valid API key.", "bot");
  }
}

function saveDalleApiKey() {
  const apiKey = dalleApiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem('dalleApiKey', encode(apiKey));
    closeModal('api-key-modal-dalle');
    addMessage("Thank you! Your DALL-E API key has been saved. You can now generate images.", "bot");
  } else {
    addMessage("Please enter a valid API key.", "bot");
  }
}

function getApiKey(type) {
  const key = type === 'gemini' ? 'geminiApiKey' : 'dalleApiKey';
  const encodedKey = localStorage.getItem(key);
  return encodedKey ? decode(encodedKey) : null;
}

systemInstructionDropdown.addEventListener('change', (event) => {
  if (event.target.value === 'custom') {
    customPromptModal.style.display = 'flex';
  }
});

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

function saveCustomPrompt() {
  const customPrompt = customPromptInput.value.trim();
  if (customPrompt) {
    currentSystemInstruction = customPrompt;
    setSystemInstruction();
    closeModal('custom-prompt-modal');
    systemInstructionDropdown.value = '';
  } else {
    addMessage("Please enter a custom personality or cancel.", "bot");
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
    addMessage(`AI personality has been set to "${currentSystemInstruction}".`, "bot");
  } else {
    addMessage(`AI personality has been reset to "Default Assistant".`, "bot");
  }
  chatbox.innerHTML = '';
}

function addMessage(text, sender) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);
  if (typeof text === 'string') {
      messageEl.textContent = text;
  } else if (text instanceof Image) {
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("generated-image-container");
      imageContainer.appendChild(text);
      messageEl.appendChild(imageContainer);
  }
  chatbox.appendChild(messageEl);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function showErrorModal(message) {
  errorMessageEl.textContent = message;
  errorModal.style.display = 'flex';
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  addMessage(message, "user");
  userInput.value = "";

  if (message.toLowerCase().startsWith('/generate ')) {
    const imagePrompt = message.substring('/generate '.length);
    const dalleKey = getApiKey('dalle');
    if (!dalleKey) {
      showErrorModal("DALL-E API key is not set. Please enter your key to generate images.");
      showApiKeyModal('dalle');
      return;
    }
    generateImage(imagePrompt, dalleKey);
  } else {
    const geminiKey = getApiKey('gemini');
    if (!geminiKey) {
      showErrorModal("Gemini API key is not set. Please enter your key to continue the conversation.");
      showApiKeyModal('gemini');
      return;
    }

    conversationHistory.push({
      "role": "user",
      "parts": [
        {"text": message}
      ]
    });

    const fullConversation = [];
    if (currentSystemInstruction) {
      fullConversation.push({
        "role": "user",
        "parts": [
          {"text": `System Instruction: ${currentSystemInstruction}`}
        ]
      });
      fullConversation.push({
        "role": "model",
        "parts": [
          {"text": "Understood."}
        ]
      });
    }
    fullConversation.push(...conversationHistory);

    try {
      const response = await fetch(GEMINI_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": geminiKey
        },
        body: JSON.stringify({
          "contents": fullConversation
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
      }

      const data = await response.json();
      const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (botResponse) {
        addMessage(botResponse, "bot");
        conversationHistory.push({
          "role": "model",
          "parts": [
            {"text": botResponse}
          ]
        });
      } else {
        addMessage("Sorry, I received an unexpected response from the AI.", "bot");
      }
    } catch (error) {
      console.error("API call failed:", error);
      showErrorModal(`Unable to connect to the AI right now. Details: ${error.message}`);
    }
  }
}

async function generateImage(prompt, apiKey) {
  try {
    const response = await fetch(IMAGE_GENERATION_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        "prompt": prompt,
        "n": 1,
        "size": "512x512"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
    }

    const data = await response.json();
    const imageUrl = data?.data?.[0]?.url;

    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        addMessage(img, "bot");
      };
      img.onerror = () => {
        addMessage("Failed to load generated image.", "bot");
      };
    } else {
      addMessage("Sorry, I received an unexpected response from the image generation AI.", "bot");
    }
  } catch (error) {
    console.error("Image generation API call failed:", error);
    showErrorModal(`Unable to generate image right now. Details: ${error.message}`);
  }
}

function resetChat() {
  conversationHistory = [];
  chatbox.innerHTML = '';
  addMessage("The conversation has been reset.", "bot");
}

userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  } else if (e.key === '/') {
    commandSuggestion.style.display = 'block';
  }
});

userInput.addEventListener('input', (e) => {
    if (e.target.value.startsWith('/')) {
        commandSuggestion.style.display = 'block';
    } else {
        commandSuggestion.style.display = 'none';
    }
});

commandSuggestion.addEventListener('click', () => {
    userInput.value = '/generate ';
    userInput.focus();
    commandSuggestion.style.display = 'none';
});