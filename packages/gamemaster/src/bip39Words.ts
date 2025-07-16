// Curated BIP39 words for game room names
// Selected for being memorable, appropriate, and easy to distinguish

export const adjectives = [
  'brave', 'bright', 'clever', 'electric', 'fancy', 'gentle', 'happy', 'jolly',
  'lucky', 'mighty', 'noble', 'proud', 'quick', 'royal', 'silver', 'smooth',
  'swift', 'wise', 'cosmic', 'crystal', 'golden', 'magic', 'mystic', 'shiny',
  'stellar', 'super', 'ultra', 'vivid', 'wild', 'bold', 'calm', 'cool'
];

export const nouns = [
  'eagle', 'falcon', 'tiger', 'dragon', 'phoenix', 'wolf', 'bear', 'lion',
  'hawk', 'fox', 'deer', 'horse', 'zebra', 'monkey', 'panda', 'koala',
  'dolphin', 'whale', 'shark', 'raven', 'star', 'moon', 'comet', 'galaxy',
  'nebula', 'planet', 'rocket', 'wizard', 'knight', 'ninja', 'samurai', 'viking'
];

export function generateGameName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

export function generateGameId(): string {
  // Generate a 6-character ID (letters and numbers)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}