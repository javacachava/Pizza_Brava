import { MenuRepository } from '../../repos/MenuRepository';
import type { MenuItem } from '../../models/MenuItem';
import { FlavorsRepository } from '../../repos/FlavorsRepository';
import { SizesRepository } from '../../repos/SizesRepository';
import { CombosRepository } from '../../repos/CombosRepository';

export class ProductsAdminService {
  private repo = new MenuRepository();
  private flavorsRepo = new FlavorsRepository();
  private sizesRepo = new SizesRepository();
  private combosRepo = new CombosRepository();

  async listProducts(): Promise<MenuItem[]> {
    return this.repo.getAll();
  }

  async createProduct(data: Omit<MenuItem, 'id'>) {
    return this.repo.create(data);
  }

  async updateProduct(id: string, data: Partial<MenuItem>) {
    return this.repo.update(id, data);
  }

  async deleteProduct(id: string) {
    return this.repo.delete(id);
  }

  async listFlavors() { return this.flavorsRepo.getAllOrdered(); }
  async listSizes() { return this.sizesRepo.getAllOrdered(); }
  async listCombos() { return this.combosRepo.getAll(); }
}
