import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, needsRehash } from '../../../src/lib/password.js';

describe('password', () => {
  it('should hash a password and verify it successfully', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isValid = await verifyPassword(hash, password);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('CorrectPassword123!');
    const isValid = await verifyPassword(hash, 'WrongPassword456!');
    expect(isValid).toBe(false);
  });

  it('should return false for an invalid hash format', async () => {
    const isValid = await verifyPassword('not-a-valid-hash', 'password');
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for the same password (random salt)', async () => {
    const password = 'SamePassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });

  it('should report needsRehash correctly for a current hash', async () => {
    const hash = await hashPassword('TestPassword');
    // A freshly generated hash should not need rehashing
    expect(needsRehash(hash)).toBe(false);
  });
});
