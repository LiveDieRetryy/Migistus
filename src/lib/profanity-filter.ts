/**
 * Profanity Filter
 * Checks for inappropriate words in usernames and content
 */

// List of prohibited words - add more as needed
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'bastard', 'crap',
  'pussy', 'dick', 'cock', 'penis', 'vagina', 'cunt', 'whore', 'slut',
  'fag', 'faggot', 'nigger', 'nigga', 'chink', 'spic', 'kike', 'retard',
  'nazi', 'hitler', 'rape', 'molest', 'pedo', 'pedophile', 'sex', 'porn',
  'xxx', 'anal', 'dildo', 'viagra', 'cialis', 'horny', 'naked', 'nude',
  // Leetspeak and common variations
  'fuk', 'fck', 'sh1t', 'b1tch', 'a55', 'azz', 'phuck', 'phuq',
  'shyt', 'shiz', 'biatch', 'd1ck', 'dik', 'c0ck', 'p0rn', 'pr0n',
  // Additional terms
  'kill', 'murder', 'suicide', 'die', 'death', 'terrorist', 'bomb',
  'weapon', 'drug', 'meth', 'cocaine', 'heroin', 'weed', 'marijuana'
];

// Words that are allowed even if they contain profanity substrings
const WHITELIST = [
  'classic', 'assassin', 'mass', 'brass', 'glass', 'class',
  'bass', 'grass', 'pass', 'assess', 'asset', 'assumption',
  'basement', 'embassador', 'cassette', 'compass', 'harass'
];

/**
 * Check if a string contains profanity
 * @param text - The text to check
 * @returns true if profanity is found, false otherwise
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase().trim();
  
  // Check whitelist first
  if (WHITELIST.some(word => normalizedText === word.toLowerCase())) {
    return false;
  }
  
  // Check for exact matches and substring matches
  for (const word of PROFANITY_LIST) {
    // Exact match (word boundaries)
    const exactMatch = new RegExp(`\\b${word}\\b`, 'i');
    if (exactMatch.test(normalizedText)) {
      return true;
    }
    
    // Substring match (catches variations)
    if (normalizedText.includes(word)) {
      return true;
    }
    
    // Check for leetspeak variations (a=@, e=3, i=1, o=0, s=$)
    const leetspeakWord = word
      .replace(/a/g, '[@a4]')
      .replace(/e/g, '[e3]')
      .replace(/i/g, '[i1!]')
      .replace(/o/g, '[o0]')
      .replace(/s/g, '[s$5]');
    
    const leetspeakRegex = new RegExp(leetspeakWord, 'i');
    if (leetspeakRegex.test(normalizedText)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a username is appropriate
 * @param username - The username to validate
 * @returns An object with isValid and optional error message
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' };
  }
  
  // Check for valid characters (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  // Check for profanity
  if (containsProfanity(username)) {
    return { isValid: false, error: 'Username contains inappropriate language' };
  }
  
  return { isValid: true };
}

/**
 * Filter profanity from text by replacing with asterisks
 * @param text - The text to filter
 * @returns The filtered text
 */
export function filterProfanity(text: string): string {
  if (!text) return text;
  
  let filteredText = text;
  
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  }
  
  return filteredText;
}
