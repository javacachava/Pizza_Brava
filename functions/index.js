// functions/index.js
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

        // C. Actualizar Orden
        batch.update(orderRef, {
            serverProcessedAt: FieldValue.serverTimestamp(),
            flagged: isFlagged,
            flagReason: isFlagged ? flagReason : FieldValue.delete(),
            verifiedTotal: calculatedTotal 
        });

        // D. Actualizar Estadísticas Diarias (Atomic Increment)
        // CORRECCIÓN: Usar Timezone UTC-6 (El Salvador) para que coincida con el Frontend
        const utcDate = order.createdAt.toDate();
        const offsetMs = 6 * 60 * 60 * 1000; // 6 horas en milisegundos
        const svDate = new Date(utcDate.getTime() - offsetMs);
        const dateStr = svDate.toISOString().split('T')[0];
        
        const statsRef = db.collection('daily_stats').doc(dateStr);

        // 1. Categorías
        const categoryIncrements = {};
        if (order.itemsSnapshot) {
            order.itemsSnapshot.forEach(item => {
                const catKey = `categoryBreakdown.${item.mainCategory || 'Otros'}`;
                categoryIncrements[catKey] = FieldValue.increment(item.price * item.qty);
            });
        }

        // 2. Métodos de Pago
        const payMethod = order.paymentMethod || "otro"; 
        const paySalesKey = `paymentBreakdown.${payMethod}.sales`;
        const payCountKey = `paymentBreakdown.${payMethod}.count`;

        // 3. Productos (Top Products)
        const productIncrements = {};
        if (order.itemsSnapshot) {
            order.itemsSnapshot.forEach(item => {
                const safeId = (item.id || "unknown").replace(/\//g, "_").replace(/\./g, "_");
                const pSalesKey = `productBreakdown.${safeId}.sales`;
                const pQtyKey = `productBreakdown.${safeId}.qty`;
                const pNameKey = `productBreakdown.${safeId}.name`;
                
                productIncrements[pSalesKey] = FieldValue.increment(item.price * item.qty);
                productIncrements[pQtyKey] = FieldValue.increment(item.qty);
                productIncrements[pNameKey] = item.name; // overwrite name ensures it's set
            });
        }

        batch.set(statsRef, {
            date: dateStr,
            totalSales: FieldValue.increment(calculatedTotal),
            totalOrders: FieldValue.increment(1),
            lastUpdated: FieldValue.serverTimestamp(),
            ...categoryIncrements,
            [paySalesKey]: FieldValue.increment(calculatedTotal),
            [payCountKey]: FieldValue.increment(1),
            ...productIncrements
        }, { merge: true });

        await batch.commit();
        logger.info(`Orden #${order.number} procesada correctamente.`);

    } catch (error) {
        logger.error("Error crítico procesando orden", error);
    }
});

// ----------------------------------------------------------------------
// 2. CRON JOB: ARCHIVADO AUTOMÁTICO (Cada noche a las 4:00 AM)
// ----------------------------------------------------------------------
exports.archiveOldOrders = onSchedule("every day 04:00", async (event) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); 

    logger.info(`Iniciando purga de órdenes anteriores a: ${cutoffDate.toISOString()}`);

    const oldOrdersQuery = db.collection('orders')
        .where('createdAt', '<', cutoffDate)
        .limit(200); 

    const snapshot = await oldOrdersQuery.get();

    if (snapshot.empty) {
        logger.info("No hay órdenes para archivar.");
        return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const archiveRef = db.collection('archived_orders').doc(doc.id);
        batch.set(archiveRef, { ...data, archivedAt: FieldValue.serverTimestamp() });
        batch.delete(doc.ref);
        count++;
    });

    await batch.commit();
    logger.info(`Se archivaron ${count} órdenes exitosamente.`);
});