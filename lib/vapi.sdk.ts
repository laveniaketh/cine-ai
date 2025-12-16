import Vapi from "@vapi-ai/web";

// Initialize Vapi with your token
export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

// Helper function to check if Vapi is initialized
export const isVapiReady = (): boolean => {
  try {
    return !!vapi;
  } catch (error) {
    console.error("Vapi not ready:", error);
    return false;
  }
};

// Vapi configuration presets
export const VapiConfigs = {
  navigation: {
    transcriber: {
      provider: "deepgram" as const,
      model: "nova-2",
      language: "en",
    },
    voice: {
      provider: "11labs" as const,
      voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel - Clear, professional
    },
    model: {
      provider: "openai" as const,
      model: "gpt-3.5-turbo",
      temperature: 0.7,
    },
  },
  chatbot: {
    transcriber: {
      provider: "deepgram" as const,
      model: "nova-2",
      language: "en",
      smartFormat: true,
    },
    voice: {
      provider: "11labs" as const,
      voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel - Friendly, conversational
      stability: 0.7,
      similarityBoost: 0.8,
    },
    model: {
      provider: "openai" as const,
      model: "gpt-4",
      temperature: 0.8,
    },
  },
};

// Navigation step messages
export const navigationSteps = {
  welcome:
    "Welcome to our cinema! Let me guide you through the booking process.",
  "movie-selection":
    "Please select a movie from the available options on screen.",
  "showtime-selection": "Great choice! Now select your preferred showtime.",
  "seat-selection": "Perfect! Please choose your seats from the seating chart.",
  concessions: "Would you like to add any snacks or drinks to your order?",
  payment: "Here is your total. Please proceed with payment when ready.",
  confirmation:
    "Thank you for your booking! Your tickets will be sent to your email.",
  goodbye: "Enjoy your movie! Have a great day!",
};

// Type definitions for better TypeScript support
export interface NavigationStep {
  step: keyof typeof navigationSteps;
  data?: any;
}

export interface ChatbotQuery {
  query: string;
  context?: any;
}

export interface VapiMessage {
  type: string;
  role?: string;
  transcript?: string;
  content?: string;
}

// Event emitter helpers
export const VapiEvents = {
  CALL_START: "call-start",
  CALL_END: "call-end",
  SPEECH_START: "speech-start",
  SPEECH_END: "speech-end",
  MESSAGE: "message",
  ERROR: "error",
  FUNCTION_CALL: "function-call",
  VOLUME_LEVEL: "volume-level",
} as const;

export default vapi;
