import React, { useState, useEffect } from 'react';
import { useVisualEditor } from '../../context/VisualEditorContext';
import { ComponentConfig, ComponentType } from '../../types/visualEditor';
import {
  X,
  Settings,
  Layout,
  Palette,
  Database,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sliders,
  Copy,
  Trash2,
  Check,
  RotateCcw,
  Maximize2
} from 'lucide-react';

export const ComponentConfigModal: React.FC = () => {
  const {
    activeEditingId,
    closeConfigModal,
    getComponentConfig,
    updateComponentConfig,
    duplicateComponent,
    deleteComponent
  } = useVisualEditor();

  const [activeTab, setActiveTab] = useState<'geral' | 'layout' | 'estilo' | 'dados'>('geral');
  const [formData, setFormData] = useState<ComponentConfig | null>(null);

  useEffect(() => {
    if (activeEditingId) {
      const current = getComponentConfig(activeEditingId);
      setFormData(current);
    } else {
      setFormData(null);
    }
  }, [activeEditingId]);

  if (!activeEditingId || !formData) return null;

  const handleChange = (field: keyof ComponentConfig, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (formData && activeEditingId) {
      updateComponentConfig(activeEditingId, formData);
      closeConfigModal();
    }
  };

  const handleResetComponent = () => {
    if (activeEditingId) {
      const resetConfig: ComponentConfig = {
        id: activeEditingId,
        name: formData.name,
        type: formData.type,
        visible: true,
        width: 'full',
        height: 'auto',
        alignment: 'left',
        theme: 'default',
        borderWidth: '1px',
        borderRadius: 'xl',
        transparency: 0,
        showLegend: true,
        showProjections: true,
        showUncertaintyBands: true,
        isLocked: false,
      };
      setFormData(resetConfig);
      updateComponentConfig(activeEditingId, resetConfig);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 text-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Configurar Componente
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
                  {formData.type || 'componente'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">ID: {formData.id}</p>
            </div>
          </div>
          <button
            onClick={closeConfigModal}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'geral'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Geral
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'layout'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layout className="w-4 h-4" />
            Dimensões & Layout
          </button>
          <button
            onClick={() => setActiveTab('estilo')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'estilo'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Palette className="w-4 h-4" />
            Estilo Visual
          </button>
          <button
            onClick={() => setActiveTab('dados')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'dados'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Database className="w-4 h-4" />
            Dados & Parâmetros
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Componente (Identificador)</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título Exibido (Sobrescrita)</label>
                <input
                  type="text"
                  placeholder="Manter título padrão do componente"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subtítulo Exibido (Sobrescrita)</label>
                <input
                  type="text"
                  placeholder="Manter subtítulo padrão"
                  value={formData.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block">Visibilidade Pública</span>
                    <span className="text-[10px] text-slate-400">Exibir este elemento aos usuários</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('visible', !formData.visible)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      formData.visible
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-red-500/20 border border-red-500/40 text-red-400'
                    }`}
                  >
                    {formData.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block">Bloquear Posição</span>
                    <span className="text-[10px] text-slate-400">Impedir movimentação involuntária</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('isLocked', !formData.isLocked)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      formData.isLocked
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}
                  >
                    {formData.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Largura do Componente</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'full', label: '100% (Largura Total)' },
                    { id: '1/2', label: '50% (Metade)' },
                    { id: '1/3', label: '33% (Um Terço)' },
                    { id: '2/3', label: '66% (Dois Terços)' },
                    { id: '1/4', label: '25% (Um Quarto)' },
                    { id: '3/4', label: '75% (Três Quartos)' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleChange('width', w.id)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer ${
                        formData.width === w.id
                          ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Altura do Componente</label>
                <select
                  value={formData.height || 'auto'}
                  onChange={(e) => handleChange('height', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="auto">Automático (Conteúdo)</option>
                  <option value="200px">Pequeno (200px)</option>
                  <option value="300px">Médio (300px)</option>
                  <option value="400px">Grande (400px)</option>
                  <option value="500px">Extra Grande (500px)</option>
                  <option value="600px">Máximo (600px)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Alinhamento Interno</label>
                  <select
                    value={formData.alignment || 'left'}
                    onChange={(e) => handleChange('alignment', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="left">Esquerda</option>
                    <option value="center">Centralizado</option>
                    <option value="right">Direita</option>
                    <option value="justify">Justificado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Espaçamento Interno (Padding)</label>
                  <select
                    value={formData.padding || 'p-4'}
                    onChange={(e) => handleChange('padding', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="p-0">Nenhum (0px)</option>
                    <option value="p-2">Compacto (8px)</option>
                    <option value="p-4">Padrão (16px)</option>
                    <option value="p-6">Amplo (24px)</option>
                    <option value="p-8">Generoso (32px)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'estilo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tema Visual Pré-definido</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'default', label: 'Padrão do Sistema' },
                    { id: 'dark', label: 'Escuro Profundo' },
                    { id: 'light', label: 'Modo Claro' },
                    { id: 'cyan', label: 'Destaque Ciano' },
                    { id: 'emerald', label: 'Esmeralda / Alerta' },
                    { id: 'amber', label: 'Âmbar / Atenção' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleChange('theme', t.id)}
                      className={`p-2.5 rounded-lg border text-xs text-center transition-all cursor-pointer ${
                        formData.theme === t.id
                          ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Espessura da Borda</label>
                  <select
                    value={formData.borderWidth || '1px'}
                    onChange={(e) => handleChange('borderWidth', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="none">Sem Borda</option>
                    <option value="1px">Fina (1px)</option>
                    <option value="2px">Média (2px)</option>
                    <option value="4px">Espessa (4px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Arredondamento dos Cantos</label>
                  <select
                    value={formData.borderRadius || 'xl'}
                    onChange={(e) => handleChange('borderRadius', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="none">Reto (0px)</option>
                    <option value="sm">Suave (4px)</option>
                    <option value="md">Médio (8px)</option>
                    <option value="lg">Grande (12px)</option>
                    <option value="xl">Extra Grande (16px)</option>
                    <option value="2xl">Curvo (24px)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Transparência do Fundo</label>
                  <span className="text-cyan-400 font-mono font-bold">{formData.transparency || 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.transparency || 0}
                  onChange={(e) => handleChange('transparency', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 bg-slate-950 rounded-lg h-2"
                />
              </div>
            </div>
          )}

          {activeTab === 'dados' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Município Associado</label>
                  <input
                    type="text"
                    placeholder="Ex: Lajeado, Muçum..."
                    value={formData.municipality || ''}
                    onChange={(e) => handleChange('municipality', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estação Hidrológica</label>
                  <input
                    type="text"
                    placeholder="Ex: Santa Tereza, Encantado..."
                    value={formData.station || ''}
                    onChange={(e) => handleChange('station', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fonte dos Dados</label>
                  <input
                    type="text"
                    placeholder="Ex: SGB/CPRM, INMET, ANA"
                    value={formData.dataSource || ''}
                    onChange={(e) => handleChange('dataSource', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Intervalo de Atualização</label>
                  <select
                    value={formData.updateInterval || '5m'}
                    onChange={(e) => handleChange('updateInterval', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="1m">Tempo Real (1 min)</option>
                    <option value="5m">Normal (5 min)</option>
                    <option value="15m">Periódico (15 min)</option>
                    <option value="1h">Horário (1 hora)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.showLegend ?? true}
                    onChange={(e) => handleChange('showLegend', e.target.checked)}
                    className="rounded accent-cyan-500 w-4 h-4"
                  />
                  <span>Exibir Legenda e Rótulos Informativos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.showProjections ?? true}
                    onChange={(e) => handleChange('showProjections', e.target.checked)}
                    className="rounded accent-cyan-500 w-4 h-4"
                  />
                  <span>Exibir Linhas de Projeção / Tendência</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.showUncertaintyBands ?? true}
                    onChange={(e) => handleChange('showUncertaintyBands', e.target.checked)}
                    className="rounded accent-cyan-500 w-4 h-4"
                  />
                  <span>Exibir Bandas de Incerteza e Cotas Críticas</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetComponent}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restaurar configurações originais deste componente"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Original
            </button>
            <button
              type="button"
              onClick={() => {
                duplicateComponent(activeEditingId);
                closeConfigModal();
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Duplicar este componente"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeConfigModal}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Configurações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
