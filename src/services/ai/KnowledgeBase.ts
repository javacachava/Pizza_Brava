export interface DocEntry {
    id: string;
    keywords: string[];
    title: string;
    content: string;
    roleAccess: ('admin' | 'cashier' | 'all')[];
}

export const staticDocs: DocEntry[] = [
    {
        id: 'create_combo',
        keywords: ['crear combo', 'nuevo combo', 'armar combo'],
        title: 'Cómo crear un combo',
        content: 'Para crear un combo: 1. Ve al Panel Admin > Productos. 2. Crea un nuevo producto. 3. Marca la casilla "Elegible para Combos" o asígnalo a la categoría Combos. 4. Define el precio base. Nota: La gestión avanzada de grupos de combo se habilitará en la Fase 5.',
        roleAccess: ['admin']
    },
    {
        id: 'close_register',
        keywords: ['cerrar caja', 'cierre', 'corte z', 'finalizar dia'],
        title: 'Cómo cerrar caja',
        content: 'Para realizar el cierre: 1. Ve a Admin > Cierre de Caja. 2. Revisa el total de ventas y el desglose de efectivo. 3. Presiona "Imprimir Corte" para generar el ticket fiscal interno.',
        roleAccess: ['admin', 'cashier']
    },
    {
        id: 'pos_explain',
        keywords: ['que hace el pos', 'explicar pos', 'como funciona venta'],
        title: 'Funcionamiento del POS',
        content: 'El POS permite tomar órdenes rápidas. Selecciona una categoría, click en los productos para agregarlos al carrito. Usa el botón "Cobrar" para definir si es Mesa, Para Llevar o Domicilio.',
        roleAccess: ['all']
    },
    {
        id: 'printer_error',
        keywords: ['impresora', 'no imprime', 'error ticket'],
        title: 'Solución a problemas de impresión',
        content: 'Si no imprime: Verifica que la impresora térmica esté encendida y conectada por USB/Bluetooth. Asegúrate de que el navegador tenga permiso para ventanas emergentes (pop-ups) para generar el PDF.',
        roleAccess: ['all']
    }
];