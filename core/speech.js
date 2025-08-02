let speechRecognition;
let speechSynthesis;
let isSpeaking = false;
let isListening = false;
let toggleSTTCallback;
let onSpeechResultCallback;

export function initSpeechApis(onResult) {
  onSpeechResultCallback = onResult;
  speechSynthesis = window.speechSynthesis;
  if ('webkitSpeechRecognition' in window) {
    speechRecognition = new webkitSpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onSpeechResultCallback) {
        onSpeechResultCallback(transcript);
      }
      isListening = false;
      if (toggleSTTCallback) {
        toggleSTTCallback();
      }
    };

    speechRecognition.onend = () => {
      isListening = false;
      if (toggleSTTCallback) {
        toggleSTTCallback();
      }
    };

    speechRecognition.onerror = (event) => {
      isListening = false;
      if (toggleSTTCallback) {
        toggleSTTCallback();
      }
    };
  } else {
    console.warn("Speech recognition not supported in this browser.");
  }
}

export function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = () => {
    isSpeaking = false;
  };
  speechSynthesis.speak(utterance);
  isSpeaking = true;
}

export function stopSpeaking() {
  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
  }
}

export function toggleSpeechToText() {
  if (!speechRecognition) {
    alert("Speech recognition is not supported in your browser.");
    return;
  }

  if (localStorage.getItem('sttEnabled') !== 'true') {
    return;
  }

  if (isListening) {
    speechRecognition.stop();
  } else {
    speechRecognition.start();
  }
  isListening = !isListening;
  return isListening;
}

export function registerToggleSTTCallback(callback) {
  toggleSTTCallback = callback;
}