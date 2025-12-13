import type { IComboRepository } from '../../repos/interfaces/IComboRepository';
import type { IComboDefinitionRepository } from '../../repos/interfaces/IComboDefinitionRepository';
import type { ComboDefinition } from '../../models/ComboDefinition';
import type { Combo } from '../../models/Combo';

export class ComboService {
  private comboRepo: IComboRepository;
  private comboDefRepo: IComboDefinitionRepository;

  constructor(
    comboRepo: IComboRepository,
    comboDefRepo: IComboDefinitionRepository
  ) {
    this.comboRepo = comboRepo;
    this.comboDefRepo = comboDefRepo;
  }

  async getDefinitions(): Promise<ComboDefinition[]> {
    return this.comboDefRepo.getAll();
  }

  async createDefinition(def: Partial<ComboDefinition>) {
    if (!def.name) throw new Error('El combo requiere nombre');
    return this.comboDefRepo.create(def as ComboDefinition);
  }

  async updateDefinition(id: string, def: Partial<ComboDefinition>) {
    return this.comboDefRepo.update(id, def);
  }

  generateCombo(def: ComboDefinition, selections: Record<string, string[]>): Combo {
    const items = Object.entries(selections).flatMap(([slotId, productIds]) =>
      productIds.map(pid => ({
        productId: pid,
        quantity: 1
      }))
    );

    // CORRECCIÓN: Usar 'price' en lugar de 'basePrice'
    const price = def.price ?? 0;

    return {
      id: crypto.randomUUID(),
      comboDefinitionId: def.id,
      name: def.name,
      items,
      price
    };
  }
}