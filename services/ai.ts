
import { GoogleGenAI, Type } from "@google/genai";
import { api } from './data';

// Define the response schema for the AI assistant
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
  try {
    // Check if API_KEY is available in environment
    if (!process.env.API_KEY || process.env.API_KEY === "undefined" || process.env.API_KEY === "") {
      console.warn("AI Assistant: API_KEY is missing. AI features will be unavailable.");
      return {
        message: "I'm sorry, the AI assistant is currently offline. Please check your environment variables.",
        suggestedAction: "NONE",
        searchQuery: ""
      };
    }

    // Fix: Initialize GoogleGenAI with named parameter apiKey from process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Await the asynchronous data fetch from context
    const { products, providers } = await api.getMockContext();

    const context = `
      You are KubwaBot, the helpful AI assistant for the 'Kubwa Connect' super app.
      The app serves Kubwa, Abuja.
      
      Features:
      1. Kubwa Mart: Buy groceries, fashion, etc. (Examples: ${products.map(p => p.name).join(', ')})
      2. FixIt: Hire artisans (Plumbers, Cleaners, Tailors). (Examples: ${providers.map(p => p.category).join(', ')})
      3. KubwaRide: Book local deliveries.

      User Query: "${userQuery}"

      Analyze the query. If they want to buy something, suggest SEARCH_MART.
      If they need help/repairs, suggest SEARCH_SERVICES.
      If they need to send a package, suggest BOOK_RIDE.
      Otherwise, just chat friendly.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context,
      config: {
        responseMimeType: "application/json",
        responseSchema: assistantSchema,
      }
    });

    // Fix: access response.text property directly
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    return {
      message: "I'm having trouble connecting to the network. Please try again later.",
      suggestedAction: "NONE",
      searchQuery: ""
    };
  }
};
