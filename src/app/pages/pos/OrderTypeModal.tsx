import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import type { Table } from '../../../models/Table';
import confetti from 'canvas-confetti'; //

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'mesa' | 'llevar' | 'pedido', meta?: any) => void;
  isLoading?: boolean;
  tables: Table[];
}

export const OrderTypeModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, isLoading, tables }) => {
  // Use domain types internally if possible, or map them
  const [selectedType, setSelectedType] = useState<'mesa' | 'llevar' | 'pedido' | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');

  // Reiniciar estado al cerrar
  const handleClose = () => {
    setSelectedType(null);
    setSelectedTableId('');
    setCustomerName('');
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedType) return;
    
    // Validaciones
    if (selectedType === 'mesa' && !selectedTableId) {
      alert('Selecciona una mesa');
      return;
    }
    if ((selectedType === 'llevar' || selectedType === 'pedido') && !customerName.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }

    // Datos meta
    const meta: any = {};
    if (selectedType === 'mesa') meta.tableId = selectedTableId;
    if (customerName) meta.customerName = customerName;

    // --- EFECTO WOW: Confeti ---
    // Lanzamos confeti desde el centro hacia arriba
    const duration = 2000;
    const end = Date.now() + duration;

    // Colores corporativos (Naranja Pizza Brava)
    const colors = ['#FF5722', '#FF9800', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
    // ---------------------------

    onConfirm(selectedType, meta);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tipo de Orden">
      <div className="space-y-6 p-2">
        
        {/* Selección de Tipo con Tarjetas Grandes */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedType('mesa')}
            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
              selectedType === 'mesa' ? 'border-[#FF5722] bg-[#FF5722]/10 text-[#FF5722]' : 'border-[#333] bg-[#1E1E1E] text-gray-400 hover:border-gray-500'
            }`}
          >
            <span className="text-4xl">🍽️</span>
            <span className="font-bold text-sm">Comer Aquí</span>
          </button>

          <button
            onClick={() => setSelectedType('llevar')}
            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
              selectedType === 'llevar' ? 'border-[#FF5722] bg-[#FF5722]/10 text-[#FF5722]' : 'border-[#333] bg-[#1E1E1E] text-gray-400 hover:border-gray-500'
            }`}
          >
            <span className="text-4xl">🛍️</span>
            <span className="font-bold text-sm">Para Llevar</span>
          </button>

          <button
            onClick={() => setSelectedType('pedido')}
            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
              selectedType === 'pedido' ? 'border-[#FF5722] bg-[#FF5722]/10 text-[#FF5722]' : 'border-[#333] bg-[#1E1E1E] text-gray-400 hover:border-gray-500'
            }`}
          >
            <span className="text-4xl">🛵</span>
            <span className="font-bold text-sm">Delivery</span>
          </button>
        </div>

        {/* Campos Dinámicos con Animación */}
        <div className="min-h-[100px] transition-all duration-300">
          {selectedType === 'mesa' && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-gray-300 text-sm font-bold">Seleccionar Mesa:</label>
              <div className="grid grid-cols-4 gap-2">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    disabled={table.state === 'occupied'} 
                    className={`p-3 rounded-lg text-sm font-bold transition-colors ${
                      selectedTableId === table.id 
                        ? 'bg-[#FF5722] text-white' 
                        : table.state === 'occupied'
                          ? 'bg-red-900/30 text-red-500 border border-red-900 cursor-not-allowed'
                          : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333]'
                    }`}
                  >
                    {table.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(selectedType === 'llevar' || selectedType === 'pedido') && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-gray-300 text-sm font-bold">Nombre del Cliente:</label>
              <input
                type="text"
                autoFocus
                className="w-full bg-[#1E1E1E] border border-[#333] rounded-xl p-4 text-white focus:border-[#FF5722] focus:outline-none transition-colors"
                placeholder="Ej. Juan Pérez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-[#333]">
          <Button variant="secondary" onClick={handleClose} className="flex-1 py-4 bg-[#2A2A2A] hover:bg-[#333] text-white border-none">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            loading={isLoading} 
            disabled={!selectedType}
            className="flex-1 py-4 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold shadow-lg shadow-orange-900/20"
          >
            Confirmar Orden
          </Button>
        </div>
      </div>
    </Modal>
  );
};