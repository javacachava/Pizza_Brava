import { BaseRepository } from './BaseRepository';
import type { ComboDefinition } from '../models/Combo';


export class ComboRepository extends BaseRepository<ComboDefinition> {
constructor() { super('combos'); }


async getAvailable(): Promise<ComboDefinition[]> {
const all = await this.getAll();
return all.filter(c => c.isAvailable);
}
}