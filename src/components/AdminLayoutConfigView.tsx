import React, { useState, useEffect } from 'react';
import { PageLayoutConfig, PositionMode } from '../types';
import { useLayoutConfig } from '../context/LayoutConfigContext';
import { Sliders, Save, CheckCircle2, AlertCircle, RotateCcw, Info, Layout, Layers } from 'lucide-react';

export const AdminLayoutConfigView: React.FC = () => {
  const { configs, saveConfigs, refreshConfigs } = useLayoutConfig();
  const [localConfigs, setLocalConfigs] = useState<PageLayoutConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'inicio' | 'centro_analises'>('inicio');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setLocalConfigs(JSON.parse(JSON.stringify(configs)));
  }, [configs]);

  const handlePositionModeChange = (pageKey: string, componentKey: string, mode: PositionMode) => {
    setLocalConfigs(prev =>
      prev.map(item => {
        if (item.page_key === pageKey && item.component_key === componentKey) {
          return { ...item, position_mode: mode };
        }
        return item;
      })
    );
    setFeedback(null);
  };

  const handleOffsetChange = (pageKey: string, componentKey: string, offsetValue: number) => {
    setLocalConfigs(prev =>
      prev.map(item => {
        if (item.page_key === pageKey && item.component_key === componentKey) {
          return { ...item, sticky_offset: Math.max(0, offsetValue) };
        }
        return item;
      })
    );
    setFeedback(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const success = await saveConfigs(localConfigs);
      if (success) {
        setFeedback({
          type: 'success',
          message: 'Alterações salvas com sucesso!'
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Erro ao salvar configuração.'
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: 'Erro ao salvar configuração.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToCurrent = () => {
    setLocalConfigs(JSON.parse(JSON.stringify(configs)));
    setFeedback(null);
  };

  const filteredConfigs = localConfigs.filter(item => item.page_key === activeTab);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-[#0B132B] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Configuração de Layout</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Defina o comportamento de rolagem (sticky vs fluxo normal) e topo (offset) para cada componente
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetToCurrent}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Descartar Alterações</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SALVAR ALTERAÇÕES</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-center justify-between transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-sm font-semibold">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* PAGE SELECTOR TABS */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('inicio')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inicio'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Página Inicial</span>
          </button>

          <button
            onClick={() => setActiveTab('centro_analises')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'centro_analises'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Centro de Análises</span>
          </button>
        </div>
      </div>

      {/* COMPONENT CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredConfigs.map(item => {
          const isSticky = item.position_mode === 'sticky';

          return (
            <div
              key={`${item.page_key}-${item.component_key}`}
              className="bg-[#0B132B] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{item.component_name || item.component_key}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Chave: <code className="text-cyan-400 bg-slate-900/80 px-1.5 py-0.5 rounded font-mono">{item.component_key}</code>
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    isSticky
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isSticky ? 'FIXO (STICKY)' : 'FLUXO NORMAL'}
                </span>
              </div>

              {/* BEHAVIOR RADIO SELECTION */}
              <div className="space-y-2 bg-[#070F22] p-3.5 rounded-xl border border-slate-800/80">
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Comportamento de rolagem:
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePositionModeChange(item.page_key, item.component_key, 'flow')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      !isSticky
                        ? 'bg-slate-800 border-cyan-500/80 text-white shadow-sm'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${!isSticky ? 'border-cyan-400 bg-cyan-400/20' : 'border-slate-600'}`}>
                      {!isSticky && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </span>
                    <span>Rolar com a página</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePositionModeChange(item.page_key, item.component_key, 'sticky')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isSticky
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSticky ? 'border-cyan-400 bg-cyan-400/20' : 'border-slate-600'}`}>
                      {isSticky && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </span>
                    <span>Ficar fixo durante o scroll</span>
                  </button>
                </div>
              </div>

              {/* STICKY TOP OFFSET CONFIGURATION */}
              {isSticky && (
                <div className="bg-[#070F22] p-3.5 rounded-xl border border-cyan-900/30 flex items-center justify-between gap-4 animate-fadeIn">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block">
                      Distância do topo (Top Offset):
                    </label>
                    <p className="text-[11px] text-slate-400">Distância do cabeçalho em pixels</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-400">Top:</span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={item.sticky_offset}
                        onChange={(e) => handleOffsetChange(item.page_key, item.component_key, parseInt(e.target.value) || 0)}
                        className="w-20 bg-slate-900 border border-slate-700 focus:border-cyan-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg text-center outline-none transition-all"
                      />
                      <span className="text-xs text-slate-400 ml-1.5 font-semibold">px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER ACTION NOTICE */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>As alterações de layout são mantidas em rascunho e aplicadas publicamente no portal somente após clicar em <strong>SALVAR ALTERAÇÕES</strong>.</span>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
};
