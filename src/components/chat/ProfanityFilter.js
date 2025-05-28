// Reusable profanity filtering logic
export const profanityList = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'bastard', 'piss',
  'scam', 'fake', 'spam', 'bot', 'phishing', 'virus', 'malware',
  'better deal', 'cheaper elsewhere', 'dont buy', "don't buy", 'overpriced', 'ripoff', 'rip off'
];

export const containsProfanity = (text) => {
  const lowerText = text.toLowerCase();
  return profanityList.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
};

export const filterProfanity = (text) => {
  let filteredText = text;
  profanityList.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  return filteredText;
};