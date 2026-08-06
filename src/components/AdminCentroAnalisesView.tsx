import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Upload,
  Link as LinkIcon,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { CotaAnalise, CotaAttachment, CotaAttachmentType, LevelStatus } from '../types';
import { getCotasAnaliseFromStorage, saveCotasAnaliseToStorage } from '../data/cotasAnaliseData';
import { uploadStorageImage } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const AdminCentroAnalisesView: React.FC = () => {
  const { settings, updateSettings } = useSiteSettings();
  const [cotas, setCotas] = useState<CotaAnalise[]>([]);
  const [selectedCota, setSelectedCota] = useState<CotaAnalise | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [isUploadingAnexo, setIsUploadingAnexo] = useState<boolean>(false);

  // Form State for Cota
  const [cotaM, setCotaM] = useState<number>(20.0);
  const [titulo, setTitulo] = useState<string>('');
  const [nivelRisco, setNivelRisco] = useState<LevelStatus>('atencao');
  const [status, setStatus] = useState<'publicado' | 'rascunho'>('publicado');
  const [resumoIa, setResumoIa] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [pdfOficialUrl, setPdfOficialUrl] = useState<string>('');
  const [anexos, setAnexos] = useState<CotaAttachment[]>([]);

  // New Attachment Form Modal
  const [isAddAnexoOpen, setIsAddAnexoOpen] = useState<boolean>(false);
  const [anexoTipo, setAnexoTipo] = useState<CotaAttachmentType>('imagem');
  const [anexoTitulo, setAnexoTitulo] = useState<string>('');
  const [anexoUrl, setAnexoUrl] = useState<string>('');
  const [anexoDescricao, setAnexoDescricao] = useState<string>('');

  const handleUploadPdfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    try {
      const url = await uploadStorageImage('documentos_cotas', file);
      setPdfOficialUrl(url);
    } catch (err) {
      console.error('Erro ao carregar PDF:', err);
      alert('Erro ao carregar o arquivo do computador.');
    } finally {
      setIsUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleUploadAnexoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAnexo(true);
    try {
      const url = await uploadStorageImage('cotas_anexos', file);
      setAnexoUrl(url);
      if (!anexoTitulo.trim()) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setAnexoTitulo(nameWithoutExt);
      }
      if (file.type.includes('pdf')) setAnexoTipo('pdf');
      else if (file.type.includes('video')) setAnexoTipo('video');
      else setAnexoTipo('imagem');
    } catch (err) {
      console.error('Erro ao carregar anexo:', err);
      alert('Erro ao carregar o arquivo do computador.');
    } finally {
      setIsUploadingAnexo(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    loadCotas();
  }, []);

  const loadCotas = () => {
    const data = getCotasAnaliseFromStorage();
    data.sort((a, b) => a.cota_m - b.cota_m);
    setCotas(data);
    if (data.length > 0 && !selectedCota) {
      handleSelectCota(data[0]);
    }
  };

  const handleSelectCota = (cota: CotaAnalise) => {
    setSelectedCota(cota);
    setIsEditing(false);
    setIsCreating(false);
    setCotaM(cota.cota_m);
    setTitulo(cota.titulo);
    setNivelRisco(cota.nivel_risco);
    setStatus(cota.status);
    setResumoIa(cota.resumo_ia);
    setDescricao(cota.descricao);
    setObservacoes(cota.observacoes || '');
    setPdfOficialUrl(cota.pdf_oficial_url || '');
    setAnexos(cota.anexos || []);
  };

  const handleStartCreate = () => {
    setSelectedCota(null);
    setIsEditing(true);
    setIsCreating(true);
    const nextM = cotas.length > 0 ? Math.max(...cotas.map(c => c.cota_m)) + 1 : 20;
    setCotaM(nextM);
    setTitulo(`Cota ${nextM.toFixed(2).replace('.', ',')}m - Novo Mapeamento Hidrológico`);
    setNivelRisco(nextM >= 22 ? 'inundacao' : nextM >= 21 ? 'alerta' : 'atencao');
    setStatus('publicado');
    setResumoIa(`Ao atingir a cota de ${nextM.toFixed(2)}m no Rio Taquari, as equipes do COE entram em regime de monitoramento. Impactos nos acessos locais e bairros baixos.`);
    setDescricao(`Descreva as ruas, pontes, rodovias e bairros atingidos quando o Rio Taquari atinge ${nextM.toFixed(2)} metros.`);
    setObservacoes('Velocidade média de subida recomendada para observação técnica.');
    setPdfOficialUrl('');
    setAnexos([]);
  };

  const handleGenerateAISummary = () => {
    let riscoText = 'Atenção';
    if (nivelRisco === 'alerta') riscoText = 'Alerta Elevado';
    if (nivelRisco === 'inundacao') riscoText = 'Inundação Urbana Severa';

    const generated = `[Análise IA] Na cota de ${cotaM.toFixed(2).replace('.', ',')}m no Rio Taquari, a bacia atinge o estado de ${riscoText}. As águas avançam sobre as áreas de inundação periódica nos bairros ribeirinhos de Lajeado (Navegantes, Conservas, Carneiros) e Estrela (Porto, Moinhos). Recomenda-se acompanhamento preventivo das famílias e prontidão das equipes de socorro da Defesa Civil.`;
    setResumoIa(generated);
  };

  const handleSaveCota = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList = [...cotas];

    const cotaData: CotaAnalise = {
      id: isCreating ? `cota-${Date.now()}` : (selectedCota ? selectedCota.id : `cota-${Date.now()}`),
      cota_m: Number(cotaM),
      titulo: titulo.trim() || `Cota ${cotaM.toFixed(2)}m`,
      nivel_risco: nivelRisco,
      status: status,
      resumo_ia: resumoIa.trim(),
      descricao: descricao.trim(),
      observacoes: observacoes.trim() || undefined,
      pdf_oficial_url: pdfOficialUrl.trim() || undefined,
      anexos: anexos,
      updated_at: new Date().toISOString()
    };

    if (isCreating) {
      updatedList.push(cotaData);
    } else {
      updatedList = updatedList.map(c => c.id === cotaData.id ? cotaData : c);
    }

    updatedList.sort((a, b) => a.cota_m - b.cota_m);
    setCotas(updatedList);
    saveCotasAnaliseToStorage(updatedList);
    setSelectedCota(cotaData);
    setIsEditing(false);
    setIsCreating(false);

    setSuccessMessage(isCreating ? 'Nova cota criada com sucesso!' : 'Cota atualizada com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteCota = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta cota e todos os seus anexos?')) {
      const filtered = cotas.filter(c => c.id !== id);
      setCotas(filtered);
      saveCotasAnaliseToStorage(filtered);
      if (filtered.length > 0) {
        handleSelectCota(filtered[0]);
      } else {
        setSelectedCota(null);
      }
      setSuccessMessage('Cota removida com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleAddAnexo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anexoTitulo.trim() || !anexoUrl.trim()) return;

    const newAnexo: CotaAttachment = {
      id: `att-${Date.now()}`,
      cota_id: selectedCota ? selectedCota.id : 'new',
      tipo: anexoTipo,
      titulo: anexoTitulo.trim(),
      url: anexoUrl.trim(),
      descricao: anexoDescricao.trim() || undefined,
      ordem: anexos.length + 1,
      created_at: new Date().toISOString()
    };

    const updatedAnexos = [...anexos, newAnexo];
    setAnexos(updatedAnexos);

    // Reset Anexo Form
    setAnexoTitulo('');
    setAnexoUrl('');
    setAnexoDescricao('');
    setIsAddAnexoOpen(false);
  };

  const handleDeleteAnexo = (anexoId: string) => {
    const updated = anexos.filter(a => a.id !== anexoId);
    setAnexos(updated);
  };

  const handleTogglePublicMode = async (mode: 'original' | 'construcao') => {
    try {
      await updateSettings({ centro_analises_public_mode: mode });
      setSuccessMessage(
        mode === 'construcao'
          ? 'Tela pública do Centro de Análises alterada para "Tela de construção".'
          : 'Tela pública do Centro de Análises alterada para "Dashboard original".'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao atualizar modo do Centro de Análises:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Gestão do Centro de Análises (Cotas do Rio Taquari)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre cotas, resumos gerados por IA, descrições técnicas, mapas, fotos, vídeos 3D e documentos oficiais em PDF.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Cota</span>
        </button>
      </div>

      {/* TELA PÚBLICA DO CENTRO DE ANÁLISES (SELETOR ADMINISTRATIVO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Tela pública do Centro de Análises</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina qual visualização será exibida para os visitantes do site na aba Centro de Análises e clique em <strong>Salvar Alterações</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleTogglePublicMode('original')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  (settings.centro_analises_public_mode || 'original') === 'original'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Dashboard original</span>
              </button>

              <button
                type="button"
                onClick={() => handleTogglePublicMode('construcao')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  settings.centro_analises_public_mode === 'construcao'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Página de Manutenção</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleTogglePublicMode(settings.centro_analises_public_mode || 'original')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        {settings.centro_analises_public_mode === 'construcao' ? (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />
            <span>
              <strong>Modo de Manutenção Ativo:</strong> Visitantes verão a tela de manutenção ("Coletando dados para exibição... Volte em breve."). Como Administrador, seu acesso continua liberado para configurações.
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Dashboard Original Ativo:</strong> Todos os dashboards hidrológicos, mapas e matrizes de análise estão completamente visíveis publicamente.
            </span>
          </div>
        )}
      </div>

      {/* SUCCESS NOTIFICATION */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: COTAS LIST (4 COLS) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cotas Cadastradas</span>
            <span className="text-[11px] text-cyan-400 font-mono font-bold">{cotas.length} cotas</span>
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {cotas.map((c) => {
              const isSelected = selectedCota?.id === c.id && !isCreating;

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCota(c)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex flex-col items-center justify-center font-mono font-black text-sm shrink-0">
                      {c.cota_m.toFixed(0)}m
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border uppercase ${
                          c.nivel_risco === 'inundacao' ? 'bg-rose-950 text-rose-400 border-rose-800' :
                          c.nivel_risco === 'alerta' ? 'bg-orange-950 text-orange-400 border-orange-800' :
                          'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {c.nivel_risco}
                        </span>
                        {c.status === 'rascunho' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Rascunho
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {c.titulo}
                      </h4>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono shrink-0">
                    {c.anexos?.length || 0} mídia(s)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: EDITOR / FORM (8 COLS) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-cyan-400" />
              {isCreating ? 'Cadastrar Nova Cota' : `Editando: Cota ${cotaM.toFixed(2)}m`}
            </h3>

            {!isCreating && selectedCota && !isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Informações</span>
                </button>
                <button
                  onClick={() => handleDeleteCota(selectedCota.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-800/80 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Cota</span>
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveCota} className="space-y-5">
            
            {/* ROW 1: HEIGHT, RISK, STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Altura da Cota (m) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  required
                  value={cotaM}
                  onChange={(e) => setCotaM(parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nível de Risco *
                </label>
                <select
                  value={nivelRisco}
                  onChange={(e) => setNivelRisco(e.target.value as LevelStatus)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                >
                  <option value="normal">Normal (Verde)</option>
                  <option value="atencao">Atenção (Amarelo)</option>
                  <option value="alerta">Alerta (Laranja)</option>
                  <option value="inundacao">Inundação (Vermelho)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Status de Publicação *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'publicado' | 'rascunho')}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                >
                  <option value="publicado">Publicado (Visível no Portal)</option>
                  <option value="rascunho">Rascunho (Oculto)</option>
                </select>
              </div>
            </div>

            {/* ROW 2: TITULO */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Título Oficial da Cota *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={!isEditing}
                placeholder="Ex: Cota 22,00m - Início de Inundação Urbana em Lajeado e Estrela"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-60"
              />
            </div>

            {/* ROW 3: AI ASSISTED SUMMARY */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resumo Técnico Elaborado por Inteligência Artificial *</span>
                </label>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleGenerateAISummary}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/80 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gerar / Atualizar via IA</span>
                  </button>
                )}
              </div>

              <textarea
                rows={3}
                required
                value={resumoIa}
                onChange={(e) => setResumoIa(e.target.value)}
                disabled={!isEditing}
                placeholder="Resumo técnico sintético do impacto para a população..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60 leading-relaxed"
              />
            </div>

            {/* ROW 4: DETAILED DESCRIPTION */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Descrição Detalhada de Bairros, Ruas e Pontes Afetadas *
              </label>
              <textarea
                rows={4}
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={!isEditing}
                placeholder="Liste detalhadamente os bairros, ruas e pontos de bloqueio..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60 leading-relaxed"
              />
            </div>

            {/* ROW 5: OBSERVATIONS & OFFICIAL PDF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Observações Técnicas / Notas de Segurança
                </label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Ex: Velocidade de subida recomendada..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Documento Oficial (PDF / Carta Hidrológica)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    value={pdfOficialUrl}
                    onChange={(e) => setPdfOficialUrl(e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://.../documento-oficial.pdf ou envie do computador"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                  {isEditing && (
                    <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors">
                      {isUploadingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>{isUploadingPdf ? 'Enviando...' : 'Enviar do computador'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                        onChange={handleUploadPdfFile}
                        className="hidden"
                        disabled={isUploadingPdf}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* ANEXOS / MEDIA ATTACHMENTS SECTION */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Anexos Mídia (Mapas, Fotos, Vídeos e PDFs)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Vincule mapas cartográficos, fotos de drone, vídeos 3D e cartas hidrológicas a esta cota.
                  </p>
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsAddAnexoOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Anexo</span>
                  </button>
                )}
              </div>

              {/* ANEXOS LIST */}
              {anexos.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  Nenhum anexo de mídia vinculado a esta cota ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {anexos.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                          {a.tipo === 'imagem' && <ImageIcon className="w-4 h-4 text-cyan-400" />}
                          {a.tipo === 'video' && <VideoIcon className="w-4 h-4 text-indigo-400" />}
                          {a.tipo === 'pdf' && <FileText className="w-4 h-4 text-emerald-400" />}
                        </div>

                        <div className="overflow-hidden">
                          <h5 className="text-xs font-bold text-white truncate">{a.titulo}</h5>
                          <p className="text-[10px] text-slate-500 truncate">{a.url}</p>
                        </div>
                      </div>

                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAnexo(a.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Remover anexo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FORM SUBMIT ACTIONS */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    if (selectedCota) handleSelectCota(selectedCota);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            )}

          </form>

        </div>

      </div>

      {/* MODAL TO ADD NEW ATTACHMENT */}
      {isAddAnexoOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-fade-in space-y-4">
            
            <button
              onClick={() => setIsAddAnexoOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Adicionar Anexo de Mídia
            </h3>

            <form onSubmit={handleAddAnexo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tipo de Mídia *
                </label>
                <select
                  value={anexoTipo}
                  onChange={(e) => setAnexoTipo(e.target.value as CotaAttachmentType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="imagem">Imagem / Mapa Cartográfico (JPG, PNG, WEBP)</option>
                  <option value="video">Vídeo / Simulação 3D (MP4)</option>
                  <option value="pdf">Documento Oficial (PDF)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Título do Anexo *
                </label>
                <input
                  type="text"
                  required
                  value={anexoTitulo}
                  onChange={(e) => setAnexoTitulo(e.target.value)}
                  placeholder="Ex: Mapa Cartográfico de Inundação Bairro Navegantes"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* SELEÇÃO E UPLOAD DO COMPUTADOR */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Enviar Arquivo do Computador
                </label>
                <label className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/80 border border-cyan-700/60 hover:bg-cyan-900/80 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow">
                  {isUploadingAnexo ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>{isUploadingAnexo ? 'Enviando arquivo...' : 'Escolher arquivo do computador (PDF, Imagem, Vídeo)'}</span>
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleUploadAnexoFile}
                    className="hidden"
                    disabled={isUploadingAnexo}
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  URL do Arquivo *
                </label>
                <input
                  type="url"
                  required
                  value={anexoUrl}
                  onChange={(e) => setAnexoUrl(e.target.value)}
                  placeholder="https://.../mapa.jpg ou clique acima para enviar do PC"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descrição Opcional
                </label>
                <input
                  type="text"
                  value={anexoDescricao}
                  onChange={(e) => setAnexoDescricao(e.target.value)}
                  placeholder="Instruções ou legenda da imagem/vídeo..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAnexoOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Anexar Mídia
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
