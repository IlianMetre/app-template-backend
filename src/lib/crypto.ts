import { randomBytes } from 'node:crypto';

/**
 * Generate a cryptographically secure random hex string.
 */
export function randomHex(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Generate a set of recovery codes (alphanumeric, uppercase, grouped for readability).
 * Format: XXXX-XXXX (8 chars per code).
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(4).toString('hex').toUpperCase(); // 8 hex chars
    const code = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(code);
  }
  return codes;
}
