const firebase = require('firebase-admin');

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
        const { email } = JSON.parse(event.body);
        
        // Validate required fields
        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email is required' })
            };
        }

        console.log(`Starting deletion process for user: ${email}`);

        // 1. Cancel all user bookings
        const bookingsSnapshot = await db.ref('bookings').once('value');
        const bookings = bookingsSnapshot.val();
        
        if (bookings) {
            const bookingPromises = [];
            
            Object.keys(bookings).forEach(bookingId => {
                const booking = bookings[bookingId];
                if (booking.email === email && booking.status !== 'cancelled') {
                    // Update booking status to cancelled
                    bookingPromises.push(
                        db.ref(`bookings/${bookingId}`).update({
                            status: 'cancelled - account deleted',
                            cancelledAt: new Date().toISOString(),
                            cancellationReason: 'User account deleted',
                            updatedAt: Date.now()
                        })
                    );
                    console.log(`Cancelled booking: ${bookingId} for user: ${email}`);
                }
            });
            
            await Promise.all(bookingPromises);
            console.log(`Cancelled ${bookingPromises.length} bookings for user: ${email}`);
        }

        // 2. Delete user from users collection
        const usersSnapshot = await db.ref('users').once('value');
        const users = usersSnapshot.val();
        
        if (users) {
            let userDeleted = false;
            Object.keys(users).forEach(userId => {
                if (users[userId].email === email) {
                    db.ref(`users/${userId}`).remove();
                    userDeleted = true;
                    console.log(`Deleted user record: ${userId} for email: ${email}`);
                }
            });
            
            if (!userDeleted) {
                console.log(`No user record found for email: ${email}`);
            }
        }

        // 3. Delete user login history
        const loginsSnapshot = await db.ref('userLogins').once('value');
        const logins = loginsSnapshot.val();
        
        if (logins) {
            const loginDeletionPromises = [];
            
            Object.keys(logins).forEach(loginId => {
                if (logins[loginId].email === email) {
                    loginDeletionPromises.push(
                        db.ref(`userLogins/${loginId}`).remove()
                    );
                    console.log(`Deleted login record: ${loginId} for user: ${email}`);
                }
            });
            
            await Promise.all(loginDeletionPromises);
            console.log(`Deleted ${loginDeletionPromises.length} login records for user: ${email}`);
        }

        // 4. Remove user from localStorage users (if exists)
        // Note: This is client-side data, but we can't access it from server
        // The client-side code will handle localStorage cleanup

        console.log(`Successfully completed deletion for user: ${email}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Account and all associated data deleted successfully',
                deletedItems: {
                    bookings: 'cancelled',
                    userRecord: 'deleted',
                    loginHistory: 'deleted'
                }
            })
        };

    } catch (error) {
        console.error('Error deleting user account:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to delete account',
                details: error.message 
            })
        };
    }
};
