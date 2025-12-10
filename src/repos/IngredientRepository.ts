import { BaseRepository } from './BaseRepository';
import type { Ingredient } from '../models/Ingredient';

export class IngredientRepository extends BaseRepository<Ingredient> {
    constructor() {
        super('ingredients');
    }
}
