import { BaseRepository } from './BaseRepository';
import type { SystemInfo } from '../models/SystemInfo';

export class SystemInfoRepository extends BaseRepository<SystemInfo> {
    constructor() {
        super('system_info');
    }
}