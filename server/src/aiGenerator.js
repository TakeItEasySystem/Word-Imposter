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

async function executeGeminiRequest(modelName, bodyPayload, apiKey) {
  // Strategy A: Header x-goog-api-key (Standard REST without query param)
  // Strategy B: Header Authorization: Bearer (Required for AQ. tokens / OAuth keys)
  // Strategy C: URL query param ?key= (Legacy AIzaSy keys)
  const strategies = [
    {
      name: 'Bearer Token',
      url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    },
    {
      name: 'x-goog-api-key header',
      url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      }
    },
    {
      name: 'URL key param',
      url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ];

  let lastError = null;

  for (const strategy of strategies) {
    try {
      const response = await fetch(strategy.url, {
        method: 'POST',
        headers: strategy.headers,
        body: JSON.stringify(bodyPayload)
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data, strategy: strategy.name };
      }

      const errText = await response.text();
      lastError = `[${strategy.name}] Status ${response.status}: ${errText.substring(0, 160)}`;
    } catch (err) {
      lastError = `[${strategy.name}] Network error: ${err.message}`;
    }
  }

  return { success: false, error: lastError };
}

export async function generateWordTriplet(theme = 'Random Mix') {
  const apiKey = getCleanApiKey();

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

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.85, topP: 0.95 }
  };

  const modelsToTry = cachedWorkingModel 
    ? [cachedWorkingModel, ...CANDIDATE_MODELS.filter(m => m !== cachedWorkingModel)]
    : CANDIDATE_MODELS;

  for (const modelName of modelsToTry) {
    const result = await executeGeminiRequest(modelName, payload, apiKey);
    if (result.success) {
      try {
        const rawText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        if (
          parsed &&
          Array.isArray(parsed.words) &&
          parsed.words.length === 3 &&
          Array.isArray(parsed.questions) &&
          parsed.questions.length >= 2
        ) {
          const generated = {
            category: parsed.category || theme || 'Mystery Theme',
            words: parsed.words.map(w => String(w).trim()),
            questions: parsed.questions.slice(0, 2).map(q => String(q).trim())
          };

          cachedWorkingModel = modelName;
          historyManager.recordUsedWords(generated.words);
          console.log(`[AIGenerator] ✨ Model (${modelName} via ${result.strategy}) generated triplet for "${theme}":`, generated.words);
          return generated;
        }
      } catch (parseErr) {
        console.warn(`[AIGenerator] JSON parse failed on ${modelName}: ${parseErr.message}`);
      }
    } else {
      console.warn(`[AIGenerator] ${modelName} failed: ${result.error}`);
    }
  }

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

  const pingPayload = {
    contents: [{ parts: [{ text: "Hello" }] }],
    generationConfig: { maxOutputTokens: 5 }
  };

  let lastDiag = '';

  for (const modelName of CANDIDATE_MODELS) {
    const result = await executeGeminiRequest(modelName, pingPayload, apiKey);
    if (result.success) {
      cachedWorkingModel = modelName;
      cachedGeminiStatus = {
        configured: true,
        status: 'connected',
        workingModel: modelName,
        authStrategy: result.strategy,
        message: `Gemini API successfully connected & operational with model "${modelName}" (via ${result.strategy})!`
      };
      lastCheckTime = now;
      return cachedGeminiStatus;
    } else {
      lastDiag = result.error;
    }
  }

  cachedGeminiStatus = {
    configured: true,
    status: 'error',
    message: lastDiag || 'GEMINI_API_KEY is set, but all candidate models failed generation.'
  };
  lastCheckTime = now;
  return cachedGeminiStatus;
}

