// src/repos/BaseRepository.ts
import { supabase } from '../services/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

// Asumimos que T tiene un id opcional, ya que Postgres lo generará
export abstract class BaseRepository<T extends { id?: string }> {
  protected collectionPath: string; // En SQL esto es el nombre de la "Tabla"

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
  }

  // --- CREATE ---
  async create(entity: T): Promise<T> {
    // Si ya tiene ID, intentamos un "upsert" (insertar o actualizar)
    if (entity.id) {
      const { data, error } = await supabase
        .from(this.collectionPath)
        .upsert(entity)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data as T;
    }

    // Si es nuevo, insertamos
    // NOTA: Asegúrate de limpiar campos undefined antes de enviar a Postgres
    const { data, error } = await supabase
      .from(this.collectionPath)
      .insert(entity)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as T;
  }

  // --- READ (Get All) ---
  async getAll(limitCount?: number): Promise<T[]> {
    let query = supabase.from(this.collectionPath).select('*');
    
    if (limitCount && limitCount > 0) {
      query = query.limit(limitCount);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as T[];
  }

  // --- READ (Get By ID) ---
  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.collectionPath)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
        // Código PGRST116 significa "No rows found" en Supabase/Postgres
        if (error.code === 'PGRST116') return null; 
        throw new Error(error.message);
    }
    return data as T;
  }

  // --- UPDATE ---
  async update(id: string, partial: Partial<T>): Promise<void> {
    const { error } = await supabase
      .from(this.collectionPath)
      .update(partial)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- DELETE ---
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.collectionPath)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- UTILIDADES ---
  
  async getByField(field: string, value: any): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.collectionPath)
      .select('*')
      .eq(field, value);

    if (error) throw new Error(error.message);
    return data as T[];
  }

  // Postgres devuelve los datos ordenados si se lo pides
  async getAllOrdered(orderField = 'created_at', direction: 'asc' | 'desc' = 'asc'): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.collectionPath)
      .select('*')
      .order(orderField, { ascending: direction === 'asc' });

    if (error) throw new Error(error.message);
    return data as T[];
  }

  // --- REALTIME (Snapshot) ---
  // Supabase maneja esto diferente a Firestore, necesitas suscribirte
  onSnapshot(callback: (items: T[]) => void) {
    // 1. Carga inicial
    this.getAll().then(items => callback(items));

    // 2. Suscripción a cambios
    const channel = supabase
      .channel(`public:${this.collectionPath}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: this.collectionPath }, payload => {
        // Cuando algo cambia, recargamos todo (estrategia simple)
        // O podrías actualizar el estado localmente para ser más eficiente
        this.getAll().then(items => callback(items));
      })
      .subscribe();

    // Retornamos una función para desuscribirse (limpieza)
    return () => {
      supabase.removeChannel(channel);
    };
  }
}