import { historyManager } from './historyManager.js';
import { getRandomWordSet } from './wordBank.js';

function getCleanApiKey() {
  const rawKey = process.env.GEMINI_API_KEY || '';
  return rawKey.trim().replace(/^["']|["']$/g, '');
}

function getAuthHeaders(apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['x-goog-api-key'] = apiKey;
    if (apiKey.startsWith('AQ.') || apiKey.startsWith('ya29.')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }
  return headers;
}

const CANDIDATE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-pro'
];

let cachedWorkingModel = null;

export async function generateWordTriplet(theme = 'Random Mix') {
  const apiKey = getCleanApiKey();

  // If no Gemini API key is provided, use the offline fallback bank with history tracking
  if (!apiKey) {
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

  const modelsToTry = cachedWorkingModel 
    ? [cachedWorkingModel, ...CANDIDATE_MODELS.filter(m => m !== cachedWorkingModel)]
    : CANDIDATE_MODELS;

  for (const modelName of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
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
        console.warn(`[AIGenerator] Model ${modelName} returned status ${response.status}: ${errText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
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

        cachedWorkingModel = modelName;
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

// Fast health check test for Gemini API connectivity with detailed diagnostic feedback
let cachedGeminiStatus = null;
let lastCheckTime = 0;

export async function checkGeminiStatus(force = false) {
  const apiKey = getCleanApiKey();
  if (!apiKey) {
    return {
      configured: false,
      status: 'unconfigured',
      message: 'GEMINI_API_KEY environment variable is not set. Using curated offline word decks.'
    };
  }

  const now = Date.now();
  if (!force && cachedGeminiStatus && (now - lastCheckTime < 60000)) {
    return cachedGeminiStatus;
  }

  // 1. Diagnostic Step: Check if API key is accepted by Google
  let diagnosticMessage = '';
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      headers: getAuthHeaders(apiKey)
    });
    if (!listRes.ok) {
      const errBody = await listRes.text();
      let parsedErr = {};
      try { parsedErr = JSON.parse(errBody); } catch (_) {}
      const googleMessage = parsedErr?.error?.message || errBody.substring(0, 150);

      diagnosticMessage = `Google API returned status ${listRes.status}: ${googleMessage}`;
      console.warn(`[AI Engine Diagnostic] ${diagnosticMessage}`);

      cachedGeminiStatus = {
        configured: true,
        status: 'error',
        httpStatus: listRes.status,
        diagnostic: diagnosticMessage,
        message: `API Key verification failed: ${googleMessage}`
      };
      lastCheckTime = now;
      return cachedGeminiStatus;
    }
  } catch (netErr) {
    console.warn(`[AI Engine Diagnostic] Network error reaching Google API: ${netErr.message}`);
  }

  // 2. Test generation across candidate models
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      });

      if (response.ok) {
        cachedWorkingModel = modelName;
        cachedGeminiStatus = {
          configured: true,
          status: 'connected',
          workingModel: modelName,
          message: `Gemini API successfully connected & operational with model "${modelName}"!`
        };
        lastCheckTime = now;
        return cachedGeminiStatus;
      } else {
        const errText = await response.text();
        console.warn(`[AI Engine Test] Model ${modelName} test ping returned ${response.status}: ${errText.substring(0, 150)}`);
      }
    } catch (err) {
      // Try next candidate model
    }
  }

  cachedGeminiStatus = {
    configured: true,
    status: 'error',
    message: diagnosticMessage || 'GEMINI_API_KEY is set, but candidate models failed generation.'
  };
  lastCheckTime = now;
  return cachedGeminiStatus;
}

