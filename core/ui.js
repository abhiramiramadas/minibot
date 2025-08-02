const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const themeToggleBtn = document.getElementById("theme-toggle");
const commandSuggestion = document.getElementById("command-suggestion");

export function addMessage(text, sender) {
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

export function setTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark-mode');
    themeToggleBtn.querySelector('i').className = 'fas fa-sun';
  } else {
    body.classList.remove('dark-mode');
    themeToggleBtn.querySelector('i').className = 'fas fa-moon';
  }
}

export function showApiKeyModal(type) {
  const modalId = type === 'gemini' ? 'api-key-modal-gemini' : 'api-key-modal-huggingface';
  const apiKey = localStorage.getItem(`${type}ApiKey`);
  if (!apiKey) {
    document.getElementById(modalId).style.display = 'flex';
  }
}

// New function to always show the modal for the update buttons.
export function forceShowApiKeyModal(type) {
  const modalId = type === 'gemini' ? 'api-key-modal-gemini' : 'api-key-modal-huggingface';
  document.getElementById(modalId).style.display = 'flex';
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

export function showErrorModal(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("error-modal").style.display = 'flex';
}

export function setupEventListeners(sendMessage) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });

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
}