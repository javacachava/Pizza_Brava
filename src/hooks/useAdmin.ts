import { useState, useCallback, useEffect } from 'react';
import type { SystemSettings } from '../models/SystemSettings';
import type { Rule } from '../models/Rules';
import type { ISystemSettingsRepository } from '../repos/interfaces/ISystemSettingsRepository';
import type { IRulesRepository } from '../repos/interfaces/IRulesRepository';
import { AdminService } from '../services/domain/AdminService';
import { useAuthContext } from '../contexts/AuthContext'; // 1. Importar Auth

export function useAdmin(settingsRepo: ISystemSettingsRepository, rulesRepo: IRulesRepository) {
  const service = new AdminService(settingsRepo, rulesRepo);
  const { user } = useAuthContext(); // 2. Obtener el usuario

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    // 🛑 3. ESCUDO DE SEGURIDAD:
    // Si no hay usuario o NO es admin, no hacemos nada.
    // Esto evita el error "Missing permissions" en la consola del cocinero.
    if (!user || user.role !== 'admin') return;

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
  }, [user]); // Dependencia clave: user

  useEffect(() => {
    if (user?.role === 'admin') {
      load();
    }
  }, [user, load]);

  return { settings, rules, loading, saveSettings: service.updateSettings.bind(service), saveRule: service.saveRule.bind(service), refresh: load };
}