import React, { useState } from 'react';
import { Bell, ShieldAlert, CheckCircle2, AlertTriangle, Lock, Send, Info, UserCheck, Smartphone, Mail, MapPin, Building2 } from 'lucide-react';
import { City } from '../types';
import { subscribeToAlerts, confirmAlertNotification, fetchAlertNotifications } from '../lib/supabase';

interface RiskAlertSignupProps {
  cities: City[];
}

export const RiskAlertSignup: React.FC<RiskAlertSignupProps> = ({ cities }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [citySlug, setCitySlug] = useState(cities[0]?.slug || 'lajeado');
  const [neighborhood, setNeighborhood] = useState('');
  const [residesInRiskArea, setResidesInRiskArea] = useState<boolean>(true);
  const [declarationConfirmed, setDeclarationConfirmed] = useState<boolean>(false);
  
  const [receiveAttention, setReceiveAttention] = useState<boolean>(true);
  const [receiveAlert, setReceiveAlert] = useState<boolean>(true);
  const [receiveFlood, setReceiveFlood] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation mode state
  const [confirmNotificationId, setConfirmNotificationId] = useState('');
  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [confirmMessage, setConfirmMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim() && !whatsapp.trim()) {
      setErrorMessage('Informe ao menos um meio de contato (E-mail ou WhatsApp).');
      return;
    }

    if (!neighborhood.trim()) {
      setErrorMessage('Por favor, informe o seu bairro.');
      return;
    }

    if (residesInRiskArea && !declarationConfirmed) {
      setErrorMessage('Para moradores em área de risco, é obrigatório confirmar a declaração de interesse.');
      return;
    }

    setLoading(true);

    try {
      await subscribeToAlerts({
        name: name.trim(),
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        city_slug: citySlug,
        neighborhood: neighborhood.trim(),
        resides_in_risk_area: residesInRiskArea,
        receive_attention: receiveAttention,
        receive_alert: receiveAlert,
        receive_flood: receiveFlood,
        active: true
      });

      if (residesInRiskArea) {
        setSuccessMessage('Cadastro realizado com sucesso na Rede Comunitária de Alerta Preventivo! Você receberá avisos prioritários quando o rio atingir níveis de atenção ou emergência na sua região.');
      } else {
        setSuccessMessage('Cadastro concluído com sucesso! Como selecionou que não reside em área de risco, seu cadastro acompanhará comunicados informativos.');
      }

      // Reset form
      setName('');
      setEmail('');
      setWhatsapp('');
      setNeighborhood('');
      setDeclarationConfirmed(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmNotificationId.trim()) return;

    setConfirmStatus('loading');
    try {
      const ok = await confirmAlertNotification(confirmNotificationId.trim());
      if (ok) {
        setConfirmStatus('success');
        setConfirmMessage('Confirmação registrada com sucesso! Agradecemos por ajudar a comunidade e a Defesa Civil a validar a eficácia dos alertas.');
        setConfirmNotificationId('');
      } else {
        setConfirmStatus('error');
        setConfirmMessage('Código de alerta não encontrado ou já confirmado.');
      }
    } catch (err) {
      setConfirmStatus('error');
      setConfirmMessage('Ocorreu um erro ao registrar confirmação.');
    }
  };

  const selectedCityObj = cities.find(c => c.slug === citySlug) || cities[0];

  return (
    <div id="risk-alert-signup" className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Rede Comunitária de Prevenção
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Receba Alertas do Rio
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Cadastre-se para receber notificações sanitárias e alertas hidrológicos comunitários diretamente no seu WhatsApp ou E-mail quando o Rio Taquari atingir níveis críticos.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 min-w-[220px]">
            <Bell className="w-8 h-8 text-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">Monitoramento Contínuo</span>
            <span className="text-xs text-slate-400">Notificações por Cidade e Bairro</span>
          </div>
        </div>
      </div>

      {/* SIGNUP FORM & CONFIRMATION BOX GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN SIGNUP FORM (2 columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              Formulário de Cadastro
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Preencha os dados do responsável pelo recebimento de alertas do seu núcleo familiar.
            </p>
          </div>

          {successMessage && (
            <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 p-4 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">{successMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NOME COMPLETO */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Nome Completo <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria da Silva"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                required
              />
            </div>

            {/* CIDADE & BAIRRO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Cidade <span className="text-rose-400">*</span>
                </label>
                <select
                  value={citySlug}
                  onChange={(e) => setCitySlug(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm cursor-pointer"
                >
                  {cities.map((city) => (
                    <option key={city.id || city.slug} value={city.slug}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Bairro <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Centro / Navegantes"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* CONTATOS: E-MAIL & WHATSAPP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  WhatsApp com DDD
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(51) 99999-9999"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* CLASSIFICAÇÃO DE ÁREA DE RISCO */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <label className="block text-sm font-semibold text-white">
                Situação Residencial em Relação a Cheias:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setResidesInRiskArea(true)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    residesInRiskArea
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="riskArea"
                    checked={residesInRiskArea === true}
                    onChange={() => setResidesInRiskArea(true)}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <span className="font-semibold block text-sm text-amber-300">Sim, moro em área de risco</span>
                    <span className="text-xs opacity-80 mt-0.5 block leading-relaxed">
                      Resido em área sujeira a alagamentos ou cota de inundação no município.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => {
                    setResidesInRiskArea(false);
                    setDeclarationConfirmed(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    !residesInRiskArea
                      ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-200'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="riskArea"
                    checked={residesInRiskArea === false}
                    onChange={() => {
                      setResidesInRiskArea(false);
                      setDeclarationConfirmed(false);
                    }}
                    className="mt-1 accent-cyan-500"
                  />
                  <div>
                    <span className="font-semibold block text-sm text-cyan-300">Não, apenas acompanho</span>
                    <span className="text-xs opacity-80 mt-0.5 block leading-relaxed">
                      Desejo acompanhar dados informativos e notícias sem prioridade de emergência.
                    </span>
                  </div>
                </label>
              </div>

              {/* DECLARAÇÃO OBRIGATÓRIA PARA MORADORES DE ÁREA DE RISCO */}
              {residesInRiskArea && (
                <div className="pt-2 border-t border-slate-700/50">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={declarationConfirmed}
                      onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded accent-amber-500 cursor-pointer shrink-0"
                      required
                    />
                    <span className="text-xs text-amber-200/90 leading-relaxed">
                      <strong>Confirmação Obrigatória:</strong> "Declaro que resido ou possuo interesse direto em uma área sujeita a risco de inundação."
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* PREFERÊNCIAS DE NÍVEL DE ALERTA */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Níveis do Rio para Notificação:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveAttention}
                    onChange={(e) => setReceiveAttention(e.target.checked)}
                    className="accent-amber-400 w-4 h-4 rounded"
                  />
                  <span className="text-amber-300 font-medium">Nível de Atenção</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveAlert}
                    onChange={(e) => setReceiveAlert(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 rounded"
                  />
                  <span className="text-orange-300 font-medium">Nível de Alerta</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveFlood}
                    onChange={(e) => setReceiveFlood(e.target.checked)}
                    className="accent-rose-500 w-4 h-4 rounded"
                  />
                  <span className="text-rose-300 font-medium">Nível de Inundação</span>
                </label>
              </div>
            </div>

            {/* PRIVACY & SUBMIT */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Garantia de Privacidade (LGPD):</strong> Seus dados pessoais não serão expostos publicamente e serão utilizados exclusivamente para comunicações sanitárias e de prevenção de cheias.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <span>Cadastrando...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Cadastrar na Rede de Alertas</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SIDEBAR: CONFIRMAÇÃO DE RECEBIMENTO & INFORMAÇÕES */}
        <div className="space-y-6">
          {/* CONFIRMAR RECEBIMENTO DE ALERTA CARD */}
          <div className="bg-slate-900 border border-cyan-800/40 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar Recebimento</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Recebeu um alerta comunitário via e-mail ou WhatsApp? Confirme aqui o recebimento para ajudar a Defesa Civil a validar a cobertura na sua região.
            </p>

            <form onSubmit={handleConfirmAlert} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Código do Alerta / ID Notificação
                </label>
                <input
                  type="text"
                  value={confirmNotificationId}
                  onChange={(e) => setConfirmNotificationId(e.target.value)}
                  placeholder="Ex: notif-172240..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={confirmStatus === 'loading'}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {confirmStatus === 'loading' ? 'Validando...' : 'Confirmar Recebimento'}
              </button>
            </form>

            {confirmStatus === 'success' && (
              <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs leading-relaxed">
                {confirmMessage}
              </div>
            )}

            {confirmStatus === 'error' && (
              <div className="bg-rose-950/90 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs leading-relaxed">
                {confirmMessage}
              </div>
            )}
          </div>

          {/* DADOS DA CIDADE SELECIONADA CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Info className="w-4 h-4 text-cyan-400" />
              Cotas de Referência em {selectedCityObj.name}
            </h4>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                <span>Nível Normal:</span>
                <span className="font-bold text-emerald-400">{selectedCityObj.normal_level?.toFixed(2) || '2.50'} m</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                <span>Atenção:</span>
                <span className="font-bold text-amber-400">{selectedCityObj.attention_level?.toFixed(2) || '3.00'} m</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                <span>Alerta:</span>
                <span className="font-bold text-orange-400">{selectedCityObj.alert_level?.toFixed(2) || '6.00'} m</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                <span>Inundação:</span>
                <span className="font-bold text-rose-400">{selectedCityObj.flood_level?.toFixed(2) || '8.50'} m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
