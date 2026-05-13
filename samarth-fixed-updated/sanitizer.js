// Input Sanitizer Utility
// Prevents XSS attacks by sanitizing user inputs

class Sanitizer {
    constructor() {
        this.allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'];
        this.allowedAttributes = {
            'a': ['href', 'title'],
            'img': ['src', 'alt', 'title']
        };
    }

    /**
     * Sanitize HTML input to prevent XSS
     * @param {string} input - Raw user input
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Create a temporary div element
        const tempDiv = document.createElement('div');
        tempDiv.textContent = input;
        
        // Return text content (strips all HTML)
        return tempDiv.innerHTML;
    }

    /**
     * Sanitize text input (escape special characters)
     * @param {string} input - Raw user input
     * @returns {string} Escaped string
     */
    escapeHTML(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;'
        };

        return input.replace(/[&<>"'/]/g, (char) => map[char]);
    }

    /**
     * Sanitize email input
     * @param {string} email - Email address
     * @returns {string} Sanitized email
     */
    sanitizeEmail(email) {
        if (!email || typeof email !== 'string') {
            return '';
        }

        // Remove any HTML tags
        const sanitized = this.sanitizeHTML(email);
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized)) {
            return '';
        }

        return sanitized.toLowerCase().trim();
    }

    /**
     * Sanitize phone number input
     * @param {string} phone - Phone number
     * @returns {string} Sanitized phone number
     */
    sanitizePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return '';
        }

        // Remove all non-digit characters
        const sanitized = this.sanitizeHTML(phone).replace(/\D/g, '');
        
        // Validate length (10 digits for Indian numbers)
        if (sanitized.length !== 10) {
            return '';
        }

        return sanitized;
    }

    /**
     * Sanitize name input
     * @param {string} name - Name
     * @returns {string} Sanitized name
     */
    sanitizeName(name) {
        if (!name || typeof name !== 'string') {
            return '';
        }

        // Remove HTML and special characters except letters, spaces, and basic punctuation
        const sanitized = this.sanitizeHTML(name);
        const cleanName = sanitized.replace(/[^a-zA-Z\s\-\.']/g, '');
        
        // Trim and capitalize first letter
        return cleanName.trim().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    /**
     * Sanitize address input
     * @param {string} address - Address
     * @returns {string} Sanitized address
     */
    sanitizeAddress(address) {
        if (!address || typeof address !== 'string') {
            return '';
        }

        // Remove HTML but allow letters, numbers, spaces, and basic punctuation
        const sanitized = this.sanitizeHTML(address);
        const cleanAddress = sanitized.replace(/[^a-zA-Z0-9\s\-\.,#\/]/g, '');
        
        return cleanAddress.trim();
    }

    /**
     * Sanitize ID proof number
     * @param {string} idNumber - ID proof number
     * @returns {string} Sanitized ID number
     */
    sanitizeIDNumber(idNumber) {
        if (!idNumber || typeof idNumber !== 'string') {
            return '';
        }

        // Remove HTML and special characters (alphanumeric only)
        const sanitized = this.sanitizeHTML(idNumber);
        const cleanID = sanitized.replace(/[^a-zA-Z0-9]/g, '');
        
        return cleanID.toUpperCase().trim();
    }

    /**
     * Sanitize vehicle number
     * @param {string} vehicleNumber - Vehicle number
     * @returns {string} Sanitized vehicle number
     */
    sanitizeVehicleNumber(vehicleNumber) {
        if (!vehicleNumber || typeof vehicleNumber !== 'string') {
            return '';
        }

        // Remove HTML and format to uppercase
        const sanitized = this.sanitizeHTML(vehicleNumber);
        const cleanVehicle = sanitized.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        
        return cleanVehicle.trim();
    }

    /**
     * Sanitize any input based on type
     * @param {string} input - Raw input
     * @param {string} type - Input type (email, phone, name, address, etc.)
     * @returns {string} Sanitized input
     */
    sanitize(input, type = 'text') {
        switch (type.toLowerCase()) {
            case 'email':
                return this.sanitizeEmail(input);
            case 'phone':
                return this.sanitizePhone(input);
            case 'name':
                return this.sanitizeName(input);
            case 'address':
                return this.sanitizeAddress(input);
            case 'id':
                return this.sanitizeIDNumber(input);
            case 'vehicle':
                return this.sanitizeVehicleNumber(input);
            default:
                return this.escapeHTML(input);
        }
    }
}

// Global sanitizer instance
const sanitizer = new Sanitizer();
