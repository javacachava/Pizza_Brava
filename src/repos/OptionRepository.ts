import { BaseRepository } from './BaseRepository';
import type { Option } from '../models/Option';

export class OptionRepository extends BaseRepository<Option> {
    constructor() {
        super('options');
    }
}