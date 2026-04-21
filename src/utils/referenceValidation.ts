import type { ReferenceType } from '../store/types';

/**
 * BRN: 12-22 chars, A-Z 0-9 only, at least 6 digits
 * UTR: 10-22 chars, A-Z 0-9 only
 */
export function validateReference(
  value: string,
  type: ReferenceType
): { valid: boolean; error?: string } {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return { valid: false, error: 'Required' };

  const alphanumeric = /^[A-Z0-9]+$/;
  if (!alphanumeric.test(trimmed)) {
    return { valid: false, error: 'Enter a valid ' + type };
  }

  const digitCount = (trimmed.match(/\d/g) || []).length;

  if (type === 'BRN') {
    if (trimmed.length < 12 || trimmed.length > 22) {
      return { valid: false, error: 'Enter a valid BRN' };
    }
    if (digitCount < 6) {
      return { valid: false, error: 'Enter a valid BRN' };
    }
  } else {
    if (trimmed.length < 10 || trimmed.length > 22) {
      return { valid: false, error: 'Enter a valid UTR' };
    }
  }

  return { valid: true };
}

export function normalizeReference(value: string): string {
  return value.trim().toUpperCase();
}
