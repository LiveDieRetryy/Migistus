import { useState, useEffect, useRef } from 'react';

interface EmailCheckResult {
  available: boolean | null;
  checking: boolean;
  message: string;
  showLoginOption?: boolean;
}

export function useEmailAvailability(email: string, debounceMs: number = 500): EmailCheckResult {
  const [result, setResult] = useState<EmailCheckResult>({
    available: null,
    checking: false,
    message: ''
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't check empty email
    if (!email.trim()) {
      setResult({ available: null, checking: false, message: '' });
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResult({ 
        available: false, 
        checking: false, 
        message: 'Invalid email format' 
      });
      return;
    }

    // Set checking state
    setResult(prev => ({ ...prev, checking: true }));

    // Debounce the API call
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (response.ok) {
          setResult({
            available: data.available,
            checking: false,
            message: data.available ? '✓ Email available' : '✗ Email already in use',
            showLoginOption: !data.available
          });
        } else {
          setResult({
            available: false,
            checking: false,
            message: data.error || 'Error checking email'
          });
        }
      } catch (error) {
        setResult({
          available: false,
          checking: false,
          message: 'Error checking email availability'
        });
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [email, debounceMs]);

  return result;
}

// Helper function for one-time email checks
export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.available || false;
  } catch (error) {
    return false;
  }
}
