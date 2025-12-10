import { BaseRepository } from './BaseRepository';
import type { ComboDefinition } from '../models/ComboDefinition';

export class CombosRepository extends BaseRepository<ComboDefinition> {
  constructor() { super('combos_def'); }
}
