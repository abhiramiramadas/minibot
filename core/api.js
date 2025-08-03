const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const HUGGINGFACE_API_ENDPOINT = "https://router.huggingface.co/fal-ai/fal-ai/flux/krea";

function getApiKey(type) {
  const key = type === 'gemini' ? 'geminiApiKey' : 'huggingfaceApiKey';
  const encodedKey = localStorage.getItem(key);
  return encodedKey ? atob(encodedKey) : null;
}

export async function callGeminiApi(conversationHistory, systemInstruction) {
  const geminiKey = getApiKey('gemini');
  if (!geminiKey) {
    throw new Error("Gemini API key is not set. Please enter your key to continue the conversation.");
  }

  const fullConversation = [];
  if (systemInstruction) {
    fullConversation.push({
      "role": "user",
      "parts": [
        {"text": `System Instruction: ${systemInstruction}`}
      ]
    });
    fullConversation.push({
      "role": "model",
      "parts": [
        {"text": "Understood."}
      ]
    });
  }

  conversationHistory.forEach(historyItem => {
    const parts = [];
    historyItem.parts.forEach(part => {
      if (part.text) {
        parts.push({ "text": part.text });
      }
      if (part.inline_data) {
        parts.push({ "inline_data": part.inline_data });
      }
    });
    fullConversation.push({
      "role": historyItem.role,
      "parts": parts
    });
  });

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
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function callHuggingFaceApi(prompt, apiKey) {
  const response = await fetch(HUGGINGFACE_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sync_mode: true,
      prompt: prompt
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
  }
  const data = await response.json();
  return data?.images?.[0]?.url;
}