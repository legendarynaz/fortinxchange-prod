/**
 * Input Sanitization & Validation Utilities
 * Prevents XSS, injection attacks, and validates user input
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char]);
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize string for safe display (combines escape and strip)
 */
export function sanitizeString(str: string, options?: { 
  maxLength?: number; 
  allowHtml?: boolean;
}): string {
  if (typeof str !== 'string') return '';
  
  let result = str.trim();
  
  if (!options?.allowHtml) {
    result = stripHtml(result);
    result = escapeHtml(result);
  }
  
  if (options?.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength);
  }
  
  return result;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = email.toLowerCase().trim();
  
  // Basic email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Invalid email format' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, sanitized, error: 'Email too long' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  score: number; 
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    suggestions.push('Add lowercase letters');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    suggestions.push('Add uppercase letters');
  } else {
    score += 1;
  }
  
  if (!/[0-9]/.test(password)) {
    suggestions.push('Add numbers');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    suggestions.push('Add special characters');
  } else {
    score += 1;
  }
  
  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'letmein', 'admin'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common patterns');
    score = Math.max(0, score - 2);
  }
  
  return {
    isValid: errors.length === 0 && score >= 4,
    score: Math.min(score, 7),
    errors,
    suggestions,
  };
}

/**
 * Sanitize wallet address
 */
export function sanitizeWalletAddress(address: string): { 
  isValid: boolean; 
  sanitized: string; 
  type?: 'ethereum' | 'bitcoin' | 'unknown';
  error?: string;
} {
  const sanitized = address.trim();
  
  // Ethereum address (0x followed by 40 hex characters)
  if (/^0x[a-fA-F0-9]{40}$/.test(sanitized)) {
    return { isValid: true, sanitized: sanitized.toLowerCase(), type: 'ethereum' };
  }
  
  // Bitcoin address (P2PKH: starts with 1, P2SH: starts with 3, Bech32: starts with bc1)
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(sanitized) || /^bc1[a-z0-9]{39,59}$/.test(sanitized)) {
    return { isValid: true, sanitized, type: 'bitcoin' };
  }
  
  return { isValid: false, sanitized, error: 'Invalid wallet address format' };
}

/**
 * Sanitize numeric input (for amounts, prices)
 */
export function sanitizeNumber(
  value: string | number,
  options?: {
    min?: number;
    max?: number;
    decimals?: number;
    allowNegative?: boolean;
  }
): { isValid: boolean; value: number; error?: string } {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, value: 0, error: 'Invalid number' };
  }
  
  if (!options?.allowNegative && numValue < 0) {
    return { isValid: false, value: 0, error: 'Negative values not allowed' };
  }
  
  if (options?.min !== undefined && numValue < options.min) {
    return { isValid: false, value: numValue, error: `Value must be at least ${options.min}` };
  }
  
  if (options?.max !== undefined && numValue > options.max) {
    return { isValid: false, value: numValue, error: `Value must be at most ${options.max}` };
  }
  
  let finalValue = numValue;
  if (options?.decimals !== undefined) {
    finalValue = Number(numValue.toFixed(options.decimals));
  }
  
  return { isValid: true, value: finalValue };
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): { isValid: boolean; sanitized: string; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, sanitized: '', error: 'Invalid protocol' };
    }
    
    // Prevent javascript: URLs that might slip through
    if (url.toLowerCase().includes('javascript:')) {
      return { isValid: false, sanitized: '', error: 'Invalid URL' };
    }
    
    return { isValid: true, sanitized: parsed.href };
  } catch {
    return { isValid: false, sanitized: '', error: 'Invalid URL format' };
  }
}

/**
 * Generic sanitization for form data
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, 'string' | 'email' | 'number' | 'wallet' | 'url' | 'boolean'>
): { isValid: boolean; sanitized: Partial<T>; errors: Record<string, string> } {
  const sanitized: Partial<T> = {};
  const errors: Record<string, string> = {};
  
  for (const [key, type] of Object.entries(schema)) {
    const value = data[key];
    
    switch (type) {
      case 'string':
        sanitized[key as keyof T] = sanitizeString(String(value || '')) as T[keyof T];
        break;
      case 'email':
        const emailResult = sanitizeEmail(String(value || ''));
        if (!emailResult.isValid) errors[key] = emailResult.error || 'Invalid';
        sanitized[key as keyof T] = emailResult.sanitized as T[keyof T];
        break;
      case 'number':
        const numResult = sanitizeNumber(value);
        if (!numResult.isValid) errors[key] = numResult.error || 'Invalid';
        sanitized[key as keyof T] = numResult.value as T[keyof T];
        break;
      case 'wallet':
        const walletResult = sanitizeWalletAddress(String(value || ''));
        if (!walletResult.isValid) errors[key] = walletResult.error || 'Invalid';
        sanitized[key as keyof T] = walletResult.sanitized as T[keyof T];
        break;
      case 'url':
        const urlResult = sanitizeUrl(String(value || ''));
        if (!urlResult.isValid) errors[key] = urlResult.error || 'Invalid';
        sanitized[key as keyof T] = urlResult.sanitized as T[keyof T];
        break;
      case 'boolean':
        sanitized[key as keyof T] = Boolean(value) as T[keyof T];
        break;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    sanitized,
    errors,
  };
}
