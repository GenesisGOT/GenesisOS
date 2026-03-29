import type { JunctionTradition } from '../../hooks/useJunction';

// ═══ Faith Path Website Mapping ═══
export const FAITH_PATH_URLS: Record<string, { url: string; siteName: string; tagline: string }> = {
  buddhism: { url: 'https://dharmapath.com.au', siteName: 'DharmaPath', tagline: 'The Middle Way — mindfulness, meditation & liberation' },
  hinduism: { url: 'https://vedapath.com.au', siteName: 'VedaPath', tagline: 'Sanātana Dharma — eternal truth & cosmic order' },
  islam: { url: 'https://islamicpath.com.au', siteName: 'IslamicPath', tagline: 'Submission & peace — prayer, charity & devotion' },
  tewahedo: { url: 'https://tewahedo.com.au', siteName: 'Tewahedo', tagline: 'Ancient Christianity — fasting, prayer & mystical devotion' },
};

export function getFaithPathInfo(slug: string) {
  return FAITH_PATH_URLS[slug] || null;
}

// ═══ Tradition Categories ═══
export type TraditionCategory = 'All' | 'Abrahamic' | 'Eastern' | 'Indigenous' | 'Philosophical';

export const TRADITION_CATEGORIES: Record<string, TraditionCategory> = {
  tewahedo: 'Abrahamic',
  islam: 'Abrahamic',
  catholic: 'Abrahamic',
  judaism: 'Abrahamic',
  buddhism: 'Eastern',
  hinduism: 'Eastern',
  sikhism: 'Eastern',
  daoism: 'Eastern',
  dreaming: 'Indigenous',
  stoicism: 'Philosophical',
};

// ═══ Alpha/Omega Messages ═══
export const ALPHA_MESSAGES: Record<string, string> = {
  tewahedo: "Selam. You have chosen the ancient path of the Ethiopian Church. Walk in the footsteps of saints and kings. ☦️",
  islam: "As-salamu alaykum. You have entered the path of submission. Five pillars guide your way. ☪️",
  buddhism: "May you awaken. The Middle Way opens before you — free from extremes, rooted in compassion. ☸️",
  hinduism: "Om. You walk the eternal Dharma. The cosmic dance of Brahman awaits your devotion. 🕉️",
  sikhism: "Sat Sri Akal. Truth is eternal. Walk with courage, serve with love, remember the One. 🪯",
  judaism: "Shalom. You have entered the covenant. Study Torah, keep the commandments, sanctify time. ✡️",
  stoicism: "Welcome, philosopher. Master yourself, accept fate, live with virtue and reason. 🏛️",
  catholic: "Pax Christi. You walk the path of universal communion. The saints accompany you. ⛪",
  daoism: "The Way unfolds. Flow like water, act without force, embrace the mystery of nature. ☯️",
  dreaming: "You walk the ancient paths. Country calls you. The ancestors are near. 🌀",
  rhasta: "Welcome, seeker. I am Ras Tafari. Before you is a path — not of religion, but of rhythm. Time and spirit, together. 🦁",
};

export const OMEGA_MESSAGES: Record<string, string> = {
  tewahedo: "You have walked the ancient path with devotion. The saints witness your faithfulness. Go in peace, child of Zion. ☦️",
  islam: "Ma sha'Allah. You have fulfilled what was asked. Your discipline honours the Creator. Walk on with peace. ☪️",
  buddhism: "The path continues, but you have walked it well. Suffering dissolves where mindfulness endures. Go gently. ☸️",
  hinduism: "Your karma is purified. The cosmic dance turns, and you have moved in rhythm with Dharma. Om Shanti. 🕉️",
  sikhism: "Waheguru. You served with love and walked with courage. The One is pleased. Rise and serve again. 🪯",
  judaism: "You have sanctified your time and honoured the covenant. Shalom — peace be upon your days. ✡️",
  stoicism: "You endured. You reasoned. You mastered yourself. This is the only victory that matters. 🏛️",
  catholic: "Well done, faithful servant. The communion of saints rejoices with you. Go forth in grace. ⛪",
  daoism: "You flowed like water and found the Way without force. The mystery deepens. Walk on. ☯️",
  dreaming: "The ancestors smile. You walked the songlines. Country remembers. Return when called. 🌀",
  rhasta: "With faith, courage, and a just cause — David will still beat Goliath. You conquered. Rise, champion. 🦁",
};

// Tier label map
export const TIER_LABELS: Record<number, string> = {
  0: 'Seeker',
  1: 'Acolyte',
  2: 'Adept',
  3: 'Master',
  4: 'Exalted',
  5: 'Legend',
  6: 'Prophet',
  7: 'Divine',
};

// Tradition metadata for network display
export const TRADITION_META: Record<string, { icon: string; color: string }> = {
  buddhism: { icon: '☸️', color: '#FF8F00' },
  hinduism: { icon: '🕉️', color: '#E65100' },
  islam: { icon: '☪️', color: '#2E7D32' },
  tewahedo: { icon: '☦️', color: '#D4AF37' },
  sikhism: { icon: '🪯', color: '#1565C0' },
  judaism: { icon: '✡️', color: '#1A237E' },
  stoicism: { icon: '🏛️', color: '#455A64' },
  catholic: { icon: '⛪', color: '#6B21A8' },
  daoism: { icon: '☯️', color: '#059669' },
  dreaming: { icon: '🌀', color: '#B45309' },
};

// Fallback traditions if DB is empty
export const FALLBACK_TRADITIONS: JunctionTradition[] = [
  { id: 'tewahedo', name: 'Tewahedo', slug: 'tewahedo', icon: '☦️', description: 'Ethiopian Orthodox tradition of ancient Christianity, fasting discipline, and mystical devotion.', color: '#D4AF37', background_gradient: null, available: true, calendar_type: 'ethiopian', paths: [
    { id: 'monastic', name: 'Monastic', description: 'Path of ascetic discipline and deep prayer', icon: '🏔️' },
    { id: 'liturgical', name: 'Liturgical', description: 'Path of sacred worship and hymnal tradition', icon: '🕯️' },
    { id: 'scholarly', name: 'Scholarly', description: 'Path of theological study and scriptural wisdom', icon: '📜' },
  ]},
  { id: 'islam', name: 'Islam', slug: 'islam', icon: '☪️', description: 'The path of submission to the One God through prayer, fasting, and righteous action.', color: '#2E7D32', background_gradient: null, available: true, calendar_type: 'hijri', paths: [] },
  { id: 'buddhism', name: 'Buddhism', slug: 'buddhism', icon: '☸️', description: 'The Middle Way — mindfulness, compassion, and liberation from suffering.', color: '#FF8F00', background_gradient: null, available: true, calendar_type: 'gregorian', paths: [] },
  { id: 'hinduism', name: 'Hinduism', slug: 'hinduism', icon: '🕉️', description: 'Sanātana Dharma — cosmic order, devotion, knowledge, and righteous action.', color: '#E65100', background_gradient: null, available: true, calendar_type: 'gregorian', paths: [] },
  { id: 'sikhism', name: 'Sikhism', slug: 'sikhism', icon: '🪯', description: 'One God, honest living, service to humanity, and the warrior-saint ideal.', color: '#1565C0', background_gradient: null, available: true, calendar_type: 'nanakshahi', paths: [] },
  { id: 'judaism', name: 'Judaism', slug: 'judaism', icon: '✡️', description: 'Covenant, Torah study, prayer, and the sanctification of everyday life.', color: '#1A237E', background_gradient: null, available: true, calendar_type: 'hebrew', paths: [] },
  { id: 'stoicism', name: 'Stoicism', slug: 'stoicism', icon: '🏛️', description: 'Virtue, reason, self-mastery, and alignment with nature\'s order.', color: '#455A64', background_gradient: null, available: true, calendar_type: 'gregorian', paths: [] },
  { id: 'catholic', name: 'Catholic', slug: 'catholic', icon: '⛪', description: 'Universal Church — sacraments, saints, and sacred tradition.', color: '#6B21A8', background_gradient: null, available: true, calendar_type: 'gregorian', paths: [] },
  { id: 'daoism', name: 'Daoism', slug: 'daoism', icon: '☯️', description: 'The Way — harmony, simplicity, and the flow of nature.', color: '#059669', background_gradient: null, available: true, calendar_type: 'gregorian', paths: [] },
  { id: 'dreaming', name: 'Aboriginal Dreaming', slug: 'dreaming', icon: '🌀', description: 'The oldest living spiritual tradition — Country, kinship, and the eternal Dreaming.', color: '#B45309', background_gradient: null, available: true, calendar_type: 'gregorian', paths: [] },
];
