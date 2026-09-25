import React, { useRef, useState } from 'react';
import { Mail, MessageCircle, Instagram, Siren, Send, Trash2, Paperclip, CheckCircle2, X, Phone } from 'lucide-react';
import { HOME_FONT, SURFACE_A, SURFACE_B, SECTION_PAD } from './homeTheme';
import { Footer } from './Footer';
import { InfoPopup } from './InfoPopup';

interface ContactPageProps {
  onNavigateToDefesaCivil?: () => void;
}

type ChannelId = 'email' | 'whatsapp' | 'instagram' | 'ajuda';

export const SELECTED_CLIP = 'polygon(14px 0,100% 0,100% 100%,14px 100%,0 50%)';
const EMAIL = 'suporte@fonsetech.com.br';
const WHATSAPP_LABEL = '(51) 99785-4518';
const INSTAGRAM_URL = 'https://www.instagram.com/niveltaquari/';
const WHATSAPP_URL = 'https://wa.me/5551997854518';

const CHANNELS: { id: ChannelId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'email', label: 'E-mail', Icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { id: 'instagram', label: 'Instagram', Icon: Instagram },
  { id: 'ajuda', label: 'Pedir ajuda', Icon: Siren }
];

// Título no padrão do site: barrinha vertical + texto em negrito, fora de cartão
export const SectionTitle: React.FC<{ children: React.ReactNode; sub?: string; bar?: boolean }> = ({ children, sub, bar = true }) => (
  <div className={`flex items-stretch gap-2.5 ${bar ? 'mb-4' : 'mb-9'}`}>
    {bar && <span className="w-px shrink-0 bg-[var(--hm-line)]" />}
    <div className="leading-tight">
      <h2 className="text-[22px] font-extrabold">{children}</h2>
      {sub && <p className="text-[12.5px] text-[var(--hm-muted)] mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const Item: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="flex items-stretch gap-2 mb-3">
      <span className="w-px shrink-0 bg-[var(--hm-line)]" />
      <h3 className="text-[18px] font-extrabold leading-tight">{label.replace(/:$/, '')}</h3>
    </div>
    <p className="text-[16px] leading-[1.65] text-[var(--hm-soft)]">{children}</p>
  </div>
);

const FIELD =
  'w-full px-3.5 py-2.5 rounded-[8px] bg-[var(--hm-a)] border border-[var(--hm-line)] text-[var(--hm-text)] placeholder:text-[var(--hm-muted)] text-[13px] focus:outline-none focus:border-[var(--hm-accent)] transition-colors';
const LABEL = 'block text-[12px] font-semibold text-[var(--hm-muted)] mb-1.5';

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateToDefesaCivil }) => {
  const [channel, setChannel] = useState<ChannelId | null>(null);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearForm = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setAttachedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      clearForm();
      setSent(false);
    }, 4000);
  };

  const takeFile = (file?: File) => {
    if (!file) return;
    if (file.size <= 10 * 1024 * 1024) setAttachedFile(file);
    else alert('O arquivo selecionado excede o limite de 10MB.');
  };

  const openWhatsApp = () => window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');

  // Texto que aparece no painel da esquerda: o canal clicado, ou as informações importantes
  const renderLeft = (channel: ChannelId | null) => {
    switch (channel) {
      case 'email':
        return (
          <>
            <SectionTitle sub="Para site fora do ar e informações inconsistentes">E-mail de suporte</SectionTitle>
            <a href={`mailto:${EMAIL}`} className="text-[15px] font-mono font-bold text-[var(--hm-accent)] hover:underline break-all">{EMAIL}</a>
            <p className="text-[13px] text-[var(--hm-muted)] mt-3">Ou preencha os campos ao lado.</p>
          </>
        );
      case 'whatsapp':
        return (
          <>
            <SectionTitle sub="Canal oficial">WhatsApp</SectionTitle>
            <p className="text-[18px] font-mono font-bold">{WHATSAPP_LABEL}</p>
            <p className="text-[13px] text-[var(--hm-muted)] mt-2">Abra a conversa diretamente no WhatsApp.</p>
            <button type="button" onClick={openWhatsApp} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#2E9E5B] hover:bg-[#278A4F] text-white text-[13px] font-bold cursor-pointer transition-colors">
              <MessageCircle className="w-4 h-4" /> Abrir conversa
            </button>
          </>
        );
      case 'instagram':
        return (
          <>
            <SectionTitle sub="Siga e envie mensagem">Instagram</SectionTitle>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[18px] font-extrabold hover:underline">Nível Taquari</a>
            <p className="text-[14px] font-mono text-[var(--hm-muted)] mt-1">@niveltaquari</p>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#C13584] hover:bg-[#A82C72] text-white text-[13px] font-bold transition-colors">
              <Instagram className="w-4 h-4" /> Abrir Instagram
            </a>
          </>
        );
      case 'ajuda':
        return (
          <>
            <SectionTitle>Precisa de ajuda urgente?</SectionTitle>
            <p className="text-[14px] leading-relaxed text-[var(--hm-soft)]">
              Em situações de emergência ou risco iminente, entre em contato imediatamente com a Defesa Civil do seu município.
            </p>
            <button type="button" onClick={onNavigateToDefesaCivil} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#C63B2F] hover:bg-[#B0342A] text-white text-[13px] font-bold cursor-pointer transition-colors">
              <Phone className="w-4 h-4" /> Defesa Civil
            </button>
          </>
        );
      default:
        return (
          <>
            <SectionTitle bar={false}>Informações importantes</SectionTitle>
            <div className="flex flex-col gap-8">
              <Item label="Tempo de resposta:">Geralmente respondemos em até 24 horas.</Item>
              <Item label="Responsabilidade:">
                Este portal possui caráter exclusivamente informativo e não substitui comunicados, alertas, boletins ou orientações emitidos pelos canais oficiais da Defesa Civil, Prefeituras Municipais e órgãos competentes responsáveis pelo monitoramento hidrológico, meteorológico, gestão de riscos, eventos climáticos e desastres naturais.
              </Item>
              <Item label="Segurança:">Todas as suas informações são tratadas com confidencialidade.</Item>
            </div>
          </>
        );
    }
  };

  return (
    <div className={`${HOME_FONT} flex flex-col lg:grid lg:grid-cols-[minmax(260px,0.62fr)_minmax(0,1.6fr)_150px] lg:h-[calc(100vh-56px)] lg:overflow-hidden text-[var(--hm-text)]`}>
      {/* DIREITA: CANAIS DE SUPORTE (no celular vira uma fileira no topo) */}
      <aside className="order-1 lg:order-3 lg:h-full min-h-0 flex flex-col bg-[var(--hm-side)]">
        <div className="hidden lg:block sticky top-0 z-10 shrink-0 pt-3.5 pb-0 px-2 text-center leading-[1.1] bg-[var(--hm-side)] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
          <div className="text-[11px] font-light whitespace-nowrap">Canais de</div>
          <div className="text-xl font-extrabold whitespace-nowrap">Suporte</div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-4 bg-gradient-to-b from-[var(--hm-side)] to-transparent" />
        </div>
        <div aria-hidden className="hidden lg:block shrink-0 h-3" />
        <nav aria-label="Canais de suporte" className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto no-scrollbar">
          {CHANNELS.map(({ id, label, Icon }) => {
            const on = channel === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => setChannel(on ? null : id)}
                style={on ? { clipPath: SELECTED_CLIP, backgroundColor: 'var(--hm-sel-bg)', color: 'var(--hm-sel-text)' } : undefined}
                className={`shrink-0 lg:h-[84px] h-[72px] px-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer flex-1 lg:flex-none ${
                  on ? 'lg:pl-5' : 'text-[var(--hm-text)] hover:bg-[var(--hm-hover)]'
                }`}
              >
                <Icon className="w-7 h-7 shrink-0" />
                <span className="text-[11px] font-extrabold whitespace-nowrap leading-none">{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* CENTRO: ENVIE SUA MENSAGEM */}
      <div data-main-scroll className="order-2 min-w-0 lg:h-full lg:overflow-y-auto no-scrollbar bg-[var(--hm-a)]">
        {/* Cabeçalho da página, igual ao da Início: ícone | título grande */}
        <div className={`${SURFACE_B} flex items-center gap-5 sm:gap-7 py-5 sm:py-[26px] px-5 sm:px-9`}>
          <span aria-hidden="true" className="w-px h-12 bg-[var(--hm-line)] shrink-0" />
          <div className="min-w-0">
            <h1 className="m-0 text-[32px] sm:text-[50px] font-black tracking-[-0.03em] leading-[1.15] truncate">Contato</h1>
            <p className="m-0 text-[13px] sm:text-[15px] text-[var(--hm-muted)] -mt-1">Envie suas dúvidas, sugestões ou comunicados oficiais.</p>
          </div>
        </div>

        <section className={`${SURFACE_B} ${SECTION_PAD} pt-8 sm:pt-10 pb-10 sm:pb-12`}>
          <div className="max-w-[720px]">
          <SectionTitle>Envie sua mensagem</SectionTitle>

          {sent ? (
            <div className="flex items-start gap-3 py-6">
              <CheckCircle2 className="w-8 h-8 text-[#2E9E5B] shrink-0" />
              <div>
                <h3 className="text-base font-extrabold">Mensagem enviada com sucesso!</h3>
                <p className="text-[13px] text-[var(--hm-soft)] mt-1">Agradecemos o seu contato. Sua mensagem e anexos foram encaminhados à equipe técnica do Centro de Monitoramento.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Nome completo</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite seu nome completo" className={FIELD} required />
                </div>
                <div>
                  <label className={LABEL}>E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={FIELD} required />
                </div>
              </div>

              <div>
                <label className={LABEL}>Assunto</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className={`${FIELD} cursor-pointer`} required>
                  <option value="" disabled>Selecione o assunto</option>
                  <option value="Informações Inconsistentes">Informações inconsistentes no portal</option>
                  <option value="Site fora do ar">Site fora do ar ou erro técnico</option>
                  <option value="Dúvidas sobre Nível do Rio">Dúvidas sobre o nível do rio / cotas</option>
                  <option value="Comunicado Oficial">Comunicado oficial de Defesa Civil / Prefeitura</option>
                  <option value="Sugestões">Sugestões e melhorias</option>
                  <option value="Outros">Outros assuntos</option>
                </select>
              </div>

              <div>
                <label className={LABEL}>Mensagem</label>
                <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva sua dúvida, sugestão ou informe o que precisa de suporte..." className={`${FIELD} resize-y`} required />
              </div>

              <div>
                <label className={LABEL}>Anexos (opcional)</label>
                <input type="file" ref={fileInputRef} onChange={(e) => takeFile(e.target.files?.[0])} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                {attachedFile ? (
                  <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-[8px] bg-[var(--hm-a)] border border-[var(--hm-line)]">
                    <span className="flex items-center gap-2 min-w-0 text-[13px]">
                      <Paperclip className="w-4 h-4 shrink-0 text-[var(--hm-accent)]" />
                      <span className="truncate font-semibold">{attachedFile.name}</span>
                      <span className="shrink-0 text-[11px] text-[var(--hm-muted)] font-mono">({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </span>
                    <button type="button" onClick={() => setAttachedFile(null)} title="Remover anexo" className="p-1 text-[var(--hm-muted)] hover:text-[#C63B2F] cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); takeFile(e.dataTransfer.files?.[0]); }}
                    className={`rounded-[8px] border border-dashed px-4 py-5 text-center cursor-pointer transition-colors ${isDragging ? 'border-[var(--hm-accent)] bg-[var(--hm-hover)]' : 'border-[var(--hm-line)] hover:bg-[var(--hm-hover)]'}`}
                  >
                    <Paperclip className="w-5 h-5 mx-auto mb-1.5 text-[var(--hm-muted)]" />
                    <p className="text-[13px] font-semibold">Arraste arquivos aqui ou clique para selecionar</p>
                    <p className="text-[11px] text-[var(--hm-muted)] mt-0.5">PDF, DOC, DOCX, PNG, JPG (máx. 10MB)</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#2F6FA3] hover:bg-[#28608F] text-white text-[13px] font-bold cursor-pointer transition-colors">
                  <Send className="w-3.5 h-3.5" /> Enviar mensagem
                </button>
                <button type="button" onClick={clearForm} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-[var(--hm-line)] text-[13px] font-semibold text-[var(--hm-soft)] hover:bg-[var(--hm-hover)] cursor-pointer transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Limpar
                </button>
              </div>
            </form>
          )}
          </div>
        </section>

        <Footer className="hidden lg:block" />
      </div>

      {/* ESQUERDA (onde fica o mapa no Início): informações importantes ou o canal clicado */}
      <section
        className="order-3 lg:order-1 relative lg:h-full min-h-[320px] overflow-hidden bg-[var(--map-bg)] text-[var(--map-text)]"
        style={{ '--hm-text': 'var(--map-text)', '--hm-soft': 'var(--map-soft)', '--hm-muted': 'var(--map-muted)', '--hm-accent': 'var(--map-edge)' } as React.CSSProperties}
      >
        <div className="h-full overflow-y-auto no-scrollbar px-7 pt-9 pb-12">
          {/* Celular: o painel mostra sempre o conteúdo inicial; o canal escolhido abre em pop-up */}
          <div className="lg:hidden">{renderLeft(null)}</div>
          <div className="hidden lg:block">{renderLeft(channel)}</div>
        </div>
        <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-[var(--map-faint)] pointer-events-none">© {new Date().getFullYear()} Nível Taquari. Todos os direitos reservados.</div>
      </section>

      <InfoPopup open={channel !== null} onClose={() => setChannel(null)} label="Detalhes do canal">
        {renderLeft(channel)}
      </InfoPopup>
    </div>
  );
};
