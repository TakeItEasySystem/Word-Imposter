import { historyManager } from './historyManager.js';
import { getRandomWordSet } from './wordBank.js';

function getCleanApiKey() {
  const explicitCandidates = [
    'GEMINI_API_KEY',
    'Gemini_API_Key',
    'gemini_api_key',
    'GOOGLE_API_KEY',
    'GEMINI_KEY',
    'GOOGLE_GEMINI_API_KEY',
    'VITE_GEMINI_API_KEY',
    'GEMINI',
    'API_KEY'
  ];

  for (const name of explicitCandidates) {
    const val = process.env[name];
    if (val && typeof val === 'string' && val.trim()) {
      return val.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\t]/g, '');
    }
  }

  // Scan case-insensitively for any env var containing gemini or google_api
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') {
      const clean = v.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\t]/g, '');
      if (clean && (k.toLowerCase().includes('gemini') || k.toLowerCase().includes('google_api'))) {
        console.log(`[AIGenerator] Found Gemini key under env var "${k}"`);
        return clean;
      }
    }
  }

  // Auto-scan for key prefix formats (AIzaSy... or AQ....)
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') {
      const clean = v.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\t]/g, '');
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

let cachedAuthConfig = null; // { apiVersion, strategy, modelName, allModels }

async function getWorkingAuthConfig(apiKey, force = false) {
  if (!force && cachedAuthConfig) {
    return cachedAuthConfig;
  }

  const versions = ['v1beta', 'v1'];
  const testPing = {
    contents: [{
      role: 'user',
      parts: [{ text: "ping" }]
    }],
    generationConfig: { maxOutputTokens: 5 }
  };

  // 1. Dynamic Discovery: Query Google's Model Registry first to inspect authorized models for this key
  for (const v of versions) {
    const endpoints = [
      { name: 'Header', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, url: `https://generativelanguage.googleapis.com/${v}/models` },
      { name: 'Query', headers: { 'Content-Type': 'application/json' }, url: `https://generativelanguage.googleapis.com/${v}/models?key=${encodeURIComponent(apiKey)}` },
      { name: 'Bearer', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, url: `https://generativelanguage.googleapis.com/${v}/models` }
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, { headers: ep.headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.models)) {
            const rawModels = data.models
              .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
              .map(m => m.name.replace(/^models\//, ''));

            // Filter out non-text models (tts, image, audio, embedding) and deprecated 2.5-flash models
            const textUsable = rawModels.filter(m => {
              const lower = m.toLowerCase();
              if (lower.includes('-tts') || lower.includes('-image') || lower.includes('-audio') || lower.includes('embed')) return false;
              if (lower.includes('2.5-flash')) return false; // Deprecated by Google for new users
              return true;
            });

            console.log(`[AIGenerator] 📋 Usable text models for ${v} (${ep.name}):`, textUsable);

            if (textUsable.length > 0) {
              const getModelScore = (name) => {
                const lower = name.toLowerCase();
                // Flagship reliable production text models first
                if (lower === 'gemini-2.0-flash') return 100;
                if (lower === 'gemini-1.5-flash') return 95;
                if (lower === 'gemini-1.5-flash-latest') return 94;
                if (lower === 'gemini-flash-latest') return 92;
                if (lower === 'gemini-2.0-flash-lite' || lower === 'gemini-2.0-flash-lite-preview') return 88;
                if (lower === 'gemini-1.5-flash-8b') return 82;
                if (lower === 'gemini-flash-lite-latest') return 80;
                if (lower === 'gemini-2.0-pro' || lower.includes('2.0-pro')) return 75;
                if (lower === 'gemini-1.5-pro' || lower.includes('1.5-pro')) return 70;
                if (lower.includes('flash')) return 60;
                if (lower.includes('pro')) return 50;
                return 10;
              };

              // Sort by proven text generation performance & reliability
              const sorted = [...textUsable].sort((a, b) => getModelScore(b) - getModelScore(a));

              // Test-ping models until we find one that successfully responds with HTTP 200
              for (const candidate of sorted) {
                const pingUrl = ep.name === 'Query'
                  ? `https://generativelanguage.googleapis.com/${v}/models/${candidate}:generateContent?key=${encodeURIComponent(apiKey)}`
                  : `https://generativelanguage.googleapis.com/${v}/models/${candidate}:generateContent`;

                try {
                  const pingRes = await fetch(pingUrl, {
                    method: 'POST',
                    headers: ep.headers,
                    body: JSON.stringify(testPing),
                    signal: AbortSignal.timeout(12000)
                  });

                  if (pingRes.ok) {
                    cachedAuthConfig = {
                      apiVersion: v,
                      strategy: ep.name,
                      modelName: candidate,
                      allModels: textUsable
                    };
                    console.log(`[AIGenerator] 🎯 Verified & locked working model "${candidate}" via ${v} (${ep.name})`);
                    return cachedAuthConfig;
                  } else {
                    const pingErr = await pingRes.text().catch(() => '');
                    if (pingRes.status === 429) {
                      console.log(`[AIGenerator] ℹ️ Model "${candidate}" quota reached (429). Auto-checking next model in registry...`);
                    } else {
                      console.log(`[AIGenerator] ℹ️ Model "${candidate}" ping returned ${pingRes.status}: ${pingErr.slice(0, 100)}`);
                    }
                  }
                } catch (pingEx) {
                  console.log(`[AIGenerator] ℹ️ Model "${candidate}" ping network note: ${pingEx.message}`);
                }
              }
            }
          }
        } else {
          const regErr = await res.text().catch(() => '');
          console.warn(`[AIGenerator] ⚠️ Registry query via ${v} (${ep.name}) failed (${res.status}): ${regErr.slice(0, 120)}`);
        }
      } catch (err) {
        // Continue to next endpoint
      }
    }
  }

  // 2. Direct Fallback: Probe candidate models directly with testPing if registry was blocked
  const fallbackCandidates = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-pro'
  ];

  for (const v of versions) {
    for (const m of fallbackCandidates) {
      const directEndpoints = [
        { name: 'Header', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, url: `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent` },
        { name: 'Query', headers: { 'Content-Type': 'application/json' }, url: `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}` }
      ];

      for (const ep of directEndpoints) {
        try {
          const res = await fetch(ep.url, {
            method: 'POST',
            headers: ep.headers,
            body: JSON.stringify(testPing)
          });

          if (res.ok) {
            cachedAuthConfig = {
              apiVersion: v,
              strategy: ep.name,
              modelName: m,
              allModels: [m]
            };
            console.log(`[AIGenerator] 🎯 Direct lock succeeded with model "${m}" via ${v} (${ep.name})`);
            return cachedAuthConfig;
          } else {
            const errBody = await res.text().catch(() => '');
            console.log(`[AIGenerator] ℹ️ Direct candidate "${m}" via ${v} (${ep.name}) failed (${res.status}): ${errBody.slice(0, 100)}`);
          }
        } catch (e) {}
      }
    }
  }

  return null;
}

// --- FINANCIAL BILLING PROTECTION & QUOTA HARD CAPS ---
const MAX_CALLS_PER_MINUTE = 15;
const MAX_CALLS_PER_HOUR = 100;
const MAX_CALLS_PER_DAY = 1000;

const apiCallTimestamps = [];
let circuitBreakerTrippedUntil = 0;

function checkBillingQuotaAllowed() {
  const now = Date.now();

  // 1. Check Circuit Breaker
  if (now < circuitBreakerTrippedUntil) {
    const remainingSec = Math.ceil((circuitBreakerTrippedUntil - now) / 1000);
    console.warn(`[BillingGuard] ⏸️ Circuit breaker active (${remainingSec}s remaining). Using matching word bank.`);
    return false;
  }

  // Prune timestamps older than 24 hours
  while (apiCallTimestamps.length > 0 && now - apiCallTimestamps[0] > 24 * 60 * 60 * 1000) {
    apiCallTimestamps.shift();
  }

  // Check 1-minute window
  const minuteCount = apiCallTimestamps.filter(t => now - t < 60 * 1000).length;
  if (minuteCount >= MAX_CALLS_PER_MINUTE) {
    console.warn(`[BillingGuard] 🛑 Minute quota reached (${minuteCount}/${MAX_CALLS_PER_MINUTE}). Falling back to matching word bank.`);
    return false;
  }

  // Check 1-hour window
  const hourCount = apiCallTimestamps.filter(t => now - t < 60 * 60 * 1000).length;
  if (hourCount >= MAX_CALLS_PER_HOUR) {
    console.warn(`[BillingGuard] 🛑 Hourly quota reached (${hourCount}/${MAX_CALLS_PER_HOUR}). Falling back to matching word bank.`);
    return false;
  }

  // Check 24-hour day window
  if (apiCallTimestamps.length >= MAX_CALLS_PER_DAY) {
    console.warn(`[BillingGuard] 🛑 Daily quota reached (${apiCallTimestamps.length}/${MAX_CALLS_PER_DAY}). Falling back to matching word bank.`);
    return false;
  }

  return true;
}

function recordApiCall() {
  apiCallTimestamps.push(Date.now());
}

function tripCircuitBreaker(durationSeconds = 30) {
  circuitBreakerTrippedUntil = Date.now() + durationSeconds * 1000;
  console.warn(`[BillingGuard] ⚡ Circuit breaker TRIPPED for ${durationSeconds}s due to API rate-limit (429). Offline decks active temporarily.`);
}

function extractAndParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        try {
          const fixed = match[0].replace(/,\s*([\]}])/g, '$1');
          return JSON.parse(fixed);
        } catch (e3) {
          return null;
        }
      }
    }
    return null;
  }
}

export async function generateWordTriplet(theme = 'Random Mix') {
  const cleanTheme = (theme || 'Random Mix').trim();

  // 1. Enforce Billing Quota Hard-Caps
  if (!checkBillingQuotaAllowed()) {
    const fallbackSet = getRandomWordSet(cleanTheme);
    historyManager.recordUsedWords(fallbackSet.words);
    return fallbackSet;
  }

  const apiKey = getCleanApiKey();
  if (!apiKey) {
    console.log(`[AIGenerator] No GEMINI_API_KEY set. Using matching word bank for theme: "${cleanTheme}".`);
    const fallbackSet = getRandomWordSet(cleanTheme);
    historyManager.recordUsedWords(fallbackSet.words);
    return fallbackSet;
  }

  const authConfig = await getWorkingAuthConfig(apiKey);
  if (!authConfig) {
    console.warn(`[AIGenerator] Could not connect to Gemini API. Falling back safely to matching word bank.`);
    const fallbackSet = getRandomWordSet(cleanTheme);
    historyManager.recordUsedWords(fallbackSet.words);
    return fallbackSet;
  }

  // 2. Prepare Clean Prompt & Exclusions
  const cleanThemeSanitized = cleanTheme
    .replace(/[^\w\s\-&',.!?]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);

  const themeDirective = (cleanThemeSanitized && cleanThemeSanitized !== 'Random Mix' && cleanThemeSanitized !== 'Random Surprise')
    ? `The round theme requested by players is: "${cleanThemeSanitized}". The 3 words MUST closely fit this theme.`
    : `Choose an engaging, universally recognized party deduction theme (e.g. Movies, Fast Food, Superheroes, Video Games, Animals).`;

  const recentWords = historyManager.getRecentWords(15);
  const excludeClause = recentWords.length > 0 
    ? `Do not repeat these recently played words: ${recentWords.join(', ')}.`
    : '';

  const prompt = `You are the game engine for a real-time multiplayer party deduction game called "Word Imposter".
Generate 3 closely related words and 2 distinguishing deduction questions.
${themeDirective}
${excludeClause}

Requirements:
1. The 3 words must be closely related, in the same category, and similar in nature so players have to give subtle clues.
2. The 2 questions must be clever questions that apply to all 3 words in subtly different ways.

Respond with ONLY valid JSON:
{
  "category": "${cleanThemeSanitized || 'Party Deduction'}",
  "words": ["Word 1", "Word 2", "Word 3"],
  "questions": [
    "Clever Question 1 tailored to distinguish these 3 words?",
    "Clever Question 2 tailored to distinguish these 3 words?"
  ]
}`;

  // Try the primary model first, with fallback to other available text models
  const candidateModels = [
    authConfig.modelName,
    ...(authConfig.allModels || []).filter(m => m !== authConfig.modelName)
  ].slice(0, 3);

  for (const modelToUse of candidateModels) {
    const url = authConfig.strategy === 'Query'
      ? `https://generativelanguage.googleapis.com/${authConfig.apiVersion}/models/${modelToUse}:generateContent?key=${encodeURIComponent(apiKey)}`
      : `https://generativelanguage.googleapis.com/${authConfig.apiVersion}/models/${modelToUse}:generateContent`;

    const headers = { 'Content-Type': 'application/json' };
    if (authConfig.strategy === 'Bearer') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (authConfig.strategy === 'Header') {
      headers['x-goog-api-key'] = apiKey;
    }

    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 300,
        responseMimeType: 'application/json'
      }
    };

    try {
      recordApiCall();

      let response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000)
      });

      // If model returned 400 complaining about responseMimeType, retry once without it
      if (!response.ok && response.status === 400) {
        const errText = await response.text();
        if (errText.includes('responseMimeType') || errText.includes('generationConfig')) {
          delete payload.generationConfig.responseMimeType;
          response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20000)
          });
        }
      }

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = extractAndParseJson(rawText);

        if (
          parsed &&
          Array.isArray(parsed.words) &&
          parsed.words.length === 3 &&
          Array.isArray(parsed.questions) &&
          parsed.questions.length >= 2
        ) {
          const generated = {
            category: parsed.category || cleanThemeSanitized || 'Investigation',
            words: parsed.words.map(w => String(w).trim()),
            questions: parsed.questions.slice(0, 2).map(q => String(q).trim())
          };

          historyManager.recordUsedWords(generated.words);
          authConfig.modelName = modelToUse; // lock the verified model
          cachedAuthConfig = authConfig;

          console.log(`[AIGenerator] ✨ Model (${modelToUse}) generated triplet for "${cleanThemeSanitized}":`, generated.words);
          return generated;
        } else {
          console.warn(`[AIGenerator] Model (${modelToUse}) response could not be parsed as valid triplet: "${rawText.slice(0, 100)}"`);
        }
      } else {
        const errText = await response.text().catch(() => '');
        console.warn(`[AIGenerator] Model (${modelToUse}) HTTP ${response.status}: ${errText.slice(0, 150)}`);
        if (response.status === 429) {
          console.warn(`[AIGenerator] ℹ️ Model (${modelToUse}) hit rate/quota limit. Trying next candidate model in queue...`);
          continue; // Seamlessly failover to the next candidate model
        }
      }
    } catch (err) {
      console.warn(`[AIGenerator] Model (${modelToUse}) request error: ${err.message}`);
    }
  }

  // If all candidate models were exhausted or failed, trip a short circuit breaker
  tripCircuitBreaker(30);

  // Invalidate cached config so next attempt re-probes
  cachedAuthConfig = null;
  console.warn(`[AIGenerator] All AI models failed for "${cleanThemeSanitized}". Falling back to matching word bank.`);
  const fallbackSet = getRandomWordSet(cleanThemeSanitized);
  historyManager.recordUsedWords(fallbackSet.words);
  return fallbackSet;
}

// Cached status of Gemini API connectivity to eliminate continuous live external pings
let lastKnownGeminiStatus = null;
let lastStatusCheckTime = 0;

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
  // Return cached status if verified recently (within 10 minutes) unless explicit force with cooldown
  if (!force && lastKnownGeminiStatus && (now - lastStatusCheckTime < 10 * 60 * 1000)) {
    return lastKnownGeminiStatus;
  }

  // Prevent spamming live health pings (minimum 2 minutes cooldown between live pings)
  if (force && (now - lastStatusCheckTime < 2 * 60 * 1000) && lastKnownGeminiStatus) {
    return lastKnownGeminiStatus;
  }

  const authConfig = await getWorkingAuthConfig(apiKey, force);
  lastStatusCheckTime = now;

  if (authConfig) {
    lastKnownGeminiStatus = {
      configured: true,
      status: 'connected',
      workingModel: authConfig.modelName,
      apiVersion: authConfig.apiVersion,
      authStrategy: authConfig.strategy,
      availableModelsCount: authConfig.allModels?.length || 1,
      billingProtection: {
        maxCallsPerHour: MAX_CALLS_PER_HOUR,
        maxCallsPerDay: MAX_CALLS_PER_DAY,
        callsRecordedToday: apiCallTimestamps.length,
        circuitBreakerActive: now < circuitBreakerTrippedUntil
      },
      message: `Gemini API successfully connected & operational with model "${authConfig.modelName}"!`
    };
    return lastKnownGeminiStatus;
  }

  lastKnownGeminiStatus = {
    configured: true,
    status: 'error',
    message: 'GEMINI_API_KEY was found, but Google returned an authentication or model error. Curated 70+ decks active.'
  };
  return lastKnownGeminiStatus;
}


