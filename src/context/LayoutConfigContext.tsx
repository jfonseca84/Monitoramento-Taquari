import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PageLayoutConfig, PositionMode } from '../types';
import { fetchPageLayoutConfigs, savePageLayoutConfigs, DEFAULT_LAYOUT_CONFIGS } from '../lib/supabase';

interface LayoutConfigContextType {
  configs: PageLayoutConfig[];
  loading: boolean;
  getComponentConfig: (pageKey: string, componentKey: string) => PageLayoutConfig;
  saveConfigs: (updatedConfigs: PageLayoutConfig[]) => Promise<boolean>;
  refreshConfigs: () => Promise<void>;
}

const LayoutConfigContext = createContext<LayoutConfigContextType>({
  configs: DEFAULT_LAYOUT_CONFIGS,
  loading: true,
  getComponentConfig: (pageKey: string, componentKey: string) => {
    const found = DEFAULT_LAYOUT_CONFIGS.find(
      c => c.page_key === pageKey && c.component_key === componentKey
    );
    return found || {
      page_key: pageKey,
      component_key: componentKey,
      position_mode: 'flow',
      sticky_offset: 76
    };
  },
  saveConfigs: async () => false,
  refreshConfigs: async () => {}
});

export const LayoutConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<PageLayoutConfig[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStr = localStorage.getItem('taquari_page_layout_config');
        if (savedStr) {
          const parsed = JSON.parse(savedStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map(parsed.map((item: any) => [`${item.page_key}:${item.component_key}`, item]));
            return DEFAULT_LAYOUT_CONFIGS.map(def => {
              const found = map.get(`${def.page_key}:${def.component_key}`);
              return found ? { ...def, ...found } : def;
            });
          }
        }
      } catch (e) {}
    }
    return DEFAULT_LAYOUT_CONFIGS;
  });

  const [loading, setLoading] = useState(true);

  const loadConfigs = async () => {
    try {
      const data = await fetchPageLayoutConfigs();
      setConfigs(data);
    } catch (err) {
      console.error('Failed to load page layout configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PageLayoutConfig[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        const map = new Map(customEvent.detail.map(item => [`${item.page_key}:${item.component_key}`, item]));
        setConfigs(prev =>
          prev.map(def => {
            const found = map.get(`${def.page_key}:${def.component_key}`);
            return found ? { ...def, ...found } : def;
          })
        );
      } else {
        loadConfigs();
      }
    };

    window.addEventListener('page_layout_config_updated', handleUpdate);
    return () => {
      window.removeEventListener('page_layout_config_updated', handleUpdate);
    };
  }, []);

  const getComponentConfig = (pageKey: string, componentKey: string): PageLayoutConfig => {
    const found = configs.find(
      c => c.page_key === pageKey && c.component_key === componentKey
    );
    if (found) return found;

    const defaultFound = DEFAULT_LAYOUT_CONFIGS.find(
      c => c.page_key === pageKey && c.component_key === componentKey
    );

    return defaultFound || {
      page_key: pageKey,
      component_key: componentKey,
      position_mode: 'flow',
      sticky_offset: 76
    };
  };

  const saveConfigs = async (updatedConfigs: PageLayoutConfig[]): Promise<boolean> => {
    const success = await savePageLayoutConfigs(updatedConfigs);
    if (success) {
      setConfigs(updatedConfigs);
    }
    return success;
  };

  return (
    <LayoutConfigContext.Provider
      value={{
        configs,
        loading,
        getComponentConfig,
        saveConfigs,
        refreshConfigs: loadConfigs
      }}
    >
      {children}
    </LayoutConfigContext.Provider>
  );
};

export const useLayoutConfig = () => useContext(LayoutConfigContext);
