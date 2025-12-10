const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Debe estar autenticado para crear usuarios."
    );
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection("users").doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo los administradores pueden crear usuarios."
    );
  }

  const { email, password, name, role } = data;

  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Faltan datos requeridos (email, password, name, role)."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      email: email,
      name: name,
      role: role,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, uid: userRecord.uid };

  } catch (error) {
    console.error("Error creando usuario:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});