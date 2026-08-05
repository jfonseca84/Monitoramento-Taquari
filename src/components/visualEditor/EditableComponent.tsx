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
    moveComponent,
    swapComponentsOrder
  } = useVisualEditor();

  const config = getComponentConfig(id, {
    name,
    type,
    width: defaultWidth,
    title: defaultTitle,
    subtitle: defaultSubtitle,
  });

  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== id) {
      swapComponentsOrder(draggedId, id);
    }
  };

  // Calculate width class based on config.width
  const getWidthClass = (width?: string) => {
    switch (width) {
      case '1/2':
        return 'w-full lg:w-[calc(50%-10px)] min-w-[260px] flex-1';
      case '1/3':
        return 'w-full lg:w-[calc(33.333%-12px)] min-w-[240px] flex-1';
      case '2/3':
        return 'w-full lg:w-[calc(66.666%-8px)] min-w-[300px] flex-1';
      case '1/4':
        return 'w-full lg:w-[calc(25%-14px)] min-w-[220px] flex-1';
      case '3/4':
        return 'w-full lg:w-[calc(75%-6px)] min-w-[350px] flex-1';
      case 'auto':
        return 'w-auto min-w-0';
      case 'full':
      default:
        return 'w-full min-w-0';
    }
  };

  // Calculate height style
  const heightStyle: React.CSSProperties = config.height && config.height !== 'auto'
    ? { minHeight: config.height, height: config.height, overflow: 'hidden' }
    : {};

  // Opacity calculation from transparency %
  const opacityStyle: React.CSSProperties = config.transparency
    ? { opacity: (100 - config.transparency) / 100 }
    : {};

  const orderStyle: React.CSSProperties = config.order !== undefined
    ? { order: config.order }
    : {};

  // Drag handle for live height resizing in edit mode
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = React.useState(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = containerRef.current?.getBoundingClientRect().height || 280;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(120, Math.round(startHeight + deltaY));
      updateComponentConfig(id, { height: `${newHeight}px` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // IF VISUAL EDIT MODE IS OFF (PUBLIC VISITORS)
  if (!isEditMode) {
    if (config.visible === false) {
      return null;
    }

    const customWidth = getWidthClass(config.width);
    const wrapperClasses = `@container min-w-0 max-w-full ${customWidth} ${className}`.trim();
    const styleObj = { ...orderStyle, ...heightStyle, ...opacityStyle };

    return (
      <div className={wrapperClasses} style={styleObj}>
        {children}
      </div>
    );
  }

  // IF VISUAL EDIT MODE IS ON (ADMIN EDITING)
  const isHiddenInPublic = config.visible === false;
  const customWidth = getWidthClass(config.width);
  const wrapperClasses = `@container min-w-0 max-w-full relative group/editable border-2 transition-all duration-150 rounded-2xl ${
    isResizing ? 'ring-4 ring-cyan-500/50 border-cyan-400' : ''
  } ${
    isDragOver ? 'ring-4 ring-cyan-400 border-cyan-300 bg-cyan-950/40' : ''
  } ${
    isHiddenInPublic
      ? 'border-dashed border-red-500/60 bg-red-950/20'
      : 'border-dashed border-cyan-500/60 hover:border-cyan-400'
  } ${customWidth} ${className}`.trim();

  return (
    <div
      ref={containerRef}
      draggable={!config.isLocked}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={wrapperClasses}
      style={{ ...orderStyle, ...heightStyle, ...opacityStyle }}
    >
      {/* ADMIN OVERLAY HEADER CONTROL BAR */}
      <div className="absolute -top-3 left-3 right-3 z-30 flex items-center justify-between gap-1 bg-slate-900 border border-cyan-500/50 text-white rounded-xl px-2.5 py-1 shadow-2xl opacity-90 group-hover/editable:opacity-100 transition-opacity text-[11px] font-sans">
        
        {/* COMPONENT NAME BADGE */}
        <div className="flex items-center gap-1.5 min-w-0 cursor-grab active:cursor-grabbing">
          <GripHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
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
      <div className={`w-full h-full flex-1 flex flex-col rounded-2xl overflow-hidden ${isHiddenInPublic ? 'opacity-40 grayscale-[50%]' : ''}`}>
        {children}
      </div>

      {/* LIVE DRAG RESIZE HANDLE AT BOTTOM RIGHT */}
      {!config.isLocked && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 z-30 p-1.5 bg-slate-900 border-t border-l border-cyan-500/60 rounded-tl-xl text-cyan-400 hover:text-white hover:bg-cyan-600 transition-colors cursor-se-resize shadow-xl flex items-center justify-center opacity-80 group-hover/editable:opacity-100"
          title="Clique e arraste para redimensionar a altura do componente"
        >
          <Sliders className="w-3.5 h-3.5 rotate-45" />
        </div>
      )}

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
