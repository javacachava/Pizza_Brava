const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Usamos onWrite para detectar CREACIONES (nuevos empleados) y ACTUALIZACIONES
exports.syncUserStatus = functions.firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
        // 1. Si el documento fue borrado, no hacemos nada
        if (!change.after.exists) return null;

        const newData = change.after.data();
        const previousData = change.before.exists ? change.before.data() : {};

        // 2. Verificamos si es un usuario nuevo O si cambiaron sus permisos
        // (Si es nuevo, change.before.exists es false, así que entra en el if)
        if (!change.before.exists || 
            newData.active !== previousData.active || 
            newData.role !== previousData.role) {
            
            try {
                // Asignamos los Claims (permisos)
                await admin.auth().setCustomUserClaims(context.params.userId, {
                    active: newData.active, 
                    role: newData.role
                });

                console.log(`Permisos actualizados para ${newData.email}: Role=${newData.role}, Active=${newData.active}`);

                // Si se desactiva, cerramos sus sesiones abiertas
                if (newData.active === false) {
                    await admin.auth().revokeRefreshTokens(context.params.userId);
                }
            } catch (error) {
                console.error('Error asignando permisos:', error);
            }
        }
        
        return null;
    });