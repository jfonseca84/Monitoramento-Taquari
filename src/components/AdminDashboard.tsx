import React, { useState, useEffect } from 'react';
import { City, NewsItem, AlertItem, Sponsor, AdminUser } from '../types';
import { getCityThresholds } from '../data/cityThresholds';
import {
  supabase,
  isSupabaseConfigured,
  fetchCities,
  saveCity,
  deleteCity,
  saveCityThresholds,
  fetchAdminUsers,
  saveAdminUser,
  deleteAdminUser,
  fetchSponsors,
  saveSponsor,
  deleteSponsor,
  fetchCameras,
  saveCamera,
  deleteCamera,
  fetchNews,
  saveNews,
  deleteNews,
  fetchAlerts,
  saveAlert,
  deleteAlert,
  fetchSyncLogs,
  fetchAuditLogs,
  addAuditLog,
  fetchSettings,
  saveSetting,
  uploadStorageImage,
  localStore
} from '../lib/supabase';
import {
  X,
  LayoutDashboard,
  Building2,
  Camera,
  Newspaper,
  Bell,
  FileText,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  Award,
  Upload,
  Link as LinkIcon,
  Edit2,
  ShieldAlert,
  Globe,
  Clock,
  Phone,
  Users,
  Sliders,
  ShieldCheck,
  Waves
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  cities: initialCities,
  onRefreshData
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Operational state
  const [citiesList, setCitiesList] = useState<City[]>(initialCities);
  const [sponsorsList, setSponsorsList] = useState<Sponsor[]>([]);
  const [camerasList, setCamerasList] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [alertsList, setAlertsList] = useState<AlertItem[]>([]);
  const [syncLogsList, setSyncLogsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<Record<string, any>>({});

  // City form state
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [cityRiver, setCityRiver] = useState('Rio Taquari');
  const [cityLevel, setCityLevel] = useState<number>(3.0);
  const [cityImage, setCityImage] = useState('');
  const [cityCameraUrl, setCityCameraUrl] = useState('');
  const [cityDescription, setCityDescription] = useState('');
  const [cityOrder, setCityOrder] = useState<number>(1);
  const [cityActive, setCityActive] = useState<boolean>(true);
  const [cityUploading, setCityUploading] = useState<boolean>(false);

  // Sponsor form state
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState('');
  const [sponsorWebsite, setSponsorWebsite] = useState('');
  const [sponsorDisplayOrder, setSponsorDisplayOrder] = useState<number>(1);
  const [sponsorActive, setSponsorActive] = useState<boolean>(true);
  const [sponsorUploading, setSponsorUploading] = useState<boolean>(false);

  // Camera form state
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);
  const [cameraCityId, setCameraCityId] = useState('');
  const [cameraName, setCameraName] = useState('');
  const [cameraUrl, setCameraUrl] = useState('');
  const [cameraOnline, setCameraOnline] = useState<boolean>(true);
  const [cameraOrder, setCameraOrder] = useState<number>(1);

  // News form state
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsCategory, setNewsCategory] = useState<'Defesa Civil' | 'Prefeituras' | 'Meteorologia'>('Defesa Civil');
  const [newsImage, setNewsImage] = useState('');
  const [newsAuthor, setNewsAuthor] = useState('Defesa Civil');
  const [newsUploading, setNewsUploading] = useState<boolean>(false);

  // Alert form state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDesc, setAlertDesc] = useState('');
  const [alertLevel, setAlertLevel] = useState<'atencao' | 'alerta' | 'inundacao'>('atencao');
  const [alertCityId, setAlertCityId] = useState('');

  // Settings form state
  const [siteName, setSiteName] = useState('Rio Taquari - Monitoramento Hidrológico');
  const [updateFreq, setUpdateFreq] = useState<number>(15);
  const [sourceUrl, setSourceUrl] = useState('https://niveldosrios.guerreirosdohumaita.com.br/');
  const [emergencyPhone, setEmergencyPhone] = useState('199');

  // Thresholds state (Cotas Hidrológicas)
  const [thresholdEdits, setThresholdEdits] = useState<Record<string, { normal_level: number; attention_level: number; alert_level: number; flood_level: number }>>({});
  const [thresholdSavingId, setThresholdSavingId] = useState<string | null>(null);
  const [thresholdFeedback, setThresholdFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});

  // Admin users state
  const [adminUsersList, setAdminUsersList] = useState<AdminUser[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'administrador' | 'editor'>('administrador');
  const [adminUserLoading, setAdminUserLoading] = useState(false);
  const [adminUserMessage, setAdminUserMessage] = useState<string | null>(null);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser | null>(null);
  const [userRole, setUserRole] = useState<'administrador' | 'editor'>('administrador');

  // Load all admin data from Supabase
  const loadAllAdminData = async () => {
    try {
      const citiesData = await fetchCities();
      setCitiesList(citiesData);

      // Initialize thresholdEdits for each city
      const tMap: Record<string, { normal_level: number; attention_level: number; alert_level: number; flood_level: number }> = {};
      citiesData.forEach(city => {
        const th = getCityThresholds(city);
        tMap[city.id] = {
          normal_level: city.normal_level ?? th.normal,
          attention_level: city.attention_level ?? th.attention,
          alert_level: city.alert_level ?? th.alert,
          flood_level: city.flood_level ?? th.flood
        };
      });
      setThresholdEdits(prev => ({ ...tMap, ...prev }));

      if (citiesData.length > 0 && !editingCityId) {
        setCameraCityId(citiesData[0].id);
        setAlertCityId(citiesData[0].id);
      }

      const sponsorsData = await fetchSponsors(true);
      setSponsorsList(sponsorsData);

      const camerasData = await fetchCameras();
      setCamerasList(camerasData);

      const newsData = await fetchNews();
      setNewsList(newsData);

      const alertsData = await fetchAlerts();
      setAlertsList(alertsData);

      const syncLogsData = await fetchSyncLogs();
      setSyncLogsList(syncLogsData);

      const auditLogsData = await fetchAuditLogs();
      setAuditLogsList(auditLogsData);

      const settingsMap = await fetchSettings();
      setSettingsData(settingsMap);
      if (settingsMap.site_name) setSiteName(settingsMap.site_name);
      if (settingsMap.update_frequency_minutes) setUpdateFreq(settingsMap.update_frequency_minutes);
      if (settingsMap.official_source_url) setSourceUrl(settingsMap.official_source_url);
      if (settingsMap.emergency_contacts?.defesa_civil) setEmergencyPhone(settingsMap.emergency_contacts.defesa_civil);

      // Fetch admin users
      const usersData = await fetchAdminUsers();
      setAdminUsersList(usersData);

    } catch (e) {
      console.error('Error loading admin dashboard data:', e);
    }
  };

  // Session check and Auth Listener
  useEffect(() => {
    const initSession = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error || !session?.user) {
            setIsAuthenticated(false);
            setCurrentAdminUser(null);
            return;
          }

          setIsAuthenticated(true);
          const { data: profile } = await supabase.from('admin_users').select('*').eq('user_id', session.user.id).maybeSingle();
          if (profile) {
            setCurrentAdminUser(profile as AdminUser);
            setUserRole(profile.nivel_acesso || 'administrador');
          } else {
            setCurrentAdminUser({
              id: session.user.id,
              user_id: session.user.id,
              nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Administrador',
              email: session.user.email || '',
              nivel_acesso: 'administrador'
            });
            setUserRole('administrador');
          }
        } catch (e) {
          console.warn('Session check note:', e);
          setIsAuthenticated(false);
          setCurrentAdminUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentAdminUser(null);
      }
    };

    if (isOpen) {
      initSession();
    }

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setIsAuthenticated(false);
          setCurrentAdminUser(null);
        } else if (session?.user && isOpen) {
          setIsAuthenticated(true);
          const { data: profile } = await supabase.from('admin_users').select('*').eq('user_id', session.user.id).maybeSingle();
          if (profile) {
            setCurrentAdminUser(profile as AdminUser);
            setUserRole(profile.nivel_acesso || 'administrador');
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadAllAdminData();
    }
  }, [isAuthenticated, isOpen, activeTab]);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    if (!isSupabaseConfigured || !supabase) {
      setAuthError('O serviço de autenticação do Supabase não está configurado.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setAuthError(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error.message
        );
        setIsLoggingIn(false);
        return;
      }

      if (data.user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase.from('admin_users').select('*').eq('user_id', data.user.id).maybeSingle();
        if (profile) {
          setCurrentAdminUser(profile as AdminUser);
          setUserRole(profile.nivel_acesso || 'administrador');
        } else {
          const newAdmin = {
            user_id: data.user.id,
            nome: data.user.user_metadata?.nome || data.user.email?.split('@')[0] || 'Administrador',
            email: data.user.email || email,
            nivel_acesso: 'administrador' as const
          };
          const created = await saveAdminUser(newAdmin);
          if (created) setCurrentAdminUser(created);
        }
        await addAuditLog('LOGIN', 'auth', 'Usuário autenticado no painel administrativo', { email: data.user.email });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao realizar login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    // Clear any local state
    setIsAuthenticated(false);
    setCurrentAdminUser(null);
    setEmail('');
    setPassword('');
    setAuthError(null);
    await addAuditLog('LOGOUT', 'auth', 'Sessão encerrada pelo usuário');
  };

  // ==========================================
  // HANDLERS: CIDADES
  // ==========================================
  const handleCityImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCityUploading(true);
      try {
        const url = await uploadStorageImage('cidades', file);
        setCityImage(url);
      } catch (err) {
        alert('Erro ao enviar imagem da cidade.');
      } finally {
        setCityUploading(false);
      }
    }
  };

  const handleSaveCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName) return alert('Informe o nome da cidade.');

    const cityPayload = {
      id: editingCityId || undefined,
      name: cityName,
      slug: cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
      river: cityRiver,
      current_level: Number(cityLevel),
      image: cityImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      camera_url: cityCameraUrl,
      description: cityDescription,
      ordem: Number(cityOrder),
      active: cityActive
    };

    await saveCity(cityPayload);
    await addAuditLog(editingCityId ? 'UPDATE' : 'CREATE', 'cidades', `Cidade ${cityName} salva com sucesso`);

    setEditingCityId(null);
    setCityName('');
    setCityRiver('Rio Taquari');
    setCityLevel(3.0);
    setCityImage('');
    setCityCameraUrl('');
    setCityDescription('');

    await loadAllAdminData();
    onRefreshData();
    alert('Cidade salva com sucesso!');
  };

  const handleEditCity = (city: City) => {
    setEditingCityId(city.id);
    setCityName(city.name);
    setCityRiver(city.river || 'Rio Taquari');
    setCityLevel(city.current_level || 3.0);
    setCityImage(city.image || '');
    setCityCameraUrl(city.camera_url || '');
    setCityDescription(city.description || '');
    setCityOrder(city.ordem || 1);
    setCityActive(city.active ?? true);
  };

  const handleDeleteCity = async (id: string, name: string) => {
    if (confirm(`Deseja remover a cidade ${name}?`)) {
      await deleteCity(id);
      await addAuditLog('DELETE', 'cidades', `Cidade ${name} excluída`);
      await loadAllAdminData();
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: PATROCINADORES
  // ==========================================
  const handleSponsorLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSponsorUploading(true);
      try {
        const url = await uploadStorageImage('patrocinadores', file);
        setSponsorLogoUrl(url);
      } catch (err) {
        alert('Erro ao enviar logo.');
      } finally {
        setSponsorUploading(false);
      }
    }
  };

  const handleSaveSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorName) return alert('Informe o nome do patrocinador.');

    const sponsorData = {
      id: editingSponsorId || undefined,
      name: sponsorName,
      logo_url: sponsorLogoUrl,
      website: sponsorWebsite,
      display_order: Number(sponsorDisplayOrder) || 1,
      active: sponsorActive
    };

    await saveSponsor(sponsorData);
    await addAuditLog(editingSponsorId ? 'UPDATE' : 'CREATE', 'patrocinadores', `Patrocinador ${sponsorName} salvo`);

    setEditingSponsorId(null);
    setSponsorName('');
    setSponsorLogoUrl('');
    setSponsorWebsite('');
    setSponsorDisplayOrder(sponsorsList.length + 1);
    setSponsorActive(true);

    await loadAllAdminData();
    onRefreshData();
    alert('Patrocinador salvo com sucesso!');
  };

  const handleEditSponsor = (sponsor: Sponsor) => {
    setEditingSponsorId(sponsor.id);
    setSponsorName(sponsor.name);
    setSponsorLogoUrl(sponsor.logo_url);
    setSponsorWebsite(sponsor.website || '');
    setSponsorDisplayOrder(sponsor.display_order);
    setSponsorActive(sponsor.active);
  };

  const handleDeleteSponsor = async (id: string, name: string) => {
    if (confirm(`Excluir o patrocinador ${name}?`)) {
      await deleteSponsor(id);
      await addAuditLog('DELETE', 'patrocinadores', `Patrocinador ${name} excluído`);
      await loadAllAdminData();
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: CÂMERAS
  // ==========================================
  const handleSaveCameraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cameraName || !cameraUrl) return alert('Preencha o nome e a URL da câmera.');

    const cameraData = {
      id: editingCameraId || undefined,
      city_id: cameraCityId || citiesList[0]?.id,
      name: cameraName,
      url: cameraUrl,
      online: cameraOnline,
      display_order: Number(cameraOrder) || 1
    };

    await saveCamera(cameraData);
    await addAuditLog(editingCameraId ? 'UPDATE' : 'CREATE', 'cameras', `Câmera ${cameraName} salva`);

    setEditingCameraId(null);
    setCameraName('');
    setCameraUrl('');
    setCameraOnline(true);
    setCameraOrder(camerasList.length + 1);

    await loadAllAdminData();
    alert('Câmera salva com sucesso!');
  };

  const handleDeleteCamera = async (id: string, name: string) => {
    if (confirm(`Remover câmera ${name}?`)) {
      await deleteCamera(id);
      await addAuditLog('DELETE', 'cameras', `Câmera ${name} excluída`);
      await loadAllAdminData();
    }
  };

  // ==========================================
  // HANDLERS: NOTÍCIAS
  // ==========================================
  const handleNewsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewsUploading(true);
      try {
        const url = await uploadStorageImage('noticias', file);
        setNewsImage(url);
      } catch (err) {
        alert('Erro ao enviar imagem da notícia.');
      } finally {
        setNewsUploading(false);
      }
    }
  };

  const handleSaveNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsSummary) return alert('Preencha o título e resumo da notícia.');

    const newsData = {
      id: editingNewsId || undefined,
      title: newsTitle,
      summary: newsSummary,
      content: newsSummary,
      category: newsCategory,
      author: newsAuthor,
      image: newsImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      published: true
    };

    await saveNews(newsData);
    await addAuditLog(editingNewsId ? 'UPDATE' : 'CREATE', 'noticias', `Notícia "${newsTitle}" salva`);

    setEditingNewsId(null);
    setNewsTitle('');
    setNewsSummary('');
    setNewsImage('');

    await loadAllAdminData();
    onRefreshData();
    alert('Notícia publicada com sucesso!');
  };

  const handleDeleteNews = async (id: string, title: string) => {
    if (confirm(`Excluir notícia "${title}"?`)) {
      await deleteNews(id);
      await addAuditLog('DELETE', 'noticias', `Notícia "${title}" excluída`);
      await loadAllAdminData();
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: ALERTAS
  // ==========================================
  const handleSaveAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle) return alert('Informe o título do alerta.');

    const alertData = {
      city_id: alertCityId || citiesList[0]?.id || 'lajeado',
      title: alertTitle,
      description: alertDesc,
      level: alertLevel,
      active: true
    };

    await saveAlert(alertData);
    await addAuditLog('CREATE', 'alertas', `Alerta de emergência emitido: ${alertTitle}`);

    setAlertTitle('');
    setAlertDesc('');

    await loadAllAdminData();
    onRefreshData();
    alert('Alerta de emergência publicado!');
  };

  const handleDeleteAlert = async (id: string) => {
    if (confirm('Encerrar este alerta?')) {
      await deleteAlert(id);
      await addAuditLog('DELETE', 'alertas', `Alerta ${id} encerrado`);
      await loadAllAdminData();
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: COTAS HIDROLÓGICAS
  // ==========================================
  const handleThresholdInputChange = (cityId: string, field: 'normal_level' | 'attention_level' | 'alert_level' | 'flood_level', val: number) => {
    const cityObj = citiesList.find(c => c.id === cityId);
    const th = getCityThresholds(cityObj || cityId);
    setThresholdEdits(prev => ({
      ...prev,
      [cityId]: {
        ...(prev[cityId] || {
          normal_level: cityObj?.normal_level ?? th.normal,
          attention_level: cityObj?.attention_level ?? th.attention,
          alert_level: cityObj?.alert_level ?? th.alert,
          flood_level: cityObj?.flood_level ?? th.flood
        }),
        [field]: val
      }
    }));
  };

  const handleSaveThreshold = async (city: City) => {
    const th = getCityThresholds(city);
    const edits = thresholdEdits[city.id] || {
      normal_level: city.normal_level ?? th.normal,
      attention_level: city.attention_level ?? th.attention,
      alert_level: city.alert_level ?? th.alert,
      flood_level: city.flood_level ?? th.flood
    };

    // Validation rule: normal < atenção < alerta < inundação
    if (edits.normal_level >= edits.attention_level || edits.attention_level >= edits.alert_level || edits.alert_level >= edits.flood_level) {
      setThresholdFeedback(prev => ({
        ...prev,
        [city.id]: {
          type: 'error',
          message: 'Validação Invalida: A ordem obrigatória é Normal < Atenção < Alerta < Inundação.'
        }
      }));
      return;
    }

    setThresholdSavingId(city.id);
    setThresholdFeedback(prev => ({ ...prev, [city.id]: undefined as any }));

    try {
      await saveCityThresholds(city.id, edits);
      await addAuditLog('UPDATE', 'cotas', `Cotas hidrológicas salvas para ${city.name}`, edits);
      setThresholdFeedback(prev => ({
        ...prev,
        [city.id]: { type: 'success', message: 'Cotas atualizadas e salvas no Supabase com sucesso!' }
      }));
      await loadAllAdminData();
      onRefreshData();
    } catch (err: any) {
      setThresholdFeedback(prev => ({
        ...prev,
        [city.id]: { type: 'error', message: err.message || 'Falha ao salvar cotas no banco.' }
      }));
    } finally {
      setThresholdSavingId(null);
    }
  };

  // ==========================================
  // HANDLERS: USUÁRIOS ADMINISTRADORES
  // ==========================================
  const handleCreateAdminUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail) return alert('Preencha o nome e o e-mail do usuário.');

    setAdminUserLoading(true);
    setAdminUserMessage(null);

    try {
      let authUserId = `usr-${Date.now()}`;
      if (isSupabaseConfigured && supabase && newAdminPassword) {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: newAdminEmail,
          password: newAdminPassword,
          options: {
            data: {
              nome: newAdminName,
              nivel_acesso: newAdminRole
            }
          }
        });
        if (authData?.user) {
          authUserId = authData.user.id;
        }
      }

      const created = await saveAdminUser({
        user_id: authUserId,
        nome: newAdminName,
        email: newAdminEmail,
        nivel_acesso: newAdminRole
      });

      if (created) {
        await addAuditLog('CREATE', 'admin_users', `Usuário ${newAdminEmail} cadastrado como ${newAdminRole}`);
        setAdminUserMessage(`Usuário ${newAdminName} salvo com sucesso!`);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        const updatedUsers = await fetchAdminUsers();
        setAdminUsersList(updatedUsers);
      }
    } catch (err: any) {
      setAdminUserMessage(`Erro: ${err.message || 'Não foi possível cadastrar o usuário.'}`);
    } finally {
      setAdminUserLoading(false);
    }
  };

  const handleDeleteAdminUserSubmit = async (id: string, name: string) => {
    if (confirm(`Remover o acesso administrativo de ${name}?`)) {
      await deleteAdminUser(id);
      await addAuditLog('DELETE', 'admin_users', `Usuário ${name} removido das permissões`);
      const updatedUsers = await fetchAdminUsers();
      setAdminUsersList(updatedUsers);
    }
  };

  // ==========================================
  // HANDLERS: CONFIGURAÇÕES
  // ==========================================
  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSetting('site_name', siteName, 'Nome oficial do portal');
    await saveSetting('update_frequency_minutes', Number(updateFreq), 'Frequência de atualização em minutos');
    await saveSetting('official_source_url', sourceUrl, 'URL da fonte oficial de dados');
    await saveSetting('emergency_contacts', { defesa_civil: emergencyPhone, bombeiros: '193', brigada: '190' }, 'Contatos de emergência');

    await addAuditLog('UPDATE', 'configuracoes', 'Configurações gerais do sistema salvas');
    alert('Configurações salvas no Supabase com sucesso!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 lg:p-6 animate-fade-in">
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B132B] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                ÁREA ADMINISTRATIVA
              </h2>
              <p className="text-[11px] text-slate-400">
                Centro de Operações e Gestão de Telemetria (Supabase Integrated)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-200">{currentAdminUser?.nome || 'Operador'}</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 font-bold text-[10px] uppercase border border-cyan-800">
                  {userRole}
                </span>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800/80 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LOGIN FORM IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#070F22]">
            <form onSubmit={handleLogin} className="bg-[#0F172A] border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-cyan-950/80 text-cyan-400 border border-cyan-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Autenticação do Operador</h3>
                <p className="text-xs text-slate-400 mt-1">Acesso via Supabase Auth para Gestores da Defesa Civil.</p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl">
                  {authError}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg transition-all mt-2 cursor-pointer"
                >
                  {isLoggingIn ? 'Autenticando...' : 'Entrar no Painel'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* MAIN DASHBOARD LAYOUT */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* SIDEBAR MENU */}
            <aside className="w-full md:w-64 bg-[#0B132B] border-r border-slate-800 p-3 flex flex-row md:flex-col gap-1 overflow-x-auto shrink-0">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'patrocinadores', label: 'Patrocinadores', icon: Award },
                { id: 'cidades', label: 'Cidades', icon: Building2 },
                { id: 'cotas', label: 'Cotas Oficiais', icon: Sliders },
                { id: 'cameras', label: 'Câmeras', icon: Camera },
                { id: 'noticias', label: 'Notícias', icon: Newspaper },
                { id: 'alertas', label: 'Alertas', icon: Bell },
                { id: 'sincronizacao', label: 'Sincronização', icon: RefreshCw },
                { id: 'logs', label: 'Registros', icon: FileText },
                { id: 'usuarios', label: 'Usuários Administradores', icon: Users },
                { id: 'configuracoes', label: 'Configurações', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#1E293B] text-cyan-400 border border-cyan-800/80 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* MAIN PANEL */}
            <main className="flex-1 bg-[#070F22] p-6 overflow-y-auto">
              
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400">Total de Estações</p>
                      <p className="text-2xl font-bold text-white mt-1">{citiesList.length}</p>
                    </div>
                    <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400">Alertas Ativos</p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">{alertsList.length}</p>
                    </div>
                    <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400">Notícias Publicadas</p>
                      <p className="text-2xl font-bold text-sky-400 mt-1">{newsList.length}</p>
                    </div>
                    <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400">Status da Sincronização</p>
                      <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Ativo via river-updater
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase">Arquitetura Desacoplada do Sistema</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      O frontend opera de modo 100% estático e consome dados do <strong>Supabase</strong>. A atualização telemétrica da Agência Nacional de Águas (ANA) ocorre de forma autônoma através do serviço independente <strong>river-updater</strong> via Cron Job a cada 15 minutos.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: COTAS HIDROLÓGICAS */}
              {activeTab === 'cotas' && (
                <div className="space-y-6">
                  <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <span>Cotas Oficiais das Cidades (17 Cidades Oficiais)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Gerencie os limiares operacionais de Normalidade, Atenção, Alerta e Inundação diretamente no Supabase. Os valores do banco de dados são a fonte única e soberana do portal.
                      </p>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-mono font-semibold shrink-0">
                      Validação: Normal &lt; Atenção &lt; Alerta &lt; Inundação
                    </div>
                  </div>

                  {/* VALE DO TAQUARI */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Waves className="w-4 h-4 text-sky-400" />
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        Vale do Taquari (7 Cidades)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {citiesList.filter(c => c.basin === 'taquari').map((city) => {
                        const th = getCityThresholds(city);
                        const edits = thresholdEdits[city.id] || {
                          normal_level: city.normal_level ?? th.normal,
                          attention_level: city.attention_level ?? th.attention,
                          alert_level: city.alert_level ?? th.alert,
                          flood_level: city.flood_level ?? th.flood
                        };
                        const isValid = edits.normal_level < edits.attention_level &&
                                        edits.attention_level < edits.alert_level &&
                                        edits.alert_level < edits.flood_level;
                        const feedback = thresholdFeedback[city.id];
                        const isSaving = thresholdSavingId === city.id;

                        return (
                          <div key={city.id} className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="text-sm font-bold text-white">{city.name}</h5>
                                <p className="text-[11px] text-slate-400">{city.river || 'Rio Taquari'}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                isValid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                              }`}>
                                {isValid ? '✓ Cotas Válidas' : '⚠️ Inválido'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Normal (m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={edits.normal_level}
                                  onChange={(e) => handleThresholdInputChange(city.id, 'normal_level', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-amber-400/90 font-semibold mb-1">Atenção (m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={edits.attention_level}
                                  onChange={(e) => handleThresholdInputChange(city.id, 'attention_level', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-orange-400 font-semibold mb-1">Alerta (m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={edits.alert_level}
                                  onChange={(e) => handleThresholdInputChange(city.id, 'alert_level', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-orange-300 font-mono focus:outline-none focus:border-orange-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-red-400 font-semibold mb-1">Inundação (m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={edits.flood_level}
                                  onChange={(e) => handleThresholdInputChange(city.id, 'flood_level', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-red-300 font-mono focus:outline-none focus:border-red-500"
                                />
                              </div>
                            </div>

                            {feedback && (
                              <p className={`text-[11px] p-2 rounded-lg font-medium ${
                                feedback.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-red-950/80 text-red-300 border border-red-800'
                              }`}>
                                {feedback.message}
                              </p>
                            )}

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleSaveThreshold(city)}
                                disabled={!isValid || isSaving}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{isSaving ? 'Salvando...' : 'Salvar Cotas'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BACIA DO GUAÍBA */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Waves className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Bacia do Guaíba (10 Cidades)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {citiesList.filter(c => c.basin === 'guaiba').map((city) => {
                        const th = getCityThresholds(city);
                        const edits = thresholdEdits[city.id] || {
                          normal_level: city.normal_level ?? th.normal,
                          attention_level: city.attention_level ?? th.attention,
                          alert_level: city.alert_level ?? th.alert,
                          flood_level: city.flood_level ?? th.flood
                        };
                        const isValid = edits.normal_level < edits.attention_level &&
                                        edits.attention_level < edits.alert_level &&
                                        edits.alert_level < edits.flood_level;
                        const feedback = thresholdFeedback[city.id];
                        const isSaving = thresholdSavingId === city.id;

                        return (
                          <div key={city.id} className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="text-sm font-bold text-white">{city.name}</h5>
                                <p className="text-[11px] text-slate-400">{city.river || 'Rio Caí / Guaíba'}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                isValid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                              }`}>
                                {isValid ? '✓ Cotas Válidas' : '⚠️ Inválido'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Normal (m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={edits.normal_level}
                                  onChange={(e) => handleThresholdInputChange(city.id, 'normal_level', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-amber-400/90 font-semibold mb-1">Atenção (m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={edits.attention_level}
                                  onChange={(e) => handleThresholdInputChange(city.id, 'attention_level', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-orange-400 font-semibold mb-1">Alerta (m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={edits.alert_level}
                                  onChange={(e) => handleThresholdInputChange(city.id, 'alert_level', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-orange-300 font-mono focus:outline-none focus:border-orange-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-red-400 font-semibold mb-1">Inundação (m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={edits.flood_level}
                                  onChange={(e) => handleThresholdInputChange(city.id, 'flood_level', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-red-300 font-mono focus:outline-none focus:border-red-500"
                                />
                              </div>
                            </div>

                            {feedback && (
                              <p className={`text-[11px] p-2 rounded-lg font-medium ${
                                feedback.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-red-950/80 text-red-300 border border-red-800'
                              }`}>
                                {feedback.message}
                              </p>
                            )}

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleSaveThreshold(city)}
                                disabled={!isValid || isSaving}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{isSaving ? 'Salvando...' : 'Salvar Cotas'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: USUÁRIOS ADMINISTRADORES */}
              {activeTab === 'usuarios' && (
                <div className="space-y-6">
                  <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span>Gestão de Usuários Administradores (Supabase Auth)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Controle de acesso e atribuição de papéis (administrador ou editor) vinculados à tabela <code className="text-cyan-300 font-mono">admin_users</code>.
                      </p>
                    </div>
                  </div>

                  {/* CADASTRO DE NOVO USUÁRIO */}
                  <form onSubmit={handleCreateAdminUserSubmit} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Plus className="w-4 h-4 text-cyan-400" />
                      <span>Cadastrar Novo Usuário Administrativo</span>
                    </h4>

                    {adminUserMessage && (
                      <div className="p-3 bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs rounded-xl font-medium">
                        {adminUserMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Nome Completo *</label>
                        <input
                          type="text"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="Ex: Carlos Silva"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">E-mail *</label>
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="carlos@taquari.gov.br"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Senha Inicial</label>
                        <input
                          type="password"
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Nível de Acesso</label>
                        <select
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="administrador">Administrador (Acesso Completo)</option>
                          <option value="editor">Editor (Notícias e Alertas)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={adminUserLoading}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{adminUserLoading ? 'Cadastrando...' : 'Cadastrar Usuário'}</span>
                      </button>
                    </div>
                  </form>

                  {/* LISTA DE USUÁRIOS EXISTENTES */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Usuários Cadastrados ({adminUsersList.length})
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">E-mail</th>
                            <th className="p-3">Nível de Acesso</th>
                            <th className="p-3">Cadastrado em</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-[11px]">
                          {adminUsersList.map((usr) => (
                            <tr key={usr.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-semibold text-white">{usr.nome}</td>
                              <td className="p-3 text-slate-300 font-mono">{usr.email}</td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                                  usr.nivel_acesso === 'administrador'
                                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                    : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                                }`}>
                                  {usr.nivel_acesso === 'administrador' ? 'Administrador' : 'Editor'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">
                                {usr.criado_em ? new Date(usr.criado_em).toLocaleDateString('pt-BR') : 'Original'}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteAdminUserSubmit(usr.id, usr.nome)}
                                  className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Remover Acesso"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PATROCINADORES */}
              {activeTab === 'patrocinadores' && (
                <div className="space-y-6">
                  <form onSubmit={handleSaveSponsorSubmit} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {editingSponsorId ? 'Editar Patrocinador' : 'Adicionar Novo Patrocinador'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Nome da Empresa *</label>
                        <input
                          type="text"
                          value={sponsorName}
                          onChange={(e) => setSponsorName(e.target.value)}
                          placeholder="Ex: Sicredi, Stara"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Website (Link)</label>
                        <input
                          type="text"
                          value={sponsorWebsite}
                          onChange={(e) => setSponsorWebsite(e.target.value)}
                          placeholder="https://empresa.com.br"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Ordem de Exibição</label>
                        <input
                          type="number"
                          value={sponsorDisplayOrder}
                          onChange={(e) => setSponsorDisplayOrder(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Status</label>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer text-slate-200">
                          <input
                            type="checkbox"
                            checked={sponsorActive}
                            onChange={(e) => setSponsorActive(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500"
                          />
                          <span>{sponsorActive ? 'Ativo (Exibir)' : 'Inativo (Ocultar)'}</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-slate-300 font-medium">Logo (Upload para Supabase Storage)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={sponsorLogoUrl}
                            onChange={(e) => setSponsorLogoUrl(e.target.value)}
                            placeholder="URL da logo ou selecione o arquivo"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          />
                          <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 font-medium shrink-0">
                            <Upload className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{sponsorUploading ? 'Enviando...' : 'Enviar Logo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSponsorLogoUpload}
                              className="hidden"
                              disabled={sponsorUploading}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Pré-visualização</label>
                        <div className="h-14 rounded-xl bg-[#0A1633] border border-[#1A315F] p-2 flex items-center justify-center">
                          {sponsorLogoUrl ? (
                            <img src={sponsorLogoUrl} alt="Preview" className="max-h-10 max-w-full object-contain" />
                          ) : (
                            <span className="text-xs text-slate-600 font-bold">PREVIEW LOGO</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingSponsorId ? 'Atualizar Patrocinador' : 'Salvar Patrocinador'}</span>
                    </button>
                  </form>

                  {/* SPONSORS LIST */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-3">Patrocinadores Cadastrados ({sponsorsList.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                          <tr>
                            <th className="p-2 w-12 text-center">Ordem</th>
                            <th className="p-2">Logo</th>
                            <th className="p-2">Nome</th>
                            <th className="p-2">Website</th>
                            <th className="p-2 text-center">Status</th>
                            <th className="p-2 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {sponsorsList.map((sponsor) => (
                            <tr key={sponsor.id}>
                              <td className="p-2 text-center font-mono font-bold text-cyan-400">#{sponsor.display_order}</td>
                              <td className="p-2">
                                <img src={sponsor.logo_url} alt={sponsor.name} className="h-8 max-w-[100px] object-contain" />
                              </td>
                              <td className="p-2 font-bold text-white">{sponsor.name}</td>
                              <td className="p-2 text-slate-400">{sponsor.website || '—'}</td>
                              <td className="p-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sponsor.active ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                  {sponsor.active ? 'ATIVO' : 'INATIVO'}
                                </span>
                              </td>
                              <td className="p-2 text-right space-x-1">
                                <button onClick={() => handleEditSponsor(sponsor)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteSponsor(sponsor.id, sponsor.name)} className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CIDADES */}
              {activeTab === 'cidades' && (
                <div className="space-y-6">
                  <form onSubmit={handleSaveCitySubmit} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
                    <h4 className="text-xs font-bold text-slate-200 uppercase">
                      {editingCityId ? 'Editar Cidade' : 'Cadastrar Nova Cidade'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 mb-1">Nome do Município *</label>
                        <input
                          type="text"
                          value={cityName}
                          onChange={(e) => setCityName(e.target.value)}
                          placeholder="Ex: Lajeado"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Rio Principal</label>
                        <input
                          type="text"
                          value={cityRiver}
                          onChange={(e) => setCityRiver(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Nível Atual (m)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={cityLevel}
                          onChange={(e) => setCityLevel(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 mb-1">Imagem Principal (Upload Supabase Storage)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={cityImage}
                            onChange={(e) => setCityImage(e.target.value)}
                            placeholder="URL da imagem da cidade"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          />
                          <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1">
                            <Upload className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{cityUploading ? '...' : 'Enviar'}</span>
                            <input type="file" accept="image/*" onChange={handleCityImageUpload} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">URL da Câmera ao Vivo / Stream</label>
                        <input
                          type="text"
                          value={cityCameraUrl}
                          onChange={(e) => setCityCameraUrl(e.target.value)}
                          placeholder="https://youtube.com/embed/..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Descrição Informativa</label>
                      <textarea
                        rows={2}
                        value={cityDescription}
                        onChange={(e) => setCityDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>Salvar Cidade</span>
                    </button>
                  </form>

                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-3">Cidades Cadastradas ({citiesList.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {citiesList.map((city) => (
                        <div key={city.id} className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white">{city.name}</p>
                            <p className="text-[11px] text-slate-400">Nível: <span className="text-cyan-400 font-mono font-bold">{city.current_level}m</span></p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditCity(city)} className="p-1.5 bg-slate-800 text-cyan-400 rounded-lg">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteCity(city.id, city.name)} className="p-1.5 bg-slate-800 text-red-400 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CÂMERAS */}
              {activeTab === 'cameras' && (
                <div className="space-y-6">
                  <form onSubmit={handleSaveCameraSubmit} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
                    <h4 className="text-xs font-bold text-slate-200 uppercase">Gestão de Câmeras de Monitoramento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 mb-1">Cidade Associada</label>
                        <select
                          value={cameraCityId}
                          onChange={(e) => setCameraCityId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        >
                          {citiesList.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Nome da Câmera</label>
                        <input
                          type="text"
                          value={cameraName}
                          onChange={(e) => setCameraName(e.target.value)}
                          placeholder="Ex: Ponte Lajeado - Estrela"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">URL da Transmissão (Stream/Embed)</label>
                        <input
                          type="text"
                          value={cameraUrl}
                          onChange={(e) => setCameraUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>Salvar Câmera</span>
                    </button>
                  </form>

                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-3">Câmeras Ativas ({camerasList.length})</h4>
                    <div className="divide-y divide-slate-800 text-xs">
                      {camerasList.map((cam) => (
                        <div key={cam.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">{cam.name}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-md">{cam.url}</p>
                          </div>
                          <button onClick={() => handleDeleteCamera(cam.id, cam.name)} className="p-1.5 bg-slate-800 text-red-400 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: NOTÍCIAS */}
              {activeTab === 'noticias' && (
                <div className="space-y-6">
                  <form onSubmit={handleSaveNewsSubmit} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
                    <h4 className="text-xs font-bold text-slate-200 uppercase">Publicar Notícia Oficial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 mb-1">Título</label>
                        <input
                          type="text"
                          value={newsTitle}
                          onChange={(e) => setNewsTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Categoria</label>
                        <select
                          value={newsCategory}
                          onChange={(e) => setNewsCategory(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="Defesa Civil">Defesa Civil</option>
                          <option value="Prefeituras">Prefeituras</option>
                          <option value="Meteorologia">Meteorologia</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Resumo / Conteúdo</label>
                      <textarea
                        rows={3}
                        value={newsSummary}
                        onChange={(e) => setNewsSummary(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        required
                      />
                    </div>

                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>Publicar Notícia</span>
                    </button>
                  </form>

                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 text-xs">
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-3">Notícias Publicadas ({newsList.length})</h4>
                    <div className="space-y-2">
                      {newsList.map((item) => (
                        <div key={item.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-bold">{item.category}</span>
                            <p className="font-bold text-white mt-1">{item.title}</p>
                          </div>
                          <button onClick={() => handleDeleteNews(item.id, item.title)} className="p-1.5 bg-slate-800 text-red-400 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ALERTAS */}
              {activeTab === 'alertas' && (
                <div className="space-y-6">
                  <form onSubmit={handleSaveAlertSubmit} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
                    <h4 className="text-xs font-bold text-slate-200 uppercase">Emitir Alerta de Emergência</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 mb-1">Título do Alerta</label>
                        <input
                          type="text"
                          value={alertTitle}
                          onChange={(e) => setAlertTitle(e.target.value)}
                          placeholder="Ex: Nível atingiu a Cota de Atenção"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Severidade</label>
                        <select
                          value={alertLevel}
                          onChange={(e) => setAlertLevel(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="atencao">Atenção (Amarelo)</option>
                          <option value="alerta">Alerta (Laranja)</option>
                          <option value="inundacao">Inundação (Vermelho)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Instruções para a População</label>
                      <textarea
                        rows={2}
                        value={alertDesc}
                        onChange={(e) => setAlertDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Emitir Alerta Urgente</span>
                    </button>
                  </form>

                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 text-xs">
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-3">Alertas Ativos ({alertsList.length})</h4>
                    <div className="space-y-2">
                      {alertsList.map((alert) => (
                        <div key={alert.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-bold uppercase">{alert.level}</span>
                            <p className="font-bold text-white mt-1">{alert.title}</p>
                            <p className="text-[11px] text-slate-400">{alert.description}</p>
                          </div>
                          <button onClick={() => handleDeleteAlert(alert.id)} className="p-1.5 bg-slate-800 text-red-400 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SINCRONIZAÇÃO */}
              {activeTab === 'sincronizacao' && (
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase">Histórico do Serviço Autónomo (river-updater)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 font-mono">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Data/Hora</th>
                          <th className="p-2.5">Duração (ms)</th>
                          <th className="p-2.5">Atualizados</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Mensagem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px]">
                        {syncLogsList.map((log) => (
                          <tr key={log.id}>
                            <td className="p-2.5 whitespace-nowrap text-slate-400">{new Date(log.created_at || log.sync_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
                            <td className="p-2.5">{log.duration_ms}ms</td>
                            <td className="p-2.5 font-bold text-cyan-400">{log.updated_count}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.status === 'sucesso' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                                {String(log.status).toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-200">{log.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 8: LOGS */}
              {activeTab === 'logs' && (
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase">Logs Auditáveis do Sistema (Supabase audit_logs)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 font-mono">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Data/Hora</th>
                          <th className="p-2.5">Usuário</th>
                          <th className="p-2.5">Ação</th>
                          <th className="p-2.5">Entidade</th>
                          <th className="p-2.5">Mensagem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px]">
                        {auditLogsList.map((log) => (
                          <tr key={log.id}>
                            <td className="p-2.5 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
                            <td className="p-2.5 text-slate-300">{log.user_email || 'admin@taquari.gov.br'}</td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold text-[9px]">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-2.5 text-amber-300">{log.entity}</td>
                            <td className="p-2.5 text-slate-200">{log.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 9: CONFIGURAÇÕES */}
              {activeTab === 'configuracoes' && (
                <form onSubmit={handleSaveSettingsSubmit} className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
                  <h4 className="text-xs font-bold text-slate-200 uppercase">Configurações Gerais do Sistema</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 mb-1">Nome do Portal</label>
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Frequência de Atualização Esperada (minutos)</label>
                      <input
                        type="number"
                        value={updateFreq}
                        onChange={(e) => setUpdateFreq(parseInt(e.target.value) || 15)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Fonte Oficial de Dados Telemétricos</label>
                      <input
                        type="text"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Telefone da Defesa Civil</label>
                      <input
                        type="text"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Salvar Configurações no Supabase</span>
                  </button>
                </form>
              )}

            </main>
          </div>
        )}

      </div>
    </div>
  );
};
