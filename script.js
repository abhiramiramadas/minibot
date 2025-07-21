// script.js

const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");

// Called when user clicks "Send"
function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  // Add user's message
  addMessage(message, "user");

  // Clear input
  userInput.value = "";

  // Fake AI typing delay
  setTimeout(() => {
    const botReply = getBotResponse(message);
    addMessage(botReply, "bot");
  }, 800);
}

// Function to add a message to the chatbox
function addMessage(text, sender) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);
  messageEl.textContent = text;
  chatbox.appendChild(messageEl);
  chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll
}

// Dummy bot response logic
function getBotResponse(userText) {
  const text = userText.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    return "Hey there! How can I help you today?";
  } else if (text.includes("your name")) {
    return "I'm MiniBot 🤖, your tiny AI assistant!";
  } else if (text.includes("bye")) {
    return "Goodbye! Have a great day!";
  } else {
    return "I'm still learning! Ask me something simple 😅";
  }
}

// Optional: press Enter to send message
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") sendMessage();
});
