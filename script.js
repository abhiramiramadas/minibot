// script.js

const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const systemInstructionDropdown = document.getElementById("systemInstruction");
const themeToggleBtn = document.getElementById("theme-toggle");
const modal = document.getElementById("custom-prompt-modal");
const customPromptInput = document.getElementById("customPromptInput");
const BASE_URL = "https://cavio-ai-backend.vercel.app";

let sessionId = localStorage.getItem("sarvamSessionId");

// Generate a new session ID if one doesn't exist
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("sarvamSessionId", sessionId);
}

// --- Theme Toggling Logic ---
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

// Check for saved theme preference on load
window.onload = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  addMessage("Hi there! I'm your Mini AI Chatbot. What personality would you like me to have?", "bot");
};

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});

// --- Modal and Dropdown Logic ---
systemInstructionDropdown.addEventListener('change', (event) => {
  if (event.target.value === 'custom') {
    modal.style.display = 'flex';
  }
});

function closeModal() {
  modal.style.display = 'none';
}

async function saveCustomPrompt() {
  const customPrompt = customPromptInput.value.trim();
  if (customPrompt) {
    await sendSystemInstruction(customPrompt);
    closeModal();
    // Reset dropdown to default after setting custom prompt
    systemInstructionDropdown.value = '';
  } else {
    addMessage("Please enter a custom personality or cancel.", "bot");
  }
}

// Function to send system instruction to the API
async function sendSystemInstruction(instruction) {
  if (instruction === "") {
    addMessage("Please select or enter a personality for the AI.", "bot");
    return;
  }

  try {
    const url = `${BASE_URL}/config`;
    const payload = {
      session_id: sessionId,
      system_instruction: instruction
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.response) {
      addMessage(data.response, "bot");
    } else {
      addMessage("Failed to set AI personality: Unexpected response format.", "bot");
    }
  } catch (error) {
    console.error("Config API call failed:", error);
    addMessage("Failed to set AI personality. Please try again.", "bot");
  }
}

async function setSystemInstruction() {
  const instruction = systemInstructionDropdown.value;
  if (instruction === 'custom') {
    // Modal already opened by the change event listener
    return;
  }
  await sendSystemInstruction(instruction);
}

// --- Chat Logic ---
function addMessage(text, sender) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);
  messageEl.textContent = text;
  chatbox.appendChild(messageEl);
  chatbox.scrollTop = chatbox.scrollHeight;
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  addMessage(message, "user");
  userInput.value = "";

  try {
    const url = `${BASE_URL}/chat`;
    const payload = {
      session_id: sessionId,
      message: message,
      enable_thinking: true,
      reasoning_effort: "high"
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.response) {
      addMessage(data.response, "bot");
    } else {
      addMessage("Sorry, I received an unexpected response from the AI.", "bot");
    }
  } catch (error) {
    console.error("API call failed:", error);
    addMessage("Sorry, I'm unable to connect to the AI right now. Please check the console for details.", "bot");
  }
}

async function resetChat() {
  addMessage("Resetting conversation...", "bot");
  
  try {
    const url = `${BASE_URL}/reset`;
    const payload = { session_id: sessionId };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.response) {
      // Clear chatbox and show reset confirmation
      chatbox.innerHTML = '';
      addMessage(data.response, "bot");
    } else {
      addMessage("Conversation has been reset, but the server response was unexpected.", "bot");
    }
  } catch (error) {
    console.error("Reset API call failed:", error);
    addMessage("Failed to reset the conversation. Please try again.", "bot");
  }
}

userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") sendMessage();
});