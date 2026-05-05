// Session Utilities
// Handles session timeout and activity tracking

class SessionUtils {
    constructor() {
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes default
        this.warningTimeout = 5 * 60 * 1000; // 5 minutes before timeout
        this.inactivityTimer = null;
        this.warningTimer = null;
        this.lastActivity = Date.now();
        this.warningShown = false;
    }

    /**
     * Initialize session timeout
     * @param {number} timeout - Session timeout in milliseconds
     */
    init(timeout = 30 * 60 * 1000) {
        this.sessionTimeout = timeout;
        this.warningTimeout = 5 * 60 * 1000;
        this.startTracking();
    }

    /**
     * Start tracking user activity
     */
    startTracking() {
        // Track user activity events
        const activityEvents = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
        ];

        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.updateActivity());
        });

        // Start timers
        this.resetTimers();
    }

    /**
     * Update last activity timestamp
     */
    updateActivity() {
        this.lastActivity = Date.now();
        this.warningShown = false;
        this.resetTimers();
    }

    /**
     * Reset inactivity timers
     */
    resetTimers() {
        // Clear existing timers
        if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);

        // Set warning timer
        this.warningTimer = setTimeout(() => {
            this.showWarning();
        }, this.sessionTimeout - this.warningTimeout);

        // Set timeout timer
        this.inactivityTimer = setTimeout(() => {
            this.logout();
        }, this.sessionTimeout);
    }

    /**
     * Show session timeout warning
     */
    showWarning() {
        if (this.warningShown) return;
        this.warningShown = true;

        const minutesRemaining = Math.ceil(this.warningTimeout / 60000);
        const message = `Your session will expire in ${minutesRemaining} minutes due to inactivity. Click OK to continue your session.`;
        
        if (confirm(message)) {
            this.updateActivity();
        }
    }

    /**
     * Logout user due to session timeout
     */
    logout() {
        // Clear session
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('loginMethod');

        // Notify user
        alert('Your session has expired due to inactivity. Please log in again.');

        // Redirect to login
        window.location.href = 'login.html';
    }

    /**
     * Stop tracking (call when user manually logs out)
     */
    stopTracking() {
        if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);
    }

    /**
     * Get remaining session time in minutes
     * @returns {number} Remaining minutes
     */
    getRemainingTime() {
        const elapsed = Date.now() - this.lastActivity;
        const remaining = this.sessionTimeout - elapsed;
        return Math.max(0, Math.ceil(remaining / 60000));
    }
}

// Global session utils instance
const sessionUtils = new SessionUtils();
