import { BaseRepository } from "../BaseRepository";
import type { Table } from "../../models";
import type { ITableRepository } from "../interfaces/ITableRepository";

export class TablesRepository extends BaseRepository<Table> implements ITableRepository {
  constructor() { super('tables'); }
  async getAll(): Promise<Table[]> { return super.getAllOrdered('name', 'asc'); }
}