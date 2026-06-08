// auth.test.ts - Unit tests for custom validation helpers and hashing mechanisms.

import { describe, test, expect } from '@jest/globals';
import { Validator } from '../../src/server/utils/validator.js';
import bcrypt from 'bcryptjs';

describe('Custom Inputs Validation Helpers (Section 9.3.5 / Section 5)', () => {
  
  test('Email validator should correctly validate format rules', () => {
    expect(Validator.validateEmail('user@domain.com')).toBe(true);
    expect(Validator.validateEmail('user.name+label@sub.domain.co.uk')).toBe(true);
    expect(Validator.validateEmail('invalid-email')).toBe(false);
    expect(Validator.validateEmail('@missing-username.com')).toBe(false);
    expect(Validator.validateEmail('missing-domain@')).toBe(false);
  });

  test('Password validator should enforce strict security constraints', () => {
    // Requirements: 12+ chars, mixed case, number, symbol
    expect(Validator.validatePassword('SecurePass123!')).toBe(true); // 14 chars, meets all
    expect(Validator.validatePassword('Short1!')).toBe(false); // < 12 chars
    expect(Validator.validatePassword('nouppercase1!')).toBe(false); // Missing upper
    expect(Validator.validatePassword('NOLOWERCASE1!')).toBe(false); // Missing lower
    expect(Validator.validatePassword('NoNumbersVal!')).toBe(false); // Missing digits
    expect(Validator.validatePassword('NoSymbols1234')).toBe(false); // Missing symbol
  });

  test('Required parameters checker identifies missing arguments', () => {
    const body = { name: 'Acme', email: 'test@acme.com' };
    
    // All parameters exist
    expect(Validator.validateRequired(body, ['name', 'email']).length).toBe(0);
    
    // Missing password
    const missing = Validator.validateRequired(body, ['name', 'email', 'password']);
    expect(missing).toContain('password');
    expect(missing.length).toBe(1);
  });

  test('Bcrypt utility correctly hashes and compares password keys', async () => {
    const rawText = 'SecurePass123!';
    const hashed = await bcrypt.hash(rawText, 12);
    
    // Correct password match
    const isMatched = await bcrypt.compare(rawText, hashed);
    expect(isMatched).toBe(true);

    // Incorrect password mismatch
    const isMismatched = await bcrypt.compare('WrongPass123!', hashed);
    expect(isMismatched).toBe(false);
  });
});
