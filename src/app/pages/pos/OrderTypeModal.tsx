import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import type { OrderType } from '../../../models/Order';
import type { Table } from '../../../models/Table';

interface OrderMeta {
  tableId?: string;
  tableName?: string;
  customerName?: string;
  phone?: string;
  address?: string;
}

interface Props {
  isOpen: boolean; // Renombrado de 'open' a 'isOpen'
  isLoading?: boolean;
  tables: Table[];
  onClose: () => void;
  onConfirm: (type: OrderType, meta: OrderMeta) => void;
}

export const OrderTypeModal: React.FC<Props> = ({
  isOpen,
  isLoading = false,
  tables,
  onClose,
  onConfirm
}) => {
  const [selectedType, setSelectedType] = useState<OrderType>('mesa');
  
  // Form State
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedType('mesa');
      setTableId('');
      setCustomerName('');
      setPhone('');
      setAddress('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const meta: OrderMeta = {};
    
    if (selectedType === 'mesa') {
      const table = tables.find(t => t.id === tableId);
      meta.tableId = tableId;
      meta.tableName = table?.name || 'Mesa desconocida';
    } else {
      meta.customerName = customerName;
      if (selectedType === 'pedido') { // Delivery
        meta.phone = phone;
        meta.address = address;
      }
    }

    onConfirm(selectedType, meta);
  };

  const isFormValid = () => {
    if (selectedType === 'mesa') return !!tableId;
    if (selectedType === 'llevar') return !!customerName.trim();
    if (selectedType === 'pedido') return !!customerName.trim() && !!phone.trim() && !!address.trim();
    return false;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Confirmar Orden"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid() || isLoading}
            className={`${isFormValid() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'} text-white`}
          >
            {isLoading ? 'Procesando...' : 'Confirmar Orden'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 p-1">
        
        {/* Selector de Tipo (Tabs) */}
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
          {(['mesa', 'llevar', 'pedido'] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                selectedType === type
                  ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type === 'mesa' && '🍽️ Mesa'}
              {type === 'llevar' && '🛍️ Llevar'}
              {type === 'pedido' && '🛵 Delivery'}
            </button>
          ))}
        </div>

        {/* Campos Dinámicos */}
        <div className="min-h-[150px]">
          {selectedType === 'mesa' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <label className="block text-sm font-medium text-gray-700">Seleccionar Mesa</label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setTableId(table.id)}
                    disabled={!table.active} // Asumiendo propiedad 'active' o 'occupied'
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      tableId === table.id 
                        ? 'bg-orange-50 border-orange-500 text-orange-700' 
                        : 'bg-white border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {table.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(selectedType === 'llevar' || selectedType === 'pedido') && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Cliente</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-orange-500 outline-none"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
              </div>

              {selectedType === 'pedido' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input
                      type="tel"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-orange-500 outline-none"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ej: 7777-7777"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección de Entrega</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-orange-500 outline-none"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Dirección completa y referencias"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};