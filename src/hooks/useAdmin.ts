import { useState, useCallback, useEffect } from 'react';
import type { SystemSettings } from '../models/SystemSettings';
import type { Rule } from '../models/Rules';
import type { ISystemSettingsRepository } from '../repos/interfaces/ISystemSettingsRepository';
import type { IRulesRepository } from '../repos/interfaces/IRulesRepository';
import { AdminService } from '../services/domain/AdminService';
import { useAuthContext } from '../contexts/AuthContext';

export function useAdmin(settingsRepo: ISystemSettingsRepository, rulesRepo: IRulesRepository) {
  const service = new AdminService(settingsRepo, rulesRepo);
  const { user } = useAuthContext(); // Obtenemos usuario actual

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);

  // 🛡️ Verificar si es Admin antes de cualquier operación
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    // SI NO ES ADMIN, ABORTAMOS SILENCIOSAMENTE
    if (!isAdmin) return;

    setLoading(true);
    try {
      const s = await service.getSettings();
      const r = await service.getRules();
      setSettings(s);
      setRules(r);
    } catch (e: any) {
      // Ignoramos errores de permisos para no ensuciar la consola si hubo race condition
      if (e?.code !== 'permission-denied') {
        console.error("Error loading admin settings:", e);
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Solo ejecutamos el efecto si es Admin
  useEffect(() => {
    if (isAdmin) {
      load();
    }
  }, [isAdmin, load]);

  return { settings, rules, loading, saveSettings: service.updateSettings.bind(service), saveRule: service.saveRule.bind(service), refresh: load };
}