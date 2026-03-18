/**
 * Extracts the first URL from a given text string.
 * Handles http://, https://, and bare domains like www.something.com
 * Strips trailing punctuation like ) . , from the URL end.
 */
export function extractUrl(text) {
  if (!text || typeof text !== 'string') return null;

  // Match URLs with protocol or bare www. domains
  const urlRegex =
    /(?:https?:\/\/|www\.)[^\s<>\"']+/gi;

  const match = text.match(urlRegex);
  if (!match) return null;

  // Strip trailing punctuation that is not part of the URL
  let url = match[0].replace(/[).,;:!?\]}>]+$/, '');

  // Ensure protocol prefix for bare www. domains
  if (url.startsWith('www.')) {
    url = 'https://' + url;
  }

  return url;
}
