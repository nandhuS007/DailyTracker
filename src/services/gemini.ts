import { GoogleGenAI, Type } from "@google/genai";
import { DailyEntry } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeDailyEntry(entry: DailyEntry) {
  const prompt = `
    Analyze the following daily accountability entry:
    Mood: ${entry.mood}/10
    Priorities: ${entry.priorities.join(", ")}
    Accomplishments: ${entry.accomplishments}
    Habits: Exercise: ${entry.habits.exercise}, Focused Work: ${entry.habits.focusedWork}, Healthy Eating: ${entry.habits.healthyEating}, Good Sleep: ${entry.habits.goodSleep}
    Distractions: ${entry.distraction}
    Learned: ${entry.learned}
    Went Well: ${entry.wentWell}
    Improvement: ${entry.improvement}
    Gratitude: ${entry.gratitude.join(", ")}

    Your job is to:
    1. Analyze the responses briefly (concise but insightful).
    2. Identify 1 pattern (good or bad).
    3. Suggest 1 clear, actionable improvement for tomorrow.

    Rules:
    - Be honest, not overly positive.
    - Push back if the user is being inconsistent or vague.
    - Keep it professional and coaching-oriented.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Brief analysis of the responses" },
          pattern: { type: Type.STRING, description: "One identified pattern" },
          actionableStep: { type: Type.STRING, description: "One clear actionable improvement" }
        },
        required: ["summary", "pattern", "actionableStep"]
      }
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text.trim());
}

export async function getCoachAdvice(history: DailyEntry[], userMessage: string) {
  const context = history.slice(0, 5).map(entry => ({
    date: entry.date,
    mood: entry.mood,
    accomplishments: entry.accomplishments,
    improvement: entry.improvement,
    pattern: entry.analysis?.pattern
  }));

  const prompt = `
    You are an advanced accountability coach. You have access to the user's recent history:
    ${JSON.stringify(context)}

    The user says: "${userMessage}"

    Provide a concise, insightful, and slightly firm response. 
    Reference their past patterns if relevant. 
    Don't just be a cheerleader; be a coach who wants them to win.
    Keep the response under 100 words.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "I'm here to help you stay on track. What's on your mind?";
}
