import { supabase } from '../services/supabase';
export abstract class BaseRepository<T extends { id: string }> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*');
    
    if (error) throw error;
    return data as T[];
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Código para "no encontrado"
      throw error;
    }
    return data as T;
  }

  // Método auxiliar para ordenar (reemplaza a los orderBy de Firestore)
  async getAllOrdered(field: string, direction: 'asc' | 'desc' = 'asc'): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order(field, { ascending: direction === 'asc' });

    if (error) throw error;
    return data as T[];
  }

  // Método auxiliar para filtros simples (reemplaza where simples)
  async getByField(field: string, value: any): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq(field, value);

    if (error) throw error;
    return data as T[];
  }

  async create(item: T): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  async update(id: string, item: Partial<T>): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update(item)
      .eq('id', id);

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}