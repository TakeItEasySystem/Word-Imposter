import { historyManager } from './historyManager.js';
import { getRandomWordSet } from './wordBank.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro'
];

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

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            topP: 0.95
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[AIGenerator] Model ${modelName} returned status ${response.status}: ${errText.substring(0, 150)}`);
        continue; // Try next model in list
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Clean potential markdown wrapper
      const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
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
        console.log(`[AIGenerator] ✨ Model (${modelName}) successfully generated triplet for "${theme}":`, result.words);
        return result;
      }
    } catch (err) {
      console.warn(`[AIGenerator] Model ${modelName} parse/request failed: ${err.message}`);
    }
  }

  // If all models failed or threw errors, fallback safely to curated wordbank
  console.warn(`[AIGenerator] All Gemini models exhausted. Falling back to curated bank.`);
  const fallbackSet = getRandomWordSet(theme);
  historyManager.recordUsedWords(fallbackSet.words);
  return fallbackSet;
}

// Fast health check test for Gemini API connectivity
let cachedGeminiStatus = null;
let lastCheckTime = 0;

export async function checkGeminiStatus(force = false) {
  if (!GEMINI_API_KEY) {
    return {
      configured: false,
      status: 'unconfigured',
      message: 'GEMINI_API_KEY environment variable is not set. Using curated offline word decks.'
    };
  }

  // Cache result for 60 seconds to prevent rate-limits on repeated health pings
  const now = Date.now();
  if (!force && cachedGeminiStatus && (now - lastCheckTime < 60000)) {
    return cachedGeminiStatus;
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Ping. Reply with 'pong'." }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (response.ok) {
        cachedGeminiStatus = {
          configured: true,
          status: 'connected',
          workingModel: modelName,
          message: `Gemini API successfully connected & operational with model "${modelName}"!`
        };
        lastCheckTime = now;
        return cachedGeminiStatus;
      }
    } catch (err) {
      // Try next candidate model
    }
  }

  cachedGeminiStatus = {
    configured: true,
    status: 'error',
    message: 'GEMINI_API_KEY is set, but all candidate Gemini models failed connection or key is invalid.'
  };
  lastCheckTime = now;
  return cachedGeminiStatus;
}

