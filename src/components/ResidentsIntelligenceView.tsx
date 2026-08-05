import React, { useState, useMemo, useEffect } from 'react';
import { AlertSubscriber, City } from '../types';
import {
  Users,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Home,
  ShieldAlert,
  Layers,
  Phone,
  Mail,
  Sliders,
  Check,
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import {
  saveAlertSubscriber,
  toggleSubscriberActive,
  deleteSubscriber,
  addAuditLog
} from '../lib/supabase';

interface ResidentsIntelligenceViewProps {
  subscribers: AlertSubscriber[];
  cities: City[];
  onRefresh: () => void;
}

export const ResidentsIntelligenceView: React.FC<ResidentsIntelligenceViewProps> = ({
  subscribers,
  cities,
  onRefresh
}) => {
  // --- FILTERS STATE ---
  const [selectedCity, setSelectedCity] = useState<string>('todas');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('todos');
  const [streetQuery, setStreetQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(''); // Name, Phone, Email
  const [minCota, setMinCota] = useState<string>('');
  const [maxCota, setMaxCota] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // --- ALERT INTEGRATION STATE ---
  const [alertMode, setAlertMode] = useState<boolean>(false);
  const [alertCitySlug, setAlertCitySlug] = useState<string>('lajeado');
  const [alertCustomLevel, setAlertCustomLevel] = useState<number>(20.35);

  // Set default level when alert city changes
  useEffect(() => {
    const cityData = cities.find(c => c.slug === alertCitySlug);
    if (cityData?.current_level) {
      setAlertCustomLevel(cityData.current_level);
    }
  }, [alertCitySlug, cities]);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Partial<AlertSubscriber> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // List of unique neighborhoods for selected city
  const availableNeighborhoods = useMemo(() => {
    let list = subscribers;
    if (selectedCity !== 'todas') {
      list = list.filter(s => (s.cidade || s.city_slug) === selectedCity);
    }
    const setN = new Set<string>();
    list.forEach(s => {
      const b = (s.bairro || s.neighborhood || '').trim();
      if (b) setN.add(b);
    });
    return Array.from(setN).sort();
  }, [subscribers, selectedCity]);

  // Reset neighborhood filter when city changes
  const handleCityChange = (c: string) => {
    setSelectedCity(c);
    setSelectedNeighborhood('todos');
    setCurrentPage(1);
  };

  // Trigger "Ver moradores que receberão alerta"
  const handleActivateAlertFilter = () => {
    setAlertMode(true);
    setSelectedCity(alertCitySlug);
    setMaxCota(alertCustomLevel.toString());
    setMinCota('');
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCity('todas');
    setSelectedNeighborhood('todos');
    setStreetQuery('');
    setSearchQuery('');
    setMinCota('');
    setMaxCota('');
    setStatusFilter('todos');
    setAlertMode(false);
    setCurrentPage(1);
  };

  // --- FILTERED DATA COMPUTATION ---
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
      // 1. City Filter
      const c = sub.cidade || sub.city_slug || '';
      if (selectedCity !== 'todas' && c !== selectedCity) return false;

      // 2. Neighborhood Filter
      const b = sub.bairro || sub.neighborhood || '';
      if (selectedNeighborhood !== 'todos' && b.toLowerCase() !== selectedNeighborhood.toLowerCase()) return false;

      // 3. Street Query Filter
      if (streetQuery.trim()) {
        const street = sub.rua || '';
        if (!street.toLowerCase().includes(streetQuery.toLowerCase().trim())) return false;
      }

      // 4. Cota Range Filter
      const cota = Number(sub.cota_residencia || 0);
      if (minCota !== '' && !isNaN(Number(minCota)) && cota < Number(minCota)) return false;
      if (maxCota !== '' && !isNaN(Number(maxCota)) && cota > Number(maxCota)) return false;

      // 5. Status Filter
      const isActive = sub.receber_alertas ?? sub.active ?? true;
      if (statusFilter === 'ativo' && !isActive) return false;
      if (statusFilter === 'inativo' && isActive) return false;

      // 6. Text Search (Name, Phone, Email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (sub.nome_completo || sub.name || '').toLowerCase();
        const phone = (sub.whatsapp || '').toLowerCase();
        const email = (sub.email || '').toLowerCase();
        if (!name.includes(q) && !phone.includes(q) && !email.includes(q)) return false;
      }

      return true;
    });
  }, [subscribers, selectedCity, selectedNeighborhood, streetQuery, minCota, maxCota, statusFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSubscribers.length]);

  // --- STATS COMPUTATION ---
  const stats = useMemo(() => {
    const total = subscribers.length;
    const citiesSet = new Set(subscribers.map(s => s.cidade || s.city_slug)).size;
    const neighborhoodsSet = new Set(subscribers.map(s => (s.bairro || s.neighborhood || '').toLowerCase().trim())).size;
    const activeCount = subscribers.filter(s => s.receber_alertas ?? s.active ?? true).length;
    const inactiveCount = total - activeCount;

    return { total, citiesSet, neighborhoodsSet, activeCount, inactiveCount };
  }, [subscribers]);

  // Breakdowns
  const byCity = useMemo(() => {
    const map: Record<string, number> = {};
    subscribers.forEach(s => {
      const citySlug = s.cidade || s.city_slug || 'outra';
      map[citySlug] = (map[citySlug] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [subscribers]);

  const byNeighborhood = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    subscribers.forEach(s => {
      const citySlug = s.cidade || s.city_slug || 'outra';
      const b = (s.bairro || s.neighborhood || 'Outro').trim();
      if (!map[citySlug]) map[citySlug] = {};
      map[citySlug][b] = (map[citySlug][b] || 0) + 1;
    });
    return map;
  }, [subscribers]);

  const byStreet = useMemo(() => {
    const map: Record<string, number> = {};
    subscribers.forEach(s => {
      const r = (s.rua || '').trim();
      if (r) {
        const key = `${r} (${s.cidade || s.city_slug})`;
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 10);
  }, [subscribers]);

  // Cota Map per City (Resumo de Cotas de Atingimento)
  const quotaMapCitySlug = selectedCity === 'todas' ? 'lajeado' : selectedCity;
  const quotaMapCityObj = cities.find(c => c.slug === quotaMapCitySlug);
  const quotaMapData = useMemo(() => {
    const citySubs = subscribers.filter(s => (s.cidade || s.city_slug) === quotaMapCitySlug);
    if (citySubs.length === 0) return [];

    // Find min and max cota
    const cotas = citySubs.map(s => Number(s.cota_residencia || 19.0)).filter(c => c > 0);
    if (cotas.length === 0) return [];

    const min = Math.floor(Math.min(...cotas));
    const max = Math.ceil(Math.max(...cotas)) + 1;

    const rows: { cota: number; count: number; cumulative: number }[] = [];
    let runningTotal = 0;

    for (let level = min; level <= max; level++) {
      const exactAtLevel = citySubs.filter(s => {
        const c = Number(s.cota_residencia || 0);
        return c > level - 1 && c <= level;
      }).length;

      const cumulative = citySubs.filter(s => Number(s.cota_residencia || 0) <= level).length;

      rows.push({
        cota: level,
        count: exactAtLevel,
        cumulative
      });
    }

    return rows;
  }, [subscribers, quotaMapCitySlug]);

  // PAGINATED ROWS
  const totalPages = Math.ceil(filteredSubscribers.length / pageSize) || 1;
  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubscribers.slice(start, start + pageSize);
  }, [filteredSubscribers, currentPage, pageSize]);

  // --- ACTIONS ---
  const handleToggleActive = async (sub: AlertSubscriber) => {
    const current = sub.receber_alertas ?? sub.active ?? true;
    const nextState = !current;
    await toggleSubscriberActive(sub.id, nextState);
    await addAuditLog('UPDATE', 'alert_subscribers', `Status do morador ${sub.nome_completo || sub.name} alterado para ${nextState ? 'ATIVO' : 'INATIVO'}`);
    onRefresh();
  };

  const handleDelete = async (sub: AlertSubscriber) => {
    const name = sub.nome_completo || sub.name || 'Morador';
    if (confirm(`Tem certeza que deseja excluir permanentemente o cadastro de ${name}?`)) {
      await deleteSubscriber(sub.id);
      await addAuditLog('DELETE', 'alert_subscribers', `Morador ${name} (ID: ${sub.id}) excluído`);
      onRefresh();
    }
  };

  const handleOpenEditModal = (sub?: AlertSubscriber) => {
    if (sub) {
      setEditingSub({ ...sub });
    } else {
      setEditingSub({
        cidade: selectedCity !== 'todas' ? selectedCity : 'lajeado',
        bairro: 'Centro',
        rua: '',
        numero: '',
        complemento: '',
        cota_residencia: 19.5,
        nome_completo: '',
        email: '',
        whatsapp: '',
        receber_alertas: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub?.nome_completo && !editingSub?.name) {
      alert('Por favor, informe o nome completo do morador.');
      return;
    }
    setIsSaving(true);
    try {
      await saveAlertSubscriber(editingSub);
      await addAuditLog(editingSub.id ? 'UPDATE' : 'CREATE', 'alert_subscribers', `Morador ${editingSub.nome_completo || editingSub.name} salvo`);
      setIsModalOpen(false);
      setEditingSub(null);
      onRefresh();
      alert('Cadastro de morador salvo com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message || 'Ocorreu uma falha.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- EXPORT FUNCTIONS ---
  const handleExportCSV = () => {
    if (filteredSubscribers.length === 0) {
      alert('Nenhum registro para exportar.');
      return;
    }

    const headers = ['Nome Completo', 'Cidade', 'Bairro', 'Rua', 'Número', 'Complemento', 'Cota Residência (m)', 'Telefone / WhatsApp', 'E-mail', 'Status', 'Data Cadastro'];
    const rows = filteredSubscribers.map(s => [
      `"${(s.nome_completo || s.name || '').replace(/"/g, '""')}"`,
      `"${(s.cidade || s.city_slug || '').replace(/"/g, '""')}"`,
      `"${(s.bairro || s.neighborhood || '').replace(/"/g, '""')}"`,
      `"${(s.rua || '').replace(/"/g, '""')}"`,
      `"${(s.numero || '').replace(/"/g, '""')}"`,
      `"${(s.complemento || '').replace(/"/g, '""')}"`,
      s.cota_residencia != null ? Number(s.cota_residencia).toFixed(2) : '0.00',
      `"${(s.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      s.receber_alertas ?? s.active ?? true ? 'ATIVO' : 'INATIVO',
      s.criado_em || s.created_at || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `moradores_cadastrados_${selectedCity}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (filteredSubscribers.length === 0) {
      alert('Nenhum registro para exportar.');
      return;
    }
    const jsonStr = JSON.stringify(filteredSubscribers, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `moradores_cadastrados_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER TITLE & INTEGRATION WITH ALERTS */}
      <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-2xl shadow-lg">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>Inteligência de Moradores Cadastrados</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {stats.total} Registros
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestão de moradores em áreas de risco, mapeamento por cotas e emissão de alertas da Defesa Civil.
              </p>
            </div>
          </div>
        </div>

        {/* INTEGRATION BUTTON: "Ver moradores que receberão alerta" */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenEditModal()}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Novo Morador</span>
          </button>

          <button
            onClick={() => setAlertMode(!alertMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
              alertMode
                ? 'bg-amber-600 text-white border border-amber-400 ring-2 ring-amber-500/40'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white'
            }`}
          >
            <Zap className="w-4 h-4 fill-current animate-pulse" />
            <span>Ver moradores que receberão alerta</span>
          </button>
        </div>
      </div>

      {/* ALERT INTEGRATION EXPANDED PANEL */}
      {alertMode && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-orange-950/80 border border-amber-700/60 p-5 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>Simulação de Atingimento por Elevação do Rio</span>
            </div>
            <button
              onClick={() => {
                setAlertMode(false);
                handleClearFilters();
              }}
              className="text-xs text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cidade para Análise</label>
              <select
                value={alertCitySlug}
                onChange={(e) => setAlertCitySlug(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-amber-500"
              >
                {cities.map(c => (
                  <option key={c.id} value={c.slug}>
                    {c.name} (Nível Atual: {c.current_level ? `${c.current_level}m` : 'Sem dados'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nível do Rio em Análise (m)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={alertCustomLevel}
                  onChange={(e) => setAlertCustomLevel(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-amber-300"
                />
                <button
                  onClick={() => {
                    const c = cities.find(x => x.slug === alertCitySlug);
                    if (c?.current_level) setAlertCustomLevel(c.current_level);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl shrink-0 font-medium text-[11px]"
                  title="Usar Nível Atual Telemetrado"
                >
                  Nível Atual
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleActivateAlertFilter}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Filter className="w-4 h-4" />
                <span>Filtrar Moradores ≤ {Number(alertCustomLevel).toFixed(2)}m</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-200">
            <div>
              <span>
                Mostrando moradores em <strong>{cities.find(c => c.slug === alertCitySlug)?.name || alertCitySlug}</strong> com cota de residência ≤ <strong>{Number(alertCustomLevel).toFixed(2)}m</strong>:
              </span>
            </div>
            <div className="px-3 py-1 bg-amber-500 text-slate-950 font-mono font-bold rounded-lg text-xs">
              {subscribers.filter(s => (s.cidade || s.city_slug) === alertCitySlug && Number(s.cota_residencia || 0) <= alertCustomLevel).length} Afetados
            </div>
          </div>
        </div>
      )}

      {/* 2. RESUMO GERAL CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Cadastrados</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{stats.total}</p>
          <p className="text-[10px] text-slate-500">Base total na plataforma</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Cidades Atendidas</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-sky-300 font-mono">{stats.citiesSet}</p>
          <p className="text-[10px] text-slate-500">Municípios com moradores</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Bairros Mapeados</span>
            <MapPin className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 font-mono">{stats.neighborhoodsSet}</p>
          <p className="text-[10px] text-slate-500">Bairros com registros</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Moradores Ativos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{stats.activeCount}</p>
          <p className="text-[10px] text-emerald-500 font-medium">Recebendo alertas ativamente</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Inativos / Pausados</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400 font-mono">{stats.inactiveCount}</p>
          <p className="text-[10px] text-slate-500">Notificações desativadas</p>
        </div>
      </div>

      {/* 3. FILTROS E PESQUISA */}
      <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Filtros Avançados de Moradores</span>
          </h3>
          {(selectedCity !== 'todas' || selectedNeighborhood !== 'todos' || streetQuery || searchQuery || minCota || maxCota || statusFilter !== 'todos') && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Cidade */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Cidade</label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
            >
              <option value="todas">Todas as Cidades</option>
              {cities.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Bairro</label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
            >
              <option value="todos">Todos os Bairros</option>
              {availableNeighborhoods.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Rua */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Rua / Logradouro</label>
            <input
              type="text"
              value={streetQuery}
              onChange={(e) => setStreetQuery(e.target.value)}
              placeholder="Ex: Bento Gonçalves"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500 placeholder-slate-600"
            />
          </div>

          {/* Faixa de Cota (Min / Max) */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Faixa de Cota (m)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.5"
                value={minCota}
                onChange={(e) => setMinCota(e.target.value)}
                placeholder="Mín"
                className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white font-mono text-center focus:border-cyan-500 placeholder-slate-600"
              />
              <span className="text-slate-600 font-bold">-</span>
              <input
                type="number"
                step="0.5"
                value={maxCota}
                onChange={(e) => setMaxCota(e.target.value)}
                placeholder="Máx"
                className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white font-mono text-center focus:border-cyan-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Apenas Ativos</option>
              <option value="inativo">Apenas Inativos</option>
            </select>
          </div>

          {/* Pesquisa Geral */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Pesquisar por Texto</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nome, Telefone, E-mail..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white focus:border-cyan-500 placeholder-slate-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAPA DAS COTAS E ESTATÍSTICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAPA DAS COTAS (RESUMO POR CIDADE E NIVEL) */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Mapa das Cotas – Atingimento por Elevação</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Resumo acumulado de moradores atingidos a cada metro de subida do rio em {quotaMapCityObj?.name || quotaMapCitySlug}.
              </p>
            </div>

            <div className="shrink-0">
              <select
                value={quotaMapCitySlug}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-xl"
              >
                {cities.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {quotaMapData.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs italic">
              Nenhum morador cadastrado para a cidade {quotaMapCityObj?.name || quotaMapCitySlug}.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {quotaMapData.map((row) => {
                const isCurrentLevel = quotaMapCityObj?.current_level &&
                  quotaMapCityObj.current_level >= row.cota - 1 &&
                  quotaMapCityObj.current_level <= row.cota;

                return (
                  <div
                    key={row.cota}
                    onClick={() => {
                      setSelectedCity(quotaMapCitySlug);
                      setMaxCota(row.cota.toString());
                      setMinCota('');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isCurrentLevel
                        ? 'bg-amber-950/80 border-amber-600 text-amber-200 ring-2 ring-amber-500/50'
                        : row.cumulative > 0
                        ? 'bg-slate-900/90 border-slate-700 hover:border-cyan-600 text-slate-200'
                        : 'bg-slate-950/50 border-slate-900 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-cyan-400">{row.cota}m</span>
                      {isCurrentLevel && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-sans font-bold">RIO AQUI</span>
                      )}
                    </div>
                    <p className="text-lg font-bold font-mono mt-1 text-white">{row.cumulative} <span className="text-xs font-sans text-slate-400 font-normal">moradores</span></p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      +{row.count} cadastrados neste nível
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ESTATÍSTICAS POR CIDADE & BAIRRO */}
        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Distribuição por Cidade & Bairro</span>
          </h3>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {byCity.map(([citySlug, count]) => {
              const cityName = cities.find(c => c.slug === citySlug)?.name || citySlug;
              const percent = Math.round((count / (subscribers.length || 1)) * 100);
              const cityBairros = Object.entries(byNeighborhood[citySlug] || {}).sort((a, b) => Number(b[1]) - Number(a[1]));

              return (
                <div key={citySlug} className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span className="capitalize">{cityName}</span>
                    <span className="text-cyan-400 font-mono">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                    {cityBairros.slice(0, 3).map(([b, cnt]) => (
                      <div key={b} className="flex justify-between text-[10px]">
                        <span className="text-slate-300">{b}</span>
                        <span className="font-mono text-slate-400">{cnt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. TABELA COMPLETA COM PAGINAÇÃO & EXPORTAÇÃO */}
      <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        {/* TABLE BAR: TITLE + EXPORT + PAGE SIZE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Lista Completa de Moradores Cadastrados</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Exibindo <span className="text-white font-bold">{filteredSubscribers.length}</span> resultado(s) conforme os filtros aplicados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Page size selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl font-medium"
            >
              <option value={10}>10 por pg</option>
              <option value={25}>25 por pg</option>
              <option value={50}>50 por pg</option>
              <option value={100}>100 por pg</option>
            </select>

            {/* Export buttons */}
            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar dados filtrados para CSV (Excel)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar arquivo JSON completo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Imprimir relatório oficial ou salvar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* TABLE CONTENT */}
        {filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="font-semibold text-slate-400">Nenhum morador encontrado para os filtros selecionados.</p>
            <p className="text-[11px] text-slate-600">Tente limpar os filtros de cidade, rua ou faixa de cota para visualizar todos os registros.</p>
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs rounded-xl font-bold mt-2 cursor-pointer inline-block"
            >
              Limpar Filtros de Pesquisa
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/50">
                  <th className="p-3 font-bold">Nome do Morador</th>
                  <th className="p-3 font-bold">Cidade / Bairro</th>
                  <th className="p-3 font-bold">Endereço (Rua, Nº, Compl.)</th>
                  <th className="p-3 font-bold text-center">Cota Residência</th>
                  <th className="p-3 font-bold">Contato (Whats / E-mail)</th>
                  <th className="p-3 font-bold">Data Cadastro</th>
                  <th className="p-3 font-bold text-center">Status</th>
                  <th className="p-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedSubscribers.map((sub) => {
                  const isActive = sub.receber_alertas ?? sub.active ?? true;
                  const cityName = cities.find(c => c.slug === (sub.cidade || sub.city_slug))?.name || (sub.cidade || sub.city_slug);
                  const cotaNum = Number(sub.cota_residencia || 0);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* NOME */}
                      <td className="p-3">
                        <p className="font-bold text-white text-xs">{sub.nome_completo || sub.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {sub.id.slice(0, 10)}</p>
                      </td>

                      {/* CIDADE / BAIRRO */}
                      <td className="p-3">
                        <p className="font-semibold text-slate-200 capitalize">{cityName}</p>
                        <p className="text-[11px] text-slate-400">{sub.bairro || sub.neighborhood || 'Centro'}</p>
                      </td>

                      {/* ENDEREÇO */}
                      <td className="p-3 text-slate-300">
                        {sub.rua ? (
                          <div>
                            <span className="font-medium">{sub.rua}</span>
                            {sub.numero && <span className="text-slate-400">, {sub.numero}</span>}
                            {sub.complemento && <span className="text-slate-500 text-[10px] block">Compl: {sub.complemento}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Rua não especificada</span>
                        )}
                      </td>

                      {/* COTA RESIDÊNCIA */}
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                          cotaNum <= 19
                            ? 'bg-red-950/80 text-red-300 border-red-800'
                            : cotaNum <= 22
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        }`}>
                          {cotaNum.toFixed(2)}m
                        </span>
                      </td>

                      {/* CONTATO */}
                      <td className="p-3 text-[11px]">
                        {sub.whatsapp && (
                          <a
                            href={`https://wa.me/${sub.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{sub.whatsapp}</span>
                          </a>
                        )}
                        {sub.email && (
                          <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[150px]">{sub.email}</span>
                          </div>
                        )}
                      </td>

                      {/* DATA CADASTRO */}
                      <td className="p-3 text-[11px] text-slate-400">
                        {sub.criado_em || sub.created_at ? (
                          new Date(sub.criado_em || sub.created_at || '').toLocaleDateString('pt-BR')
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleActive(sub)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                              : 'bg-red-950 text-red-400 border-red-800 hover:bg-red-900'
                          }`}
                          title="Clique para ativar/desativar este morador"
                        >
                          {isActive ? 'ATIVO' : 'INATIVO'}
                        </button>
                      </td>

                      {/* AÇÕES */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                            title="Editar Morador"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Morador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {filteredSubscribers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div>
              Exibindo <span className="font-bold text-white">{(currentPage - 1) * pageSize + 1}</span> a{' '}
              <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredSubscribers.length)}</span> de{' '}
              <span className="font-bold text-white">{filteredSubscribers.length}</span> moradores
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-300 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="px-3 py-1 font-mono text-cyan-400 font-bold">
                Página {currentPage} de {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-300 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. MODAL PARA EDITAR OU CADASTRAR MORADOR */}
      {isModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-3xl max-w-xl w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4 text-cyan-400" />
                <span>{editingSub.id ? 'Editar Cadastro de Morador' : 'Novo Cadastro de Morador'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={editingSub.nome_completo || editingSub.name || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, nome_completo: e.target.value, name: e.target.value })}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cidade *</label>
                  <select
                    value={editingSub.cidade || editingSub.city_slug || 'lajeado'}
                    onChange={(e) => setEditingSub({ ...editingSub, cidade: e.target.value, city_slug: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  >
                    {cities.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bairro *</label>
                  <input
                    type="text"
                    value={editingSub.bairro || editingSub.neighborhood || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, bairro: e.target.value, neighborhood: e.target.value })}
                    placeholder="Ex: Centro"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={editingSub.rua || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, rua: e.target.value })}
                    placeholder="Ex: Rua Bento Gonçalves"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Número</label>
                  <input
                    type="text"
                    value={editingSub.numero || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, numero: e.target.value })}
                    placeholder="Ex: 450"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Complemento</label>
                  <input
                    type="text"
                    value={editingSub.complemento || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, complemento: e.target.value })}
                    placeholder="Ex: Apto 201 / Sobrado"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cota da Residência (m) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSub.cota_residencia || 19.5}
                    onChange={(e) => setEditingSub({ ...editingSub, cota_residencia: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={editingSub.whatsapp || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, whatsapp: e.target.value })}
                    placeholder="(51) 99999-9999"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editingSub.email || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, email: e.target.value })}
                    placeholder="morador@exemplo.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-semibold">
                    <input
                      type="checkbox"
                      checked={editingSub.receber_alertas ?? editingSub.active ?? true}
                      onChange={(e) => setEditingSub({ ...editingSub, receber_alertas: e.target.checked, active: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500"
                    />
                    <span>Morador Ativo (Receber alertas hidrológicos)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
