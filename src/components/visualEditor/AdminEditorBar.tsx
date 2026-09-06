import React, { useState } from 'react';
import { useVisualEditor } from '../../context/VisualEditorContext';
import {
  Pencil,
  Save,
  RotateCcw,
  Download,
  Upload,
  Eye,
  Check,
  AlertCircle,
  X,
  Sliders,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const AdminEditorBar: React.FC = () => {
  const {
    isEditMode,
    setEditMode,
    saveLayoutToStorage,
    resetToDefaultLayout,
    exportLayoutJSON,
    importLayoutJSON,
    configs
  } = useVisualEditor();

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  if (!isEditMode) return null;

  const handleSave = async () => {
    await saveLayoutToStorage();
    setNotificationMsg('Layout salvo com sucesso!');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar o layout padrão original do site? Todas as customizações visuais serão resetadas.')) {
      resetToDefaultLayout();
      setNotificationMsg('Layout restaurado para o padrão original.');
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleImportSubmit = () => {
    const success = importLayoutJSON(jsonInput);
    if (success) {
      setShowImportModal(false);
      setJsonInput('');
      setNotificationMsg('Layout importado e aplicado com sucesso!');
      setTimeout(() => setNotificationMsg(null), 3000);
    } else {
      alert('JSON de layout inválido. Verifique o formato e tente novamente.');
    }
  };

  const editedComponentsCount = Object.keys(configs).length;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] w-full max-w-4xl px-4 pointer-events-auto">
        <div className="bg-slate-900/95 border-2 border-cyan-500/80 backdrop-blur-xl text-white rounded-2xl p-2.5 px-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-wrap items-center justify-between gap-3">
          
          {/* LEFT BADGE */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-600 flex items-center justify-center text-black font-bold animate-pulse">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white tracking-wide uppercase">
                  Editor Visual Universal
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400">
                  {editedComponentsCount} componentes configurados
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Passe o mouse sobre qualquer elemento para editar título, largura, cores e visibilidade.
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 flex-wrap">
            {notificationMsg && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {notificationMsg}
              </span>
            )}

            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Layout</span>
            </button>

            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Restaurar layout padrão original"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>

            <button
              onClick={handleExport}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Exportar configuração do layout em JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Exportar</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Importar configuração de layout JSON"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Importar</span>
            </button>

            <button
              onClick={() => setEditMode(false)}
              className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sair do modo de edição e visualizar site público"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Concluir / Sair</span>
            </button>
          </div>

        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                Exportar Layout JSON
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Copie o código JSON abaixo para fazer backup ou importar em outro ambiente.
            </p>
            <textarea
              readOnly
              value={exportLayoutJSON()}
              rows={10}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-mono text-xs text-cyan-300 focus:outline-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportLayoutJSON());
                  alert('JSON do layout copiado para a área de transferência!');
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs"
              >
                Copiar JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Importar Layout JSON
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Cole o código JSON de layout para substituir a configuração atual do dashboard.
            </p>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Cole o JSON de layout aqui..."
              rows={10}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-mono text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs"
              >
                Aplicar Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
