// Password Strength Validator
// Provides password strength checking and visual feedback

export interface PasswordStrength {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  feedback: string[];
  percentage: number;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      color: '#ef4444',
      feedback: ['Enter a password'],
      percentage: 0,
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (password.length >= 12) score++;

  // Character variety
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add special characters (!@#$%^&*)');

  // Common patterns (reduce score)
  const commonPatterns = [
    /^123+/,
    /^abc+/i,
    /^qwerty/i,
    /^password/i,
    /^admin/i,
    /(.)\1{2,}/, // Repeated characters
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid common patterns');
      break;
    }
  }

  // Sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential characters');
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(4, Math.max(0, Math.floor(score / 1.5)));

  let label: PasswordStrength['label'];
  let color: string;

  switch (normalizedScore) {
    case 0:
      label = 'Very Weak';
      color = '#ef4444';
      break;
    case 1:
      label = 'Weak';
      color = '#f97316';
      break;
    case 2:
      label = 'Fair';
      color = '#eab308';
      break;
    case 3:
      label = 'Strong';
      color = '#22c55e';
      break;
    case 4:
      label = 'Very Strong';
      color = '#10b981';
      break;
    default:
      label = 'Very Weak';
      color = '#ef4444';
  }

  return {
    score: normalizedScore,
    label,
    color,
    feedback: feedback.length > 0 ? feedback : ['Password looks good!'],
    percentage: (normalizedScore / 4) * 100,
  };
}

export function isPasswordStrong(password: string): boolean {
  const strength = calculatePasswordStrength(password);
  return strength.score >= 3;
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return null;
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
}
