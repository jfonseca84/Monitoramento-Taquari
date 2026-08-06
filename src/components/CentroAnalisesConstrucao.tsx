import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  ChevronDown, 
  ChevronRight, 
  Info, 
  FileCode, 
  Settings, 
  Activity, 
  Sparkles,
  Layers,
  Share2,
  Bell,
  Code2
} from 'lucide-react';

interface CentroAnalisesConstrucaoProps {
  title?: string;
  subtitle?: string;
}

export const CentroAnalisesConstrucao: React.FC<CentroAnalisesConstrucaoProps> = ({
  title = "Coletando dados para exibição... Volte depois.",
  subtitle = "Estamos configurando o Centro de Análises para disponibilizar informações mais completas, consistentes e confiáveis. Volte em breve."
}) => {
  // Folder tree open state
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    dashboard: true,
    hidrologia: false,
    meteorologia: false,
    alertas: false,
    relatorios: false,
    sistema: false
  });

  // Code typing effect state
  const [typedLineIndex, setTypedLineIndex] = useState(0);

  const toggleFolder = (key: string) => {
    setOpenFolders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const codeSnippet = [
    { line: 1, text: "import React from 'react';" },
    { line: 2, text: "import { Container, Title, Grid } from './styles';" },
    { line: 3, text: "" },
    { line: 4, text: "const CentroAnalises: React.FC = () => {" },
    { line: 5, text: "  return (" },
    { line: 6, text: "    <Container>" },
    { line: 7, text: "      <Title>Centro de Análises</Title>" },
    { line: 8, text: "    </Container>" },
    { line: 9, text: "  );" },
    { line: 10, text: "};" },
    { line: 11, text: "" },
    { line: 12, text: "export default CentroAnalises;" }
  ];

  // Typing animation interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTypedLineIndex(prev => (prev < codeSnippet.length ? prev + 1 : prev));
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto mb-4 bg-[#030712] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-300 relative flex flex-col min-h-[720px] transition-all">
      
      {/* CSS STYLES FOR STEAM ANIMATION & GLOW */}
      <style>{`
        @keyframes steamRising {
          0% {
            transform: translateY(0) scaleX(1);
            opacity: 0;
          }
          30% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-22px) scaleX(1.3);
            opacity: 0;
          }
        }
        .animate-steam-1 {
          animation: steamRising 2.8s infinite ease-out;
        }
        .animate-steam-2 {
          animation: steamRising 2.8s infinite ease-out 0.9s;
        }
        .animate-steam-3 {
          animation: steamRising 2.8s infinite ease-out 1.8s;
        }
      `}</style>

      {/* VS CODE WINDOW TOP BAR */}
      <div className="bg-[#0b0f19] border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs select-none">
        {/* Left Window Dots & Tab */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          <div className="flex items-center gap-2 bg-[#050914] px-3 py-1.5 rounded-t-lg border-t-2 border-cyan-400 text-cyan-300 font-mono text-xs shadow-inner">
            <span className="text-cyan-400 font-bold text-[10px]">{`⚛`}</span>
            <span>CentroAnalises.tsx</span>
            <span className="text-slate-500 text-[10px] ml-1 hover:text-white cursor-pointer">✕</span>
          </div>
        </div>

        {/* Center Breadcrumb */}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
          <span>src</span>
          <span>›</span>
          <span>pages</span>
          <span>›</span>
          <span className="text-cyan-300 font-bold">CentroAnalises.tsx</span>
          <span>›</span>
          <span className="text-slate-300">CentroAnalises</span>
        </div>

        {/* Right Window Controls */}
        <div className="flex items-center gap-3 text-slate-400">
          <Share2 className="w-3.5 h-3.5 hover:text-cyan-400 cursor-pointer" />
          <Code2 className="w-3.5 h-3.5 hover:text-cyan-400 cursor-pointer" />
          <Settings className="w-3.5 h-3.5 hover:text-cyan-400 cursor-pointer" />
        </div>
      </div>

      {/* MAIN VS CODE LAYOUT: SIDEBAR + EDITOR */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: FILE EXPLORER (FOLDERS ONLY) */}
        <div className="w-64 md:w-72 bg-[#080d1a] border-r border-slate-800/80 flex flex-col shrink-0 select-none hidden sm:flex">
          
          {/* Explorer Header */}
          <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
              EXPLORADOR
            </span>
            <span className="text-slate-500 text-[10px]">•••</span>
          </div>

          {/* Root Project Title */}
          <div className="px-3 py-2 text-xs font-bold text-slate-200 flex items-center gap-1.5 tracking-wide border-b border-slate-800/40 bg-slate-900/30">
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="uppercase text-[11px] tracking-wider text-cyan-400 font-mono">PROJETO NÍVEL TAQUARI</span>
          </div>

          {/* Folder Structure (Only folders, no files or extensions) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono custom-scrollbar">
            
            {/* 1. Dashboard */}
            <div>
              <div 
                onClick={() => toggleFolder('dashboard')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 text-slate-300 cursor-pointer transition-colors"
              >
                {openFolders.dashboard ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-slate-200">dashboard</span>
              </div>
              {openFolders.dashboard && (
                <div className="ml-5 pl-2 border-l border-slate-800/80 space-y-1 my-0.5 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>visao-geral</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>graficos</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>indicadores</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Hidrologia */}
            <div>
              <div 
                onClick={() => toggleFolder('hidrologia')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 text-slate-300 cursor-pointer transition-colors"
              >
                {openFolders.hidrologia ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-slate-200">hidrologia</span>
              </div>
              {openFolders.hidrologia && (
                <div className="ml-5 pl-2 border-l border-slate-800/80 space-y-1 my-0.5 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>rios</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>medicoes</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>historico</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Meteorologia */}
            <div>
              <div 
                onClick={() => toggleFolder('meteorologia')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 text-slate-300 cursor-pointer transition-colors"
              >
                {openFolders.meteorologia ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-slate-200">meteorologia</span>
              </div>
              {openFolders.meteorologia && (
                <div className="ml-5 pl-2 border-l border-slate-800/80 space-y-1 my-0.5 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>estacoes</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>previsao</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>chuvas</span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Alertas */}
            <div>
              <div 
                onClick={() => toggleFolder('alertas')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 text-slate-300 cursor-pointer transition-colors"
              >
                {openFolders.alertas ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-slate-200">alertas</span>
              </div>
              {openFolders.alertas && (
                <div className="ml-5 pl-2 border-l border-slate-800/80 space-y-1 my-0.5 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>avisos</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>configuracoes</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>nivel-risco</span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Relatorios */}
            <div>
              <div 
                onClick={() => toggleFolder('relatorios')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 text-slate-300 cursor-pointer transition-colors"
              >
                {openFolders.relatorios ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-slate-200">relatorios</span>
              </div>
              {openFolders.relatorios && (
                <div className="ml-5 pl-2 border-l border-slate-800/80 space-y-1 my-0.5 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>resumos</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>exportacoes</span>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Sistema */}
            <div>
              <div 
                onClick={() => toggleFolder('sistema')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 text-slate-300 cursor-pointer transition-colors"
              >
                {openFolders.sistema ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-slate-200">sistema</span>
              </div>
              {openFolders.sistema && (
                <div className="ml-5 pl-2 border-l border-slate-800/80 space-y-1 my-0.5 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>usuarios</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>permissoes</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                    <Folder className="w-3 h-3 text-cyan-500/70" />
                    <span>configuracoes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Folders */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 text-slate-400 cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <Folder className="w-3.5 h-3.5 text-cyan-500/60" />
              <span>assets</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/60 text-slate-400 cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <Folder className="w-3.5 h-3.5 text-cyan-500/60" />
              <span>componentes</span>
            </div>

          </div>

          {/* Bottom Explorer Accordion Titles */}
          <div className="p-2 border-t border-slate-800/80 space-y-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-1 hover:text-slate-300 cursor-pointer">
              <ChevronRight className="w-3 h-3" />
              <span>ESTRUTURA DO CÓDIGO</span>
            </div>
            <div className="flex items-center gap-1 hover:text-slate-300 cursor-pointer">
              <ChevronRight className="w-3 h-3" />
              <span>LINHA DO TEMPO</span>
            </div>
          </div>

        </div>

        {/* RIGHT AREA: CODE EDITOR & ASCII COFFEE ART */}
        <div className="flex-1 bg-[#040813] flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Ambient Background Blue Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          {/* CODE EDITOR WORKSPACE */}
          <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed relative z-10 flex-1 flex flex-col justify-between">
            
            {/* Top TypeScript Code Block */}
            <div className="space-y-1 select-text">
              {codeSnippet.slice(0, typedLineIndex).map((item) => (
                <div key={item.line} className="flex items-center gap-4 group">
                  <span className="w-6 text-right text-slate-600 text-xs select-none">{item.line}</span>
                  <span className="text-slate-300">
                    {item.text.startsWith('import') ? (
                      <>
                        <span className="text-pink-400 font-semibold">import </span>
                        {item.text.replace('import ', '')}
                      </>
                    ) : item.text.startsWith('const') || item.text.startsWith('export') ? (
                      <>
                        <span className="text-sky-400 font-semibold">{item.text.split(' ')[0]} </span>
                        <span className="text-amber-300">{item.text.split(' ')[1]}</span>
                        {item.text.substring(item.text.indexOf(item.text.split(' ')[1]) + item.text.split(' ')[1].length)}
                      </>
                    ) : item.text.includes('<') ? (
                      <>
                        <span className="text-cyan-400">{item.text}</span>
                      </>
                    ) : (
                      item.text
                    )}
                  </span>
                </div>
              ))}
              {typedLineIndex <= codeSnippet.length && (
                <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-10 vertical-middle"></span>
              )}
            </div>

            {/* CENTER ASCII COFFEE CUP & RISING STEAM */}
            <div className="my-6 sm:my-10 flex flex-col items-center justify-center relative">
              
              {/* Animated Steam Lines */}
              <div className="relative h-8 w-20 flex items-center justify-center gap-3 select-none pointer-events-none mb-1">
                <span className="text-cyan-300/80 font-mono font-bold text-sm animate-steam-1">. :</span>
                <span className="text-cyan-300/80 font-mono font-bold text-sm animate-steam-2">: : :: :</span>
                <span className="text-cyan-300/80 font-mono font-bold text-sm animate-steam-3">. :</span>
              </div>

              {/* ASCII Coffee Cup Artwork */}
              <pre className="font-mono text-cyan-400 text-[10px] sm:text-xs md:text-sm font-bold leading-none select-none text-center drop-shadow-[0_0_16px_rgba(6,182,212,0.6)]">
{`               .:
             ::.:
           ::.::.:
           ::.::.:
             ::.:
               .:
      . . . . . . . . . .
    . . . . . . . . . . . . .
   . . . . . . . . . . . . . .
   |: :                      | \\
   |: :                      |  )
   |: :                      | /
    \\ . . . . . . . . . . . / '
     \\ . . . . . . . . . . /
      ' ' ' ' ' ' ' ' ' ' '
  . . . . . . . . . . . . . . . .
  . . . . . . . . . . . . . . . .`}
              </pre>

              {/* MESSAGE CARD BELOW COFFEE CUP */}
              <div className="mt-8 max-w-xl w-full px-4 sm:px-6 py-4 rounded-2xl bg-[#091122]/90 border border-cyan-500/30 shadow-xl shadow-cyan-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left transition-all hover:border-cyan-500/50">
                <div className="p-2.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0 animate-pulse">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-cyan-200 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    <span>{title}</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {subtitle}
                  </p>
                </div>
              </div>

            </div>

            {/* Dummy Bottom Code Comments */}
            <div className="text-[11px] text-slate-600 font-mono select-none hidden sm:block">
              <span>// Sincronizando APIs telemétricas do Rio Taquari... [OK]</span>
            </div>

          </div>

          {/* VS CODE BOTTOM STATUS BAR */}
          <div className="bg-[#007acc] text-white px-3 py-1 flex items-center justify-between text-[11px] font-mono select-none border-t border-cyan-500/30">
            {/* Left Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                <span className="font-bold">main*</span>
              </div>
              <div className="flex items-center gap-2 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                <span>⊗ 0</span>
                <span>⚠ 0</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                <Share2 className="w-3 h-3" />
                <span>Live Share</span>
              </div>
            </div>

            {/* Right Status */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Ln 6, Col 36</span>
              <span className="hidden sm:inline">Espaços: 2</span>
              <span>UTF-8</span>
              <span>LF</span>
              <span className="hidden sm:inline">{`{}`} TypeScript React</span>
              <Bell className="w-3 h-3 hover:text-cyan-200 cursor-pointer" />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
