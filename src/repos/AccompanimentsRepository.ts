import { BaseRepository } from './BaseRepository';
import type { Accompaniment } from '../models/Accompaniment';

export class AccompanimentsRepository extends BaseRepository<Accompaniment> {
  constructor() { super('accompaniments'); }
}
