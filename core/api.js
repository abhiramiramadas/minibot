const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const HUGGINGFACE_API_ENDPOINT = "https://router.huggingface.co/fal-ai/fal-ai/flux/krea";
const GEMINI_VIDEO_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning";

function getApiKey(type) {
  const key = type === 'gemini' ? 'geminiApiKey' : 'huggingfaceApiKey';
  const encodedKey = localStorage.getItem(key);
  return encodedKey ? atob(encodedKey) : null;
}

export async function callGeminiApi(conversationHistory, systemInstruction, personalizedContext = null) {
  const geminiKey = getApiKey('gemini');
  if (!geminiKey) {
    throw new Error("Gemini API key is not set. Please enter your key to continue the conversation.");
  }

  const fullConversation = [];
  
  if (systemInstruction || personalizedContext) {
    let systemMessage = "";
    if (systemInstruction) {
      systemMessage += `System Instruction: ${systemInstruction}`;
    }
    if (personalizedContext) {
      systemMessage += systemMessage ? ` Additional Context: ${personalizedContext}` : `Context: ${personalizedContext}`;
    }
    
    fullConversation.push({
      "role": "user",
      "parts": [
        {"text": systemMessage}
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

export async function callGeminiVideoApi(prompt) {
  const geminiKey = getApiKey('gemini');
  if (!geminiKey) {
    throw new Error("Gemini API key is not set. Please enter your key to generate videos.");
  }

  const requestBody = {
    "instances": [{
      "prompt": prompt,
    }],
    "parameters": {
      "personGeneration": "dont_allow",
      "aspectRatio": "16:9",
      "sampleCount": 1,
      "durationSeconds": 8,
    }
  };

  const initialResponse = await fetch(`${GEMINI_VIDEO_ENDPOINT}?key=${geminiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!initialResponse.ok) {
    const errorData = await initialResponse.json();
    throw new Error(`HTTP error! status: ${initialResponse.status} - ${errorData.error.message}`);
  }

  const initialData = await initialResponse.json();
  const operationName = initialData.name;

  const pollOperation = async () => {
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        const statusResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${geminiKey}`);
        const statusData = await statusResponse.json();

        if (statusData.done) {
          clearInterval(intervalId);
          if (statusData.response && statusData.response.generateVideoResponse && statusData.response.generateVideoResponse.generatedSamples) {
            const videoUrl = statusData.response.generateVideoResponse.generatedSamples[0].video.uri;
            resolve(videoUrl);
          } else {
            reject(new Error("Video generation completed but no video URL was found."));
          }
        }
      }, 10000);
    });
  };

  return pollOperation();
}