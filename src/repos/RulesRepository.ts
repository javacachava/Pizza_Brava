import { BaseRepository } from './BaseRepository';
import type { Rule } from '../models/Rules';

export class RulesRepository extends BaseRepository<Rule> {
  constructor() { super('rules'); }

  async getByKey(key: string): Promise<Rule | null> {
    const all = await this.getAll();
    return all.find(r => r.key === key) || null;
  }
}
