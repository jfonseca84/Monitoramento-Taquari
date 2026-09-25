import React, { useState } from 'react';
import { Cpu, Database, Shield, User } from 'lucide-react';
import { HOME_FONT, SURFACE_B, SECTION_PAD } from './homeTheme';
import { Footer } from './Footer';
import { InfoPopup } from './InfoPopup';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SectionTitle, Item, SELECTED_CLIP } from './ContactPage';

// Nunca exibir nomes de serviços de hospedagem/banco de dados, mesmo que estejam salvos nos textos do painel admin
const hideInfra = (t: string) => t.replace(/\s*supabase\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim();

type FeatureId = 'sensores' | 'sincronizacao' | 'alertas' | 'autor';

// Detalhes exibidos ao clicar em "Sensores": o que são as estações do SGB/ANA e como o site obtém os dados
// Detalhes exibidos ao clicar em "Sincronização": como operamos, com ênfase na disponibilidade dos dados
const SYNC_DETAILS: { label: string; text: string }[] = [
  {
    label: 'Ciclo de coleta',
    text: 'A cada 5 minutos o coletor consulta as fontes oficiais, confere cada leitura e guarda o resultado. A previsão do tempo é renovada a cada 30 minutos.'
  },
  {
    label: 'Mais de uma fonte',
    text: 'Três fontes são consultadas ao mesmo tempo: os boletins do SACE/SGB, a rede do Guaíba e a telemetria da ANA. Se uma delas ficar fora do ar, as outras seguem alimentando o site, e a consulta tenta de novo em caso de falha momentânea.'
  },
  {
    label: 'Disponibilidade dos dados',
    text: 'O painel continua respondendo mesmo durante uma nova coleta, e as informações são renovadas em segundo plano. Assim, ele abre rápido e não fica em branco quando uma fonte oscila. Se uma estação não envia dados novos, a última leitura confirmada continua disponível.'
  },
  {
    label: 'Histórico auditável',
    text: 'Cada leitura é gravada com data, hora e fonte, sem duplicar valores repetidos. Isso alimenta os gráficos de 24 horas a 7 dias e o histórico de cheias.'
  },
  {
    label: 'Monitoramento da operação',
    text: 'O próprio sistema acompanha o frescor de cada estação e sinaliza as que passam de 60 minutos sem dado novo. Uma verificação automática avisa quando a coleta fica parada por mais de 30 minutos.'
  }
];

// Texto do centro da página Sobre. Cada bloco: p (parágrafo), ul (lista), q (destaque em negrito)
type Block = { p: string } | { ul: string[] } | { q: string };
interface Section { title: string; blocks: Block[]; subs?: { label: string; blocks: Block[] }[] }

const SECTIONS: Section[] = [
  {
    title: 'Como funciona',
    blocks: [
      { p: 'O **Nível Taquari** reúne, organiza e apresenta dados de monitoramento hidrológico para facilitar o acompanhamento dos rios da Bacia do Taquari-Antas. A plataforma consulta periodicamente informações disponibilizadas por estações oficiais do **Serviço Geológico do Brasil (SGB)** e da **Agência Nacional de Águas e Saneamento Básico (ANA)**, processando, verificando e armazenando esses dados para transformá-los em informações mais claras e acessíveis. O sistema funciona de forma automatizada, realizando novas coletas em ciclos de aproximadamente cinco minutos e mantendo a plataforma atualizada com a informação mais recente disponível, sem depender de uma atualização manual do navegador. A partir dessas leituras, o usuário pode acompanhar o nível atual do rio, o horário da última medição, sua tendência de subida ou descida, as cotas de atenção, alerta e inundação quando disponibilizadas pelas fontes oficiais, além do histórico das variações e de informações relacionadas às chuvas na bacia. Dessa forma, o projeto procura reunir em um único ambiente informações que normalmente estão distribuídas entre diferentes estações, sistemas e plataformas, oferecendo uma visão regional mais organizada sobre o comportamento dos rios.' },
      { p: 'O Nível Taquari é uma **ferramenta complementar de acompanhamento** e não substitui os canais oficiais da Defesa Civil, do SGB, da ANA, das prefeituras ou de outros órgãos responsáveis pelo monitoramento, pela comunicação de riscos e pela emissão de alertas. Seu propósito é aproximar os dados oficiais da população, facilitando o acesso e a compreensão das informações sem interferir nas atribuições dos órgãos responsáveis pela gestão de emergências.' }
    ]
  },
  {
    title: 'Por que o projeto existe',
    blocks: [
      { p: 'O **Vale do Taquari conhece de forma muito concreta o impacto que uma enchente pode causar**. As grandes cheias que atingiram a região deixaram marcas profundas em famílias, propriedades rurais, empresas, escolas e comunidades inteiras, muitas das quais precisaram reconstruir suas vidas depois de perder casas, plantações, equipamentos, documentos e meios de sustento. Em situações como essas, ter acesso à informação no momento adequado pode fazer diferença, especialmente quando é possível acompanhar não apenas o nível atual de um rio, mas também sua evolução ao longo das horas, sua velocidade de elevação ou redução e o comportamento observado em diferentes pontos da bacia.' },
      { p: 'Os dados hidrológicos existem e são produzidos por sistemas oficiais, mas muitas vezes estão distribuídos entre diferentes plataformas, estações e ferramentas técnicas. Para quem não trabalha diretamente com esse tipo de informação, transformar uma sequência de números em uma compreensão real do que está acontecendo pode ser uma tarefa difícil. Foi a partir dessa necessidade que surgiu o **Nível Taquari**, com a proposta de reunir dados oficiais, organizar essas informações e apresentá-las de maneira clara, permitindo que moradores e comunidades tenham uma referência regional para acompanhar o comportamento dos rios.' },
      { p: 'Mais do que apresentar uma medição isolada, o projeto procura construir uma visão contínua da bacia. Acompanhar um rio significa observar sua evolução, comparar diferentes momentos, compreender suas variações e perceber como as condições mudam ao longo do tempo. Por isso, o Nível Taquari foi pensado como uma plataforma de acompanhamento permanente, capaz de aproximar o dado técnico da realidade cotidiana das pessoas que vivem, trabalham e mantêm suas atividades na região.' },
      { p: 'A proposta não é substituir os sistemas oficiais, produzir alertas independentes ou assumir o papel das autoridades responsáveis pela resposta a situações de emergência. O objetivo é **criar uma ponte entre os dados e a população**, utilizando tecnologia para tornar informações importantes mais acessíveis, organizadas e fáceis de acompanhar.' }
    ]
  },
  {
    title: 'Mais do que acompanhar um número',
    blocks: [
      { p: 'O **Nível Taquari** não foi criado apenas para informar quantos metros o rio está, mas para transformar esse dado em uma informação que possa ser realmente compreendida por quem acompanha a realidade da bacia. Um nível isolado representa apenas um momento, enquanto a evolução desse nível ao longo das horas, sua velocidade de subida ou descida, o comportamento observado em diferentes pontos do rio, os registros históricos e as condições de chuva ajudam a formar um quadro muito mais completo da situação. Por isso, o projeto reúne diferentes informações em uma única plataforma, permitindo acompanhar a dinâmica dos rios ao longo do tempo e compreender melhor as mudanças que acontecem na Bacia do Taquari-Antas. A proposta é construir uma ferramenta regional de acompanhamento permanente, baseada em dados oficiais, transparência e tecnologia, aproximando informações que muitas vezes estão dispersas dos moradores, comunidades, empresas, instituições e de todas as pessoas que vivem e dependem dos rios da região.' }
    ]
  }
];

// Converte **texto** em negrito
const withBold = (t: string) =>
  t.split('**').map((part, j) => (j % 2 === 1 ? <strong key={j} className="font-extrabold text-[var(--hm-text)]">{part}</strong> : part));

const renderBlocks = (blocks: Block[]) =>
  blocks.map((b, i) => {
    if ('ul' in b) {
      return (
        <ul key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {b.ul.map((li) => (
            <li key={li} className="flex items-stretch gap-3 rounded-[8px] bg-[var(--hm-a)] px-3 py-3.5">
              <span aria-hidden="true" className="w-px shrink-0 bg-[var(--hm-muted)]" />
              <span className="min-w-0 text-[14px] font-semibold leading-snug break-words">{li.replace(/[;.]$/, '').replace(/^./, (c) => c.toUpperCase())}</span>
            </li>
          ))}
        </ul>
      );
    }
    if ('q' in b) return <p key={i} className="text-[17px] leading-[1.65] font-extrabold">{b.q}</p>;
    return (
      <p key={i} className="text-[16px] leading-[1.75] text-[var(--hm-soft)]">
        {b.p.split('**').map((part, j) => (j % 2 === 1 ? <strong key={j} className="font-extrabold text-[var(--hm-text)]">{part}</strong> : part))}
      </p>
    );
  });

const SLOGAN = 'Tecnologia, Inteligência e Informação para salvar vidas no Vale.';
const TAGLINES = ['O Vale bem informado', SLOGAN];

const MVV: { label: string; text: string }[] = [
  {
    label: 'Missão',
    text: 'Levar a todos no Vale informação clara, atual e confiável sobre o nível dos rios, usando tecnologia e inteligência para ajudar a proteger vidas.'
  },
  {
    label: 'Visão',
    text: 'Ser a referência de informação sobre os rios do Vale e um parceiro de confiança das comunidades e dos órgãos governamentais na prevenção e na resposta às cheias.'
  }
];

// Ao clicar em "Quem mantém": texto exibido no painel da esquerda
const AUTHOR_TITLE = 'Quem mantém o projeto';
const AUTHOR_PARAGRAPHS = [
  'O **Nível Taquari** é um projeto independente idealizado, desenvolvido e mantido por **João Fonseca**, profissional de Tecnologia da Informação com mais de 15 anos de experiência e responsável pela arquitetura, desenvolvimento, manutenção e evolução da plataforma.',
  'Em 2024, João fundou a **Fonsetech**, empresa de suporte e soluções em Tecnologia da Informação, com atuação em suporte técnico, infraestrutura, redes, desenvolvimento e atendimento a empresas e profissionais.',
  'João também atua como **Instrutor de Informática na SLAN, em Lajeado**, onde trabalha diretamente com crianças e adolescentes em atividades relacionadas à tecnologia, educação e inclusão digital. Essa combinação entre experiência profissional em TI e educação aproxima o projeto de diferentes realidades e ajuda a manter sua proposta voltada não apenas à tecnologia, mas principalmente às pessoas que precisam compreender e acompanhar as informações produzidas pelo sistema.'
];

// Ao clicar em "Alertas": posição do projeto (definida por nós, não vem do painel admin)
const ALERT_TITLE = 'Alertas';
const ALERT_TEXT = 'Estamos trabalhando em maneiras de colaborar com órgãos governamentais e de disponibilizar à população um sistema de alerta seguro e responsável.';

const SENSOR_DETAILS: { label: string; text: string }[] = [
  {
    label: 'Estações do SGB e da ANA',
    text: 'O Serviço Geológico do Brasil (SGB) opera, pelo SACE, estações telemétricas ao longo da bacia do Taquari-Antas, e a Agência Nacional de Águas (ANA) mantém a rede telemétrica nacional. As estações ficam às margens dos rios e funcionam sozinhas, 24 horas por dia.'
  },
  {
    label: 'O que cada estação mede',
    text: 'O nível do rio, em metros, por um sensor instalado sobre a calha (radar ou pressão, conforme a estação), e a chuva, por um pluviômetro. Os valores são enviados automaticamente por transmissão remota a uma central de dados.'
  },
  {
    label: 'Como nosso site obtém as informações',
    text: 'A cada 5 minutos, nosso coletor consulta as fontes públicas: os boletins do SACE/SGB e a telemetria da ANA, que renova as leituras a cada 15 minutos. Os valores são conferidos, gravados no nosso banco de dados e exibidos aqui, com o histórico de cada leitura.'
  },
  {
    label: 'Limites',
    text: 'O Nível Taquari não mede o rio: repete dados oficiais. Podem ocorrer atrasos ou falhas de sensor. Em caso de risco, siga sempre as orientações da Defesa Civil.'
  }
];

// Página Sobre no formato de três colunas da Início: destaques técnicos à esquerda, texto no centro, ícones à direita
export const AboutPage: React.FC = () => {
  const { settings } = useSiteSettings();
  const [feature, setFeature] = useState<FeatureId | null>(null);

  const features: { id: FeatureId; short: string; title: string; text: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'sensores',
      short: 'Sensores',
      title: hideInfra(settings.about_feature1_title || '') || 'Sensores de Precisão Radar',
      text: hideInfra(settings.about_feature1_text || '') || 'Medição sem contato físico por micro-ondas com margem de erro de ±1cm e amostragem contínua.',
      Icon: Cpu
    },
    {
      id: 'sincronizacao',
      short: 'Sincronização',
      title: hideInfra(settings.about_feature2_title || '') || 'Sincronização Contínua',
      text: hideInfra(settings.about_feature2_text || '') || 'Coleta automática com tolerância a falhas, resposta rápida e histórico auditável.',
      Icon: Database
    },
    {
      id: 'alertas',
      short: 'Alertas',
      title: hideInfra(settings.about_feature3_title || '') || 'Alertas Automatizados',
      text: hideInfra(settings.about_feature3_text || '') || 'Emissão direta para prefeituras e órgãos de segurança comunitária assim que o nível atinge a cota de atenção.',
      Icon: Shield
    },
    {
      id: 'autor',
      short: 'Quem mantém',
      title: AUTHOR_TITLE,
      text: '',
      Icon: User
    }
  ];
  const current = features.find((f) => f.id === feature) || null;

  const renderLeft = (current: (typeof features)[number] | null) => (
    <>
          {current ? (
            <>
              <SectionTitle>{current.id === 'alertas' ? ALERT_TITLE : current.title}</SectionTitle>
              {current.id === 'autor' ? (
                <div className="flex flex-col gap-4">
                  {AUTHOR_PARAGRAPHS.map((t) => (
                    <p key={t} className="text-[16px] leading-[1.7] text-[var(--hm-soft)]">{withBold(t)}</p>
                  ))}
                </div>
              ) : current.id === 'alertas' ? (
                <p className="text-[18px] leading-[1.6] text-[var(--hm-soft)]">{ALERT_TEXT}</p>
              ) : (
                <p className="text-[16px] leading-[1.65] text-[var(--hm-soft)] whitespace-pre-line">{current.text}</p>
              )}
              {(current.id === 'sensores' || current.id === 'sincronizacao') && (
                <div className="flex flex-col gap-8 mt-9">
                  {(current.id === 'sensores' ? SENSOR_DETAILS : SYNC_DETAILS).map((d) => (
                    <Item key={d.label} label={d.label}>{d.text}</Item>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-10">
              <h2 className="m-0 text-[clamp(26px,2.6vw,34px)] font-black tracking-[-0.02em] leading-tight">O Vale bem informado</h2>
              {MVV.map((m) => (
                <div key={m.label}>
                  <SectionTitle>{m.label}</SectionTitle>
                  <p className="text-[16px] leading-[1.65] text-[var(--hm-soft)]">{m.text}</p>
                </div>
              ))}
              <div>
                <SectionTitle>Valores</SectionTitle>
                <p className="text-[16px] leading-[1.65] text-[var(--hm-soft)]">
                  Os nossos valores estão baseados em <strong className="font-extrabold text-[var(--hm-text)]">Responsabilidade</strong>, <strong className="font-extrabold text-[var(--hm-text)]">Transparência</strong>, <strong className="font-extrabold text-[var(--hm-text)]">Segurança</strong> e <strong className="font-extrabold text-[var(--hm-text)]">Colaboração</strong>.
                </p>
              </div>
            </div>
          )}
    </>
  );

  return (
    <div className={`hm-light ${HOME_FONT} flex flex-col lg:grid lg:grid-cols-[minmax(260px,0.62fr)_minmax(0,1.6fr)_150px] lg:h-[calc(100vh-56px)] lg:overflow-hidden text-[var(--hm-text)]`}>
      {/* DIREITA: DESTAQUES (no celular vira uma fileira no topo) */}
      <aside className="order-1 lg:order-3 lg:h-full min-h-0 flex flex-col bg-[var(--hm-side)]">
        <div className="hidden lg:block sticky top-0 z-10 shrink-0 pt-3.5 pb-0 px-2 text-center leading-[1.1] bg-[var(--hm-side)] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
          <div className="text-[11px] font-light whitespace-nowrap">Destaques do</div>
          <div className="text-xl font-extrabold whitespace-nowrap">Portal</div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-4 bg-gradient-to-b from-[var(--hm-side)] to-transparent" />
        </div>
        <div aria-hidden className="hidden lg:block shrink-0 h-3" />
        <nav aria-label="Destaques do portal" className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto no-scrollbar">
          {features.map(({ id, short, Icon }) => {
            const on = feature === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => setFeature(on ? null : id)}
                style={on ? { clipPath: SELECTED_CLIP, backgroundColor: 'var(--hm-sel-bg)', color: 'var(--hm-sel-text)' } : undefined}
                className={`shrink-0 lg:h-[84px] h-[72px] px-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer flex-1 lg:flex-none ${
                  on ? 'lg:pl-5' : 'text-[var(--hm-text)] hover:bg-[var(--hm-hover)]'
                }`}
              >
                <Icon className="w-7 h-7 shrink-0" />
                <span className="text-[11px] font-extrabold whitespace-nowrap leading-none">{short}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* CENTRO: TEXTO SOBRE O PORTAL */}
      <div data-main-scroll onClick={() => setFeature(null)} className="order-2 min-w-0 lg:h-full lg:overflow-y-auto no-scrollbar bg-[var(--hm-a)]">
        <div className={`${SURFACE_B} flex items-center gap-5 sm:gap-7 py-5 sm:py-[26px] px-5 sm:px-9`}>
          <span aria-hidden="true" className="w-px h-12 bg-[var(--hm-line)] shrink-0" />
          <div className="min-w-0">
            <h1 className="m-0 text-[32px] sm:text-[50px] font-black tracking-[-0.03em] leading-[1.15] truncate">Sobre</h1>
            <p className="m-0 text-[13px] sm:text-[15px] text-[var(--hm-muted)] -mt-1">{SLOGAN}</p>
          </div>
        </div>

        <section className={`${SURFACE_B} ${SECTION_PAD} pt-8 sm:pt-10 pb-12 sm:pb-14`}>
          <div className="max-w-[720px] flex flex-col gap-12">
            {SECTIONS.map((sec) => (
              <div key={sec.title}>
                <SectionTitle>{sec.title}</SectionTitle>
                <div className="flex flex-col gap-4">{renderBlocks(sec.blocks)}</div>
                {sec.subs && (
                  <div className="flex flex-col gap-8">
                    {sec.subs.map((sub) => (
                      <div key={sub.label}>
                        <div className="flex items-stretch gap-2 mb-3">
                          <span className="w-px shrink-0 bg-[var(--hm-line)]" />
                          <h3 className="text-[18px] font-extrabold leading-tight">{sub.label}</h3>
                        </div>
                        <div className="flex flex-col gap-3">{renderBlocks(sub.blocks)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Fecha com as duas frases de efeito do projeto */}
            <div className="flex flex-col gap-5 pt-2">
              {TAGLINES.map((t) => (
                <div key={t} className="flex items-stretch gap-4">
                  <span aria-hidden="true" className="w-px shrink-0 bg-[var(--hm-line)]" />
                  <p className="m-0 text-[clamp(22px,3.2cqw,34px)] font-black tracking-[-0.02em] leading-tight">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer className="hidden lg:block" />
      </div>

      {/* ESQUERDA (onde fica o mapa no Início): destaques técnicos ou o destaque clicado */}
      <section
        className="order-3 lg:order-1 relative lg:h-full min-h-[320px] overflow-hidden bg-[var(--map-bg)] text-[var(--map-text)]"
        style={{ '--hm-text': 'var(--map-text)', '--hm-soft': 'var(--map-soft)', '--hm-muted': 'var(--map-muted)', '--hm-accent': 'var(--map-edge)' } as React.CSSProperties}
      >
        <div className="h-full overflow-y-auto no-scrollbar px-7 pt-9 pb-12">
          {/* Celular: o painel mostra sempre o conteúdo inicial; o destaque escolhido abre em pop-up */}
          <div className="lg:hidden">{renderLeft(null)}</div>
          <div className="hidden lg:block">{renderLeft(current)}</div>
        </div>
        <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-[var(--map-faint)] pointer-events-none">© {new Date().getFullYear()} Nível Taquari. Todos os direitos reservados.</div>
      </section>

      <InfoPopup open={!!current} onClose={() => setFeature(null)} label={current?.title || 'Detalhes'}>
        {renderLeft(current)}
      </InfoPopup>
    </div>
  );
};
