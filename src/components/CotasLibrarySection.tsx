import React, { useState } from 'react';
import { FolderOpen, Search, FileText, ExternalLink, Download, X } from 'lucide-react';

export const CotasLibrarySection: React.FC = () => {
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [selectedDirectDocument, setSelectedDirectDocument] = useState<{
    cotaNum: number;
    cotaTitle: string;
    fileUrl: string;
  } | null>(null);

  // Simplified Clean Technical Library Dataset (Cotas Cards - 19m to 34m)
  const cotasLibrarySimplified = [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34].map((cotaNum) => {
    let status = 'INUNDAÇÃO INICIAL';
    let color = 'border-amber-500/80 text-amber-300 bg-amber-950/20';
    let category = 'inundacao';

    if (cotaNum <= 20) {
      status = 'INUNDAÇÃO INICIAL';
      color = 'border-amber-500/80 text-amber-300 bg-amber-950/20';
      category = 'atencao';
    } else if (cotaNum <= 23) {
      status = 'INUNDAÇÃO SEVERA';
      color = 'border-orange-500/80 text-orange-300 bg-orange-950/20';
      category = 'alerta';
    } else if (cotaNum <= 26) {
      status = 'INUNDAÇÃO CRÍTICA';
      color = 'border-rose-500/90 text-rose-300 bg-rose-950/20';
      category = 'inundacao';
    } else if (cotaNum <= 29) {
      status = 'EMERGÊNCIA REGIONAL';
      color = 'border-purple-500/90 text-purple-300 bg-purple-950/30';
      category = 'inundacao';
    } else if (cotaNum <= 31) {
      status = 'DESASTRE URBANO';
      color = 'border-pink-600/90 text-pink-300 bg-pink-950/30';
      category = 'catastrofico';
    } else {
      status = 'NÍVEL EXTREMO HISTÓRICO';
      color = 'border-red-600/90 text-red-300 bg-red-950/40';
      category = 'catastrofico';
    }

    return {
      cota: `Cota ${cotaNum} m`,
      cotaNum,
      cotaVal: cotaNum,
      status,
      category,
      color,
      fileUrl: `https://xaqttiojmz2xmbzrptob6x.supabase.co/storage/v1/object/public/documentos_cotas/cota_${cotaNum}m.pdf`
    };
  });

  const handleOpenDirectCotaFile = (item: typeof cotasLibrarySimplified[0]) => {
    setSelectedDirectDocument({
      cotaNum: item.cotaNum,
      cotaTitle: item.cota,
      fileUrl: item.fileUrl
    });
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      // Fallback
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <>
      <div className="bg-[#0A1226] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        
        {/* HEADER DA BIBLIOTECA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-950 text-cyan-400 border border-sky-800 shrink-0">
              <FolderOpen className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  BIBLIOTECA TÉCNICA HIDROLÓGICA POR COTAS
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                  DOCUMENTAÇÃO INSTITUCIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
                Cards de acesso direto por elevação de cota (19m a 34m). Clique sobre qualquer cota para abrir a caixa de exibição do documento técnico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={librarySearchTerm}
                onChange={(e) => setLibrarySearchTerm(e.target.value)}
                placeholder="Buscar cota..."
                className="w-full bg-[#050A18] text-xs text-slate-100 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-3 py-1.5 rounded-xl border border-cyan-800 shrink-0 hidden sm:inline">
              16 Cotas Mapeadas
            </span>
          </div>
        </div>

        {/* COTAS CARDS GRID (COTAS 19 A 34) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {cotasLibrarySimplified
            .filter(item => {
              if (librarySearchTerm) {
                const term = librarySearchTerm.toLowerCase();
                return item.cota.toLowerCase().includes(term) || item.status.toLowerCase().includes(term);
              }
              return true;
            })
            .map((item) => (
              <div
                key={item.cotaNum}
                onClick={() => handleOpenDirectCotaFile(item)}
                className={`p-3.5 rounded-2xl bg-[#050A18] border ${item.color} hover:bg-slate-900 hover:scale-105 transition-all cursor-pointer group shadow-lg flex flex-col justify-between space-y-3 min-h-[95px]`}
              >
                <div>
                  <span className="text-sm font-mono font-black text-white group-hover:text-cyan-300 block">
                    {item.cota}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase block mt-1 text-slate-300 truncate">
                    {item.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-cyan-400 font-extrabold group-hover:underline">
                  <span>Abrir Arquivo</span>
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* VISUALIZADOR DIRETO DE ARQUIVO DA COTA (CAIXA DE EXIBIÇÃO) */}
      {selectedDirectDocument && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#0A1226] border-2 border-cyan-500/80 rounded-3xl p-5 max-w-5xl w-full h-[85vh] flex flex-col justify-between shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-700">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase">
                    ARQUIVO DA {selectedDirectDocument.cotaTitle.toUpperCase()}
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-cyan-400 font-mono">
                    Supabase Storage • cota_{selectedDirectDocument.cotaNum}m.pdf
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={selectedDirectDocument.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Abrir em nova aba</span>
                </a>

                <button
                  onClick={() => handleDownload(selectedDirectDocument.fileUrl, `cota_${selectedDirectDocument.cotaNum}m.pdf`)}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setSelectedDirectDocument(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer ml-1"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DOCUMENT EMBEDDED PREVIEW / IFRAME */}
            <div className="flex-1 w-full bg-[#050A18] rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col items-center justify-center">
              <iframe
                src={selectedDirectDocument.fileUrl}
                className="w-full h-full rounded-xl border-0"
                title={`Documento da Cota ${selectedDirectDocument.cotaNum}m`}
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
              <span className="truncate max-w-xl">
                Caminho do arquivo no Supabase: <span className="text-cyan-300 font-semibold">{selectedDirectDocument.fileUrl}</span>
              </span>
              <button
                onClick={() => setSelectedDirectDocument(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                FECHAR DOCUMENTO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
