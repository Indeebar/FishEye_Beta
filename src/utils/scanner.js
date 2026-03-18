import { runHeuristics } from './heuristics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

/**
 * Scans a URL through cache → heuristics → Google Safe Browsing.
 * Returns { verdict, reason, reasonHindi, source }
 */
export async function scanUrl(url) {
  // 1. Check cache
  try {
    const cached = await AsyncStorage.getItem(`cache:${url}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        return {
          verdict: parsed.verdict,
          reason: parsed.reason,
          reasonHindi: parsed.reasonHindi,
          source: 'cache',
        };
      }
    }
  } catch {
    // Cache read failed, continue
  }

  // 2. Run local heuristics
  const heuristicResult = runHeuristics(url);
  if (heuristicResult && heuristicResult.verdict) {
    const result = {
      verdict: heuristicResult.verdict,
      reason: heuristicResult.reason,
      reasonHindi: heuristicResult.reasonHindi,
      source: 'heuristics',
    };
    await saveToCache(url, result);
    return result;
  }

  // 3. Call Google Safe Browsing API
  try {
    const apiKey = process.env.EXPO_PUBLIC_SAFE_BROWSING_KEY;
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

    const body = {
      client: {
        clientId: 'fisheye-app',
        clientVersion: '1.0.0',
      },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION',
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    let result;
    if (data.matches && data.matches.length > 0) {
      // 4. Safe Browsing found threats
      result = {
        verdict: 'DANGEROUS',
        reason: 'Known malware or phishing site (Google Safe Browsing)',
        reasonHindi: 'Google के अनुसार यह खतरनाक वेबसाइट है',
        source: 'safebrowsing',
      };
    } else {
      // 5. Safe Browsing found no threats
      result = {
        verdict: 'SAFE',
        reason: 'No threats detected',
        reasonHindi: 'कोई खतरा नहीं मिला',
        source: 'safebrowsing',
      };
    }

    // 6. Save to cache
    await saveToCache(url, result);
    return result;
  } catch {
    // 7. Network or API error
    return {
      verdict: 'SUSPICIOUS',
      reason: 'Could not verify — treat with caution',
      reasonHindi: 'जांच नहीं हो सकी — सावधान रहें',
      source: 'safebrowsing',
    };
  }
}

async function saveToCache(url, result) {
  try {
    const entry = {
      verdict: result.verdict,
      reason: result.reason,
      reasonHindi: result.reasonHindi,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`cache:${url}`, JSON.stringify(entry));
  } catch {
    // Cache write failed silently
  }
}
