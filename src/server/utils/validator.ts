// validator.ts - High-quality lightweight custom inputs validator.
// Asserts validation logic without requiring bulky third-party dependencies.

export class Validator {
  /**
   * Validate standard email pattern
   */
  static validateEmail(email: any): boolean {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate secure superadmin/user password constraints (Section 9.3.5 requirements)
   * Minimum 12+ characters, mixed case, number, symbol
   */
  static validatePassword(password: any): boolean {
    if (typeof password !== 'string') return false;
    if (password.length < 12) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password); // symbol

    return hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
  }

  /**
   * Validate simple string length ranges
   */
  static validateStringRange(str: any, min: number, max: number): boolean {
    if (typeof str !== 'string') return false;
    const len = str.trim().length;
    return len >= min && len <= max;
  }

  /**
   * Validate mandatory parameter fields existence in objects
   */
  static validateRequired(body: any, requiredFields: string[]): string[] {
    const missing: string[] = [];
    if (!body || typeof body !== 'object') {
      return requiredFields;
    }
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        missing.push(field);
      }
    }
    return missing;
  }

  /**
   * Validate calendar ISO date strings
   */
  static validateDate(dateStr: any): boolean {
    if (typeof dateStr !== 'string') return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  }

  /**
   * Validate numeric integer parameters
   */
  static validateInteger(value: any): boolean {
    if (value === undefined || value === null) return false;
    const num = Number(value);
    return Number.isInteger(num);
  }
}
