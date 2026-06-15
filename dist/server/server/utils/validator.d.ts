export declare class Validator {
    /**
     * Validate standard email pattern
     */
    static validateEmail(email: any): boolean;
    /**
     * Validate secure superadmin/user password constraints (Section 9.3.5 requirements)
     * Minimum 12+ characters, mixed case, number, symbol
     */
    static validatePassword(password: any): boolean;
    /**
     * Validate simple string length ranges
     */
    static validateStringRange(str: any, min: number, max: number): boolean;
    /**
     * Validate mandatory parameter fields existence in objects
     */
    static validateRequired(body: any, requiredFields: string[]): string[];
    /**
     * Validate calendar ISO date strings
     */
    static validateDate(dateStr: any): boolean;
    /**
     * Validate numeric integer parameters
     */
    static validateInteger(value: any): boolean;
}
