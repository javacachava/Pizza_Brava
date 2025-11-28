/**
 * BACKEND SERVERLESS - PIZZA BRAVA
 * Stack: Node.js 20 (Recomendado)
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// ----------------------------------------------------------------------
// 1. TRIGGER: NUEVA ORDEN (Validación y Estadísticas)
// ----------------------------------------------------------------------
exports.processNewOrder = onDocumentCreated("orders/{orderId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return; // No hay datos

    const order = snapshot.data();
    const orderId = event.params.orderId;

    // A. Evitar re-procesamiento (Idempotencia)
    if (order.status === "processed_by_server") return;

    logger.info(`Procesando Orden #${order.number} - ID: ${orderId}`);

    try {
        let calculatedTotal = 0;
        let isFlagged = false;
        let flagReason = "";

        // B. Recalcular precios (Seguridad: Validar vs BD)
        // Nota: Para "costo cero extremo" confiamos en los snapshots del array,
        // pero validamos la matemática interna (qty * price = subtotal).
        if (order.itemsSnapshot && Array.isArray(order.itemsSnapshot)) {
            order.itemsSnapshot.forEach(item => {
                const lineTotal = item.price * item.qty;
                calculatedTotal += lineTotal;
            });
        }

        // Tolerancia a pequeños errores de punto flotante
        const diff = Math.abs(calculatedTotal - order.total);
        if (diff > 0.05) {
            isFlagged = true;
            flagReason = `Discrepancia detectada. Cliente: $${order.total}, Servidor: $${calculatedTotal}`;
            logger.warn(flagReason);
        }

        const batch = db.batch();
        const orderRef = db.collection('orders').doc(orderId);

        // C. Actualizar Orden (Marcar como procesada y/o fraudulenta)
        batch.update(orderRef, {
            serverProcessedAt: FieldValue.serverTimestamp(),
            flagged: isFlagged,
            flagReason: isFlagged ? flagReason : FieldValue.delete(),
            // Si hay error, corregimos el total "oficial" para reportes
            verifiedTotal: calculatedTotal 
        });

        // D. Actualizar Estadísticas Diarias (Atomic Increment)
        // Esto garantiza que la contabilidad financiera sea EXACTA, aunque falle el internet del cliente
        // Usamos la fecha de creación de la orden para asignar el día correcto
        const dateStr = order.createdAt.toDate().toISOString().split('T')[0]; 
        const statsRef = db.collection('daily_stats').doc(dateStr);

        const categoryIncrements = {};
        if (order.itemsSnapshot) {
            order.itemsSnapshot.forEach(item => {
                const catKey = `categoryBreakdown.${item.mainCategory || 'Otros'}`;
                // Truco para crear objetos dinámicos de FieldValue
                categoryIncrements[catKey] = FieldValue.increment(item.price * item.qty);
            });
        }

        batch.set(statsRef, {
            date: dateStr,
            totalSales: FieldValue.increment(calculatedTotal),
            totalOrders: FieldValue.increment(1),
            lastUpdated: FieldValue.serverTimestamp(),
            ...categoryIncrements
        }, { merge: true });

        await batch.commit();
        logger.info(`Orden #${order.number} procesada correctamente.`);

    } catch (error) {
        logger.error("Error crítico procesando orden", error);
        // No borramos la orden, pero dejamos logs para debug manual
    }
});

// ----------------------------------------------------------------------
// 2. CRON JOB: ARCHIVADO AUTOMÁTICO (Cada noche a las 4:00 AM)
// ----------------------------------------------------------------------
exports.archiveOldOrders = onSchedule("every day 04:00", async (event) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 días atrás

    logger.info(`Iniciando purga de órdenes anteriores a: ${cutoffDate.toISOString()}`);

    const oldOrdersQuery = db.collection('orders')
        .where('createdAt', '<', cutoffDate)
        .limit(200); // Límite por ejecución para evitar Timeout

    const snapshot = await oldOrdersQuery.get();

    if (snapshot.empty) {
        logger.info("No hay órdenes para archivar.");
        return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        // Copiar a colección fría
        const archiveRef = db.collection('archived_orders').doc(doc.id);
        batch.set(archiveRef, { ...data, archivedAt: FieldValue.serverTimestamp() });
        // Borrar de colección caliente
        batch.delete(doc.ref);
        count++;
    });

    await batch.commit();
    logger.info(`Se archivaron ${count} órdenes exitosamente.`);
});