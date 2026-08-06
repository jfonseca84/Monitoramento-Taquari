import React, { useState, useEffect, useRef } from 'react';
import { City, NewsItem, NewsSource, AlertItem, Sponsor, AdminUser, AlertSubscriber, AlertNotification, AlertStats, AlertHistoryItem, LevelStatus, CityCamera } from '../types';
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
  verifyAdminUserProfile,
  fetchSponsors,
  saveSponsor,
  deleteSponsor,
  fetchCameras,
  saveCamera,
  deleteCamera,
  fetchNews,
  saveNews,
  deleteNews,
  fetchNewsSources,
  saveNewsSource,
  deleteNewsSource,
  toggleNewsSourceActive,
  triggerNewsCollectorNow,
  fetchAlerts,
  saveAlert,
  deleteAlert,
  fetchSyncLogs,
  fetchAuditLogs,
  addAuditLog,
  fetchSettings,
  saveSetting,
  uploadStorageImage,
  localStore,
  fetchAlertSubscribers,
  toggleSubscriberActive,
  deleteSubscriber,
  fetchAlertNotifications,
  getAlertStats,
  checkAndTriggerRiverLevelAlerts,
  sendHydrologicalAlert,
  fetchAlertHistory,
  approveAlertHistory,
  processHydrologicalMeasurement,
  fetchAlertDispatches,
  processDispatchQueue
} from '../lib/supabase';
import { AlertDispatchItem } from '../types';
import { ResidentsIntelligenceView } from './ResidentsIntelligenceView';
import { AdminCentroAnalisesView } from './AdminCentroAnalisesView';
import { AdminLayoutConfigView } from './AdminLayoutConfigView';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useVisualEditor } from '../context/VisualEditorContext';
import {
  X,
  LayoutDashboard,
  BarChart3,
  Home,
  Building2,
  Camera,
  Video,
  Pencil,
  Newspaper,
  Rss,
  Globe,
  Clock,
  Play,
  Check,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Bell,
  FileText,
  RefreshCw,
  Settings,
  Wrench,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  Award,
  Upload,
  Loader2,
  Link as LinkIcon,
  Edit2,
  ShieldAlert,
  Phone,
  Users,
  Sliders,
  ShieldCheck,
  Waves,
  BellRing,
  Send,
  UserCheck,
  CheckCircle,
  Search,
  Filter,
  Radio,
  Download,
  Map,
  Mail,
  MessageSquare,
  Smartphone,
  Eye,
  SendHorizontal,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Info
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
  const { isEditMode, setEditMode, setIsAdmin, exportLayoutJSON, importLayoutJSON, resetToDefaultLayout, configs } = useVisualEditor();

  useEffect(() => {
    if (isAuthenticated) {
      setIsAdmin(true);
    }
  }, [isAuthenticated, setIsAdmin]);

  // Operational state
  const [citiesList, setCitiesList] = useState<City[]>(initialCities);
  const [sponsorsList, setSponsorsList] = useState<Sponsor[]>([]);
  const [camerasList, setCamerasList] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [alertsList, setAlertsList] = useState<AlertItem[]>([]);
  const [syncLogsList, setSyncLogsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<Record<string, any>>({});

  // Rede de Alertas State
  const [subscribersList, setSubscribersList] = useState<AlertSubscriber[]>([]);
  const [notificationsList, setNotificationsList] = useState<AlertNotification[]>([]);
  const [alertStatsList, setAlertStatsList] = useState<AlertStats[]>([]);
  
  // Subscribers Filters
  const [subCityFilter, setSubCityFilter] = useState<string>('all');
  const [subNeighborhoodFilter, setSubNeighborhoodFilter] = useState<string>('');
  const [subRiskFilter, setSubRiskFilter] = useState<'all' | 'risk' | 'info'>('all');
  const [subCotaFilter, setSubCotaFilter] = useState<string>('all');
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Central de Alertas State
  const [alertHistoryList, setAlertHistoryList] = useState<AlertHistoryItem[]>([]);
  const [dispatchesList, setDispatchesList] = useState<AlertDispatchItem[]>([]);
  const [centralCitySlug, setCentralCitySlug] = useState<string>('lajeado');
  const [centralSimLevel, setCentralSimLevel] = useState<number>(19.0);
  const [centralCustomMessage, setCentralCustomMessage] = useState<string>('');
  const [centralDispatching, setCentralDispatching] = useState<boolean>(false);
  const [centralSuccessMsg, setCentralSuccessMsg] = useState<string | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [selectedHistoryForDispatchModal, setSelectedHistoryForDispatchModal] = useState<AlertHistoryItem | null>(null);

  const handleSimulateHydrologicalAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setCentralDispatching(true);
    setCentralSuccessMsg(null);

    try {
      const cityData = citiesList.find(c => c.slug === centralCitySlug);
      const cityName = cityData?.name || centralCitySlug;
      
      const citySubscribers = subscribersList.filter(s => (s.cidade || s.city_slug) === centralCitySlug && (s.receber_alertas ?? s.active ?? true));
      const impactedSubscribers = citySubscribers.filter(s => Number(s.cota_residencia || 0) <= Number(centralSimLevel));

      const th = getCityThresholds(cityData || centralCitySlug);
      let tipoAlerta: 'atenção' | 'alerta' | 'inundação' = 'atenção';
      if (centralSimLevel >= th.flood) tipoAlerta = 'inundação';
      else if (centralSimLevel >= th.alert) tipoAlerta = 'alerta';

      await sendHydrologicalAlert(
        cityName,
        Number(centralSimLevel),
        tipoAlerta,
        impactedSubscribers,
        Number(centralSimLevel),
        centralCustomMessage.trim() || undefined
      );

      await addAuditLog(
        'INSERT',
        'alert_history',
        `Alerta simulado para ${cityName} cota ${centralSimLevel}m - ${impactedSubscribers.length} moradores alertados`
      );

      setCentralSuccessMsg(`Simulação e registro gravados no histórico! ${impactedSubscribers.length} morador(es) na cota ≤ ${Number(centralSimLevel).toFixed(2)}m identificados.`);
      
      const updatedHistory = await fetchAlertHistory();
      setAlertHistoryList(updatedHistory);
    } catch (err) {
      console.error('Erro na simulação do alerta:', err);
    } finally {
      setCentralDispatching(false);
    }
  };

  const handleApproveAlert = async (alertId: string) => {
    try {
      const adminName = currentAdminUser?.nome || 'Administrador';
      const success = await approveAlertHistory(alertId, adminName);
      if (success) {
        await addAuditLog(
          'UPDATE',
          'alert_history',
          `Alerta ID ${alertId} aprovado pelo administrador ${adminName} e fila multicanal gerada`
        );
        setCentralSuccessMsg(`Alerta aprovado e fila de envio gerada com sucesso!`);
        const updatedHistory = await fetchAlertHistory();
        setAlertHistoryList(updatedHistory);
        const updatedDispatches = await fetchAlertDispatches();
        setDispatchesList(updatedDispatches);
      }
    } catch (err) {
      console.error('Erro ao aprovar alerta:', err);
    }
  };

  const handleProcessQueue = async (alertHistoryId?: string) => {
    setIsProcessingQueue(true);
    setCentralSuccessMsg(null);
    try {
      const res = await processDispatchQueue(alertHistoryId);
      setCentralSuccessMsg(`Fila de envio processada com sucesso! ${res.processedCount} notificação(ões) enviada(s).`);
      const updatedDispatches = await fetchAlertDispatches();
      setDispatchesList(updatedDispatches);
    } catch (err) {
      console.error('Erro ao processar fila de envio:', err);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const handleExportSubscribersCSV = () => {
    const filtered = subscribersList
      .filter(s => subCityFilter === 'all' || (s.cidade || s.city_slug) === subCityFilter)
      .filter(s => subCotaFilter === 'all' || Number(s.cota_residencia || 0) <= Number(subCotaFilter))
      .filter(s => subStatusFilter === 'all' || (subStatusFilter === 'active' ? (s.receber_alertas ?? s.active) : !(s.receber_alertas ?? s.active)))
      .filter(s => !subNeighborhoodFilter || (s.bairro || s.neighborhood || '').toLowerCase().includes(subNeighborhoodFilter.toLowerCase()));

    const headers = ['ID', 'Nome Completo', 'Cidade', 'Bairro', 'WhatsApp', 'E-mail', 'Cota Residencia (m)', 'Status', 'Data Cadastro'];
    const rows = filtered.map(s => [
      s.id,
      `"${s.nome_completo || s.name || ''}"`,
      `"${s.cidade || s.city_slug || ''}"`,
      `"${s.bairro || s.neighborhood || ''}"`,
      `"${s.whatsapp || ''}"`,
      `"${s.email || ''}"`,
      (s.cota_residencia != null ? s.cota_residencia : 19).toFixed(2),
      (s.receber_alertas ?? s.active) ? 'Ativo' : 'Inativo',
      new Date(s.criado_em || s.created_at || Date.now()).toLocaleDateString('pt-BR')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alertas_moradores_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulator state
  const [simCitySlug, setSimCitySlug] = useState<string>('lajeado');
  const [simLevel, setSimLevel] = useState<number>(6.5);
  const [simStatus, setSimStatus] = useState<LevelStatus>('alerta');
  const [simMessage, setSimMessage] = useState<string>('');
  const [simSending, setSimSending] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // City form state
  const cityFormRef = useRef<HTMLFormElement>(null);
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
  const [adminCameraCityFilter, setAdminCameraCityFilter] = useState<string>('all');
  const [cameraCitySlug, setCameraCitySlug] = useState<string>('lajeado');
  const [cameraName, setCameraName] = useState('');
  const [cameraDescricao, setCameraDescricao] = useState('');
  const [cameraUrlStream, setCameraUrlStream] = useState('');
  const [cameraUrlThumbnail, setCameraUrlThumbnail] = useState('');
  const [cameraTipo, setCameraTipo] = useState<string>('YouTube');
  const [cameraLocalizacao, setCameraLocalizacao] = useState('');
  const [cameraOrder, setCameraOrder] = useState<number>(1);
  const [cameraAtivo, setCameraAtivo] = useState<boolean>(true);

  // News form state
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsCategory, setNewsCategory] = useState<'Defesa Civil' | 'Prefeituras' | 'Meteorologia' | 'Comunicados' | 'Alertas'>('Defesa Civil');
  const [newsImage, setNewsImage] = useState('');
  const [newsAuthor, setNewsAuthor] = useState('Defesa Civil');
  const [newsManterPermanente, setNewsManterPermanente] = useState<boolean>(false);
  const [newsExibirNoMenu, setNewsExibirNoMenu] = useState<boolean>(true);
  const [newsPrioridade, setNewsPrioridade] = useState<'baixa' | 'media' | 'alta'>('media');
  const [newsUploading, setNewsUploading] = useState<boolean>(false);

  // News Sources state
  const [newsSourcesList, setNewsSourcesList] = useState<NewsSource[]>([]);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sourceNome, setSourceNome] = useState('');
  const [sourceDescricao, setSourceDescricao] = useState('');
  const [newsSourceUrl, setNewsSourceUrl] = useState('');
  const [sourceTipo, setSourceTipo] = useState<'rss' | 'api' | 'html'>('rss');
  const [sourceAtivo, setSourceAtivo] = useState<boolean>(true);
  const [sourceFrequencia, setSourceFrequencia] = useState<'hourly' | 'multiple_daily' | 'daily' | 'weekly' | 'manual'>('hourly');
  const [sourceTimes, setSourceTimes] = useState<string[]>(['08:00', '18:00']);
  const [sourceTime, setSourceTime] = useState('08:00');
  const [sourceDayOfWeek, setSourceDayOfWeek] = useState<number>(1);
  const [sourceCountPerDay, setSourceCountPerDay] = useState<number>(2);
  const [sourceCategoriaPadrao, setSourceCategoriaPadrao] = useState<string>('Comunicados');
  const [sourceKeywordsIncluir, setSourceKeywordsIncluir] = useState<string>('taquari, enchente, cheia, inundação, rio, chuva, alerta, emergência, defesa civil, evacuação, nível, cota, prefeitura, boletim, decreto');
  const [sourceKeywordsIgnorar, setSourceKeywordsIgnorar] = useState<string>('esporte, eventos, cultura, entretenimento, futebol, carnaval');
  const [sourceImportarTodas, setSourceImportarTodas] = useState<boolean>(false);
  const [sourceTestingId, setSourceTestingId] = useState<string | null>(null);
  const [sourceTestFeedback, setSourceTestFeedback] = useState<string | null>(null);

  // Alert form state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDesc, setAlertDesc] = useState('');
  const [alertLevel, setAlertLevel] = useState<'atencao' | 'alerta' | 'inundacao'>('atencao');
  const [alertCityId, setAlertCityId] = useState('');

  // Settings form state
  const { settings: siteSettings, updateSettings } = useSiteSettings();
  const [siteName, setSiteName] = useState(siteSettings.site_name || 'Monitoramento Rio Taquari');
  const [siteSubtitle, setSiteSubtitle] = useState(siteSettings.site_subtitle || 'Informação e prevenção para o Vale do Taquari');
  const [siteDescription, setSiteDescription] = useState(siteSettings.site_description || 'Portal institucional e sistema de alerta hidrológico.');
  const [logoUrl, setLogoUrl] = useState<string | null>(siteSettings.logo_url || null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(siteSettings.favicon_url || null);

  // About Page state
  const [aboutBadge, setAboutBadge] = useState(siteSettings.about_badge || 'CENTRO DE OPERAÇÕES HIDROLÓGICAS');
  const [aboutTitle, setAboutTitle] = useState(siteSettings.about_title || 'Portal Profissional de Monitoramento Hidrológico');
  const [aboutText, setAboutText] = useState(siteSettings.about_text || 'Desenvolvido para oferecer previsibilidade, segurança e transparência em tempo real. Sincronizado a cada 5 minutos com dados da rede telemétrica oficial.');
  const [aboutFeature1Title, setAboutFeature1Title] = useState(siteSettings.about_feature1_title || 'Sensores de Precisão Radar');
  const [aboutFeature1Text, setAboutFeature1Text] = useState(siteSettings.about_feature1_text || 'Medição sem contato físico por micro-ondas com margem de erro de ±1cm e amostragem contínua.');
  const [aboutFeature2Title, setAboutFeature2Title] = useState(siteSettings.about_feature2_title || 'Sincronização Supabase');
  const [aboutFeature2Text, setAboutFeature2Text] = useState(siteSettings.about_feature2_text || 'Arquitetura desacoplada com tolerância a falhas, cache de alta performance e histórico auditável.');
  const [aboutFeature3Title, setAboutFeature3Title] = useState(siteSettings.about_feature3_title || 'Alertas Automatizados');
  const [aboutFeature3Text, setAboutFeature3Text] = useState(siteSettings.about_feature3_text || 'Emissão direta para prefeituras e órgãos de segurança comunitária assim que o nível atinge a cota de atenção.');
  const [aboutSaveSuccess, setAboutSaveSuccess] = useState<string | null>(null);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [updateFreq, setUpdateFreq] = useState<number>(15);
  const [sourceUrl, setSourceUrl] = useState('https://niveldosrios.guerreirosdohumaita.com.br/');
  const [emergencyPhone, setEmergencyPhone] = useState('199');
  const [centroAnalisesPublicMode, setCentroAnalisesPublicMode] = useState<'original' | 'construcao'>(siteSettings.centro_analises_public_mode || 'original');
  const [alertasPublicMode, setAlertasPublicMode] = useState<'original' | 'construcao'>(siteSettings.alertas_public_mode || 'original');

  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.site_name) setSiteName(siteSettings.site_name);
      if (siteSettings.site_subtitle) setSiteSubtitle(siteSettings.site_subtitle);
      if (siteSettings.site_description) setSiteDescription(siteSettings.site_description);
      setLogoUrl(siteSettings.logo_url || null);
      setFaviconUrl(siteSettings.favicon_url || null);

      if (siteSettings.about_badge) setAboutBadge(siteSettings.about_badge);
      if (siteSettings.about_title) setAboutTitle(siteSettings.about_title);
      if (siteSettings.about_text) setAboutText(siteSettings.about_text);
      if (siteSettings.about_feature1_title) setAboutFeature1Title(siteSettings.about_feature1_title);
      if (siteSettings.about_feature1_text) setAboutFeature1Text(siteSettings.about_feature1_text);
      if (siteSettings.about_feature2_title) setAboutFeature2Title(siteSettings.about_feature2_title);
      if (siteSettings.about_feature2_text) setAboutFeature2Text(siteSettings.about_feature2_text);
      if (siteSettings.about_feature3_title) setAboutFeature3Title(siteSettings.about_feature3_title);
      if (siteSettings.about_feature3_text) setAboutFeature3Text(siteSettings.about_feature3_text);

      if (siteSettings.centro_analises_public_mode) setCentroAnalisesPublicMode(siteSettings.centro_analises_public_mode);
      if (siteSettings.alertas_public_mode) setAlertasPublicMode(siteSettings.alertas_public_mode);
    }
  }, [siteSettings]);

  const handleSaveAboutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAboutError(null);
    setAboutSaveSuccess(null);
    setIsSavingAbout(true);

    try {
      await updateSettings({
        about_badge: aboutBadge,
        about_title: aboutTitle,
        about_text: aboutText,
        about_feature1_title: aboutFeature1Title,
        about_feature1_text: aboutFeature1Text,
        about_feature2_title: aboutFeature2Title,
        about_feature2_text: aboutFeature2Text,
        about_feature3_title: aboutFeature3Title,
        about_feature3_text: aboutFeature3Text,
      });

      await saveSetting('about_page_content', {
        about_badge: aboutBadge,
        about_title: aboutTitle,
        about_text: aboutText,
        about_feature1_title: aboutFeature1Title,
        about_feature1_text: aboutFeature1Text,
        about_feature2_title: aboutFeature2Title,
        about_feature2_text: aboutFeature2Text,
        about_feature3_title: aboutFeature3Title,
        about_feature3_text: aboutFeature3Text,
      }, 'Conteúdo da página Sobre Nós');

      await addAuditLog('UPDATE', 'pagina_sobre', 'Página Sobre Nós atualizada pelo administrador');
      setAboutSaveSuccess('Conteúdo da página Sobre Nós atualizado e publicado com sucesso!');
    } catch (err: any) {
      setAboutError(`Erro ao salvar página Sobre Nós: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSavingAbout(false);
    }
  };

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
        setCameraCitySlug(citiesData[0].slug || 'lajeado');
        setAlertCityId(citiesData[0].id);
      }

      const sponsorsData = await fetchSponsors(true);
      setSponsorsList(sponsorsData);

      const camerasData = await fetchCameras();
      setCamerasList(camerasData);

      const newsData = await fetchNews();
      setNewsList(newsData);

      const sourcesData = await fetchNewsSources();
      setNewsSourcesList(sourcesData);

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

      // Fetch alert network data
      const subsData = await fetchAlertSubscribers();
      setSubscribersList(subsData);

      const notifsData = await fetchAlertNotifications();
      setNotificationsList(notifsData);

      const historyData = await fetchAlertHistory();
      setAlertHistoryList(historyData);

      const dispatchesData = await fetchAlertDispatches();
      setDispatchesList(dispatchesData);

      const statsData = await getAlertStats();
      setAlertStatsList(statsData);

    } catch (e) {
      console.error('Error loading admin dashboard data:', e);
    }
  };

  const handleToggleSubActive = async (id: string, currentActive: boolean) => {
    await toggleSubscriberActive(id, !currentActive);
    await addAuditLog('UPDATE', 'alert_subscribers', `Inscrito ${id} status alterado para ${!currentActive ? 'ativo' : 'inativo'}`);
    await loadAllAdminData();
  };

  const handleDeleteSub = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cadastrado?')) {
      await deleteSubscriber(id);
      await addAuditLog('DELETE', 'alert_subscribers', `Inscrito ${id} removido`);
      await loadAllAdminData();
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimSending(true);
    setSimResult(null);

    try {
      const sentCount = await checkAndTriggerRiverLevelAlerts(
        simCitySlug,
        simLevel,
        'normal',
        simStatus,
        simMessage.trim() || undefined
      );
      setSimResult(`Alerta simulado com sucesso! ${sentCount} morador(es) cadastrado(s) em área de risco em ${simCitySlug} receberam a notificação.`);
      await addAuditLog('ALERT_TRIGGER', 'alert_notifications', `Alerta manual simulado para ${simCitySlug} (${simStatus}): ${sentCount} enviados`);
      await loadAllAdminData();
    } catch (err: any) {
      setSimResult(`Erro ao disparar alerta simulado: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setSimSending(false);
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

          const adminProfile = await verifyAdminUserProfile(session.user);
          if (adminProfile) {
            setIsAuthenticated(true);
            setCurrentAdminUser(adminProfile);
            setUserRole(adminProfile.nivel_acesso || 'administrador');
          } else {
            setIsAuthenticated(false);
            setCurrentAdminUser(null);
            setAuthError(`Acesso Negado: O e-mail (${session.user.email}) não possui autorização de acesso ao painel administrativo.`);
            await supabase.auth.signOut();
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
          const adminProfile = await verifyAdminUserProfile(session.user);
          if (adminProfile) {
            setIsAuthenticated(true);
            setCurrentAdminUser(adminProfile);
            setUserRole(adminProfile.nivel_acesso || 'administrador');
          } else {
            setIsAuthenticated(false);
            setCurrentAdminUser(null);
            setAuthError(`Acesso Negado: O e-mail (${session.user.email}) não possui autorização de acesso ao painel administrativo.`);
            await supabase.auth.signOut();
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
        const adminProfile = await verifyAdminUserProfile(data.user);
        if (adminProfile) {
          setIsAuthenticated(true);
          setCurrentAdminUser(adminProfile);
          setUserRole(adminProfile.nivel_acesso || 'administrador');
          await addAuditLog('LOGIN', 'auth', 'Usuário autenticado no painel administrativo', { email: data.user.email, user_id: data.user.id });
        } else {
          setIsAuthenticated(false);
          setCurrentAdminUser(null);
          setAuthError(`Acesso Negado: O e-mail (${data.user.email}) não possui autorização administrativa. Entre em contato com o administrador principal.`);
          await addAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', 'auth', `Tentativa de acesso por usuário comum sem autorização: ${data.user.email}`, { user_id: data.user.id, email: data.user.email });
          await supabase.auth.signOut();
        }
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
      image_url: cityImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
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

  const handleResetCityForm = () => {
    setEditingCityId(null);
    setCityName('');
    setCityRiver('Rio Taquari');
    setCityLevel(3.0);
    setCityImage('');
    setCityCameraUrl('');
    setCityDescription('');
    setCityOrder(1);
    setCityActive(true);
  };

  const handleEditCity = (city: City) => {
    setEditingCityId(city.id);
    setCityName(city.name);
    setCityRiver(city.river || 'Rio Taquari');
    setCityLevel(city.current_level || 3.0);
    setCityImage(city.image || (city as any).image_url || '');
    setCityCameraUrl(city.camera_url || '');
    setCityDescription(city.description || '');
    setCityOrder(city.ordem || 1);
    setCityActive(city.active ?? true);

    setTimeout(() => {
      cityFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sponsors_updated'));
    }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sponsors_updated'));
      }
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: CÂMERAS
  // ==========================================
  const handleEditCameraClick = (cam: CityCamera) => {
    setEditingCameraId(cam.id);
    setCameraCitySlug(cam.city_slug || 'lajeado');
    setCameraName(cam.nome || '');
    setCameraDescricao(cam.descricao || '');
    setCameraUrlStream(cam.url_stream || '');
    setCameraUrlThumbnail(cam.url_thumbnail || '');
    setCameraTipo(cam.tipo || 'YouTube');
    setCameraLocalizacao(cam.localizacao || '');
    setCameraOrder(cam.ordem_exibicao || 1);
    setCameraAtivo(cam.ativo ?? true);
  };

  const handleResetCameraForm = () => {
    setEditingCameraId(null);
    setCameraCitySlug(citiesList[0]?.slug || 'lajeado');
    setCameraName('');
    setCameraDescricao('');
    setCameraUrlStream('');
    setCameraUrlThumbnail('');
    setCameraTipo('YouTube');
    setCameraLocalizacao('');
    setCameraOrder(camerasList.length + 1);
    setCameraAtivo(true);
  };

  const handleSaveCameraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cameraName || !cameraUrlStream) return alert('Preencha o nome e a URL da transmissão.');

    const cameraData: Partial<CityCamera> = {
      id: editingCameraId || undefined,
      city_slug: cameraCitySlug || citiesList[0]?.slug || 'lajeado',
      nome: cameraName,
      descricao: cameraDescricao,
      url_stream: cameraUrlStream,
      url_thumbnail: cameraUrlThumbnail,
      tipo: cameraTipo,
      localizacao: cameraLocalizacao,
      ordem_exibicao: Number(cameraOrder) || 1,
      ativo: cameraAtivo
    };

    await saveCamera(cameraData);
    await addAuditLog(editingCameraId ? 'UPDATE' : 'CREATE', 'city_cameras', `Câmera ${cameraName} (${cameraCitySlug}) salva`);

    handleResetCameraForm();
    await loadAllAdminData();
    alert('Câmera salva com sucesso!');
  };

  const handleDeleteCamera = async (id: string, name: string) => {
    if (confirm(`Remover a câmera "${name}"?`)) {
      await deleteCamera(id);
      await addAuditLog('DELETE', 'city_cameras', `Câmera ${name} excluída`);
      await loadAllAdminData();
    }
  };

  const handleToggleCameraAtivo = async (cam: CityCamera) => {
    await saveCamera({ ...cam, ativo: !cam.ativo });
    await addAuditLog('UPDATE', 'city_cameras', `Câmera ${cam.nome} ${!cam.ativo ? 'ativada' : 'desativada'}`);
    await loadAllAdminData();
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
      published: true,
      manter_permanente: newsManterPermanente,
      exibir_no_menu: newsExibirNoMenu,
      prioridade: newsPrioridade
    };

    await saveNews(newsData);
    await addAuditLog(editingNewsId ? 'UPDATE' : 'CREATE', 'noticias', `Notícia "${newsTitle}" salva`);

    setEditingNewsId(null);
    setNewsTitle('');
    setNewsSummary('');
    setNewsImage('');
    setNewsManterPermanente(false);
    setNewsExibirNoMenu(true);
    setNewsPrioridade('media');

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

  const handleSaveNewsSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceNome || !newsSourceUrl) return alert('Preencha o nome e a URL da fonte de notícias.');

    const scheduleData = {
      times: sourceFrequencia === 'multiple_daily' ? sourceTimes : undefined,
      time: (sourceFrequencia === 'daily' || sourceFrequencia === 'weekly') ? sourceTime : undefined,
      day_of_week: sourceFrequencia === 'weekly' ? sourceDayOfWeek : undefined,
      count_per_day: sourceFrequencia === 'multiple_daily' ? sourceCountPerDay : undefined
    };

    const sourcePayload: Partial<NewsSource> = {
      id: editingSourceId || undefined,
      nome: sourceNome,
      descricao: sourceDescricao,
      url: newsSourceUrl,
      tipo: sourceTipo,
      ativo: sourceAtivo,
      frequencia: sourceFrequencia,
      horarios_configurados: scheduleData,
      categoria_padrao: sourceCategoriaPadrao,
      keywords_incluir: sourceKeywordsIncluir,
      keywords_ignorar: sourceKeywordsIgnorar,
      importar_todas: sourceImportarTodas
    };

    await saveNewsSource(sourcePayload);
    await addAuditLog(
      editingSourceId ? 'UPDATE' : 'CREATE',
      'fontes_noticias',
      `Fonte de notícia "${sourceNome}" salva (${sourceFrequencia})`
    );

    // Reset form
    setEditingSourceId(null);
    setSourceNome('');
    setSourceDescricao('');
    setNewsSourceUrl('');
    setSourceTipo('rss');
    setSourceAtivo(true);
    setSourceFrequencia('hourly');
    setSourceCategoriaPadrao('Comunicados');
    setSourceKeywordsIncluir('taquari, enchente, cheia, inundação, rio, chuva, alerta, emergência, defesa civil, evacuação, nível, cota, prefeitura, boletim, decreto');
    setSourceKeywordsIgnorar('esporte, eventos, cultura, entretenimento, futebol, carnaval');
    setSourceImportarTodas(false);

    await loadAllAdminData();
    alert('Fonte de notícias salva com sucesso!');
  };

  const handleEditNewsSource = (source: NewsSource) => {
    setEditingSourceId(source.id);
    setSourceNome(source.nome);
    setSourceDescricao(source.descricao || '');
    setNewsSourceUrl(source.url);
    setSourceTipo(source.tipo);
    setSourceAtivo(source.ativo);
    setSourceFrequencia(source.frequencia);
    setSourceCategoriaPadrao(source.categoria_padrao || 'Comunicados');
    setSourceKeywordsIncluir(source.keywords_incluir || '');
    setSourceKeywordsIgnorar(source.keywords_ignorar || '');
    setSourceImportarTodas(source.importar_todas ?? false);
    if (source.horarios_configurados?.times) setSourceTimes(source.horarios_configurados.times);
    if (source.horarios_configurados?.time) setSourceTime(source.horarios_configurados.time);
    if (source.horarios_configurados?.day_of_week !== undefined) setSourceDayOfWeek(source.horarios_configurados.day_of_week);
    if (source.horarios_configurados?.count_per_day !== undefined) setSourceCountPerDay(source.horarios_configurados.count_per_day);
  };

  const handleDeleteNewsSource = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja remover a fonte "${nome}"?`)) return;
    await deleteNewsSource(id);
    await addAuditLog('DELETE', 'fontes_noticias', `Fonte de notícia "${nome}" excluída`);
    await loadAllAdminData();
    alert('Fonte removida.');
  };

  const handleToggleNewsSourceActive = async (id: string, currentAtivo: boolean, nome: string) => {
    const newAtivo = !currentAtivo;
    await toggleNewsSourceActive(id, newAtivo);
    await addAuditLog('UPDATE', 'fontes_noticias', `Fonte "${nome}" ${newAtivo ? 'ativada' : 'desativada'}`);
    await loadAllAdminData();
  };

  const handleTriggerCollectorNow = async (sourceId?: string, sourceName?: string) => {
    setSourceTestingId(sourceId || 'all');
    setSourceTestFeedback('Iniciando consulta à fonte oficial...');

    try {
      const result = await triggerNewsCollectorNow(sourceId);
      setSourceTestFeedback(result.message || 'Consulta concluída.');
      await loadAllAdminData();
      onRefreshData();
      alert(result.message || 'Busca de notícias executada!');
    } catch (e: any) {
      setSourceTestFeedback(`Erro: ${e?.message || e}`);
      alert(`Falha ao consultar fonte: ${e?.message || e}`);
    } finally {
      setSourceTestingId(null);
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
  // HANDLERS: CONFIGURAÇÕES DO SITE
  // ==========================================
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSettingsError('O arquivo de logo excede o limite máximo permitido de 5MB.');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSettingsError('Formato inválido para o logo. Formatos permitidos: .PNG, .JPG, .JPEG, .SVG e .WEBP.');
      return;
    }

    setSettingsError(null);
    setLogoUploading(true);
    try {
      const uploadedUrl = await uploadStorageImage('logos', file);
      setLogoUrl(uploadedUrl);
      setSettingsSaveSuccess('Imagem do logo enviada com sucesso! Clique em "Salvar Configurações" para confirmar.');
    } catch (err: any) {
      console.error('Erro no upload do logo:', err);
      setSettingsError('Falha ao enviar a imagem do logo para o Supabase Storage.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setSettingsSaveSuccess('Logo removido. O sistema utilizará o ícone padrão. Clique em "Salvar Configurações" para aplicar.');
  };

  const handleFaviconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSettingsError('O arquivo de favicon excede o limite máximo permitido de 2MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['ico', 'png', 'svg'];
    if (!allowedExtensions.includes(ext) && !['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml'].includes(file.type)) {
      setSettingsError('Formato inválido para o favicon. Formatos permitidos: .ICO, .PNG e .SVG.');
      return;
    }

    setSettingsError(null);
    setFaviconUploading(true);
    try {
      const uploadedUrl = await uploadStorageImage('favicons', file);
      setFaviconUrl(uploadedUrl);
      setSettingsSaveSuccess('Favicon enviado com sucesso! Clique em "Salvar Configurações" para confirmar.');
    } catch (err: any) {
      console.error('Erro no upload do favicon:', err);
      setSettingsError('Falha ao enviar o favicon para o Supabase Storage.');
    } finally {
      setFaviconUploading(false);
    }
  };

  const handleRemoveFavicon = () => {
    setFaviconUrl(null);
    setSettingsSaveSuccess('Favicon removido. Clique em "Salvar Configurações" para confirmar.');
  };

  const handleRestoreDefaults = () => {
    if (confirm('Deseja restaurar as configurações padrão da identidade visual do site?')) {
      setSiteName('Monitoramento Rio Taquari');
      setSiteSubtitle('Informação e prevenção para o Vale do Taquari');
      setSiteDescription('Portal institucional e sistema de alerta hidrológico.');
      setLogoUrl(null);
      setFaviconUrl(null);
      setSettingsSaveSuccess('Valores padrão restaurados. Clique em "Salvar Configurações" para aplicar.');
    }
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSaveSuccess(null);

    try {
      await updateSettings({
        site_name: siteName,
        site_subtitle: siteSubtitle,
        site_description: siteDescription,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        centro_analises_public_mode: centroAnalisesPublicMode,
        alertas_public_mode: alertasPublicMode,
      });

      await saveSetting('site_name', siteName, 'Nome oficial do portal');
      await saveSetting('update_frequency_minutes', Number(updateFreq), 'Frequência de atualização em minutos');
      await saveSetting('official_source_url', sourceUrl, 'URL da fonte oficial de dados');
      await saveSetting('emergency_contacts', { defesa_civil: emergencyPhone, bombeiros: '193', brigada: '190' }, 'Contatos de emergência');

      await addAuditLog('UPDATE', 'configuracoes', `Configurações do site salvas: ${siteName}`);
      setSettingsSaveSuccess('Configurações salvas e aplicadas em todo o sistema com sucesso!');
    } catch (err: any) {
      setSettingsError(`Erro ao salvar configurações: ${err.message || 'Erro desconhecido'}`);
    }
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
                onClick={() => {
                  setEditMode(true);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 px-3 py-1.5 rounded-lg border border-cyan-800 transition-all font-bold shadow-sm cursor-pointer"
                title="Ativar modo de edição visual no site ao vivo"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Ativar Editor Visual</span>
              </button>
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
                { id: 'centro_analises', label: 'Centro de Análises', icon: BarChart3 },
                { id: 'sobre', label: 'Página Sobre Nós', icon: Info },
                { id: 'moradores', label: 'Moradores Cadastrados', icon: Home },
                { id: 'central_alertas', label: 'Central de Alertas', icon: Radio },
                { id: 'rede_alertas', label: 'Alertas de Moradores', icon: BellRing },
                { id: 'patrocinadores', label: 'Patrocinadores', icon: Award },
                { id: 'cidades', label: 'Cidades', icon: Building2 },
                { id: 'cotas', label: 'Cotas Oficiais', icon: Sliders },
                { id: 'cameras', label: 'Câmeras', icon: Camera },
                { id: 'noticias', label: 'Notícias Publicadas', icon: Newspaper },
                { id: 'fontes_noticias', label: 'Fontes de Notícias', icon: Rss },
                { id: 'alertas', label: 'Alertas', icon: Bell },
                { id: 'sincronizacao', label: 'Sincronização', icon: RefreshCw },
                { id: 'logs', label: 'Registros', icon: FileText },
                { id: 'usuarios', label: 'Usuários Administradores', icon: Users },
                { id: 'layout_config', label: 'Configuração de Layout', icon: Sliders },
                { id: 'configuracoes', label: 'Configurações do Site', icon: Settings },
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
                      O frontend opera de modo 100% estático e consome dados do <strong>Supabase</strong>. A atualização telemétrica da Agência Nacional de Águas (ANA) ocorre de forma autônoma através do serviço independente <strong>river-updater</strong> via Cron Job a cada 5 minutos.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: CENTRO DE ANÁLISES */}
              {activeTab === 'centro_analises' && (
                <AdminCentroAnalisesView />
              )}

              {/* TAB: EDITAR PÁGINA SOBRE NÓS */}
              {activeTab === 'sobre' && (
                <div className="space-y-6 text-xs animate-fade-in">
                  
                  {/* HEADER */}
                  <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/40 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-base">
                      <Info className="w-5 h-5 text-cyan-400" />
                      <span>Gestão do Conteúdo da Página "Sobre Nós"</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                      Edite os textos institucionais, missão, objetivos e destaques tecnológicos apresentados na aba pública "SOBRE" do portal.
                    </p>
                  </div>

                  {/* ALERTS */}
                  {aboutSaveSuccess && (
                    <div className="p-4 bg-emerald-950/90 border border-emerald-800 text-emerald-300 rounded-2xl flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                        <span className="font-semibold">{aboutSaveSuccess}</span>
                      </div>
                      <button onClick={() => setAboutSaveSuccess(null)} className="text-emerald-400 hover:text-white p-1 rounded-lg cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {aboutError && (
                    <div className="p-4 bg-red-950/90 border border-red-800 text-red-300 rounded-2xl flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                        <span className="font-semibold">{aboutError}</span>
                      </div>
                      <button onClick={() => setAboutError(null)} className="text-red-400 hover:text-white p-1 rounded-lg cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSaveAboutSubmit} className="space-y-6">
                    
                    {/* APRESENTAÇÃO PRINCIPAL */}
                    <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2 border-b border-slate-800 pb-3">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        1. Cabeçalho & Texto Principal
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1 font-semibold">
                            Selo / Insígnia do Topo
                          </label>
                          <input
                            type="text"
                            value={aboutBadge}
                            onChange={(e) => setAboutBadge(e.target.value)}
                            placeholder="Ex: CENTRO DE OPERAÇÕES HIDROLÓGICAS"
                            className="w-full bg-[#050A18] text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1 font-semibold">
                            Título Principal da Página
                          </label>
                          <input
                            type="text"
                            value={aboutTitle}
                            onChange={(e) => setAboutTitle(e.target.value)}
                            placeholder="Ex: Portal Profissional de Monitoramento Hidrológico"
                            className="w-full bg-[#050A18] text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          Texto "Sobre Nós" / Descrição Institucional
                        </label>
                        <textarea
                          rows={6}
                          value={aboutText}
                          onChange={(e) => setAboutText(e.target.value)}
                          placeholder="Escreva a apresentação detalhada sobre a iniciativa, missão, equipe, órgãos integrados e como o portal serve a comunidade..."
                          className="w-full bg-[#050A18] text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
                        />
                      </div>
                    </div>

                    {/* CARTÕES DE DESTAQUE / PILARES */}
                    <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Award className="w-4 h-4 text-cyan-400" />
                        2. Cartões de Destaque Tecnológico / Pilares
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* DESTAQUE 1 */}
                        <div className="bg-[#050A18] border border-slate-800 p-4 rounded-xl space-y-3">
                          <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">Cartão 1</span>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium text-[11px]">Título do Cartão</label>
                            <input
                              type="text"
                              value={aboutFeature1Title}
                              onChange={(e) => setAboutFeature1Title(e.target.value)}
                              className="w-full bg-[#0F172A] text-slate-100 p-2.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-cyan-400 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium text-[11px]">Descrição</label>
                            <textarea
                              rows={3}
                              value={aboutFeature1Text}
                              onChange={(e) => setAboutFeature1Text(e.target.value)}
                              className="w-full bg-[#0F172A] text-slate-100 p-2.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-cyan-400 leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* DESTAQUE 2 */}
                        <div className="bg-[#050A18] border border-slate-800 p-4 rounded-xl space-y-3">
                          <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">Cartão 2</span>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium text-[11px]">Título do Cartão</label>
                            <input
                              type="text"
                              value={aboutFeature2Title}
                              onChange={(e) => setAboutFeature2Title(e.target.value)}
                              className="w-full bg-[#0F172A] text-slate-100 p-2.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-cyan-400 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium text-[11px]">Descrição</label>
                            <textarea
                              rows={3}
                              value={aboutFeature2Text}
                              onChange={(e) => setAboutFeature2Text(e.target.value)}
                              className="w-full bg-[#0F172A] text-slate-100 p-2.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-cyan-400 leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* DESTAQUE 3 */}
                        <div className="bg-[#050A18] border border-slate-800 p-4 rounded-xl space-y-3">
                          <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">Cartão 3</span>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium text-[11px]">Título do Cartão</label>
                            <input
                              type="text"
                              value={aboutFeature3Title}
                              onChange={(e) => setAboutFeature3Title(e.target.value)}
                              className="w-full bg-[#0F172A] text-slate-100 p-2.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-cyan-400 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium text-[11px]">Descrição</label>
                            <textarea
                              rows={3}
                              value={aboutFeature3Text}
                              onChange={(e) => setAboutFeature3Text(e.target.value)}
                              className="w-full bg-[#0F172A] text-slate-100 p-2.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-cyan-400 leading-relaxed"
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* PREVIEW EM TEMPO REAL */}
                    <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-300 uppercase flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          Pré-visualização ao Vivo (Como os usuários verão)
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">Live Sync</span>
                      </h4>

                      <div className="p-6 bg-[#0B132B] border border-slate-800 rounded-2xl space-y-5">
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px] font-bold">
                            <Waves className="w-3.5 h-3.5" />
                            <span>{aboutBadge || 'CENTRO DE OPERAÇÕES HIDROLÓGICAS'}</span>
                          </div>
                          <h3 className="text-xl font-extrabold text-white">
                            {aboutTitle || 'Portal Profissional de Monitoramento Hidrológico'}
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                            {aboutText || 'Descrição do projeto...'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                          <div className="bg-[#050A18] p-4 rounded-xl border border-slate-800 space-y-1.5">
                            <h5 className="text-xs font-bold text-white">{aboutFeature1Title || 'Sensores de Precisão'}</h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{aboutFeature1Text}</p>
                          </div>
                          <div className="bg-[#050A18] p-4 rounded-xl border border-slate-800 space-y-1.5">
                            <h5 className="text-xs font-bold text-white">{aboutFeature2Title || 'Sincronização Supabase'}</h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{aboutFeature2Text}</p>
                          </div>
                          <div className="bg-[#050A18] p-4 rounded-xl border border-slate-800 space-y-1.5">
                            <h5 className="text-xs font-bold text-white">{aboutFeature3Title || 'Alertas Automatizados'}</h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{aboutFeature3Text}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BOTÃO DE SALVAMENTO */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSavingAbout}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingAbout ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Salvando Alterações...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Salvar Página Sobre Nós</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* TAB: MORADORES CADASTRADOS */}
              {activeTab === 'moradores' && (
                <ResidentsIntelligenceView
                  subscribers={subscribersList}
                  cities={citiesList}
                  onRefresh={loadAllAdminData}
                />
              )}

              {/* TAB: CENTRAL DE ALERTAS */}
              {activeTab === 'central_alertas' && (() => {
                const currentCityObj = citiesList.find(c => c.slug === centralCitySlug);
                const currentCityName = currentCityObj?.name || centralCitySlug;

                const citySubs = subscribersList.filter(s => 
                  (s.cidade || s.city_slug) === centralCitySlug && (s.receber_alertas ?? s.active ?? true)
                );

                const impactedAtSimLevel = citySubs.filter(s => Number(s.cota_residencia || 0) <= Number(centralSimLevel));
                const safeAtSimLevel = citySubs.filter(s => Number(s.cota_residencia || 0) > Number(centralSimLevel));

                const th = getCityThresholds(currentCityObj || centralCitySlug);
                let currentSimStatus: 'atenção' | 'alerta' | 'inundação' = 'atenção';
                if (centralSimLevel >= th.flood) currentSimStatus = 'inundação';
                else if (centralSimLevel >= th.alert) currentSimStatus = 'alerta';

                const pendingAlerts = alertHistoryList.filter(item => !item.enviado);

                return (
                  <div className="space-y-8">
                    {/* TOP HEADER & BRIEF */}
                    <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/40 rounded-2xl p-5 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                        <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                        <span>Central de Gerenciamento & Simulação de Alertas Hidrológicos</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                        Simule níveis d'água e cotas críticas em tempo real para visualizar instantaneamente quantos e quais moradores serão notificados antes da ativação dos gateways de envio em massa (WhatsApp & E-mail).
                      </p>
                    </div>

                    {/* ÁREA DE ALERTAS PENDENTES */}
                    <div className="bg-[#0F172A] border border-amber-900/60 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Alertas Pendentes de Aprovação ({pendingAlerts.length})
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold">
                          Monitoramento Automático
                        </span>
                      </div>

                      {pendingAlerts.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-4 text-center">
                          Nenhum alerta pendente de aprovação no momento. A monitoração automática gerará um alerta assim que uma cidade mudar de categoria de risco.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {pendingAlerts.map(alert => (
                            <div key={alert.id} className="p-4 rounded-xl bg-slate-900/90 border border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">{alert.cidade}</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                                    {alert.tipo_alerta}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(alert.criado_em).toLocaleString('pt-BR')}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                  <span className="text-cyan-400 font-mono font-bold">Nível Atual: {Number(alert.nivel_rio).toFixed(2)}m</span>
                                  <span className="text-amber-300 font-mono font-bold">Cota Atingida: {Number(alert.cota_disparada).toFixed(2)}m</span>
                                  <span className="text-emerald-400 font-bold">{alert.quantidade_usuarios_atingidos} morador(es) afetados</span>
                                </div>
                                <p className="text-xs text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                                  {alert.mensagem}
                                </p>
                              </div>
                              <button
                                onClick={() => handleApproveAlert(alert.id)}
                                className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Aprovar Alerta</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* FILA MULTICANAL & DISPAROS REGISTRADOS */}
                    <div className="bg-[#0F172A] border border-cyan-900/60 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <SendHorizontal className="w-5 h-5 text-cyan-400" />
                          <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                              Fila Multicanal de Disparos de Alerta
                            </h3>
                            <p className="text-xs text-slate-400">
                              Gerenciamento e envio para WhatsApp & E-mail de alertas aprovados
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleProcessQueue()}
                          disabled={isProcessingQueue || dispatchesList.filter(d => d.status === 'pendente').length === 0}
                          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${isProcessingQueue ? 'animate-spin' : ''}`} />
                          <span>{isProcessingQueue ? 'Processando...' : 'Processar fila de envio'}</span>
                        </button>
                      </div>

                      {/* SUMMARY METRICS OF QUEUE */}
                      {(() => {
                        const pendingDispatches = dispatchesList.filter(d => d.status === 'pendente');
                        const sentDispatches = dispatchesList.filter(d => d.status === 'enviado');
                        const waCount = dispatchesList.filter(d => d.canal === 'whatsapp').length;
                        const emailCount = dispatchesList.filter(d => d.canal === 'email').length;

                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                              </span>
                              <p className="text-xl font-black text-white mt-1">{waCount} <span className="text-xs text-slate-500 font-normal">mensagens</span></p>
                            </div>
                            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-blue-400" /> E-mail
                              </span>
                              <p className="text-xl font-black text-white mt-1">{emailCount} <span className="text-xs text-slate-500 font-normal">mensagens</span></p>
                            </div>
                            <div className="p-3 bg-slate-900/80 border border-amber-900/40 rounded-xl">
                              <span className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Aguardando envio
                              </span>
                              <p className="text-xl font-black text-amber-300 mt-1">{pendingDispatches.length}</p>
                            </div>
                            <div className="p-3 bg-slate-900/80 border border-emerald-900/40 rounded-xl">
                              <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Enviados com sucesso
                              </span>
                              <p className="text-xl font-black text-emerald-300 mt-1">{sentDispatches.length}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* VISUALIZAÇÃO DOS NÍVEIS ATUAIS POR CIDADE */}
                    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Waves className="w-4 h-4 text-cyan-400" />
                        <span>Níveis Atuais de Telemetria e Impacto de Moradores em Tempo Real</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {citiesList.map(city => {
                          const level = city.current_level ?? 0;
                          const cSubs = subscribersList.filter(s => (s.cidade || s.city_slug) === city.slug && (s.receber_alertas ?? s.active ?? true));
                          const affectedNow = cSubs.filter(s => Number(s.cota_residencia || 0) <= level);
                          const cityTh = getCityThresholds(city);

                          let statusBadge = 'bg-emerald-950 text-emerald-400 border-emerald-800/50';
                          let statusTxt = 'Normal';
                          if (level >= cityTh.flood) {
                            statusBadge = 'bg-rose-950 text-rose-400 border-rose-800/50';
                            statusTxt = 'Inundação';
                          } else if (level >= cityTh.alert) {
                            statusBadge = 'bg-orange-950 text-orange-400 border-orange-800/50';
                            statusTxt = 'Alerta';
                          } else if (level >= cityTh.attention) {
                            statusBadge = 'bg-amber-950 text-amber-400 border-amber-800/50';
                            statusTxt = 'Atenção';
                          }

                          return (
                            <div 
                              key={city.id}
                              onClick={() => {
                                setCentralCitySlug(city.slug);
                                setCentralSimLevel(Number((city.current_level || 19).toFixed(2)));
                              }}
                              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                centralCitySlug === city.slug
                                  ? 'bg-slate-800/80 border-cyan-500/80 shadow-lg ring-1 ring-cyan-500/50'
                                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-white text-sm">{city.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                                  {statusTxt}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <span className="text-2xl font-black text-cyan-400">{level.toFixed(2)}</span>
                                  <span className="text-xs text-slate-400 ml-1">m</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold text-amber-400">{affectedNow.length}</span>
                                  <span className="text-[11px] text-slate-400 block">moradores na cota</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SIMULADOR MANUAL DE COTA DE RISCO */}
                    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-6">
                      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-cyan-400" />
                            Simulador Manual de Disparo de Alerta por Cota
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Ajuste a cota do rio para simular a quantidade exata de moradores que receberão o aviso de emergência.
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-semibold">
                          Cidade Selecionada: {currentCityName}
                        </span>
                      </div>

                      <form onSubmit={handleSimulateHydrologicalAlert} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                              Cidade para Simulação
                            </label>
                            <select
                              value={centralCitySlug}
                              onChange={(e) => {
                                setCentralCitySlug(e.target.value);
                                const selectedC = citiesList.find(c => c.slug === e.target.value);
                                setCentralSimLevel(Number((selectedC?.current_level || 19).toFixed(2)));
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                            >
                              {citiesList.map(c => (
                                <option key={c.id} value={c.slug}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                              Cota / Nível do Rio Simulado (Metros)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="40"
                                value={centralSimLevel}
                                onChange={(e) => setCentralSimLevel(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                                required
                              />
                              <span className="text-slate-400 font-bold text-sm">m</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                              Status Mapeado
                            </label>
                            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-2">
                              {currentSimStatus === 'inundação' && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
                              {currentSimStatus === 'alerta' && <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                              {currentSimStatus === 'atenção' && <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                              <span className="capitalize text-white">{currentSimStatus}</span>
                            </div>
                          </div>
                        </div>

                        {/* RESULTADO DA SIMULAÇÃO */}
                        <div className="bg-slate-900/90 border border-cyan-900/60 rounded-2xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-cyan-400" />
                              Resultado da Simulação para {currentCityName} na Cota {Number(centralSimLevel).toFixed(2)}m
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 text-xs font-bold">
                                {impactedAtSimLevel.length} morador(es) alertados
                              </span>
                              <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold">
                                {safeAtSimLevel.length} preservados (&gt; {Number(centralSimLevel).toFixed(2)}m)
                              </span>
                            </div>
                          </div>

                          {/* PAINEL DE MORADORES QUE RECEBERIAM O AVISO */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-300">
                              Moradores que RECEBERÃO o alerta (Cota de residência ≤ {Number(centralSimLevel).toFixed(2)}m):
                            </h4>
                            {impactedAtSimLevel.length === 0 ? (
                              <p className="text-xs text-slate-500 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
                                Nenhum morador cadastrado possui cota de risco atingida no nível de {Number(centralSimLevel).toFixed(2)}m nesta cidade.
                              </p>
                            ) : (
                              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                {impactedAtSimLevel.map(sub => (
                                  <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-amber-900/40 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white">{sub.nome_completo || sub.name}</span>
                                      <span className="text-slate-400">({sub.bairro || sub.neighborhood})</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                                        Cota: {Number(sub.cota_residencia || 19).toFixed(2)}m
                                      </span>
                                      <span className="text-emerald-400 font-mono text-[11px]">{sub.whatsapp || sub.email || 'Cadastrado'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* MENSAGEM CUSTOMIZADA OPCIONAL */}
                          <div className="pt-2">
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                              Mensagem Customizada do Alerta (Opcional)
                            </label>
                            <input
                              type="text"
                              value={centralCustomMessage}
                              onChange={(e) => setCentralCustomMessage(e.target.value)}
                              placeholder={`Ex: Defesa Civil informa: Nível do Rio atingiu ${Number(centralSimLevel).toFixed(2)}m em ${currentCityName}. Início de evacuação preventivo.`}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        {centralSuccessMsg && (
                          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{centralSuccessMsg}</span>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={centralDispatching}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                            <span>{centralDispatching ? 'Gravando Simulação...' : 'Registrar / Testar Disparo no Histórico'}</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* TABELA DE HISTÓRICO DE ALERTAS (alert_history) */}
                    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span>Histórico de Alertas Registrados & Auditoria de Envio</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          Total: {alertHistoryList.length} registro(s)
                        </span>
                      </div>

                      {alertHistoryList.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs italic">
                          Nenhum histórico de alerta registrado até o momento. Faça uma simulação acima para gravar.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400">
                                <th className="p-3 font-semibold">Cidade</th>
                                <th className="p-3 font-semibold">Nível / Cota</th>
                                <th className="p-3 font-semibold">Atingidos</th>
                                <th className="p-3 font-semibold">Tipo</th>
                                <th className="p-3 font-semibold">Aprovado Por</th>
                                <th className="p-3 font-semibold">Data / Hora</th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold text-right">Ações Fila</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {alertHistoryList.map((item) => {
                                const itemDispatches = dispatchesList.filter(d => d.alert_history_id === item.id);
                                const pendingCount = itemDispatches.filter(d => d.status === 'pendente').length;
                                const sentCount = itemDispatches.filter(d => d.status === 'enviado').length;

                                return (
                                  <tr key={item.id} className="hover:bg-slate-800/30">
                                    <td className="p-3 font-bold text-white">{item.cidade}</td>
                                    <td className="p-3 font-mono">
                                      <span className="text-cyan-400 font-bold">{Number(item.nivel_rio).toFixed(2)}m</span>
                                      <span className="text-slate-500 text-[10px] block">Cota: {Number(item.cota_disparada).toFixed(2)}m</span>
                                    </td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                                        {item.quantidade_usuarios_atingidos} morador(es)
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <span className="capitalize font-bold text-slate-200">
                                        {item.tipo_alerta}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-300 text-[11px]">
                                      {item.aprovado_por ? (
                                        <div>
                                          <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> {item.aprovado_por}
                                          </span>
                                          {item.aprovado_em && (
                                            <span className="text-slate-500 text-[10px] block">
                                              {new Date(item.aprovado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-500 italic">Pendente aprovação</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-slate-400 text-[11px]">
                                      {new Date(item.criado_em).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="p-3">
                                      {item.enviado ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                                          Aprovado ({itemDispatches.length} disparos)
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                                          Pendente
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => setSelectedHistoryForDispatchModal(item)}
                                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Ver Fila ({itemDispatches.length})</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* PREPARAÇÃO PARA INTEGRAÇÃO FUTURA DE MAPAS - DEFESA CIVIL */}
                    <div className="bg-[#0F172A] border border-cyan-900/50 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                        <Map className="w-4 h-4 text-cyan-400" />
                        <span>Preparação de Integração Geográfica com Mapas da Defesa Civil</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Estrutura preparada para vincular polígonos de mancha de inundação e bairros atingidos diretamente aos cadastros dos moradores:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Entidade Cidade</span>
                          <span className="font-bold text-white">Cidade (slug / ID)</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Métrica Hidrológica</span>
                          <span className="font-bold text-amber-400">Cota em Metros (m)</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Mapeamento Urbano</span>
                          <span className="font-bold text-cyan-400">Bairro / Polígono Defesa Civil</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Beneficiário</span>
                          <span className="font-bold text-emerald-400">Usuários Cadastrados</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB: REDE DE ALERTAS */}
              {activeTab === 'rede_alertas' && (
                <div className="space-y-8">
                  {/* METRIC CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400">Moradores em Área de Risco</p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        {subscribersList.filter(s => s.resides_in_risk_area).length}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Total Geral: {subscribersList.length} cadastrados
                      </span>
                    </div>

                    <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400">Total de Alertas Disparados</p>
                      <p className="text-2xl font-bold text-cyan-400 mt-1">
                        {notificationsList.length}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Registros em alert_notifications
                      </span>
                    </div>

                    <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400">Confirmações de Recebimento</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {notificationsList.filter(n => Boolean(n.confirmed_at)).length}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Validadas via morador
                      </span>
                    </div>

                    <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400">Taxa Média de Confirmação</p>
                      <p className="text-2xl font-bold text-indigo-400 mt-1">
                        {notificationsList.length > 0
                          ? `${Math.round((notificationsList.filter(n => Boolean(n.confirmed_at)).length / notificationsList.length) * 100)}%`
                          : '0%'}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Eficácia da Rede Comunitária
                      </span>
                    </div>
                  </div>

                  {/* COBERTURA E CONFIRMAÇÃO POR CIDADE */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span>Estatísticas de Alerta por Cidade</span>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="p-3 font-semibold">Cidade</th>
                            <th className="p-3 font-semibold">Alertas Enviados</th>
                            <th className="p-3 font-semibold">Confirmações</th>
                            <th className="p-3 font-semibold">Taxa de Confirmação</th>
                            <th className="p-3 font-semibold">Progresso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {alertStatsList.map((st) => (
                            <tr key={st.city_slug} className="hover:bg-slate-800/30">
                              <td className="p-3 font-medium text-white">{st.city_name}</td>
                              <td className="p-3 text-cyan-400 font-bold">{st.sent_count}</td>
                              <td className="p-3 text-emerald-400 font-bold">{st.confirmed_count}</td>
                              <td className="p-3 text-slate-300 font-bold">{st.confirmation_rate}%</td>
                              <td className="p-3 w-48">
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${st.confirmation_rate}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* TABELA DE ALERTAS DE MORADORES */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span>Alertas de Moradores</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Inscrições ativas para alertas hidrológicos personalizados por cota e bairro.
                        </p>
                      </div>

                      {/* FILTROS DE PESQUISA & EXPORTAÇÃO */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* FILTRO CIDADE */}
                        <select
                          value={subCityFilter}
                          onChange={(e) => setSubCityFilter(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="all">Todas as Cidades</option>
                          {citiesList.map(c => (
                            <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>

                        {/* FILTRO COTA DE RISCO */}
                        <select
                          value={subCotaFilter}
                          onChange={(e) => setSubCotaFilter(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="all">Todas as Cotas</option>
                          <option value="15">Cotas ≤ 15.00m</option>
                          <option value="18">Cotas ≤ 18.00m</option>
                          <option value="20">Cotas ≤ 20.00m</option>
                          <option value="24">Cotas ≤ 24.00m</option>
                          <option value="30">Cotas ≤ 30.00m</option>
                        </select>

                        {/* FILTRO STATUS */}
                        <select
                          value={subStatusFilter}
                          onChange={(e) => setSubStatusFilter(e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="all">Todos os Status</option>
                          <option value="active">Apenas Ativos</option>
                          <option value="inactive">Apenas Inativos</option>
                        </select>

                        {/* FILTRO BAIRRO */}
                        <input
                          type="text"
                          value={subNeighborhoodFilter}
                          onChange={(e) => setSubNeighborhoodFilter(e.target.value)}
                          placeholder="Filtrar bairro..."
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-28 sm:w-36"
                        />

                        {/* BOTÃO EXPORTAR */}
                        <button
                          onClick={handleExportSubscribersCSV}
                          className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Exportar CSV</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="p-3 font-semibold">Nome</th>
                            <th className="p-3 font-semibold">Cidade</th>
                            <th className="p-3 font-semibold">Bairro</th>
                            <th className="p-3 font-semibold">WhatsApp / Contatos</th>
                            <th className="p-3 font-semibold">Cota Cadastrada</th>
                            <th className="p-3 font-semibold">Data Cadastro</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {subscribersList
                            .filter(s => subCityFilter === 'all' || (s.cidade || s.city_slug) === subCityFilter)
                            .filter(s => subCotaFilter === 'all' || Number(s.cota_residencia || 0) <= Number(subCotaFilter))
                            .filter(s => subStatusFilter === 'all' || (subStatusFilter === 'active' ? (s.receber_alertas ?? s.active) : !(s.receber_alertas ?? s.active)))
                            .filter(s => !subNeighborhoodFilter || (s.bairro || s.neighborhood || '').toLowerCase().includes(subNeighborhoodFilter.toLowerCase()))
                            .map((sub) => {
                              const rawCity = sub.cidade || sub.city_slug || 'lajeado';
                              const cityName = citiesList.find(c => c.slug === rawCity)?.name || rawCity;
                              const cotaVal = sub.cota_residencia != null ? Number(sub.cota_residencia) : 19.0;
                              const isActive = sub.receber_alertas ?? sub.active ?? true;
                              const createdDate = sub.criado_em || sub.created_at || new Date().toISOString();

                              return (
                                <tr key={sub.id} className="hover:bg-slate-800/30">
                                  <td className="p-3 font-medium text-white">{sub.nome_completo || sub.name || 'Morador'}</td>
                                  <td className="p-3 text-cyan-400 font-semibold">{cityName}</td>
                                  <td className="p-3 text-slate-300">{sub.bairro || sub.neighborhood || '-'}</td>
                                  <td className="p-3 text-slate-300 space-y-0.5">
                                    {sub.whatsapp && <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1"><Smartphone className="w-3 h-3 shrink-0" />{sub.whatsapp}</div>}
                                    {sub.email && <div className="text-[11px] text-cyan-400 flex items-center gap-1"><Mail className="w-3 h-3 shrink-0" />{sub.email}</div>}
                                  </td>
                                  <td className="p-3 font-bold text-amber-300">
                                    <span className="px-2 py-0.5 rounded-lg bg-amber-950/70 border border-amber-800/60">
                                      {cotaVal.toFixed(2).replace('.', ',')} m
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-400 text-[11px]">
                                    {new Date(createdDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isActive
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                        : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                                    }`}>
                                      {isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right space-x-2">
                                    <button
                                      onClick={() => handleToggleSubActive(sub.id, isActive)}
                                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-all cursor-pointer"
                                    >
                                      {isActive ? 'Desativar' : 'Ativar'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSub(sub.id)}
                                      className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[10px] transition-all cursor-pointer"
                                    >
                                      Excluir
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* HISTÓRICO DE NOTIFICAÇÕES & SIMULADOR DE DISPARO */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LISTA DE NOTIFICAÇÕES (2 cols) */}
                    <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Bell className="w-4 h-4 text-cyan-400" />
                        <span>Histórico de Alertas Disparados</span>
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                              <th className="p-2.5 font-semibold">Data / Hora</th>
                              <th className="p-2.5 font-semibold">Cidade</th>
                              <th className="p-2.5 font-semibold">Tipo</th>
                              <th className="p-2.5 font-semibold">Nível</th>
                              <th className="p-2.5 font-semibold">Confirmação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {notificationsList.map((notif) => (
                              <tr key={notif.id} className="hover:bg-slate-800/30">
                                <td className="p-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                                  {new Date(notif.sent_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                </td>
                                <td className="p-2.5 text-white font-medium">{notif.city_slug}</td>
                                <td className="p-2.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    notif.alert_type === 'inundacao'
                                      ? 'bg-rose-950 text-rose-400'
                                      : notif.alert_type === 'alerta'
                                      ? 'bg-orange-950 text-orange-400'
                                      : 'bg-amber-950 text-amber-400'
                                  }`}>
                                    {notif.alert_type}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-300 font-bold">{notif.river_level.toFixed(2)}m</td>
                                <td className="p-2.5">
                                  {notif.confirmed_at ? (
                                    <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-[10px]">Pendente</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SIMULADOR DE ALERTA DE TESTE (1 col) */}
                    <div className="bg-[#0F172A] border border-amber-800/40 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Simulador de Alerta Manual</span>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Simule um disparo de alerta de emergência para testar o recebimento por moradores cadastrados na cidade selecionada.
                      </p>

                      <form onSubmit={handleRunSimulation} className="space-y-3">
                        <div>
                          <label className="block text-[11px] text-slate-300 font-semibold mb-1">Cidade Alvo</label>
                          <select
                            value={simCitySlug}
                            onChange={(e) => setSimCitySlug(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            {citiesList.map(c => (
                              <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-300 font-semibold mb-1">Nível do Rio (m)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={simLevel}
                              onChange={(e) => setSimLevel(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-300 font-semibold mb-1">Categoria</label>
                            <select
                              value={simStatus}
                              onChange={(e) => setSimStatus(e.target.value as LevelStatus)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            >
                              <option value="atencao">Atenção</option>
                              <option value="alerta">Alerta</option>
                              <option value="inundacao">Inundação</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 font-semibold mb-1">Mensagem do Comunicado</label>
                          <textarea
                            value={simMessage}
                            onChange={(e) => setSimMessage(e.target.value)}
                            placeholder="Deixe em branco para usar a mensagem automática padronizada..."
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={simSending}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {simSending ? 'Disparando...' : 'Disparar Alerta de Teste'}
                        </button>
                      </form>

                      {simResult && (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs text-amber-200 leading-relaxed">
                          {simResult}
                        </div>
                      )}
                    </div>
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
                  {/* CARD DE LAYOUT: CÂMERAS AO VIVO - APOIO / PARCEIROS */}
                  <div className="bg-[#0F172A] border border-cyan-500/30 p-5 rounded-2xl space-y-4 shadow-lg shadow-cyan-950/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                          <Award className="w-4 h-4 text-cyan-400" />
                          <span>Layout do Painel de Câmeras — Apoio / Parceiros</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Gerencie os logotipos dos parceiros (Logo 1 e Logo 2) exibidos na barra lateral das Câmeras ao Vivo e no rodapé do portal.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2.5 py-1 rounded-full shrink-0">
                        {sponsorsList.length} Marca(s) Cadastrada(s)
                      </span>
                    </div>

                    {/* PREVIEW DO LAYOUT SIDEBAR (LOGO 1 E LOGO 2) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* LOGO 1 SLOT */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                            POSIÇÃO #1 — LOGO 1
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${sponsorsList[0]?.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-slate-800 text-slate-400'}`}>
                            {sponsorsList[0] ? (sponsorsList[0].active ? 'ATIVO' : 'INATIVO') : 'VAZIO'}
                          </span>
                        </div>

                        <div className="h-14 bg-[#0A1326] border border-dashed border-slate-700/80 rounded-lg flex items-center justify-center p-2 text-center">
                          {sponsorsList[0]?.logo_url ? (
                            <img src={sponsorsList[0].logo_url} alt={sponsorsList[0].name} className="max-h-10 max-w-full object-contain" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {sponsorsList[0]?.name || 'Logo 1 (Sem imagem)'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                          <span className="text-[11px] font-medium text-slate-300 truncate">
                            {sponsorsList[0]?.name || 'Nenhuma marca vinculada ao Logo 1'}
                          </span>
                          {sponsorsList[0] ? (
                            <button
                              type="button"
                              onClick={() => handleEditSponsor(sponsorsList[0])}
                              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline shrink-0 cursor-pointer"
                            >
                              Editar Logo 1
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSponsorId(null);
                                setSponsorName('');
                                setSponsorLogoUrl('');
                                setSponsorWebsite('');
                                setSponsorDisplayOrder(1);
                                setSponsorActive(true);
                              }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline shrink-0 cursor-pointer"
                            >
                              Cadastrar Logo 1
                            </button>
                          )}
                        </div>
                      </div>

                      {/* LOGO 2 SLOT */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                            POSIÇÃO #2 — LOGO 2
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${sponsorsList[1]?.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-slate-800 text-slate-400'}`}>
                            {sponsorsList[1] ? (sponsorsList[1].active ? 'ATIVO' : 'INATIVO') : 'VAZIO'}
                          </span>
                        </div>

                        <div className="h-14 bg-[#0A1326] border border-dashed border-slate-700/80 rounded-lg flex items-center justify-center p-2 text-center">
                          {sponsorsList[1]?.logo_url ? (
                            <img src={sponsorsList[1].logo_url} alt={sponsorsList[1].name} className="max-h-10 max-w-full object-contain" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {sponsorsList[1]?.name || 'Logo 2 (Sem imagem)'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                          <span className="text-[11px] font-medium text-slate-300 truncate">
                            {sponsorsList[1]?.name || 'Nenhuma marca vinculada ao Logo 2'}
                          </span>
                          {sponsorsList[1] ? (
                            <button
                              type="button"
                              onClick={() => handleEditSponsor(sponsorsList[1])}
                              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline shrink-0 cursor-pointer"
                            >
                              Editar Logo 2
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSponsorId(null);
                                setSponsorName('');
                                setSponsorLogoUrl('');
                                setSponsorWebsite('');
                                setSponsorDisplayOrder(2);
                                setSponsorActive(true);
                              }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline shrink-0 cursor-pointer"
                            >
                              Cadastrar Logo 2
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

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
                  <form ref={cityFormRef} onSubmit={handleSaveCitySubmit} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        <span>{editingCityId ? `Editar Cidade: ${cityName || 'Selecionada'}` : 'Cadastrar Nova Cidade'}</span>
                      </h4>
                      {editingCityId && (
                        <button
                          type="button"
                          onClick={handleResetCityForm}
                          className="text-cyan-400 hover:underline text-[11px] font-semibold cursor-pointer"
                        >
                          + Cancelar edição e criar nova
                        </button>
                      )}
                    </div>

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
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
                          />
                          <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors">
                            {cityUploading ? (
                              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                            <span className="text-xs text-slate-200">{cityUploading ? 'Enviando...' : 'Enviar'}</span>
                            <input type="file" accept="image/*" onChange={handleCityImageUpload} disabled={cityUploading} className="hidden" />
                          </label>
                        </div>

                        {/* LIVE IMAGE PREVIEW BOX */}
                        {cityImage ? (
                          <div className="mt-2.5 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center gap-3">
                            <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950 flex items-center justify-center">
                              <img
                                src={cityImage}
                                alt="Pré-visualização da cidade"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
                                }}
                              />
                              {cityImage.includes('supabase.co/storage') && (
                                <span className="absolute bottom-1 right-1 bg-cyan-500 text-slate-950 font-bold text-[8px] px-1 py-0.2 rounded">
                                  Storage
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-white flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  Pré-visualização
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCityImage('')}
                                  className="text-[10px] text-slate-400 hover:text-red-400 underline cursor-pointer"
                                >
                                  Remover
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono truncate">{cityImage}</p>
                              {cityImage.includes('supabase.co/storage') ? (
                                <p className="text-[10px] text-emerald-400 font-semibold">✓ Arquivo no Supabase Storage</p>
                              ) : (
                                <p className="text-[10px] text-cyan-400 font-medium">✓ URL Externa de Imagem</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-1.5 italic">
                            Sem imagem. Envie uma foto para o Supabase Storage ou insira uma URL.
                          </p>
                        )}
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

                    <div className="flex items-center gap-3 pt-2">
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
                        <Save className="w-4 h-4" />
                        <span>{editingCityId ? 'Atualizar Cidade' : 'Salvar Cidade'}</span>
                      </button>
                      {editingCityId && (
                        <button
                          type="button"
                          onClick={handleResetCityForm}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-medium cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-3">Cidades Cadastradas ({citiesList.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {citiesList.map((city) => (
                        <div
                          key={city.id}
                          className={`p-3 rounded-xl flex items-center justify-between text-xs transition-all ${
                            editingCityId === city.id
                              ? 'bg-cyan-950/60 border-2 border-cyan-500 shadow-lg shadow-cyan-950/50'
                              : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                              <img
                                src={city.image || (city as any).image_url || city.camera_image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80'}
                                alt={city.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80';
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <span>{city.name}</span>
                                {editingCityId === city.id && (
                                  <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">
                                    Editando
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">Nível: <span className="text-cyan-400 font-mono font-bold">{city.current_level}m</span></p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditCity(city)}
                              title="Editar Cidade"
                              className="p-2 bg-slate-800 hover:bg-cyan-900/50 text-cyan-400 hover:text-cyan-300 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCity(city.id, city.name)}
                              title="Excluir Cidade"
                              className="p-2 bg-slate-800 hover:bg-red-950 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                            >
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
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Video className="w-4 h-4 text-cyan-400" />
                        <span>{editingCameraId ? 'Editar Câmera de Monitoramento' : 'Cadastrar Nova Câmera por Cidade'}</span>
                      </h4>
                      {editingCameraId && (
                        <button
                          type="button"
                          onClick={handleResetCameraForm}
                          className="text-cyan-400 hover:underline text-[11px] font-semibold cursor-pointer"
                        >
                          + Cancelar edição e criar nova
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Cidade Obrigatoriamente Vinculada</label>
                        <select
                          value={cameraCitySlug}
                          onChange={(e) => setCameraCitySlug(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                          required
                        >
                          {citiesList.map((c) => (
                            <option key={c.id} value={c.slug}>{c.name} ({c.slug})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Nome da Câmera</label>
                        <input
                          type="text"
                          value={cameraName}
                          onChange={(e) => setCameraName(e.target.value)}
                          placeholder="Ex: Ponte BR-386 (Lajeado / Estrela)"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">URL da Transmissão (Stream/Embed/YouTube)</label>
                        <input
                          type="text"
                          value={cameraUrlStream}
                          onChange={(e) => setCameraUrlStream(e.target.value)}
                          placeholder="https://www.youtube.com/embed/... ou stream URL"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Tipo de Transmissão</label>
                        <select
                          value={cameraTipo}
                          onChange={(e) => setCameraTipo(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="YouTube">YouTube Live/Embed</option>
                          <option value="MJPEG">MJPEG Stream</option>
                          <option value="HLS">HLS (.m3u8)</option>
                          <option value="RTSP">RTSP Convertido</option>
                          <option value="Imagem Estática">Imagem Estática (Foto/Snapshot)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Localização / Ponto de Referência</label>
                        <input
                          type="text"
                          value={cameraLocalizacao}
                          onChange={(e) => setCameraLocalizacao(e.target.value)}
                          placeholder="Ex: Orla do Taquari - Bairro Navegantes"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-300 mb-1 font-semibold">Ordem</label>
                          <input
                            type="number"
                            min={1}
                            value={cameraOrder}
                            onChange={(e) => setCameraOrder(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 mb-1 font-semibold">Status</label>
                          <label className="flex items-center gap-2 mt-2 cursor-pointer text-slate-200">
                            <input
                              type="checkbox"
                              checked={cameraAtivo}
                              onChange={(e) => setCameraAtivo(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-cyan-500 w-4 h-4"
                            />
                            <span className="text-xs font-semibold">{cameraAtivo ? 'Ativa' : 'Inativa'}</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Descrição Detalhada (opcional)</label>
                      <input
                        type="text"
                        value={cameraDescricao}
                        onChange={(e) => setCameraDescricao(e.target.value)}
                        placeholder="Acompanhamento direto do avanço das cotas de inundação..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow cursor-pointer">
                        <Save className="w-4 h-4" />
                        <span>{editingCameraId ? 'Atualizar Câmera' : 'Cadastrar Câmera'}</span>
                      </button>
                      {editingCameraId && (
                        <button
                          type="button"
                          onClick={handleResetCameraForm}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>

                  {/* LIST OF CAMERAS BY CITY */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Video className="w-4 h-4 text-cyan-400" />
                          <span>Câmeras Cadastradas por Cidade ({camerasList.length})</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Cada cidade exibe estritamente as suas próprias câmeras vinculadas.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Filtrar por Cidade:</span>
                        <select
                          value={adminCameraCityFilter}
                          onChange={(e) => setAdminCameraCityFilter(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                        >
                          <option value="all">Todas as Cidades</option>
                          {citiesList.map((c) => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(() => {
                      const filteredCams = camerasList.filter(cam =>
                        adminCameraCityFilter === 'all' || cam.city_slug === adminCameraCityFilter
                      );

                      if (filteredCams.length === 0) {
                        return (
                          <div className="p-8 text-center text-slate-500 italic bg-slate-900/50 rounded-xl">
                            Nenhuma câmera cadastrada para {adminCameraCityFilter === 'all' ? 'o sistema' : `a cidade ${adminCameraCityFilter}`}.
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold">
                              <tr>
                                <th className="p-3">Cidade (slug)</th>
                                <th className="p-3">Nome da Câmera</th>
                                <th className="p-3">Tipo / Local</th>
                                <th className="p-3">URL Stream</th>
                                <th className="p-3">Ordem</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filteredCams.map((cam) => (
                                <tr key={cam.id} className="hover:bg-slate-800/30">
                                  <td className="p-3 font-bold text-cyan-300 uppercase">
                                    {cam.city_slug}
                                  </td>
                                  <td className="p-3 font-bold text-white">
                                    {cam.nome}
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] block w-fit mb-1">
                                      {cam.tipo || 'YouTube'}
                                    </span>
                                    <span className="text-slate-400 text-[11px] block">{cam.localizacao || '-'}</span>
                                  </td>
                                  <td className="p-3 text-slate-400 font-mono max-w-xs truncate" title={cam.url_stream}>
                                    {cam.url_stream}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-slate-300">
                                    #{cam.ordem_exibicao || 1}
                                  </td>
                                  <td className="p-3">
                                    <button
                                      onClick={() => handleToggleCameraAtivo(cam)}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${
                                        cam.ativo !== false
                                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                          : 'bg-rose-950 text-rose-400 border-rose-800'
                                      }`}
                                    >
                                      {cam.ativo !== false ? 'Ativa' : 'Inativa'}
                                    </button>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleEditCameraClick(cam)}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg cursor-pointer"
                                        title="Editar câmera"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCamera(cam.id, cam.nome)}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg cursor-pointer"
                                        title="Excluir câmera"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 5.1: FONTES DE NOTÍCIAS */}
              {activeTab === 'fontes_noticias' && (
                <div className="space-y-6">
                  {/* Top Notice & Global Action */}
                  <div className="bg-[#0F172A] border border-cyan-900/50 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Rss className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fontes Oficiais de Notícias e Comunicados</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        Cadastre e autorize fontes oficiais (Defesa Civil, Prefeituras, Órgãos Públicos). 
                        O coletor automático só consultará fontes ativas e nos horários e frequências explicitamente configurados por você.
                      </p>
                    </div>

                    <button
                      onClick={() => handleTriggerCollectorNow()}
                      disabled={sourceTestingId === 'all'}
                      className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs shrink-0 transition-all cursor-pointer shadow-lg shadow-cyan-900/30"
                    >
                      {sourceTestingId === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>Executar Coleta Agora em Todas as Fontes</span>
                    </button>
                  </div>

                  {sourceTestFeedback && (
                    <div className="p-3 bg-cyan-950/60 border border-cyan-800 text-cyan-200 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{sourceTestFeedback}</span>
                    </div>
                  )}

                  {/* Form: Adicionar / Editar Fonte */}
                  <form onSubmit={handleSaveNewsSourceSubmit} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
                        <Plus className="w-4 h-4 text-cyan-400" />
                        <span>{editingSourceId ? 'Editar Fonte de Notícia Oficial' : 'Cadastrar Nova Fonte Oficial de Notícias'}</span>
                      </h4>
                      {editingSourceId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSourceId(null);
                            setSourceNome('');
                            setSourceDescricao('');
                            setNewsSourceUrl('');
                            setSourceTipo('rss');
                            setSourceAtivo(true);
                            setSourceFrequencia('hourly');
                          }}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Nome da Fonte Oficial *</label>
                        <input
                          type="text"
                          value={sourceNome}
                          onChange={(e) => setSourceNome(e.target.value)}
                          placeholder="Ex: Defesa Civil RS, Prefeitura de Lajeado"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Tipo de Integração *</label>
                        <select
                          value={sourceTipo}
                          onChange={(e) => setSourceTipo(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="rss">Feed RSS / XML (Recomendado)</option>
                          <option value="api">API JSON</option>
                          <option value="html">Página Web HTML</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">URL Oficial do Feed ou Fonte *</label>
                      <input
                        type="url"
                        value={newsSourceUrl}
                        onChange={(e) => setNewsSourceUrl(e.target.value)}
                        placeholder="https://defesacivil.rs.gov.br/feed ou https://prefeitura.gov.br/noticias"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Descrição / Finalidade</label>
                      <input
                        type="text"
                        value={sourceDescricao}
                        onChange={(e) => setSourceDescricao(e.target.value)}
                        placeholder="Ex: Comunicados oficiais sobre cheias e alertas meteorológicos no Vale do Taquari"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Frequência de Atualização Automática *</label>
                        <select
                          value={sourceFrequencia}
                          onChange={(e) => setSourceFrequencia(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
                        >
                          <option value="hourly">A cada hora</option>
                          <option value="multiple_daily">Várias vezes ao dia</option>
                          <option value="daily">Uma vez ao dia</option>
                          <option value="weekly">Uma vez por semana</option>
                          <option value="manual">Apenas Manual (Sem agendamento)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Status da Fonte *</label>
                        <select
                          value={sourceAtivo ? 'true' : 'false'}
                          onChange={(e) => setSourceAtivo(e.target.value === 'true')}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
                        >
                          <option value="true">🟢 Ativa (Autorizada para Coleta)</option>
                          <option value="false">🔴 Inativa (Bloqueada pelo Admin)</option>
                        </select>
                      </div>
                    </div>

                    {/* Campos condicionais baseados na frequência selecionada */}
                    {sourceFrequencia === 'multiple_daily' && (
                      <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3">
                        <p className="font-bold text-cyan-400">Configuração de múltiplos horários no dia:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-300 mb-1">Consultas por dia (quantidade)</label>
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={sourceCountPerDay}
                              onChange={(e) => setSourceCountPerDay(parseInt(e.target.value) || 2)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1">Horários fixos (separados por vírgula)</label>
                            <input
                              type="text"
                              value={sourceTimes.join(', ')}
                              onChange={(e) => setSourceTimes(e.target.value.split(',').map(s => s.trim()))}
                              placeholder="08:00, 12:00, 18:00"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {sourceFrequencia === 'daily' && (
                      <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3">
                        <p className="font-bold text-cyan-400">Configuração de horário diário:</p>
                        <div className="w-48">
                          <label className="block text-slate-300 mb-1">Horário fixo da consulta</label>
                          <input
                            type="time"
                            value={sourceTime}
                            onChange={(e) => setSourceTime(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                          />
                        </div>
                      </div>
                    )}

                    {sourceFrequencia === 'weekly' && (
                      <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3">
                        <p className="font-bold text-cyan-400">Configuração semanal:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-300 mb-1">Dia da semana</label>
                            <select
                              value={sourceDayOfWeek}
                              onChange={(e) => setSourceDayOfWeek(parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                            >
                              <option value={0}>Domingo</option>
                              <option value={1}>Segunda-feira</option>
                              <option value={2}>Terça-feira</option>
                              <option value={3}>Quarta-feira</option>
                              <option value={4}>Quinta-feira</option>
                              <option value={5}>Sexta-feira</option>
                              <option value={6}>Sábado</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1">Horário da consulta</label>
                            <input
                              type="time"
                              value={sourceTime}
                              onChange={(e) => setSourceTime(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {sourceFrequencia === 'manual' && (
                      <div className="p-3 bg-amber-950/40 border border-amber-800/60 text-amber-300 rounded-xl text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>A fonte ficará salva no painel, mas o sistema NUNCA fará consultas automáticas. Você poderá acionar manualmente a qualquer momento.</span>
                      </div>
                    )}

                    {/* Regras de Filtragem e Relevância da Fonte */}
                    <div className="p-4 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Filter className="w-4 h-4 text-cyan-400" />
                          <span>Filtros de Relevância e Classificação da Fonte</span>
                        </span>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sourceImportarTodas}
                            onChange={(e) => setSourceImportarTodas(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-amber-300">
                            Importar todas as publicações sem filtrar
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1 font-semibold">
                            Categoria Padrão da Fonte
                          </label>
                          <select
                            value={sourceCategoriaPadrao}
                            onChange={(e) => setSourceCategoriaPadrao(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                          >
                            <option value="Comunicados">🔵 Comunicados Oficiais</option>
                            <option value="Alertas">🔴 Alertas & Defesa Civil</option>
                            <option value="Monitoramento">🟠 Monitoramento Hidrológico</option>
                            <option value="Meteorologia">🟢 Meteorologia & Previsão</option>
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Categoria atribuída quando o conteúdo for genérico.
                          </p>
                        </div>

                        <div className={sourceImportarTodas ? 'opacity-40 pointer-events-none' : ''}>
                          <label className="block text-slate-300 mb-1 font-semibold">
                            Palavras-chave de Relevância (Incluir)
                          </label>
                          <textarea
                            rows={2}
                            value={sourceKeywordsIncluir}
                            onChange={(e) => setSourceKeywordsIncluir(e.target.value)}
                            placeholder="enchente, cheia, inundação, rio, chuva, alerta, Taquari"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Apenas notícias contendo estes termos (separados por vírgula) serão aceitas.
                          </p>
                        </div>

                        <div className={sourceImportarTodas ? 'opacity-40 pointer-events-none' : ''}>
                          <label className="block text-slate-300 mb-1 font-semibold">
                            Termos de Bloqueio (Ignorar)
                          </label>
                          <textarea
                            rows={2}
                            value={sourceKeywordsIgnorar}
                            onChange={(e) => setSourceKeywordsIgnorar(e.target.value)}
                            placeholder="esporte, eventos, cultura, entretenimento, futebol"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Notícias contendo estes termos serão automaticamente descartadas.
                          </p>
                        </div>
                      </div>

                      {sourceImportarTodas && (
                        <div className="p-2.5 bg-amber-950/40 border border-amber-800/50 rounded-lg text-[11px] text-amber-300">
                          ⚡ <b>Modo Auto-Importar Ativado:</b> O coletor importará todas as publicações publicadas nesta fonte sem aplicar filtro de palavras-chave.
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-900/20">
                        <Save className="w-4 h-4" />
                        <span>{editingSourceId ? 'Atualizar Fonte' : 'Salvar e Autorizar Fonte'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Lista de Fontes Cadastradas */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 text-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>Fontes de Notícias Cadastradas ({newsSourcesList.length})</span>
                      </h4>
                    </div>

                    {newsSourcesList.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                        <Rss className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-slate-400">Nenhuma fonte oficial cadastrada até o momento.</p>
                        <p className="text-[11px] text-slate-500 mt-1">Conforme as diretrizes, o sistema não consulta nenhuma fonte automaticamente enquanto nenhuma for cadastrada e ativada acima.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {newsSourcesList.map((source) => (
                          <div
                            key={source.id}
                            className={`p-4 bg-slate-900/90 border ${source.ativo ? 'border-slate-800 hover:border-cyan-800' : 'border-red-900/30 bg-red-950/10'} rounded-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${source.ativo ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-red-950 text-red-400 border border-red-800/50'}`}>
                                  {source.ativo ? '🟢 Ativa' : '🔴 Inativa'}
                                </span>

                                <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded font-mono uppercase border border-slate-700">
                                  {source.tipo.toUpperCase()}
                                </span>

                                <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-medium border border-blue-900/50 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-blue-400" />
                                  <span>
                                    {source.frequencia === 'hourly' && 'A cada hora'}
                                    {source.frequencia === 'multiple_daily' && `Várias vezes ao dia (${source.horarios_configurados?.count_per_day || 2}x)`}
                                    {source.frequencia === 'daily' && `Diário às ${source.horarios_configurados?.time || '08:00'}`}
                                    {source.frequencia === 'weekly' && `Semanal (${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][source.horarios_configurados?.day_of_week || 1]} às ${source.horarios_configurados?.time || '08:00'})`}
                                    {source.frequencia === 'manual' && 'Manual (Sem coleta auto)'}
                                  </span>
                                </span>

                                <span className="text-[10px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded font-medium border border-purple-800/50">
                                  📂 {source.categoria_padrao || 'Comunicados'}
                                </span>

                                {source.importar_todas ? (
                                  <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-800/50">
                                    ⚡ Importa Todas
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-medium border border-cyan-800/50 flex items-center gap-1">
                                    <Filter className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>Filtro de Relevância Ativo</span>
                                  </span>
                                )}
                              </div>

                              <h5 className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{source.nome}</span>
                              </h5>

                              {source.descricao && (
                                <p className="text-slate-400 text-xs">{source.descricao}</p>
                              )}

                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center gap-1 truncate max-w-lg"
                              >
                                <span>{source.url}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>

                              <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                                <span>Última verificação: {source.ultima_verificacao ? new Date(source.ultima_verificacao).toLocaleString('pt-BR') : 'Nunca'}</span>
                                {source.proxima_verificacao && source.ativo && source.frequencia !== 'manual' && (
                                  <span>Próxima agendada: {new Date(source.proxima_verificacao).toLocaleString('pt-BR')}</span>
                                )}
                              </div>
                            </div>

                            {/* Controles da Fonte */}
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              <button
                                onClick={() => handleToggleNewsSourceActive(source.id, source.ativo, source.nome)}
                                title={source.ativo ? 'Desativar fonte' : 'Ativar fonte'}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  source.ativo ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900' : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {source.ativo ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                                <span>{source.ativo ? 'Ativa' : 'Inativa'}</span>
                              </button>

                              <button
                                onClick={() => handleTriggerCollectorNow(source.id, source.nome)}
                                disabled={sourceTestingId === source.id}
                                title="Executar busca de notícias imediatamente"
                                className="p-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg flex items-center gap-1 text-xs cursor-pointer"
                              >
                                {sourceTestingId === source.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                <span>Consultar</span>
                              </button>

                              <button
                                onClick={() => handleEditNewsSource(source)}
                                title="Editar fonte"
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteNewsSource(source.id, source.nome)}
                                title="Remover fonte"
                                className="p-2 bg-red-950 hover:bg-red-900 border border-red-900/50 text-red-400 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: NOTÍCIAS */}
              {activeTab === 'noticias' && (
                <div className="space-y-6">
                  <div className="bg-[#0F172A] border border-cyan-900/40 p-4 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Rss className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-300">Deseja automatizar a coleta de comunicados de sites oficiais?</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('fontes_noticias')}
                      className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Gerenciar Fontes Oficiais</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                          <option value="Comunicados">Comunicados Oficiais</option>
                          <option value="Alertas">Alertas de Emergência</option>
                          <option value="Monitoramento">Monitoramento Hidrológico</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Prioridade *</label>
                        <select
                          value={newsPrioridade}
                          onChange={(e) => setNewsPrioridade(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
                        >
                          <option value="baixa">Baixa</option>
                          <option value="media">Média (Padrão)</option>
                          <option value="alta">🔴 Alta / Destaque Principal</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Resumo / Conteúdo *</label>
                      <textarea
                        rows={3}
                        value={newsSummary}
                        onChange={(e) => setNewsSummary(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        placeholder="Insira a íntegra ou resumo do comunicado oficial..."
                        required
                      />
                    </div>

                    {/* Regras de Permanência e Exibição */}
                    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                      <p className="font-bold text-cyan-400 text-xs">Controle de Permanência e Exibição</p>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                          <input
                            type="checkbox"
                            checked={newsManterPermanente}
                            onChange={(e) => setNewsManterPermanente(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                          />
                          <span className="font-medium">Manter notícia permanentemente</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                          <input
                            type="checkbox"
                            checked={newsExibirNoMenu}
                            onChange={(e) => setNewsExibirNoMenu(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                          />
                          <span className="font-medium">Exibir no menu Notícias</span>
                        </label>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        * Se a opção <b>Manter notícia permanentemente</b> não estiver marcada, a notícia será removida automaticamente pela rotina de limpeza após 7 dias de sua publicação.
                      </p>
                    </div>

                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/20">
                      <Plus className="w-4 h-4" />
                      <span>Publicar Notícia Oficial</span>
                    </button>
                  </form>

                  <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 text-xs">
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-3">Notícias Publicadas no Sistema ({newsList.length})</h4>
                    <div className="space-y-2">
                      {newsList.map((item) => (
                        <div key={item.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded font-bold">{item.category}</span>
                              {item.manter_permanente ? (
                                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded font-medium">📌 Permanente</span>
                              ) : (
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-medium">⏳ 7 dias</span>
                              )}
                              {item.prioridade === 'alta' && (
                                <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/50 px-2 py-0.5 rounded font-bold">🔴 Alta Prioridade</span>
                              )}
                            </div>
                            <p className="font-bold text-white text-sm">{item.title}</p>
                            <p className="text-slate-400 text-xs line-clamp-1">{item.summary}</p>
                          </div>
                          <button onClick={() => handleDeleteNews(item.id, item.title)} className="p-2 bg-slate-800 hover:bg-red-950 text-red-400 rounded-lg shrink-0 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
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
                            <td className="p-2.5 text-slate-300">{log.user_email || 'Sistema'}</td>
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

              {/* TAB LAYOUT CONFIGURATION */}
              {activeTab === 'layout_config' && (
                <AdminLayoutConfigView />
              )}

              {/* TAB 9: CONFIGURAÇÕES DO SITE */}
              {activeTab === 'configuracoes' && (
                <div className="space-y-6 text-xs">
                  
                  {/* ALERTS FOR SUCCESS / ERROR */}
                  {settingsSaveSuccess && (
                    <div className="p-4 bg-emerald-950/90 border border-emerald-800 text-emerald-300 rounded-2xl flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                        <span className="font-semibold">{settingsSaveSuccess}</span>
                      </div>
                      <button onClick={() => setSettingsSaveSuccess(null)} className="text-emerald-400 hover:text-white p-1 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {settingsError && (
                    <div className="p-4 bg-red-950/90 border border-red-800 text-red-300 rounded-2xl flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                        <span className="font-semibold">{settingsError}</span>
                      </div>
                      <button onClick={() => setSettingsError(null)} className="text-red-400 hover:text-white p-1 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSaveSettingsSubmit} className="space-y-6">
                    
                    {/* SEÇÃO 1: LOGO DO SITE */}
                    <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-cyan-400" />
                            1. Logo do Site
                          </h4>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Envie uma imagem para substituir o logo em todo o sistema (cabeçalho, menus, telas iniciais e administrativas).
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono shrink-0 self-start sm:self-auto">
                          PNG, JPG, SVG, WEBP (Máx. 5MB)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        {/* PREVIEW CONTAINER */}
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center min-h-[140px] relative">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-mono">Preview do Logo Atual</span>
                          {logoUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <img 
                                src={`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}v=${Date.now()}`} 
                                alt="Logo Preview" 
                                className="max-h-16 max-w-full object-contain p-2 bg-slate-950/60 rounded-lg border border-slate-800"
                              />
                              <span className="text-[10px] text-cyan-400 font-mono truncate max-w-[250px]">{logoUrl}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                                <Waves className="w-7 h-7" />
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">Ícone Padrão Ativo (Sem Logo Personalizado)</span>
                            </div>
                          )}
                        </div>

                        {/* CONTROLES DO LOGO */}
                        <div className="space-y-3">
                          <label className="block text-slate-300 font-semibold mb-1">Upload de Novo Logo</label>
                          <div className="flex flex-wrap gap-2">
                            <label className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${logoUploading ? 'bg-slate-700 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-md'}`}>
                              <Upload className="w-4 h-4" />
                              <span>{logoUploading ? 'Enviando imagem...' : 'Selecionar Nova Imagem'}</span>
                              <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                                onChange={handleLogoFileChange}
                                disabled={logoUploading}
                                className="hidden" 
                              />
                            </label>

                            {logoUrl && (
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="px-4 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remover Logo</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Dica: Utilize imagens com fundo transparente (PNG ou SVG) e boa definição. A substituição será aplicada instantaneamente no portal.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 2: NOME E INFORMAÇÕES INSTITUCIONAIS */}
                    <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                      <div className="border-b border-slate-800 pb-3">
                        <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          2. Nome e Identidade do Sistema
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Altere as informações institucionais exibidas no título da página, cabeçalho, rodapé e menus.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-slate-300 font-semibold mb-1">Nome Principal do Sistema</label>
                          <input
                            type="text"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            placeholder="Ex: Monitoramento Rio Taquari"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Subtítulo Institucional</label>
                          <input
                            type="text"
                            value={siteSubtitle}
                            onChange={(e) => setSiteSubtitle(e.target.value)}
                            placeholder="Ex: Informação e prevenção para o Vale do Taquari"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Descrição Curta</label>
                          <input
                            type="text"
                            value={siteDescription}
                            onChange={(e) => setSiteDescription(e.target.value)}
                            placeholder="Ex: Portal institucional e sistema de alerta hidrológico."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 3: FAVICON DO SITE */}
                    <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            3. Favicon do Site
                          </h4>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            O favicon é o pequeno ícone exibido na aba do navegador ao lado do título do site.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono shrink-0 self-start sm:self-auto">
                          .ICO, .PNG, .SVG (Máx. 2MB)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        {/* PREVIEW CONTAINER */}
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-around min-h-[120px]">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono uppercase">Tamanho Real (16x16 / 32x32)</span>
                            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1">
                              {faviconUrl ? (
                                <img src={`${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${Date.now()}`} alt="Favicon Small" className="w-5 h-5 object-contain" />
                              ) : (
                                <Waves className="w-4 h-4 text-cyan-400" />
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono uppercase">Preview Ampliado</span>
                            <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2 shadow-inner">
                              {faviconUrl ? (
                                <img src={`${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${Date.now()}`} alt="Favicon Large" className="w-10 h-10 object-contain" />
                              ) : (
                                <Waves className="w-8 h-8 text-cyan-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* CONTROLES DO FAVICON */}
                        <div className="space-y-3">
                          <label className="block text-slate-300 font-semibold mb-1">Upload de Favicon</label>
                          <div className="flex flex-wrap gap-2">
                            <label className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${faviconUploading ? 'bg-slate-700 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-md'}`}>
                              <Upload className="w-4 h-4" />
                              <span>{faviconUploading ? 'Enviando favicon...' : 'Selecionar Favicon'}</span>
                              <input 
                                type="file" 
                                accept=".ico, image/x-icon, image/vnd.microsoft.icon, image/png, image/svg+xml" 
                                onChange={handleFaviconFileChange}
                                disabled={faviconUploading}
                                className="hidden" 
                              />
                            </label>

                            {faviconUrl && (
                              <button
                                type="button"
                                onClick={handleRemoveFavicon}
                                className="px-4 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remover Favicon</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            A imagem enviada atualizará automaticamente a tag &lt;link rel="icon"&gt; na aba do navegador.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 4: CONFIGURAÇÕES COMPLEMENTARES DA TELEMETRIA */}
                    <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                      <div className="border-b border-slate-800 pb-3">
                        <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-cyan-400" />
                          4. Parâmetros de Sincronização e Contatos
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Intervalo de Sync (Minutos)</label>
                          <input
                            type="number"
                            value={updateFreq}
                            onChange={(e) => setUpdateFreq(parseInt(e.target.value) || 5)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Fonte Oficial de Dados</label>
                          <input
                            type="text"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Defesa Civil Emergência</label>
                          <input
                            type="text"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 5: PÁGINAS EM MANUTENÇÃO E TELAS PÚBLICAS */}
                    <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                      <div className="border-b border-slate-800 pb-3">
                        <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-cyan-400" />
                          5. Páginas em Manutenção / Módulos Públicos
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Defina se estes módulos do portal estarão em modo de manutenção para visitantes. Administradores autenticados continuarão com acesso liberado para testes.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CENTRO DE ANÁLISES */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-cyan-400" />
                              Centro de Análises
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              centroAnalisesPublicMode === 'construcao' 
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800' 
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            }`}>
                              {centroAnalisesPublicMode === 'construcao' ? 'Em Manutenção' : 'Ativo (Público)'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCentroAnalisesPublicMode('original')}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                centroAnalisesPublicMode === 'original'
                                  ? 'bg-cyan-600 text-white shadow-md'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Dashboard Normal</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCentroAnalisesPublicMode('construcao')}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                centroAnalisesPublicMode === 'construcao'
                                  ? 'bg-amber-600 text-white shadow-md'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Manutenção</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {centroAnalisesPublicMode === 'construcao' 
                              ? 'Visitantes verão a tela de manutenção. Administradores acessam o painel completo normalmente.' 
                              : 'Disponível publicamente para todos os visitantes do portal.'}
                          </p>
                        </div>

                        {/* CENTRAL DE ALERTAS */}
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <Bell className="w-4 h-4 text-cyan-400" />
                              Central de Alertas
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              alertasPublicMode === 'construcao' 
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800' 
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            }`}>
                              {alertasPublicMode === 'construcao' ? 'Em Manutenção' : 'Ativo (Público)'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAlertasPublicMode('original')}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                alertasPublicMode === 'original'
                                  ? 'bg-cyan-600 text-white shadow-md'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Cadastro Normal</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAlertasPublicMode('construcao')}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                alertasPublicMode === 'construcao'
                                  ? 'bg-amber-600 text-white shadow-md'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Manutenção</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {alertasPublicMode === 'construcao' 
                              ? 'Formulário oculto para visitantes com aviso de manutenção. Administradores podem visualizar e testar o formulário.' 
                              : 'Disponível publicamente para cadastros de novos moradores.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BARRA DE AÇÕES INFERIOR */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleRestoreDefaults}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-700 w-full sm:w-auto justify-center cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restaurar Configurações Padrão</span>
                      </button>

                      <button 
                        type="submit" 
                        className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Todas as Configurações no Supabase</span>
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </main>
          </div>
        )}

        {/* MODAL AUDITORIA DA FILA MULTICANAL */}
        {selectedHistoryForDispatchModal && (() => {
          const itemDispatches = dispatchesList.filter(d => d.alert_history_id === selectedHistoryForDispatchModal.id);
          const pending = itemDispatches.filter(d => d.status === 'pendente');
          const sent = itemDispatches.filter(d => d.status === 'enviado');

          return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0F172A] border border-cyan-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <SendHorizontal className="w-5 h-5" />
                    <span>Fila de Envio Multicanal — {selectedHistoryForDispatchModal.cidade} ({selectedHistoryForDispatchModal.tipo_alerta.toUpperCase()})</span>
                  </div>
                  <button
                    onClick={() => setSelectedHistoryForDispatchModal(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <p className="text-slate-300 font-mono"><strong className="text-white">Mensagem:</strong> {selectedHistoryForDispatchModal.mensagem}</p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 pt-1">
                      <span><strong>Nível:</strong> {Number(selectedHistoryForDispatchModal.nivel_rio).toFixed(2)}m</span>
                      <span><strong>Cota:</strong> {Number(selectedHistoryForDispatchModal.cota_disparada).toFixed(2)}m</span>
                      <span><strong>Aprovado por:</strong> {selectedHistoryForDispatchModal.aprovado_por || 'Sistema'}</span>
                      <span><strong>Criado em:</strong> {new Date(selectedHistoryForDispatchModal.criado_em).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[10px]">
                        Pendente: {pending.length}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                        Enviados: {sent.length}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">Total: {itemDispatches.length} destinatários</span>
                    </div>

                    {pending.length > 0 && (
                      <button
                        onClick={async () => {
                          await handleProcessQueue(selectedHistoryForDispatchModal.id);
                        }}
                        disabled={isProcessingQueue}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isProcessingQueue ? 'animate-spin' : ''}`} />
                        <span>Processar Fila deste Alerta</span>
                      </button>
                    )}
                  </div>

                  {itemDispatches.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 italic bg-slate-900/50 rounded-xl">
                      Nenhum envio registrado para este alerta.
                    </div>
                  ) : (
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-slate-300 text-xs">
                        <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">Morador / Destino</th>
                            <th className="p-2.5">Canal</th>
                            <th className="p-2.5">Tentativa</th>
                            <th className="p-2.5">Enviado Em</th>
                            <th className="p-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                          {itemDispatches.map(disp => (
                            <tr key={disp.id} className="hover:bg-slate-900/60">
                              <td className="p-2.5 font-medium text-white">
                                <div>{disp.subscriber_name || 'Morador'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{disp.destino}</div>
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${disp.canal === 'whatsapp' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'}`}>
                                  {disp.canal}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-400">#{disp.tentativa}</td>
                              <td className="p-2.5 text-[11px] text-slate-400">
                                {disp.enviado_em ? new Date(disp.enviado_em).toLocaleString('pt-BR') : '-'}
                              </td>
                              <td className="p-2.5 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${disp.status === 'enviado' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                                  {disp.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
                  <button
                    onClick={() => setSelectedHistoryForDispatchModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
