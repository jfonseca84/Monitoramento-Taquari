import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SiteSettingsProvider } from './context/SiteSettingsContext.tsx';
import { VisualEditorProvider } from './context/VisualEditorContext.tsx';
import { LayoutConfigProvider } from './context/LayoutConfigContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteSettingsProvider>
      <VisualEditorProvider>
        <LayoutConfigProvider>
          <App />
        </LayoutConfigProvider>
      </VisualEditorProvider>
    </SiteSettingsProvider>
  </StrictMode>,
);


