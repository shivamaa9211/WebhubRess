import { GoogleGenAI } from "@google/genai";

// Fixed: Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type EnhancementOption = 'professional' | 'grammar' | 'concise' | 'expand';

export const enhanceText = async (text: string, type: 'summary' | 'experience' | 'skill', option: EnhancementOption = 'professional'): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided for Gemini.");
    return "Error: No API Key configured. Please check your environment variables."; 
  }

  let instruction = "";
  
  switch (option) {
    case 'professional':
      instruction = "Rewrite this to be more professional, impactful, and use strong action verbs. Keep the same meaning but elevate the tone.";
      break;
    case 'grammar':
      instruction = "Fix all grammar, spelling, and punctuation errors. Do not change the tone or structure significantly, just correct the mistakes.";
      break;
    case 'concise':
      instruction = "Make this more concise and to the point. Remove fluff and unnecessary words while keeping key achievements.";
      break;
    case 'expand':
      instruction = "Expand on this text with relevant professional details and keywords. Make it more descriptive and comprehensive.";
      break;
  }

  let prompt = "";
  if (type === 'summary') {
    prompt = `Act as a professional resume writer. 
    Context: Professional Summary section.
    Task: ${instruction}
    Input Text: "${text}"
    Output: Return ONLY the rewritten text. Do not include quotes or preambles.`;
  } else if (type === 'experience') {
    prompt = `Act as a professional resume writer.
    Context: Job Description bullet points.
    Task: ${instruction}
    Maintain bullet point formatting if present.
    Input Text: "${text}"
    Output: Return ONLY the rewritten text. Do not include quotes or preambles.`;
  } else {
    // Skills are usually simple lists
    prompt = `Suggest 10 relevant technical skills separated by commas based on this input: "${text}". Just return the comma separated list.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
