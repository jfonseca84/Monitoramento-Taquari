import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ComponentConfig, DashboardLayoutState } from '../types/visualEditor';
import { isSupabaseConfigured, supabase, verifyAdminUserProfile } from '../lib/supabase';

const LAYOUT_STORAGE_KEY = 'rio_taquari_layout_editor_config_v1';

interface VisualEditorContextType {
  isEditMode: boolean;
  isAdmin: boolean;
  configs: Record<string, ComponentConfig>;
  activeEditingId: string | null;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  getComponentConfig: (id: string, defaultConfig?: Partial<ComponentConfig>) => ComponentConfig;
  updateComponentConfig: (id: string, updates: Partial<ComponentConfig>) => void;
  openConfigModal: (id: string) => void;
  closeConfigModal: () => void;
  resetToDefaultLayout: () => void;
  exportLayoutJSON: () => string;
  importLayoutJSON: (jsonString: string) => boolean;
  saveLayoutToStorage: () => Promise<void>;
  duplicateComponent: (id: string) => void;
  deleteComponent: (id: string) => void;
  moveComponent: (id: string, direction: 'up' | 'down') => void;
  swapComponentsOrder: (id1: string, id2: string) => void;
}

const VisualEditorContext = createContext<VisualEditorContextType>({
  isEditMode: false,
  isAdmin: false,
  configs: {},
  activeEditingId: null,
  toggleEditMode: () => {},
  setEditMode: () => {},
  setIsAdmin: () => {},
  getComponentConfig: (id, defaultConfig) => ({
    id,
    name: defaultConfig?.name || id,
    visible: true,
    width: defaultConfig?.width || 'full',
    ...defaultConfig,
  }),
  updateComponentConfig: () => {},
  openConfigModal: () => {},
  closeConfigModal: () => {},
  resetToDefaultLayout: () => {},
  exportLayoutJSON: () => '',
  importLayoutJSON: () => false,
  saveLayoutToStorage: async () => {},
  duplicateComponent: () => {},
  deleteComponent: () => {},
  moveComponent: () => {},
});

export const VisualEditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAdminState, setIsAdminState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_authenticated');
      return stored === 'true';
    }
    return false;
  });

  const setIsAdmin = (value: boolean) => {
    setIsAdminState(value);
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('admin_authenticated', 'true');
      } else {
        localStorage.removeItem('admin_authenticated');
      }
    }
  };

  // Verify real admin session on mount and listen to auth state changes
  useEffect(() => {
    const checkAdminSession = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const adminProfile = await verifyAdminUserProfile(session.user);
            if (adminProfile) {
              setIsAdmin(true);
              return;
            }
          }
        } catch (e) {
          console.warn('Error checking admin session:', e);
        }
        setIsAdmin(false);
      }
    };

    checkAdminSession();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setIsAdmin(false);
        } else if (session?.user) {
          const adminProfile = await verifyAdminUserProfile(session.user);
          if (adminProfile) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);
  const [configs, setConfigs] = useState<Record<string, ComponentConfig>>({});
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);

  // Load configs on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed: DashboardLayoutState = JSON.parse(saved);
        if (parsed && parsed.components) {
          setConfigs(parsed.components);
        }
      }
    } catch (e) {
      console.error('Error loading saved visual layout config:', e);
    }
  }, []);

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  const setEditMode = (enabled: boolean) => {
    setIsEditMode(enabled);
  };

  const getComponentConfig = (id: string, defaultConfig?: Partial<ComponentConfig>): ComponentConfig => {
    const existing = configs[id];
    if (existing) {
      return {
        ...existing,
        // Fallback default values
        visible: existing.visible ?? true,
        width: existing.width || defaultConfig?.width || 'full',
      };
    }
    // Return default initial config
    return {
      id,
      name: defaultConfig?.name || id,
      type: defaultConfig?.type || 'card',
      title: defaultConfig?.title || '',
      subtitle: defaultConfig?.subtitle || '',
      visible: true,
      order: defaultConfig?.order ?? 0,
      width: defaultConfig?.width || 'full',
      height: defaultConfig?.height || 'auto',
      alignment: defaultConfig?.alignment || 'left',
      theme: defaultConfig?.theme || 'default',
      borderWidth: defaultConfig?.borderWidth || '1px',
      borderRadius: defaultConfig?.borderRadius || 'xl',
      transparency: defaultConfig?.transparency ?? 0,
      station: defaultConfig?.station || '',
      municipality: defaultConfig?.municipality || '',
      dataSource: defaultConfig?.dataSource || '',
      updateInterval: defaultConfig?.updateInterval || '5m',
      showLegend: defaultConfig?.showLegend ?? true,
      showProjections: defaultConfig?.showProjections ?? true,
      showUncertaintyBands: defaultConfig?.showUncertaintyBands ?? true,
      isLocked: defaultConfig?.isLocked ?? false,
      ...defaultConfig,
    };
  };

  const updateComponentConfig = (id: string, updates: Partial<ComponentConfig>) => {
    setConfigs(prev => {
      const current = prev[id] || getComponentConfig(id);
      const updated = {
        ...current,
        ...updates,
      };
      const nextConfigs = {
        ...prev,
        [id]: updated,
      };

      // Auto save to localStorage
      try {
        const stateToSave: DashboardLayoutState = {
          version: 1,
          updatedAt: new Date().toISOString(),
          components: nextConfigs,
        };
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (e) {
        console.error('Failed to save layout:', e);
      }

      return nextConfigs;
    });
  };

  const openConfigModal = (id: string) => {
    setActiveEditingId(id);
  };

  const closeConfigModal = () => {
    setActiveEditingId(null);
  };

  const resetToDefaultLayout = () => {
    setConfigs({});
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch (e) {}
  };

  const exportLayoutJSON = (): string => {
    const stateToExport: DashboardLayoutState = {
      version: 1,
      updatedAt: new Date().toISOString(),
      components: configs,
    };
    return JSON.stringify(stateToExport, null, 2);
  };

  const importLayoutJSON = (jsonString: string): boolean => {
    try {
      const parsed: DashboardLayoutState = JSON.parse(jsonString);
      if (parsed && typeof parsed.components === 'object') {
        setConfigs(parsed.components);
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(parsed));
        return true;
      }
    } catch (e) {
      console.error('Invalid layout JSON:', e);
    }
    return false;
  };

  const saveLayoutToStorage = async () => {
    try {
      const stateToSave: DashboardLayoutState = {
        version: 1,
        updatedAt: new Date().toISOString(),
        components: configs,
      };
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving layout:', e);
    }
  };

  const duplicateComponent = (id: string) => {
    const original = configs[id] || getComponentConfig(id);
    const newId = `${id}_copy_${Date.now()}`;
    const copy: ComponentConfig = {
      ...original,
      id: newId,
      name: `${original.name || original.id} (Cópia)`,
    };
    setConfigs(prev => ({
      ...prev,
      [newId]: copy,
    }));
  };

  const deleteComponent = (id: string) => {
    updateComponentConfig(id, { visible: false });
  };

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const current = configs[id] || getComponentConfig(id);
    const currentOrder = current.order || 0;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    updateComponentConfig(id, { order: newOrder });
  };

  const swapComponentsOrder = (id1: string, id2: string) => {
    if (id1 === id2) return;
    const cfg1 = configs[id1] || getComponentConfig(id1);
    const cfg2 = configs[id2] || getComponentConfig(id2);
    const order1 = cfg1.order ?? 0;
    const order2 = cfg2.order ?? 0;
    
    // Swap order values or give them distinct order values if equal
    const newOrder1 = order2;
    const newOrder2 = order1 === order2 ? order1 + 1 : order1;

    setConfigs(prev => ({
      ...prev,
      [id1]: { ...cfg1, order: newOrder1 },
      [id2]: { ...cfg2, order: newOrder2 },
    }));
  };

  return (
    <VisualEditorContext.Provider
      value={{
        isEditMode,
        isAdmin: isAdminState,
        configs,
        activeEditingId,
        toggleEditMode,
        setEditMode,
        setIsAdmin,
        getComponentConfig,
        updateComponentConfig,
        openConfigModal,
        closeConfigModal,
        resetToDefaultLayout,
        exportLayoutJSON,
        importLayoutJSON,
        saveLayoutToStorage,
        duplicateComponent,
        deleteComponent,
        moveComponent,
        swapComponentsOrder,
      }}
    >
      {children}
    </VisualEditorContext.Provider>
  );
};

export const useVisualEditor = () => useContext(VisualEditorContext);
