import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function explainTest(testType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Explain what a "${testType}" is in simple terms for a patient. Keep it under 50 words. Mention if they usually need to fast or prepare.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not load explanation at this time.";
  }
}

export async function suggestStaffAction(test: any, patientProfile?: any, otherTests?: any[]) {
  try {
    const history = patientProfile ? `Patient History: ${JSON.stringify(patientProfile.medicalHistory)}` : "No history available.";
    const pending = otherTests ? `Other Pending Tests: ${otherTests.filter(t => t.id !== test.id).map(t => t.type).join(", ")}` : "No other pending tests.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `A patient's test (${test.type}) has been delayed for ${test.waitingDays} days. Status is ${test.status}. 
      Context:
      - ${history}
      - ${pending}
      
      Suggest a single professional next step for the healthcare staff to resolve this delay, considering the patient's context if relevant. Keep it very short and actionable.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Review hospital workflow for delays.";
  }
}
