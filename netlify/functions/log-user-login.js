const firebase = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
if (!firebase.apps.length) {
    firebase.initializeApp({
        credential: firebase.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = firebase.database();

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, name, loginTime, userAgent, ipAddress } = JSON.parse(event.body);
        
        // Validate required fields
        if (!email || !name || !loginTime) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Get client IP from headers
        const clientIP = event.headers['x-forwarded-for'] || 
                        event.headers['x-real-ip'] || 
                        event.headers['client-ip'] || 
                        'unknown';

        // Create login record
        const loginRecord = {
            email: email,
            name: name,
            loginTime: loginTime,
            userAgent: userAgent || 'unknown',
            ipAddress: clientIP,
            sessionId: crypto.randomBytes(16).toString('hex'),
            timestamp: Date.now()
        };

        // Save to Firebase under 'userLogins'
        const loginRef = db.ref('userLogins').push();
        await loginRef.set(loginRecord);

        // Also update user's last login in users collection
        const usersRef = db.ref('users');
        const userSnapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            const userId = Object.keys(userData)[0];
            
            // Update last login time
            await usersRef.child(userId).update({
                lastLogin: loginTime,
                lastLoginIP: clientIP,
                loginCount: (userData[userId].loginCount || 0) + 1
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Login logged successfully',
                sessionId: loginRecord.sessionId
            })
        };

    } catch (error) {
        console.error('Error logging user login:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to log login',
                details: error.message 
            })
        };
    }
};
