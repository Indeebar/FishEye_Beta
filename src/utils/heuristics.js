import {
  FAKE_BRAND_PATTERNS,
  URL_SHORTENERS,
  SUSPICIOUS_TLDS,
} from '../constants/brands';

// Official brand domains that should NOT be flagged
const OFFICIAL_DOMAINS = [
  'sbi.co.in',
  'onlinesbi.com',
  'hdfcbank.com',
  'axisbank.com',
  'icicibank.com',
  'flipkart.com',
  'amazon.in',
  'amazon.com',
  'paytm.com',
  'phonepe.com',
  'pay.google.com',
  'irctc.co.in',
  'jio.com',
  'airtel.in',
  'uidai.gov.in',
  'incometax.gov.in',
  'epfindia.gov.in',
  'npci.org.in',
];

/**
 * Runs offline heuristic checks on a URL.
 * Returns { verdict, reason, reasonHindi } or null if heuristics found nothing.
 */
export function runHeuristics(url) {
  let hostname;
  try {
    // Ensure URL has a protocol for parsing
    const parsed = url.startsWith('http') ? url : 'https://' + url;
    hostname = new URL(parsed).hostname.toLowerCase();
  } catch {
    hostname = url.toLowerCase();
  }

  const urlLower = url.toLowerCase();

  // 1. Fake Indian brand domain check
  const isOfficialDomain = OFFICIAL_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith('.' + d)
  );

  if (!isOfficialDomain) {
    const matchedBrand = FAKE_BRAND_PATTERNS.find(
      (keyword) => urlLower.includes(keyword)
    );
    if (matchedBrand) {
      return {
        verdict: 'DANGEROUS',
        reason: 'Fake Indian brand domain detected',
        reasonHindi: 'नकली भारतीय ब्रांड वेबसाइट',
      };
    }
  }

  // 2. URL shortener check
  const isShortener = URL_SHORTENERS.some(
    (d) => hostname === d || hostname.endsWith('.' + d)
  );
  if (isShortener) {
    return {
      verdict: 'SUSPICIOUS',
      reason: 'URL shortener — destination unknown',
      reasonHindi: 'URL छोटा किया गया है — असली गंतव्य अज्ञात',
    };
  }

  // 3. Raw IP address check
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(hostname)) {
    return {
      verdict: 'DANGEROUS',
      reason: 'Raw IP address — likely phishing',
      reasonHindi: 'IP पता — संभावित फिशिंग',
    };
  }

  // 4. Suspicious TLD check
  const hasSuspiciousTld = SUSPICIOUS_TLDS.some((tld) =>
    hostname.endsWith(tld)
  );
  if (hasSuspiciousTld) {
    return {
      verdict: 'SUSPICIOUS',
      reason: 'Suspicious domain extension',
      reasonHindi: 'संदिग्ध डोमेन एक्सटेंशन',
    };
  }

  // 5. Nothing found
  return null;
}
