import { GoogleGenAI } from "@google/genai";

// Initialize with process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateClinicalInterpretation = async (
  score: number, 
  maxScore: number, 
  status: string,
  consistency: number,
  categoryScores: Record<string, number>
): Promise<string> => {
  try {
    // Use gemini-3-flash-preview instead of the prohibited gemini-1.5-flash
    const model = "gemini-3-flash-preview"; 
    
    const prompt = `
    Role: Senior Clinical Psychologist.
    Task: Provide a brief, empathetic, and professional interpretation of a mental health assessment.
    
    Patient Data:
    - Total Score: ${score}/${maxScore}
    - Calculated Status: ${status}
    - Consistency Score: ${consistency}% (Below 70% suggests random answering)
    - Category Breakdown: ${JSON.stringify(categoryScores)}

    Instructions:
    1. Summarize the mental health status based on the score.
    2. If consistency is low, gently warn that results might not be accurate.
    3. Highlight 1-2 specific areas of concern based on category scores.
    4. Provide 3 actionable, non-medical self-care recommendations.
    5. Tone: Professional, supportive, non-alarmist. 
    6. Max length: 150 words. Do not use markdown formatting like bolding.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Unable to generate interpretation.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Automated interpretation currently unavailable due to network or service error.";
  }
};