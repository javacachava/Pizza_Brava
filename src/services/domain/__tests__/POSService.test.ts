import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POSService } from '../POSService';
import type { OrderItem } from '../../../models/OrderItem';

// Definimos los spies globales para poder controlarlos y asertarlos en los tests
const createTransactionalMock = vi.fn().mockResolvedValue('new-order-id');
const getRulesMock = vi.fn().mockResolvedValue({ taxRate: 0.1 });
const getByIdMock = vi.fn();

// Mockeamos los Repositorios usando clases reales para evitar errores de constructor
vi.mock('../../../repos/OrdersRepository', () => ({
  OrdersRepository: class {
    createTransactional = createTransactionalMock;
  }
}));

vi.mock('../../../repos/RulesRepository', () => ({
  RulesRepository: class {
    getRules = getRulesMock;
  }
}));

vi.mock('../../../repos/MenuRepository', () => ({
  MenuRepository: class {
    getById = getByIdMock;
  }
}));

describe('POSService', () => {
    let service: POSService;

    beforeEach(() => {
        vi.clearAllMocks();
        // Al instanciar el servicio, este usará las clases mockeadas arriba
        service = new POSService();
    });

    it('debe recalcular el total basado en precios del repositorio, ignorando precio del cliente', async () => {
        // Arrange
        const fakeItem: OrderItem = {
            productId: 'p1',
            productName: 'Pizza',
            quantity: 2,
            unitPrice: 5.00, // Precio falso enviado por cliente (simulación de ataque o error)
            totalPrice: 10.00,
            selectedOptions: [],
            isCombo: false
        };
        
        // Configuramos el mock para devolver el precio REAL de la base de datos (10.00)
        getByIdMock.mockResolvedValue({
            id: 'p1',
            name: 'Pizza',
            price: 10.00, // Precio real
            categoryId: 'c1',
            isAvailable: true,
            usesIngredients: false,
            usesFlavors: false,
            usesSizeVariant: false,
            comboEligible: true
        });

        // Act
        await service.createOrder([fakeItem], 'Juan', 'dine-in', 'user1');

        // Assert
        // Verificamos que se llamó a guardar con el subtotal recalculado (2 * 10.00 = 20.00)
        // y NO con el total falso del item (10.00)
        expect(createTransactionalMock).toHaveBeenCalledWith(expect.objectContaining({
            subtotal: 20.00, 
            total: 22.00 // 20.00 + 10% tax (0.1 definido en el mock de Rules)
        }));
    });
});