import { BaseRepository } from '../BaseRepository';
import type { MenuItem } from '../../models/MenuItem';
import type { IMenuRepository } from '../interfaces/IMenuRepository';
import { supabase } from '../../services/supabase';

export class MenuRepository extends BaseRepository<MenuItem> implements IMenuRepository {
  constructor() { super('menu_items'); }

  // Función auxiliar para traducir de SQL (snake_case) a App (camelCase)
  private mapToModel(d: any): MenuItem {
    return {
      ...d,
      categoryId: d.category_id,       // 👈 AQUÍ ESTÁ LA MAGIA DEL FIX
      imageUrl: d.image_url,
      usesIngredients: d.uses_ingredients,
      usesFlavors: d.uses_flavors,
      usesSizeVariant: d.uses_size_variant,
      comboEligible: d.combo_eligible,
      isAvailable: d.is_available
    };
  }

  async getAll(): Promise<MenuItem[]> {
    const { data, error } = await supabase.from(this.tableName).select('*');
    if (error) throw error;
    return data.map(this.mapToModel);
  }

  async getAllAvailable(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('is_available', true);
      
    if (error) throw error;
    return data.map(this.mapToModel);
  }

  async getByCategory(categoryId: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('category_id', categoryId); // Buscamos por la columna real de la BD

    if (error) throw error;
    return data.map(this.mapToModel);
  }
}