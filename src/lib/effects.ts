import { AvatarEffectType } from '@/components/effects/AvatarEffects';
import { ProfileEffectType } from '@/components/effects/ProfileEffects';

export interface AvatarEffect {
  id: AvatarEffectType;
  name: string;
  description: string;
  tier: 'free' | 'initiate' | 'guild' | 'migistus';
  icon: string;
  previewColor?: string;
}

export interface ProfileEffect {
  id: ProfileEffectType;
  name: string;
  description: string;
  tier: 'free' | 'initiate' | 'guild' | 'migistus';
  icon: string;
  previewColor?: string;
}

export const avatarEffects: AvatarEffect[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No effect',
    tier: 'free',
    icon: '⭕',
  },
  {
    id: 'glow',
    name: 'Glow',
    description: 'Soft blue glow around your avatar',
    tier: 'free',
    icon: '💫',
    previewColor: 'rgba(59, 130, 246, 0.5)',
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    description: 'Animated sparkles orbiting your avatar',
    tier: 'initiate',
    icon: '✨',
    previewColor: 'rgba(255, 255, 255, 0.8)',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Gentle pulsing animation',
    tier: 'initiate',
    icon: '💗',
    previewColor: 'rgba(236, 72, 153, 0.5)',
  },
  {
    id: 'fire',
    name: 'Fire',
    description: 'Flames dancing around your avatar',
    tier: 'guild',
    icon: '🔥',
    previewColor: 'rgba(255, 100, 0, 0.6)',
  },
  {
    id: 'ice',
    name: 'Ice',
    description: 'Frosty blue aura',
    tier: 'guild',
    icon: '❄️',
    previewColor: 'rgba(147, 197, 253, 0.6)',
  },
  {
    id: 'electric',
    name: 'Electric',
    description: 'Lightning crackling around your avatar',
    tier: 'guild',
    icon: '⚡',
    previewColor: 'rgba(100, 200, 255, 0.7)',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Animated rainbow border',
    tier: 'guild',
    icon: '🌈',
    previewColor: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)',
  },
  {
    id: 'golden',
    name: 'Golden Aura',
    description: 'Luxurious golden glow',
    tier: 'migistus',
    icon: '👑',
    previewColor: 'rgba(250, 204, 21, 0.7)',
  },
  {
    id: 'mystic',
    name: 'Mystic',
    description: 'Otherworldly purple energy',
    tier: 'migistus',
    icon: '🔮',
    previewColor: 'rgba(168, 85, 247, 0.8)',
  },
];

export const profileEffects: ProfileEffect[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No effect',
    tier: 'free',
    icon: '⭕',
  },
  {
    id: 'particles',
    name: 'Particles',
    description: 'Floating blue particles',
    tier: 'free',
    icon: '✨',
    previewColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    id: 'stars',
    name: 'Stars',
    description: 'Twinkling stars background',
    tier: 'initiate',
    icon: '⭐',
    previewColor: 'rgba(255, 255, 255, 0.2)',
  },
  {
    id: 'snow',
    name: 'Snow',
    description: 'Gentle snowfall',
    tier: 'initiate',
    icon: '❄️',
    previewColor: 'rgba(255, 255, 255, 0.4)',
  },
  {
    id: 'fireflies',
    name: 'Fireflies',
    description: 'Glowing fireflies floating around',
    tier: 'guild',
    icon: '✨',
    previewColor: 'rgba(255, 200, 50, 0.4)',
  },
  {
    id: 'waves',
    name: 'Waves',
    description: 'Flowing wave patterns',
    tier: 'guild',
    icon: '🌊',
    previewColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Falling matrix code',
    tier: 'guild',
    icon: '💻',
    previewColor: 'rgba(0, 255, 0, 0.3)',
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Cosmic nebula clouds',
    tier: 'migistus',
    icon: '🌌',
    previewColor: 'rgba(138, 43, 226, 0.4)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Beautiful aurora borealis',
    tier: 'migistus',
    icon: '🌠',
    previewColor: 'rgba(100, 200, 255, 0.4)',
  },
];

export const getTierColor = (tier: string) => {
  switch (tier) {
    case 'migistus': return 'text-yellow-400';
    case 'guild': return 'text-purple-400';
    case 'initiate': return 'text-blue-400';
    default: return 'text-zinc-400';
  }
};

export const getTierBadge = (tier: string) => {
  switch (tier) {
    case 'migistus': return '👑';
    case 'guild': return '⚔️';
    case 'initiate': return '🛡️';
    default: return '🎮';
  }
};

export const canUserAccessEffect = (userTier: string | undefined, effectTier: string) => {
  // Admin has access to all effects
  if (userTier === 'Admin') return true;

  const tierRank: { [key: string]: number } = {
    'free': 0,
    'initiate': 1,
    'Initiate': 1,
    'guild': 2,
    'Guild': 2,
    'migistus': 3,
    'MIGISTUS': 3,
  };

  const userRank = tierRank[userTier || 'free'] || 0;
  const requiredRank = tierRank[effectTier] || 0;

  return userRank >= requiredRank;
};
