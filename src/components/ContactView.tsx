import React, { useState, useRef } from 'react';
import { 
  Shield, 
  Mail, 
  User, 
  Send, 
  Trash2, 
  Lock, 
  MessageSquare, 
  Clock, 
  Info, 
  Paperclip, 
  CheckCircle2, 
  Phone,
  Siren,
  X
} from 'lucide-react';

interface ContactViewProps {
  onNavigateToDefesaCivil?: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onNavigateToDefesaCivil }) => {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setAttachedFile(null);
      setSent(false);
    }, 4000);
  };

  const handleClear = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setAttachedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size <= 10 * 1024 * 1024) {
        setAttachedFile(file);
      } else {
        alert('O arquivo selecionado excede o limite de 10MB.');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size <= 10 * 1024 * 1024) {
        setAttachedFile(file);
      } else {
        alert('O arquivo selecionado excede o limite de 10MB.');
      }
    }
  };

  const openWhatsApp = () => {
    const primaryUrl = 'https://wa.me/5551997854518';
    const fallbackUrl = 'https://api.whatsapp.com/send?phone=5551997854518';
    try {
      window.open(primaryUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800/80 border-slate-200 border rounded-3xl p-6 shadow-2xl transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-blue-500 shadow-lg shadow-blue-950/40 shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">
              Contato e Suporte Técnico
            </h2>
            <p className="text-sm dark:text-slate-400 text-slate-600 mt-1">
              Envie suas dúvidas, sugestões ou comunicados oficiais.
            </p>
          </div>
        </div>
      </div>

      {/* TWO COLUMN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTACT FORM */}
        <div className="lg:col-span-7 xl:col-span-8 dark:bg-[#0F172A]/90 bg-white dark:border-slate-800/80 border-slate-200 border rounded-3xl p-6 md:p-8 shadow-2xl transition-colors flex flex-col justify-between">
          
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <Mail className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h3 className="text-base font-bold dark:text-blue-400 text-blue-700 uppercase tracking-wide">
                Envie sua mensagem
              </h3>
            </div>

            {sent ? (
              <div className="dark:bg-emerald-950/80 bg-emerald-50 dark:border-emerald-800 border-emerald-300 border p-8 rounded-2xl text-center space-y-3 my-6 animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold dark:text-white text-slate-900">Mensagem Enviada com Sucesso!</h4>
                <p className="text-xs dark:text-emerald-300 text-emerald-800 leading-relaxed max-w-md mx-auto">
                  Agradecemos o seu contato. Sua mensagem e anexos foram encaminhados à equipe técnica do Centro de Monitoramento.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs md:text-sm">
                
                {/* NAME & EMAIL GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5 text-xs">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Digite seu nome completo"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-slate-900/90 bg-slate-50 dark:border-slate-700/80 border-slate-300 border dark:text-white text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5 text-xs">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-slate-900/90 bg-slate-50 dark:border-slate-700/80 border-slate-300 border dark:text-white text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SUBJECT SELECT */}
                <div>
                  <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5 text-xs">
                    Assunto
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl dark:bg-slate-900/90 bg-slate-50 dark:border-slate-700/80 border-slate-300 border dark:text-white text-slate-900 text-xs focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    required
                  >
                    <option value="" disabled className="dark:bg-slate-900 bg-white text-slate-500">
                      Selecione o assunto
                    </option>
                    <option value="Informações Inconsistentes" className="dark:bg-slate-900 bg-white">
                      Informações Inconsistentes no Portal
                    </option>
                    <option value="Site fora do ar" className="dark:bg-slate-900 bg-white">
                      Site fora do ar ou Erro Técnico
                    </option>
                    <option value="Dúvidas sobre Nível do Rio" className="dark:bg-slate-900 bg-white">
                      Dúvidas sobre o Nível do Rio / Cotas
                    </option>
                    <option value="Comunicado Oficial" className="dark:bg-slate-900 bg-white">
                      Comunicado Oficial de Defesa Civil / Prefeitura
                    </option>
                    <option value="Sugestões" className="dark:bg-slate-900 bg-white">
                      Sugestões e Melhorias
                    </option>
                    <option value="Outros" className="dark:bg-slate-900 bg-white">
                      Outros Assuntos
                    </option>
                  </select>
                </div>

                {/* MESSAGE TEXTAREA */}
                <div>
                  <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5 text-xs">
                    Mensagem
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva sua dúvida, sugestão ou informe o que precisa de suporte..."
                    className="w-full px-3.5 py-2.5 rounded-xl dark:bg-slate-900/90 bg-slate-50 dark:border-slate-700/80 border-slate-300 border dark:text-white text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-y"
                    required
                  />
                </div>

                {/* ATTACHMENTS DROPZONE */}
                <div>
                  <label className="block dark:text-slate-300 text-slate-700 font-medium mb-1.5 text-xs">
                    Anexos (opcional)
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                  />

                  {attachedFile ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl dark:bg-slate-900/90 bg-slate-100 dark:border-slate-700 border-slate-300 border">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Paperclip className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-xs dark:text-slate-200 text-slate-800 font-medium truncate">
                          {attachedFile.name}
                        </span>
                        <span className="text-[10px] dark:text-slate-400 text-slate-500 font-mono shrink-0">
                          ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Remover anexo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'dark:border-slate-700/80 border-slate-300 dark:bg-slate-900/40 bg-slate-50/50 hover:border-blue-500/80 hover:bg-blue-500/5'
                      }`}
                    >
                      <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-medium dark:text-slate-300 text-slate-700">
                        Arraste arquivos aqui ou clique para selecionar
                      </p>
                      <p className="text-[11px] dark:text-slate-500 text-slate-500 mt-1">
                        Formatos aceitos: PDF, DOC, DOCX, PNG, JPG (Máx. 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* BUTTONS */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-900/30 text-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Mensagem</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-2 dark:bg-slate-800/80 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-700 border dark:border-slate-700 border-slate-300 font-medium px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                </div>

              </form>
            )}
          </div>

          {/* SECURITY NOTE */}
          <div className="flex items-center gap-2 pt-6 mt-6 dark:border-slate-800/80 border-slate-200 border-t text-[11px] dark:text-slate-400 text-slate-500">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Suas informações estão seguras. Utilizamos os mais altos padrões de segurança.</span>
          </div>

        </div>

        {/* RIGHT COLUMN: SUPPORT CHANNELS & IMPORTANT INFO */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* CANAIS DE SUPORTE CARD */}
          <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800/80 border-slate-200 border rounded-3xl p-6 shadow-2xl transition-colors space-y-5">
            
            <div className="flex items-center gap-2.5 pb-2 dark:border-slate-800/80 border-slate-100 border-b">
              <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h3 className="text-base font-bold dark:text-white text-slate-900 tracking-tight">
                Canais de Suporte
              </h3>
            </div>

            {/* EMAIL SECTION */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold dark:text-white text-slate-900">
                  E-mail de Suporte do Projeto
                </h4>
                <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-tight">
                  para site fora do ar e informações inconsistentes:
                </p>
                <a 
                  href="mailto:suporte@fonsetech.com.br"
                  className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline block pt-0.5"
                >
                  suporte@fonsetech.com.br
                </a>
                <p className="text-[10px] dark:text-slate-500 text-slate-500 pt-0.5">
                  ou preencha os campos nesse site
                </p>
              </div>
            </div>

            {/* WHATSAPP SECTION */}
            <div 
              onClick={openWhatsApp}
              className="flex items-start gap-3.5 p-3 rounded-2xl dark:bg-emerald-950/20 bg-emerald-50/60 dark:border-emerald-800/50 border-emerald-200 border hover:border-emerald-500 transition-all cursor-pointer group"
            >
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5 fill-emerald-500/20" />
              </div>
              <div>
                <h4 className="text-xs font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                  <span>WhatsApp</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono">OFICIAL</span>
                </h4>
                <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  (51) 99785-4518
                </p>
                <p className="text-[10px] dark:text-emerald-300 text-emerald-700 mt-1 font-medium">
                  Clique aqui para abrir a conversa diretamente no WhatsApp
                </p>
              </div>
            </div>

          </div>

          {/* INFORMAÇÕES IMPORTANTES CARD */}
          <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800/80 border-slate-200 border rounded-3xl p-6 shadow-2xl transition-colors space-y-4">
            
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-bold text-sm pb-1 border-b dark:border-slate-800 border-slate-100">
              <Info className="w-4 h-4" />
              <span>Informações importantes</span>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* RESPONSE TIME */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="dark:text-slate-300 text-slate-700 leading-relaxed">
                  <strong className="dark:text-white text-slate-900">Tempo de resposta:</strong>{' '}
                  Geralmente respondemos em até 24 horas.
                </div>
              </div>

              {/* RESPONSIBILITY */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="dark:text-slate-300 text-slate-700 leading-relaxed">
                  <strong className="dark:text-white text-slate-900">Responsabilidade:</strong>{' '}
                  Este portal possui caráter exclusivamente informativo e não substitui comunicados, alertas, boletins ou orientações emitidos pelos canais oficiais da Defesa Civil, Prefeituras Municipais e órgãos competentes responsáveis pelo monitoramento hidrológico, meteorológico, gestão de riscos, eventos climáticos e desastres naturais.
                </div>
              </div>

              {/* SECURITY */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="dark:text-slate-300 text-slate-700 leading-relaxed">
                  <strong className="dark:text-white text-slate-900">Segurança:</strong>{' '}
                  Todas as suas informações são tratadas com confidencialidade.
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* BOTTOM EMERGENCY BANNER */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800/80 border-slate-200 border rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-500 shadow-lg shadow-red-950/40 shrink-0">
            <Siren className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold dark:text-white text-slate-900">
              Precisa de ajuda urgente?
            </h3>
            <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
              Em situações de emergência ou risco iminente, entre em contato imediatamente com a Defesa Civil do seu município.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToDefesaCivil}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2.5 text-xs transition-all shrink-0 cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>Defesa Civil</span>
        </button>
      </div>

    </div>
  );
};
