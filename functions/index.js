const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Esta función se dispara cada vez que se actualiza un documento en la colección 'users'
exports.syncUserStatus = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const previousData = change.before.data();

        // Solo actuamos si el campo 'active' o 'role' cambió
        if (newData.active === previousData.active && newData.role === previousData.role) {
            return null;
        }

        try {
            // Establecemos los Custom Claims en el usuario de Authentication
            await admin.auth().setCustomUserClaims(context.params.userId, {
                active: newData.active, // true o false
                role: newData.role      // 'admin', 'cocina', 'recepcion'
            });

            console.log(`Claims actualizados para ${context.params.userId}: Active=${newData.active}`);
            
            // Opcional: Si se desactiva, forzamos el cierre de los tokens de sesión existentes
            if (newData.active === false) {
                await admin.auth().revokeRefreshTokens(context.params.userId);
            }
            
            return null;
        } catch (error) {
            console.error('Error actualizando claims:', error);
            return null;
        }
    });