import { BaseRepository } from '../BaseRepository';
import type { MenuItem } from '../../models/MenuItem';
import type { IMenuRepository } from '../interfaces/IMenuRepository';
import { supabase } from '../../services/supabase';

export class MenuRepository extends BaseRepository<MenuItem> implements IMenuRepository {
  constructor() { super('menu_items'); }

  async getAll(): Promise<MenuItem[]> {
    return super.getAll();
  }

  async getAllAvailable(): Promise<MenuItem[]> {
    // Firebase: where('isAvailable', '==', true)
    // Supabase: .eq('is_available', true) 
    // NOTA: Recuerda que en SQL usamos snake_case (is_available) si así creaste la tabla
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('is_available', true);
      
    if (error) throw error;
    return data as MenuItem[];
  }

  async getByCategory(categoryId: string): Promise<MenuItem[]> {
    // Firebase: getByField('categoryId', categoryId)
    // Supabase: .eq('category_id', categoryId)
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('category_id', categoryId);

    if (error) throw error;
    return data as MenuItem[];
  }
}