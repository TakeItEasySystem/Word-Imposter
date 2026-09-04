import { historyManager } from './historyManager.js';
import { getRandomWordSet } from './wordBank.js';

function getCleanApiKey() {
  const candidateNames = [
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'GEMINI_KEY',
    'GOOGLE_GEMINI_API_KEY',
    'VITE_GEMINI_API_KEY',
    'GEMINI',
    'API_KEY'
  ];

  for (const name of candidateNames) {
    const val = process.env[name];
    if (val && typeof val === 'string' && val.trim()) {
      return val.trim().replace(/^["']|["']$/g, '');
    }
  }

  // Auto-scan all env variables in case of custom/different naming in Render
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') {
      const clean = v.trim().replace(/^["']|["']$/g, '');
      if (clean.startsWith('AQ.') || clean.startsWith('AIzaSy')) {
        console.log(`[AIGenerator] Found Gemini key under env var "${k}"`);
        return clean;
      }
    }
  }

  return '';
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

let cachedAuthConfig = null; // { apiVersion, strategy, modelName }

async function getWorkingAuthConfig(apiKey, force = false) {
  if (!force && cachedAuthConfig) {
    return cachedAuthConfig;
  }

  const versions = ['v1beta', 'v1'];
  const testPing = {
    contents: [{ parts: [{ text: "ping" }] }],
    generationConfig: { maxOutputTokens: 5 }
  };

  // 1. Try dynamic discovery from Google's model registry
  for (const v of versions) {
    const endpoints = [
      { name: 'Bearer', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, url: `https://generativelanguage.googleapis.com/${v}/models` },
      { name: 'Header', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, url: `https://generativelanguage.googleapis.com/${v}/models` },
      { name: 'Query', headers: { 'Content-Type': 'application/json' }, url: `https://generativelanguage.googleapis.com/${v}/models?key=${encodeURIComponent(apiKey)}` }
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, { headers: ep.headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.models)) {
            const usable = data.models
              .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
              .map(m => m.name.replace(/^models\//, ''));

            if (usable.length > 0) {
              // Priority: 1.5-flash, 2.0-flash, 1.5-pro, first available
              const pickedModel = usable.find(m => m.includes('1.5-flash')) ||
                                 usable.find(m => m.includes('2.0-flash')) ||
                                 usable.find(m => m.includes('flash')) ||
                                 usable[0];

              cachedAuthConfig = {
                apiVersion: v,
                strategy: ep.name,
                modelName: pickedModel,
                allModels: usable
              };
              console.log(`[AIGenerator] 🎯 Discovered & locked working model "${pickedModel}" via ${v} (${ep.name})`);
              return cachedAuthConfig;
            }
          }
        }
      } catch (err) {
        // Continue trying next endpoint
      }
    }
  }

  // 2. Fallback: try direct candidate model matrix
  const candidateModels = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
  for (const v of versions) {
    for (const m of candidateModels) {
      const candidates = [
        { name: 'Bearer', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, url: `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent` },
        { name: 'Header', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, url: `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent` },
        { name: 'Query', headers: { 'Content-Type': 'application/json' }, url: `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}` }
      ];

      for (const cand of candidates) {
        try {
          const res = await fetch(cand.url, {
            method: 'POST',
            headers: cand.headers,
            body: JSON.stringify(testPing)
          });

          if (res.ok) {
            cachedAuthConfig = {
              apiVersion: v,
              strategy: cand.name,
              modelName: m,
              allModels: [m]
            };
            console.log(`[AIGenerator] 🎯 Direct lock succeeded with model "${m}" via ${v} (${cand.name})`);
            return cachedAuthConfig;
          }
        } catch (err) {}
      }
    }
  }

  return null;
}

export async function generateWordTriplet(theme = 'Random Mix') {
  const apiKey = getCleanApiKey();

  if (!apiKey) {
    console.log(`[AIGenerator] No GEMINI_API_KEY set. Using curated word bank for theme: "${theme}".`);
    const fallbackSet = getRandomWordSet(theme);
    historyManager.recordUsedWords(fallbackSet.words);
    return fallbackSet;
  }

  const authConfig = await getWorkingAuthConfig(apiKey);
  if (!authConfig) {
    console.warn(`[AIGenerator] Could not connect to Gemini API. Falling back safely to curated wordbank.`);
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

  const url = authConfig.strategy === 'Query'
    ? `https://generativelanguage.googleapis.com/${authConfig.apiVersion}/models/${authConfig.modelName}:generateContent?key=${encodeURIComponent(apiKey)}`
    : `https://generativelanguage.googleapis.com/${authConfig.apiVersion}/models/${authConfig.modelName}:generateContent`;

  const headers = { 'Content-Type': 'application/json' };
  if (authConfig.strategy === 'Bearer') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (authConfig.strategy === 'Header') {
    headers['x-goog-api-key'] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
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
        const generated = {
          category: parsed.category || theme || 'Mystery Theme',
          words: parsed.words.map(w => String(w).trim()),
          questions: parsed.questions.slice(0, 2).map(q => String(q).trim())
        };

        historyManager.recordUsedWords(generated.words);
        console.log(`[AIGenerator] ✨ Model (${authConfig.modelName}) generated triplet for "${theme}":`, generated.words);
        return generated;
      }
    } else {
      const errText = await response.text();
      console.warn(`[AIGenerator] Generation failed (${response.status}): ${errText.substring(0, 150)}`);
    }
  } catch (err) {
    console.warn(`[AIGenerator] Generation request error: ${err.message}`);
  }

  console.warn(`[AIGenerator] Falling back to curated bank for "${theme}".`);
  const fallbackSet = getRandomWordSet(theme);
  historyManager.recordUsedWords(fallbackSet.words);
  return fallbackSet;
}

// Fast health check test for Gemini API connectivity with detailed diagnostic feedback
export async function checkGeminiStatus(force = false) {
  const apiKey = getCleanApiKey();
  if (!apiKey) {
    return {
      configured: false,
      status: 'unconfigured',
      message: 'GEMINI_API_KEY environment variable is not set. Using curated offline word decks.'
    };
  }

  const authConfig = await getWorkingAuthConfig(apiKey, force);
  if (authConfig) {
    return {
      configured: true,
      status: 'connected',
      workingModel: authConfig.modelName,
      apiVersion: authConfig.apiVersion,
      authStrategy: authConfig.strategy,
      availableModelsCount: authConfig.allModels?.length || 1,
      message: `Gemini API successfully connected & operational with model "${authConfig.modelName}"!`
    };
  }

  return {
    configured: true,
    status: 'error',
    message: 'GEMINI_API_KEY was found, but Google returned an authentication or model error. Curated 70+ decks active.'
  };
}


