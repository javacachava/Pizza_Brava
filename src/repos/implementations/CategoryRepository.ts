import type { Category } from "../../models";
import { BaseRepository } from "../BaseRepository";
import type { ICategoryRepository } from "../interfaces/ICategoryRepository";

export class CategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
  constructor() { super('categories'); }

  async getAll(): Promise<Category[]> { return super.getAll(); }
  async getAllOrdered(): Promise<Category[]> { return super.getAllOrdered('sort_order', 'asc'); }
}