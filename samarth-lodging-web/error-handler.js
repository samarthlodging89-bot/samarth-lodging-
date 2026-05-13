// Error Handler Utility
// Provides structured error logging with context

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.rateLimitMap = new Map(); // Track error frequency
        this.rateLimitWindow = 60000; // 1 minute window
        this.maxErrorsPerWindow = 10; // Max 10 same errors per minute
    }

    /**
     * Log error with context
     * @param {Error} error - The error object
     * @param {string} operation - The operation that failed
     * @param {Object} context - Additional context (userId, data, etc.)
     * @param {string} severity - 'error', 'warning', 'info'
     */
    log(error, operation, context = {}, severity = 'error') {
        const timestamp = new Date().toISOString();
        const userId = sessionStorage.getItem('userEmail') || 'anonymous';
        
        // Create error key for rate limiting
        const errorKey = `${operation}_${error.message || 'unknown'}`;
        const now = Date.now();
        
        // Check rate limit
        if (!this.rateLimitMap.has(errorKey)) {
            this.rateLimitMap.set(errorKey, { count: 0, resetTime: now + this.rateLimitWindow });
        }
        
        const rateLimitData = this.rateLimitMap.get(errorKey);
        
        // Reset if window expired
        if (now > rateLimitData.resetTime) {
            rateLimitData.count = 0;
            rateLimitData.resetTime = now + this.rateLimitWindow;
        }
        
        // Check if rate limit exceeded
        if (rateLimitData.count >= this.maxErrorsPerWindow) {
            console.warn(`[RATE LIMITED] ${operation}: Too many errors in time window`);
            return null; // Skip logging
        }
        
        // Increment count
        rateLimitData.count++;
        
        const errorEntry = {
            timestamp,
            severity,
            operation,
            userId,
            errorMessage: error.message || 'Unknown error',
            errorStack: error.stack,
            context: JSON.stringify(context),
            userAgent: navigator.userAgent,
            url: window.location.href,
            rateLimited: false
        };

        // Add to in-memory log
        this.errorLog.push(errorEntry);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console with context
        console.error(`[${severity.toUpperCase()}] ${operation}:`, {
            error: error.message,
            context,
            userId,
            timestamp
        });

        // Store in localStorage for persistence
        try {
            const storedErrors = JSON.parse(localStorage.getItem('errorLog') || '[]');
            storedErrors.push(errorEntry);
            if (storedErrors.length > 50) storedErrors.shift();
            localStorage.setItem('errorLog', JSON.stringify(storedErrors));
        } catch (e) {
            console.error('Failed to store error in localStorage:', e);
        }

        return errorEntry;
    }

    /**
     * Get recent errors
     */
    getRecentErrors(count = 10) {
        return this.errorLog.slice(-count);
    }

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = [];
        localStorage.removeItem('errorLog');
    }

    /**
     * Handle API errors with retry logic
     * @param {Function} apiCall - The API function to call
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} delay - Delay between retries in ms
     */
    async withRetry(apiCall, operation, context = {}, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await apiCall();
            } catch (error) {
                lastError = error;
                this.log(error, `${operation} (attempt ${i + 1}/${maxRetries})`, context, 'warning');
                
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        }
        
        // All retries failed
        this.log(lastError, `${operation} (failed after ${maxRetries} retries)`, context, 'error');
        throw lastError;
    }

    /**
     * Show user-friendly error message
     * @param {string} message - User-friendly message
     * @param {Error} error - The actual error
     */
    showUserMessage(message, error = null) {
        if (error) {
            console.error('Error details:', error);
        }
        alert(message);
    }
}

// Global error handler instance
const errorHandler = new ErrorHandler();

// Global error listener for unhandled errors
window.addEventListener('error', (event) => {
    errorHandler.log(event.error, 'Unhandled global error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Global error listener for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    errorHandler.log(event.reason, 'Unhandled promise rejection', {}, 'error');
});
