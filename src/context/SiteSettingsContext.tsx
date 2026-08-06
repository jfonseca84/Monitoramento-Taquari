import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiteSettings } from '../types';
import { fetchSiteSettings, saveSiteSettings, DEFAULT_SITE_SETTINGS } from '../lib/supabase';

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SiteSettings>) => Promise<SiteSettings>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SITE_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
  updateSettings: async () => DEFAULT_SITE_SETTINGS,
});

export const SiteSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('taquari_site_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_SITE_SETTINGS, ...parsed };
        }
      } catch (e) {}
    }
    return DEFAULT_SITE_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  const applyFaviconAndTitle = (currentSettings: SiteSettings) => {
    if (typeof document === 'undefined') return;

    // 1. Update Document Title
    if (currentSettings.site_name) {
      document.title = currentSettings.site_subtitle
        ? `${currentSettings.site_name} - ${currentSettings.site_subtitle}`
        : currentSettings.site_name;
    }

    // 2. Update Favicon Link in Head
    if (currentSettings.favicon_url) {
      let faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.id = 'dynamic-favicon';
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      
      // Determine image type or fallback
      const url = currentSettings.favicon_url;
      let type = 'image/png';
      if (url.endsWith('.ico')) type = 'image/x-icon';
      else if (url.endsWith('.svg')) type = 'image/svg+xml';
      
      faviconLink.type = type;
      // Apply cache busting parameter
      const cacheBust = currentSettings.updated_at
        ? new Date(currentSettings.updated_at).getTime()
        : Date.now();
      faviconLink.href = `${url}${url.includes('?') ? '&' : '?'}v=${cacheBust}`;
    } else {
      const faviconLink = document.getElementById('dynamic-favicon');
      if (faviconLink) {
        faviconLink.remove();
      }
    }
  };

  const loadSettings = async () => {
    try {
      const data = await fetchSiteSettings();
      setSettings(data);
      applyFaviconAndTitle(data);
    } catch (err) {
      console.error('Failed to load site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SiteSettings>): Promise<SiteSettings> => {
    const updated = await saveSiteSettings(updates);
    setSettings(updated);
    applyFaviconAndTitle(updated);
    return updated;
  };

  useEffect(() => {
    loadSettings();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SiteSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
        applyFaviconAndTitle(customEvent.detail);
      } else {
        loadSettings();
      }
    };

    window.addEventListener('site_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('site_settings_updated', handleUpdate);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: loadSettings,
        updateSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
