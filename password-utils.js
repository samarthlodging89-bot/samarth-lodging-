// Password Utilities
// Handles password hashing and verification using Web Crypto API (built into browsers)

class PasswordUtils {
    constructor() {
        this.saltLength = 16;
        this.iterations = 100000;
    }

    /**
     * Generate a random salt
     * @returns {string} Hex-encoded salt
     */
    _generateSalt() {
        const array = new Uint8Array(this.saltLength);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Hash a password using PBKDF2 (Web Crypto API)
     * @param {string} password - Plain text password
     * @param {string} [salt] - Optional salt (generated if not provided)
     * @returns {Promise<string>} Hashed password in format "salt:hash"
     */
    async hashPassword(password, salt) {
        try {
            const actualSalt = salt || this._generateSalt();
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveBits']
            );

            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: encoder.encode(actualSalt),
                    iterations: this.iterations,
                    hash: 'SHA-256'
                },
                keyMaterial,
                256
            );

            const hash = Array.from(new Uint8Array(derivedBits), b => b.toString(16).padStart(2, '0')).join('');
            return `${actualSalt}:${hash}`;
        } catch (error) {
            console.error('Error hashing password:', error);
            throw error;
        }
    }

    /**
     * Verify a password against a hash
     * @param {string} password - Plain text password
     * @param {string} storedHash - Stored hash in format "salt:hash"
     * @returns {Promise<boolean>} True if password matches
     */
    async verifyPassword(password, storedHash) {
        try {
            const [salt, hash] = storedHash.split(':');
            const newHash = await this.hashPassword(password, salt);
            return newHash === storedHash;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validatePasswordStrength(password) {
        const errors = [];
        
        if (!password) {
            errors.push('Password is required');
            return { isValid: false, errors };
        }
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate a random password
     * @param {number} length - Password length (default 12)
     * @returns {string} Random password
     */
    generateRandomPassword(length = 12) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(array[i] % charset.length);
        }
        return password;
    }
}

// Global password utils instance
const passwordUtils = new PasswordUtils();
