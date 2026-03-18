import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'scan_history';
const MAX_ENTRIES = 100;

/**
 * Saves a scan entry to history. Keeps only the last 100 entries.
 */
export async function saveToHistory(url, verdict, reason, reasonHindi) {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];

    const entry = {
      url,
      verdict,
      reason,
      reasonHindi,
      timestamp: Date.now(),
    };

    // Add newest entry at the beginning
    history.unshift(entry);

    // Keep only the last 100
    if (history.length > MAX_ENTRIES) {
      history.length = MAX_ENTRIES;
    }

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage write failed silently
  }
}

/**
 * Returns the array of last 100 scans, newest first.
 */
export async function getHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears all scan history.
 */
export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    // Clear failed silently
  }
}
