import { historyManager } from './historyManager.js';
import { getRandomWordSet } from './wordBank.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function generateWordTriplet(theme = 'Random Mix') {
  // If no Gemini API key is provided, use the offline fallback bank with history tracking
  if (!GEMINI_API_KEY) {
    console.log(`[AIGenerator] No GEMINI_API_KEY set. Using curated word bank for theme: "${theme}".`);
    const fallbackSet = getRandomWordSet(theme);
    historyManager.recordUsedWords(fallbackSet.words);
    return fallbackSet;
  }

  const recentWords = historyManager.getRecentWords(80);
  const excludeClause = recentWords.length > 0 
    ? `IMPORTANT: DO NOT use any of these recently played words (or close variations of them): ${recentWords.join(', ')}.`
    : '';

  const themeClause = (theme && theme !== 'Random Mix' && theme !== 'Random Surprise')
    ? `The theme of this round MUST BE: "${theme}". Pick concepts strictly related to "${theme}".`
    : `Pick an engaging, fun, universally recognizable theme (e.g. Pop Culture, Movies, Food, Everyday Objects, Gaming, Sports, Anime, Space, Animals, College Life).`;

  const prompt = `You are the game engine for a real-time multiplayer party deduction game called "Word Imposter".
In this game, 3 closely related words are chosen. 3 players receive the common word, and 1 player receives the imposter word.
The 3 words MUST be closely related, in the same category, and similar in nature so players have to give subtle clues.
You must also generate 2 clever, specific questions that apply to all 3 words in subtly different ways.

${themeClause}
${excludeClause}

Respond with ONLY a valid JSON object in this exact format (no markdown, no backticks, just raw JSON):
{
  "category": "Theme Name (e.g. 'Superhero Equipment' or 'Indian Street Food')",
  "words": ["Word 1", "Word 2", "Word 3"],
  "questions": [
    "Clever Question 1 tailored to distinguish these 3 words?",
    "Clever Question 2 tailored to distinguish these 3 words?"
  ]
}`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          topP: 0.95,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean potential markdown wrapper
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    if (
      parsed &&
      Array.isArray(parsed.words) &&
      parsed.words.length === 3 &&
      Array.isArray(parsed.questions) &&
      parsed.questions.length >= 2
    ) {
      const result = {
        category: parsed.category || theme || 'Mystery Theme',
        words: parsed.words.map(w => String(w).trim()),
        questions: parsed.questions.slice(0, 2).map(q => String(q).trim())
      };

      // Record words in history manager to avoid future repetition
      historyManager.recordUsedWords(result.words);
      console.log(`[AIGenerator] ✨ AI successfully generated triplet for "${theme}":`, result.words);
      return result;
    } else {
      throw new Error("Invalid schema structure returned from Gemini");
    }
  } catch (err) {
    console.warn(`[AIGenerator] AI generation failed (${err.message}), falling back to curated bank.`);
    const fallbackSet = getRandomWordSet(theme);
    historyManager.recordUsedWords(fallbackSet.words);
    return fallbackSet;
  }
}
