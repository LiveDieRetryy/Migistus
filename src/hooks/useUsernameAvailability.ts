// Username Availability Checker
// Debounced API calls to check username availability

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsernameCheckResult {
  available: boolean | null;
  checking: boolean;
  message: string;
  suggestions?: string[];
}

export function useUsernameAvailability(username: string, debounceMs: number = 500): UsernameCheckResult {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const checkAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setAvailable(null);
      setMessage('');
      setChecking(false);
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setAvailable(false);
      setMessage('Only letters, numbers, and underscores allowed');
      setChecking(false);
      return;
    }

    setChecking(true);
    setMessage('Checking availability...');

    try {
      const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(usernameToCheck)}`);
      const data = await response.json();

      if (response.ok) {
        setAvailable(data.available);
        setMessage(data.available ? '✓ Username available' : '✗ Username already taken');
      } else {
        setAvailable(null);
        setMessage('Error checking username');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setAvailable(null);
      setMessage('Error checking username');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset states if username is too short
    if (!username || username.length < 3) {
      setAvailable(null);
      setMessage('');
      setChecking(false);
      return;
    }

    // Debounce the API call
    timeoutRef.current = setTimeout(() => {
      checkAvailability(username);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [username, debounceMs, checkAvailability]);

  return { available, checking, message };
}

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    return data.available === true;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}
