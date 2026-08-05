import { CotaAnalise, CotaAttachment } from '../types';

export const INITIAL_COTAS_ANALISE: CotaAnalise[] = [
  {
    id: 'cota-19',
    cota_m: 19.00,
    titulo: 'Cota 19,00m - Início de Atenção em Bairros Baixos',
    nivel_risco: 'atencao',
    status: 'publicado',
    ordem: 19,
    resumo_ia: 'Ao atingir a cota de 19,00m no Rio Taquari (região de Lajeado e Estrela), o rio atinge o estado oficial de Atenção. As águas ocupam áreas de preservação permanente (APP) e calha expandida. Pequenas vias de acesso rural e áreas de camping no Bairro Carneiros e Praia de Lajeado começam a registrar alagamentos superficiais.',
    descricao: 'Monitoramento intensificado pelas Defesas Civis Municipais. Início da contenção preventiva de bueiros e inspeção de bombas de drenagem urbana. Moradores das áreas ribeirinhas mais baixas do Bairro Navegantes e Praia de Lajeado recebem alertas preventivos via SMS e WhatsApp.',
    observacoes: 'Velocidade de subida média recomendada para observação: 10 a 20 cm/hora. Sem interrupção de vias estruturais ou pontes estaduais neste nível.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-19-1',
        cota_id: 'cota-19',
        tipo: 'imagem',
        titulo: 'Mapa da Calha Expandida - Cota 19.00m',
        url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Delimitação cartográfica da calha ordinária do Rio Taquari na cota de 19 metros.',
        ordem: 1
      },
      {
        id: 'att-19-2',
        cota_id: 'cota-19',
        tipo: 'imagem',
        titulo: 'Fotografia Aérea - Parque da Imigrante e Orla',
        url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Inundação restrita às vegetações ciliares e faixa de areia do parque ciliar.',
        ordem: 2
      }
    ]
  },
  {
    id: 'cota-20',
    cota_m: 20.00,
    titulo: 'Cota 20,00m - Nível de Atenção Consolidado',
    nivel_risco: 'atencao',
    status: 'publicado',
    ordem: 20,
    resumo_ia: 'Na cota de 20,00m, as águas do Rio Taquari começam a cobrir os primeiros trechos da Rua Bento Rosa no Bairro Navegantes e a faixa ribeirinha de Estrela (Bairro Porto). Moradores que possuem embarcações e depósitos ribeirinhos iniciam a retirada cautelar de equipamentos.',
    descricao: 'Nível crítico para operação de marinas locais e parques náuticos. Equipes de socorro posicionam barcos de resgate em prontidão nos ginásios municipais de Lajeado, Estrela e Arroio do Meio.',
    observacoes: 'Abertura oficial do Centro de Operações de Emergência (COE) da Defesa Civil do Vale do Taquari.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-20-1',
        cota_id: 'cota-20',
        tipo: 'imagem',
        titulo: 'Mancha de Inundação Bairro Navegantes - 20m',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Projeção georreferenciada demonstrando primeiros focos de acúmulo na rede pluvial.',
        ordem: 1
      },
      {
        id: 'att-20-2',
        cota_id: 'cota-20',
        tipo: 'video',
        titulo: 'Simulação 3D - Avanço da Água Cota 20m',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        descricao: 'Animação produzida por IA simulando o avanço do fluxo d\'água nas margens do Rio Taquari.',
        ordem: 2
      }
    ]
  },
  {
    id: 'cota-21',
    cota_m: 21.00,
    titulo: 'Cota 21,00m - Limiar de Alerta na Bacia',
    nivel_risco: 'alerta',
    status: 'publicado',
    ordem: 21,
    resumo_ia: 'A cota 21,00m marca a transição direta para a fase de ALERTA. Ocorre represamento do Arroio Saraqua em Lajeado e Arroio Boa Vista em Estrela. Início do transbordamento na Rua Carlos Von Koseritz e estradas vicinais de acesso a Arroio do Meio.',
    descricao: 'As equipes municipais realizam os primeiros bloqueios preventivos de trânsito em vias baixas. Cadastro prévio de famílias com necessidade de acolhimento nos abrigos públicos provisórios.',
    observacoes: 'Início da contagem regressiva para interrupção de rotas secundárias entre Lajeado e Arroio do Meio.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-21-1',
        cota_id: 'cota-21',
        tipo: 'imagem',
        titulo: 'Mapeamento Hidrológico - Cota 21m',
        url: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Topografia detalhada das áreas impactadas pelo refluxo dos arroios afluentes.',
        ordem: 1
      },
      {
        id: 'att-21-2',
        cota_id: 'cota-21',
        tipo: 'imagem',
        titulo: 'Vista da Ponte de Ferro e Margens',
        url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Registro fotográfico da aproximação do nível do rio à base dos pilares.',
        ordem: 2
      }
    ]
  },
  {
    id: 'cota-22',
    cota_m: 22.00,
    titulo: 'Cota 22,00m - Início do Nível de Inundação Urbana',
    nivel_risco: 'inundacao',
    status: 'publicado',
    ordem: 22,
    resumo_ia: 'Ao atingir 22,00m, o Rio Taquari entra formalmente no Nível de Inundação Urbana. Ocorre a invasão de imóveis residenciais nas partes mais baixas dos Bairros Navegantes, Morro 25 e Conservas (Lajeado), além do Bairro Porto e Moinhos (Estrela). Retirada obrigatória das primeiras dezenas de famílias.',
    descricao: 'Interrupção total da Rua Bento Rosa. Trânsito desviado na Avenida Senador Alberto Pasqualini. Caminhões da prefeitura e voluntários iniciam a mudança de móveis e pertences para os pavilhões do Parque do Imigrante e Ginásio Municipal.',
    observacoes: 'Desligamento preventivo da rede de energia elétrica pela distribuidora nas ruas atingidas para evitar acidentes elétricos.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-22-1',
        cota_id: 'cota-22',
        tipo: 'imagem',
        titulo: 'Mapa Oficial de Inundação Urbana - Cota 22m',
        url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Carta sintética de risco demonstrando arruamentos e quadras atingidas.',
        ordem: 1
      },
      {
        id: 'att-22-2',
        cota_id: 'cota-22',
        tipo: 'video',
        titulo: 'Reconstrução Digital por IA - Inundação 22m',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        descricao: 'Vídeo simulação em 3D demonstrando a elevação da lâmina d\'água nas ruas centrais ribeirinhas.',
        ordem: 2
      },
      {
        id: 'att-22-3',
        cota_id: 'cota-22',
        tipo: 'pdf',
        titulo: 'Relatório Técnico e Carta de Risco Cota 22m.pdf',
        url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
        descricao: 'Documento técnico assinado pelos engenheiros da Defesa Civil do Estado.',
        ordem: 3
      }
    ]
  },
  {
    id: 'cota-23',
    cota_m: 23.00,
    titulo: 'Cota 23,00m - Expansão do Alagamento Residencial',
    nivel_risco: 'inundacao',
    status: 'publicado',
    ordem: 23,
    resumo_ia: 'Com 23,00m, o nível do rio avança sobre a quadra central do Bairro Navegantes e trechos da Rua Décio Martins Costa. Em Estrela, o Bairro Moinhos registra alagamentos em vias pavimentadas. Interrupção parcial do tráfego na ERS-130.',
    descricao: 'Acolhimento familiar ampliado. Equipes de assistência social atuam na distribuição de cestas básicas, lonas e água potável.',
    observacoes: 'Monitoramento contínuo da medição nas estações montante de Muçum e Encantado para estimativa de pico.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-23-1',
        cota_id: 'cota-23',
        tipo: 'imagem',
        titulo: 'Mapeamento de Quadras Atingidas - Cota 23m',
        url: 'https://images.unsplash.com/photo-1508873696983-2df5057d0256?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Vista ortofotográfica demonstrando a mancha de inundação.',
        ordem: 1
      }
    ]
  },
  {
    id: 'cota-24',
    cota_m: 24.00,
    titulo: 'Cota 24,00m - Inundação Severa e Deslocamento de Bairros',
    nivel_risco: 'inundacao',
    status: 'publicado',
    ordem: 24,
    resumo_ia: 'Na cota de 24,00m, o nível d\'água atinge residências de dois pavimentos nos bairros mais atingidos. Interrupção de importantes vias arteriais de ligação entre Lajeado, Arroio do Meio e Estrela. Interrupção da captação de água tratada nas estações de bombas alagadas.',
    descricao: 'Efetivo total das forças de segurança (Corpo de Bombeiros, Brigada Militar, Exército Brasileiro e Defesa Civil) em operação ininterrupta. Remoção de centenas de moradores via barcos a motor.',
    observacoes: 'Risco extremo nas proximidades da ponte sobre o Rio Taquari na BR-386. Tráfego de veículos pesados passa a ser monitorado rigorosamente pela PRF.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-24-1',
        cota_id: 'cota-24',
        tipo: 'imagem',
        titulo: 'Vista de Satélite do Represamento no Taquari - 24m',
        url: 'https://images.unsplash.com/photo-1508873696983-2df5057d0256?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Imagem orbital destacando o aumento da largura do leito do rio de 200m para mais de 1,2km.',
        ordem: 1
      },
      {
        id: 'att-24-2',
        cota_id: 'cota-24',
        tipo: 'imagem',
        titulo: 'Acessos Interrompidos em Arroio do Meio',
        url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Fotografia mostrando alagamento na rodovia ERS-130.',
        ordem: 2
      }
    ]
  },
  {
    id: 'cota-26',
    cota_m: 26.00,
    titulo: 'Cota 26,00m - Inundação Crítica e Evacuação Massiva',
    nivel_risco: 'inundacao',
    status: 'publicado',
    ordem: 26,
    resumo_ia: 'A cota 26,00m representa um dos níveis históricos mais elevados registrados no século XX. Atingimento do centro comercial de Lajeado, Estrela, Muçum e Roca Sales. A água atinge o segundo andar de prédios e isola bairros inteiros.',
    descricao: 'Início do resgate aéreo com helicópteros das Forças Armadas e Polícia Militar para moradores ilhados nos telhados. Pontes secundárias totalmente cobertas pelas águas.',
    observacoes: 'Montagem de hospitais de campanha e central única de doações e mantimentos na região central do Estado.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-26-1',
        cota_id: 'cota-26',
        tipo: 'imagem',
        titulo: 'Registro de Drone - Centro Comercial Atingido',
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Vista aérea demonstrando o isolamento de quadras comerciais.',
        ordem: 1
      },
      {
        id: 'att-26-2',
        cota_id: 'cota-26',
        tipo: 'video',
        titulo: 'Simulação de Fluxo Hidrodinâmico - Cota 26m',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        descricao: 'Modelo de computação gráfica demonstrando a velocidade e correnteza nas vias centrais.',
        ordem: 2
      }
    ]
  },
  {
    id: 'cota-28',
    cota_m: 28.00,
    titulo: 'Cota 28,00m - Inundação Catastrófica (Nível Super-Histórico)',
    nivel_risco: 'inundacao',
    status: 'publicado',
    ordem: 28,
    resumo_ia: 'Nível que ultrapassa as marcas históricas das grandes enchentes de 1941 e 2023. Destruição de infraestruturas rodoviárias, pontes estaduais e redes de transmissão de energia elétrica. Cidades de Muçum, Roca Sales e Encantado registram submersão de mais de 80% da malha urbana.',
    descricao: 'Situação de Calamidade Pública decretada em âmbito Municipal, Estadual e Federal. Rotas de suprimentos são mantidas exclusivamente por ponte aérea e embarcações de grande porte do Exército.',
    observacoes: 'Necessidade de evacuação total de zonas de risco elevado em um raio de até 2km das margens do rio.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-28-1',
        cota_id: 'cota-28',
        tipo: 'imagem',
        titulo: 'Carta de Danos Severos e Áreas de Exclusão - Cota 28m',
        url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Mapeamento espacial das zonas de perigo iminente de colapso estrutural.',
        ordem: 1
      },
      {
        id: 'att-28-2',
        cota_id: 'cota-28',
        tipo: 'pdf',
        titulo: 'Decreto Estadual de Calamidade Pública e Mapeamento de Danos.pdf',
        url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
        descricao: 'Documentação oficial de emergência e diretrizes de reconstrução.',
        ordem: 2
      }
    ]
  },
  {
    id: 'cota-30',
    cota_m: 30.00,
    titulo: 'Cota 30,00m - Evento Extremo e Colapso de Infraestrutura',
    nivel_risco: 'inundacao',
    status: 'publicado',
    ordem: 30,
    resumo_ia: 'A cota 30,00m é o limiar de eventos climáticos extremos de magnitude secular na Bacia do Taquari-Antas. Submersão de pontes de grande porte sobre a BR-386 e ERS-130. Desconectividade total entre as margens esquerda e direita do Rio Taquari.',
    descricao: 'Operações exclusivamente focadas na preservação da vida humana, abrigo massivo e suprimento de água e medicamentos por vias aéreas. Coleta e distribuição automatizada por postos avançados.',
    observacoes: 'Pontes e estruturas viárias passam por perícia técnica obrigatória antes de qualquer tentativa de liberação pós-vazante.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-30-1',
        cota_id: 'cota-30',
        tipo: 'imagem',
        titulo: 'Modelagem 3D - Bacia Hidrográfica do Taquari na Cota 30m',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Visão tridimensional por sensoriamento remoto de alta precisão.',
        ordem: 1
      },
      {
        id: 'att-30-2',
        cota_id: 'cota-30',
        tipo: 'video',
        titulo: 'Animação Hidrológica de Simulação Extrema - IA 3D',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        descricao: 'Vídeo institucional demonstrando padrões de escoamento e velocidade da mancha de inundação.',
        ordem: 2
      }
    ]
  },
  {
    id: 'cota-32',
    cota_m: 32.00,
    titulo: 'Cota 32,00m - Limiar Extremo Histórico (Maior Enchente de Maio/2024)',
    nivel_risco: 'inundacao',
    status: 'publicado',
    ordem: 32,
    resumo_ia: 'Cota correspondente à histórica marca registrada na grande tragédia climática de Maio de 2024 no Rio Grande do Sul. O Rio Taquari atingiu marcas sem precedentes, superando todos os registros oficiais anteriores desde o início das medições hidrológicas no Estado.',
    descricao: 'Inundação generalizada em mais de 10 municípios do Vale do Taquari. Reestruturação completa do plano diretor regional, reassentamento urbano de comunidades e construção de novas cotas de segurança.',
    observacoes: 'Estudo permanente de engenharia e modelagem climática para adaptação da infraestrutura regional.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-32-1',
        cota_id: 'cota-32',
        tipo: 'imagem',
        titulo: 'Registro Fotográfico Histórico - Maio de 2024',
        url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Panorama aéreo documentando a extensão máxima da água no Vale do Taquari.',
        ordem: 1
      },
      {
        id: 'att-32-2',
        cota_id: 'cota-32',
        tipo: 'pdf',
        titulo: 'Dossiê Técnico de Reconstrução do Vale do Taquari - Cota 32m.pdf',
        url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
        descricao: 'Documento completo de diretrizes urbanísticas e mapeamento de risco do Estado.',
        ordem: 2
      }
    ]
  },
  {
    id: 'cota-34',
    cota_m: 34.00,
    titulo: 'Cota 34,00m - Cota Teórica Máxima Extrema',
    nivel_risco: 'inundacao',
    status: 'publicado',
    ordem: 34,
    resumo_ia: 'Cota limite de modelagem matemática e simulação computacional teórica para eventos meteorológicos extremos excepcionais na Bacia do Rio Taquari. Utilizada por projetistas, Defesa Civil e engenheiros para cálculo de estruturas de contenção e planejamento de longo prazo.',
    descricao: 'Mapeamento preventivo de áreas seguras e elevação de patamares para novas construções públicas e hospitais regionais.',
    observacoes: 'Modelo de referência para zoneamento de uso do solo em planos diretores municipais.',
    pdf_oficial_url: 'https://www.defesacivil.rs.gov.br/upload/arquivos/202405/02123000-plano-de-contingencia-bacia-taquari.pdf',
    anexos: [
      {
        id: 'att-34-1',
        cota_id: 'cota-34',
        tipo: 'imagem',
        titulo: 'Modelo Digital de Elevação (MDE) - Simulação Cota 34m',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        descricao: 'Simulação computacional de área máxima de abrangência.',
        ordem: 1
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'taquari_cotas_analise';

export const getCotasAnaliseFromStorage = (): CotaAnalise[] => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Error loading cotas from localStorage:', e);
  }
  return INITIAL_COTAS_ANALISE;
};

export const saveCotasAnaliseToStorage = (cotas: CotaAnalise[]) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cotas));
      window.dispatchEvent(new Event('cotas_analise_updated'));
    }
  } catch (e) {
    console.error('Error saving cotas to localStorage:', e);
  }
};
