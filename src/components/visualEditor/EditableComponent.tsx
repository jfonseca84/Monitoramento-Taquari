import React, { ReactNode } from 'react';
import { useVisualEditor } from '../../context/VisualEditorContext';
import { ComponentType, ComponentConfig } from '../../types/visualEditor';
import {
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Move,
  Sliders,
  GripHorizontal
} from 'lucide-react';

interface EditableComponentProps {
  id: string;
  name: string;
  type?: ComponentType;
  defaultWidth?: 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4' | 'auto';
  defaultTitle?: string;
  defaultSubtitle?: string;
  children: ReactNode;
  className?: string;
}

export const EditableComponent: React.FC<EditableComponentProps> = ({
  id,
  name,
  type = 'card',
  defaultWidth = 'full',
  defaultTitle,
  defaultSubtitle,
  children,
  className = ''
}) => {
  const {
    isEditMode,
    getComponentConfig,
    updateComponentConfig,
    openConfigModal,
    duplicateComponent,
    deleteComponent,
    moveComponent
  } = useVisualEditor();

  const config = getComponentConfig(id, {
    name,
    type,
    width: defaultWidth,
    title: defaultTitle,
    subtitle: defaultSubtitle,
  });

  // Calculate width class based on config.width
  const getWidthClass = (width?: string) => {
    switch (width) {
      case '1/2':
        return 'col-span-1 lg:col-span-6 w-full';
      case '1/3':
        return 'col-span-1 lg:col-span-4 w-full';
      case '2/3':
        return 'col-span-1 lg:col-span-8 w-full';
      case '1/4':
        return 'col-span-1 lg:col-span-3 w-full';
      case '3/4':
        return 'col-span-1 lg:col-span-9 w-full';
      case 'full':
      default:
        return 'w-full';
    }
  };

  // Calculate height style
  const heightStyle = config.height && config.height !== 'auto' ? { minHeight: config.height } : {};

  // Opacity calculation from transparency %
  const opacityStyle = config.transparency ? { opacity: (100 - config.transparency) / 100 } : {};

  // IF VISUAL EDIT MODE IS OFF
  if (!isEditMode) {
    if (config.visible === false) {
      return null;
    }

    // Standard public rendering: 100% untouched layout & appearance
    const customWidth = config.width && config.width !== 'full' ? getWidthClass(config.width) : '';
    const wrapperClasses = `${customWidth} ${className}`.trim();

    if (wrapperClasses || Object.keys(heightStyle).length > 0 || Object.keys(opacityStyle).length > 0) {
      return (
        <div className={wrapperClasses} style={{ ...heightStyle, ...opacityStyle }}>
          {children}
        </div>
      );
    }

    return <>{children}</>;
  }

  // IF VISUAL EDIT MODE IS ON (ADMIN EDITING)
  const isHiddenInPublic = config.visible === false;

  return (
    <div
      className={`relative group/editable border-2 transition-all duration-200 my-1 rounded-2xl ${
        isHiddenInPublic
          ? 'border-dashed border-red-500/60 bg-red-950/10'
          : 'border-dashed border-cyan-500/70 hover:border-cyan-400 bg-cyan-950/5'
      } ${className}`}
      style={{ ...heightStyle, ...opacityStyle }}
    >
      {/* ADMIN OVERLAY HEADER CONTROL BAR */}
      <div className="absolute -top-3 left-3 right-3 z-30 flex items-center justify-between gap-1 bg-slate-900 border border-cyan-500/50 text-white rounded-xl px-2.5 py-1 shadow-2xl opacity-90 group-hover/editable:opacity-100 transition-opacity text-[11px] font-sans">
        
        {/* COMPONENT NAME BADGE */}
        <div className="flex items-center gap-1.5 min-w-0">
          <GripHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0 cursor-grab" />
          <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
            {config.type || type}
          </span>
          <span className="font-bold text-slate-200 truncate max-w-[150px] sm:max-w-[200px]" title={config.name || name}>
            {config.name || name}
          </span>
          {isHiddenInPublic && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-900/80 text-red-300 border border-red-700 shrink-0">
              Oculto
            </span>
          )}
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-1 shrink-0">
          {/* QUICK WIDTH SELECTOR */}
          <div className="hidden md:flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 mr-1">
            {(['full', '1/2', '1/3', '2/3'] as const).map((w) => (
              <button
                key={w}
                onClick={() => updateComponentConfig(id, { width: w })}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-colors ${
                  config.width === w
                    ? 'bg-cyan-500 text-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={`Largura: ${w}`}
              >
                {w === 'full' ? '100%' : w === '1/2' ? '50%' : w === '1/3' ? '33%' : '66%'}
              </button>
            ))}
          </div>

          {/* MOVE UP */}
          <button
            onClick={() => moveComponent(id, 'up')}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Mover para cima"
          >
            <ArrowUp className="w-3 h-3" />
          </button>

          {/* MOVE DOWN */}
          <button
            onClick={() => moveComponent(id, 'down')}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Mover para baixo"
          >
            <ArrowDown className="w-3 h-3" />
          </button>

          {/* TOGGLE VISIBILITY */}
          <button
            onClick={() => updateComponentConfig(id, { visible: !config.visible })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              config.visible !== false
                ? 'text-emerald-400 hover:bg-emerald-950/80'
                : 'text-red-400 hover:bg-red-950/80'
            }`}
            title={config.visible !== false ? 'Ocultar elemento' : 'Mostrar elemento'}
          >
            {config.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* TOGGLE LOCK */}
          <button
            onClick={() => updateComponentConfig(id, { isLocked: !config.isLocked })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              config.isLocked
                ? 'text-amber-400 hover:bg-amber-950/80'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={config.isLocked ? 'Posição Bloqueada' : 'Bloquear Posição'}
          >
            {config.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {/* EDIT CONFIG MODAL BUTTON */}
          <button
            onClick={() => openConfigModal(id)}
            className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-bold rounded-md shadow-md flex items-center gap-1 cursor-pointer text-[10px]"
            title="Configurar Componente (Título, Cores, Estilos, Fontes de Dados)"
          >
            <Settings className="w-3 h-3" />
            <span>Configurar</span>
          </button>

          {/* DUPLICATE */}
          <button
            onClick={() => duplicateComponent(id)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Duplicar componente"
          >
            <Copy className="w-3 h-3" />
          </button>

          {/* DELETE / REMOVE */}
          <button
            onClick={() => deleteComponent(id)}
            className="p-1 rounded hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Excluir do layout"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* CHILDREN WRAPPER */}
      <div className={`p-1 ${isHiddenInPublic ? 'opacity-40 grayscale-[50%]' : ''}`}>
        {children}
      </div>

      {/* HIDDEN BADGE OVERLAY WHEN COMPONENT IS SET TO HIDDEN */}
      {isHiddenInPublic && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center p-2 z-20 pointer-events-none">
          <div className="bg-red-950/90 border border-red-700/80 text-red-200 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xl">
            <EyeOff className="w-4 h-4 text-red-400" />
            <span>Elemento Oculto para Visitantes</span>
          </div>
        </div>
      )}
    </div>
  );
};
