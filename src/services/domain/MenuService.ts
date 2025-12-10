import { CategoryRepository } from '../../repos/CategoryRepository';
import { MenuRepository } from '../../repos/MenuRepository';
import type { MenuItem } from '../../models/MenuItem';
import type { Category } from '../../models/Category';

export class MenuService {
    private categoryRepo = new CategoryRepository();
    private menuRepo = new MenuRepository();

    async getFullMenu() {
        const categories = await this.categoryRepo.getAllOrdered();
        const products = await this.menuRepo.getAll();
        
        return categories.map((cat: Category) => ({
            ...cat,
            items: products.filter((p: MenuItem) => p.categoryId === cat.id && p.isAvailable)
        }));
    }

    async getProductById(id: string): Promise<MenuItem | null> {
        return this.menuRepo.getById(id);
    }
}
