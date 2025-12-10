import { ComboRepository } from '../../repos/ComboRepository';
import { MenuRepository } from '../../repos/MenuRepository';

export class ComboService {
    private comboRepo = new ComboRepository();
    private menuRepo = new MenuRepository();

    async getAvailableCombos() {
        const combos = await this.comboRepo.getAll();
        return combos.filter(c => c.isAvailable);
    }
    async getById(id: string) {
        return await this.comboRepo.getById(id);
    }
    async validateCombo(comboId: string, selections: { slotId: string; productId: string; quantity: number }[]) {
        const errors: string[] = [];

        const combo = await this.comboRepo.getById(comboId);
        if (!combo) {
            return { valid: false, errors: [`Combo ${comboId} no encontrado`] };
        }

        const slots = combo.slots || [];

        for (const sel of selections) {
            const slot = slots.find(s => s.id === sel.slotId);
            if (!slot) {
                errors.push(`Slot ${sel.slotId} no existe en combo ${combo.name}`);
                continue;
            }

            const product = await this.menuRepo.getById(sel.productId);
            if (!product) {
                errors.push(`Producto ${sel.productId} no encontrado`);
                continue;
            }

            if (slot.allowedProductIds && slot.allowedProductIds.length > 0 && !slot.allowedProductIds.includes(product.id)) {
                errors.push(`El producto "${product.name}" no está permitido en el slot "${slot.name}"`);
            }
            if (slot.allowedCategoryIds && slot.allowedCategoryIds.length > 0 && !slot.allowedCategoryIds.includes(product.categoryId)) {
                errors.push(`El producto "${product.name}" no pertenece a categorías permitidas para el slot "${slot.name}"`);
            }
        }

        for (const sel of selections) {
            if (sel.productId === combo.id) {
                errors.push('Incoherencia detectada: el combo no puede contenerse a sí mismo');
            }
        }

        return { valid: errors.length === 0, errors };
    }

    async buildOrderItemFromCombo(
        comboId: string,
        selections: { slotId: string; productId: string; quantity: number }[],
        quantity: number
    ) {
        const combo = await this.getById(comboId);
        if (!combo) throw new Error('Combo no encontrado');

        const slotsDetail: {
            slotId: string;
            productId: string;
            productName: string;
            quantity: number;
            unitPrice: number;
        }[] = [];

        for (const s of selections) {
            const product = await this.menuRepo.getById(s.productId);
            if (!product) throw new Error(`Producto ${s.productId} no encontrado`);

            slotsDetail.push({
                slotId: s.slotId,
                productId: s.productId,
                productName: product.name,
                quantity: s.quantity,
                unitPrice: product.price
            });
        }

        const slotsTotal = slotsDetail.reduce((sum, d) => sum + d.unitPrice * d.quantity, 0);

        const unitPrice = combo.basePrice + slotsTotal;
        const totalPrice = unitPrice * quantity;

        return {
            productId: `combo_${combo.id}`,
            productName: combo.name,
            quantity,
            unitPrice,
            totalPrice,
            isCombo: true,
            comboDefinitionId: combo.id,
            comboSlots: slotsDetail
        } as const;
    }

    validateComboSelection(comboId: string, selection: any[]): boolean {
        return typeof comboId === 'string' && Array.isArray(selection);
    }
}
