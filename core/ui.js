const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const themeToggleBtn = document.getElementById("theme-toggle");
const commandSuggestion = document.getElementById("command-suggestion");
const fileInput = document.getElementById("fileInput");
const attachButton = document.getElementById("attachButton");
const filePreviewContainer = document.getElementById("file-preview-container");
const filePreviewName = document.getElementById("file-preview-name");
const removeFileButton = document.getElementById("remove-file-button");

export function addMessage(content, sender) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);

  if (typeof content === 'string') {
    messageEl.innerHTML = renderMarkdown(content);
  } else if (content.type === 'text') {
    messageEl.innerHTML = renderMarkdown(content.data);
  } else if (content.type === 'image') {
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("generated-image-container");
    const img = new Image();
    img.src = content.data;
    imageContainer.appendChild(img);
    messageEl.appendChild(imageContainer);
  } else if (content.type === 'video') {
    const videoContainer = document.createElement("div");
    videoContainer.classList.add("generated-video-container");
    const video = document.createElement("video");
    video.src = content.data;
    video.controls = true;
    videoContainer.appendChild(video);
    messageEl.appendChild(videoContainer);
  } else if (content.type === 'document') {
    const docContainer = document.createElement("div");
    docContainer.classList.add("generated-doc-container");
    const link = document.createElement("a");
    link.href = content.data;
    link.textContent = content.fileName;
    link.target = "_blank";
    docContainer.appendChild(link);
    messageEl.appendChild(docContainer);
  }

  chatbox.appendChild(messageEl);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Simple markdown renderer
function renderMarkdown(text) {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>');

  // Handle lists
  const listRegex = /(\* |\d\. ).*/g;
  const lines = html.split('\n');
  let inList = false;
  let listHtml = '';
  const newLines = [];

  for (const line of lines) {
    if (line.match(listRegex)) {
      if (!inList) {
        listHtml += '<ul>';
        inList = true;
      }
      listHtml += `<li>${line.substring(2)}</li>`;
    } else {
      if (inList) {
        listHtml += '</ul>';
        newLines.push(listHtml);
        listHtml = '';
        inList = false;
      }
      newLines.push(line);
    }
  }
  if (inList) {
    listHtml += '</ul>';
    newLines.push(listHtml);
  }
  html = newLines.join('<br/>');

  return html;
}

export function showFilePreview(fileName) {
  filePreviewName.textContent = fileName;
  filePreviewContainer.style.display = 'flex';
  userInput.style.flexGrow = 0;
  userInput.style.width = '100%';
}

export function hideFilePreview() {
  filePreviewContainer.style.display = 'none';
  filePreviewName.textContent = '';
  userInput.style.flexGrow = 1;
}

export function applyCustomTheme() {
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
    }
}

export function setTheme(theme) {
  const body = document.body;
  // Always clear all theme classes first to prevent conflicts
  body.classList.remove('dark-theme', 'ocean-theme', 'forest-theme', 'custom-theme');
  
  // Reset custom CSS variables
  const root = document.documentElement;
  root.style.removeProperty('--light-primary-color');
  root.style.removeProperty('--light-bg-color');
  root.style.removeProperty('--light-container-bg');
  root.style.removeProperty('--light-message-bg');

  // Remove any custom font link
  const customLink = document.getElementById('custom-font-link');
  if (customLink) {
    customLink.remove();
  }

  if (theme === 'custom') {
      applyCustomTheme();
      // Update theme toggle button icon
      themeToggleBtn.querySelector('i').className = 'fas fa-paint-brush';
      body.classList.add('custom-theme');
      return;
  }
  
  if (theme !== 'light') {
    body.classList.add(`${theme}-theme`);
  }

  // Update theme toggle button icon
  if (theme === 'dark') {
    themeToggleBtn.querySelector('i').className = 'fas fa-sun';
  } else {
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
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });

  userInput.addEventListener("keydown", function(e) {
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

  attachButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      showFilePreview(fileInput.files[0].name);
    } else {
      hideFilePreview();
    }
  });

  removeFileButton.addEventListener('click', () => {
    fileInput.value = null;
    hideFilePreview();
  });
}