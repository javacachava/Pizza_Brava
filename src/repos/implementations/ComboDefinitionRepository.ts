import { BaseRepository } from '../BaseRepository';
import type { ComboDefinition } from '../../models/ComboDefinition';
import type { IComboDefinitionRepository } from '../interfaces/IComboDefinitionRepository';

export class ComboDefinitionRepository extends BaseRepository<ComboDefinition> implements IComboDefinitionRepository {
  constructor() { super('combos'); }

  async getAll(): Promise<ComboDefinition[]> { return super.getAll(); }
}
