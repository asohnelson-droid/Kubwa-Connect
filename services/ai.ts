
import { GoogleGenAI, Type } from "@google/genai";
import { api } from './data';

const assistantSchema = {
  type: Type.OBJECT,
  properties: {
    message: { type: Type.STRING, description: "A helpful, friendly response to the user." },
    suggestedAction: {
      type: Type.STRING,
      enum: ["NONE", "SEARCH_MART", "SEARCH_SERVICES", "BOOK_RIDE"],
      description: "The best app section to direct the user to."
    },
    searchQuery: { type: Type.STRING, description: "A refined search term based on user input." }
  },
  required: ["message", "suggestedAction"],
};

export const askKubwaAssistant = async (userQuery: string) => {
  // We wrap everything in a single try-catch to ensure we always return a valid object to the UI
  try {
    const apiKey = process.env.API_KEY;
    
    // Check if API_KEY is missing before attempting initialization
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      console.error("AI Service: API_KEY is missing from environment.");
      return {
        message: "Welcome! I'm your Kubwa assistant. I'm currently in offline mode, but you can still browse the Mart and FixIt sections manually.",
        suggestedAction: "NONE",
        searchQuery: ""
      };
    }

    // Step 1: Initialize the SDK inside the try block
    const ai = new GoogleGenAI({ apiKey });

    // Step 2: Fetch application context for grounding the response
    const { products, providers } = await api.getMockContext();

    const systemInstruction = `
      You are KubwaBot, the flagship AI for 'Kubwa Connect'. 
      Location Context: Kubwa, Abuja, Nigeria.
      Tone: Professional, helpful, slightly local (Naija friendly but polite).
      
      Inventory Context:
      - Mart Examples: ${products.slice(0, 5).map(p => p.name).join(', ')}
      - Services Examples: ${providers.slice(0, 5).map(p => p.category).join(', ')}
      
      Routing Logic:
      - If they want to buy items (food, clothes, electronics): suggestedAction = SEARCH_MART.
      - If they need a fix (plumber, electrician, repair): suggestedAction = SEARCH_SERVICES.
      - If they need delivery or a ride: suggestedAction = BOOK_RIDE.
      - Otherwise: NONE.
    `;

    // Step 3: Generate content using the recommended Gemini 3 Flash model
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: userQuery }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: assistantSchema,
        temperature: 0.7,
      }
    });

    // Step 4: Extract the generated text safely using the .text property
    const text = response.text;
    if (!text) {
      throw new Error("AI returned an empty response body.");
    }
    
    // Parse and return the JSON payload
    return JSON.parse(text);

  } catch (error: any) {
    // Categorize errors for better debugging and user feedback
    console.error("KubwaBot Assistant Error:", error);

    // Graceful fallback for API limits, network errors, or parsing issues
    let userMessage = "Eyah! I hit a small snag while thinking. Could you try asking that again?";
    
    if (error.message?.includes("429")) {
      userMessage = "I'm receiving too many requests right now! Please wait a few seconds before asking me again.";
    } else if (error.message?.includes("API_KEY")) {
      userMessage = "My intelligence core isn't configured yet. Please check the API key setup.";
    }

    return {
      message: userMessage,
      suggestedAction: "NONE",
      searchQuery: ""
    };
  }
};
