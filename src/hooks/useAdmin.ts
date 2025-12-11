import { useState, useCallback, useEffect } from 'react';
import type { SystemSettings } from '../models/SystemSettings';
import type { Rule } from '../models/Rules';
import type { ISystemSettingsRepository } from '../repos/interfaces/ISystemSettingsRepository';
import type { IRulesRepository } from '../repos/interfaces/IRulesRepository';
import { AdminService } from '../services/domain/AdminService';
import { useAuthContext } from '../contexts/AuthContext';

export function useAdmin(settingsRepo: ISystemSettingsRepository, rulesRepo: IRulesRepository) {
  const service = new AdminService(settingsRepo, rulesRepo);
  const { isAuthenticated } = useAuthContext();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return; // 🛑

    setLoading(true);
    try {
      const s = await service.getSettings();
      const r = await service.getRules();
      setSettings(s);
      setRules(r);
    } catch (e) {
      console.error("Error loading admin settings:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const saveSettings = useCallback(async (partial: Partial<SystemSettings>) => {
    await service.updateSettings(partial);
    await load();
  }, [load]);

  const saveRule = useCallback(async (r: Partial<Rule>) => {
    await service.saveRule(r);
    await load();
  }, [load]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  return { settings, rules, loading, saveSettings, saveRule, refresh: load };
}