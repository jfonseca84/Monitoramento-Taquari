import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink, 
  Search, 
  MessageCircle, 
  PhoneCall, 
  LifeBuoy, 
  Siren, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';
import { City } from '../types';

interface DefesaCivilContact {
  cityName: string;
  region: 'Vale do Taquari' | 'Bacia do Guaíba';
  river: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  websiteUrl: string;
}

const DEFAULT_DEFESA_CIVIL_LIST: DefesaCivilContact[] = [
  {
    cityName: 'Bom Retiro do Sul',
    region: 'Vale do Taquari',
    river: 'Rio Taquari',
    phone: '(51) 3763-8200 / 199',
    whatsapp: '(51) 99824-3450',
    email: 'defesacivil@bomretirodosul.rs.gov.br',
    address: 'R. Jorge Siepmann, 50 - Centro, Bom Retiro do Sul - RS',
    websiteUrl: 'https://bomretirodosul.rs.gov.br'
  },
  {
    cityName: 'Cachoeira do Sul',
    region: 'Bacia do Guaíba',
    river: 'Rio Jacuí',
    phone: '(51) 3724-6010 / 199',
    whatsapp: '(51) 99834-3113',
    email: 'defesacivil@cachoeiradosul.rs.gov.br',
    address: 'R. Moron, 1013 - Centro, Cachoeira do Sul - RS',
    websiteUrl: 'https://cachoeiradosul.rs.gov.br'
  },
  {
    cityName: 'Dona Francisca',
    region: 'Bacia do Guaíba',
    river: 'Rio Jacuí',
    phone: '(55) 3268-1133 / 199',
    whatsapp: '(55) 99615-4421',
    email: 'defesacivil@donafrancisca.rs.gov.br',
    address: 'Av. do Imigrante, 500 - Centro, Dona Francisca - RS',
    websiteUrl: 'https://donafrancisca.rs.gov.br'
  },
  {
    cityName: 'Encantado',
    region: 'Vale do Taquari',
    river: 'Rio Taquari',
    phone: '(51) 3751-0100 / 199',
    whatsapp: '(51) 99615-5488',
    email: 'defesacivil@encantado-rs.com.br',
    address: 'R. Monsenhor Scalabrini, 1047 - Centro, Encantado - RS',
    websiteUrl: 'https://encantado.rs.gov.br'
  },
  {
    cityName: 'Estrela',
    region: 'Vale do Taquari',
    river: 'Rio Taquari',
    phone: '(51) 3981-1180 / 199',
    whatsapp: '(51) 99882-6284',
    email: 'defesacivil@estrela.rs.gov.br',
    address: 'R. Júlio de Castilhos, 380 - Centro, Estrela - RS',
    websiteUrl: 'https://estrela.rs.gov.br'
  },
  {
    cityName: 'Feliz',
    region: 'Bacia do Guaíba',
    river: 'Rio Caí',
    phone: '(51) 3637-4200 / 199',
    whatsapp: '(51) 99512-3211',
    email: 'defesacivil@feliz.rs.gov.br',
    address: 'R. Pinheiro Machado, 55 - Centro, Feliz - RS',
    websiteUrl: 'https://feliz.rs.gov.br'
  },
  {
    cityName: 'Gravataí',
    region: 'Bacia do Guaíba',
    river: 'Rio Gravataí',
    phone: '(51) 3600-7630 / 199',
    whatsapp: '(51) 99342-9884',
    email: 'defesacivil@gravatai.rs.gov.br',
    address: 'R. José Loureiro da Silva, 1350 - Centro, Gravataí - RS',
    websiteUrl: 'https://gravatai.rs.gov.br'
  },
  {
    cityName: 'Lajeado',
    region: 'Vale do Taquari',
    river: 'Rio Taquari',
    phone: '(51) 3982-1150 / 199',
    whatsapp: '(51) 99828-4971',
    email: 'defesacivil@lajeado.rs.gov.br',
    address: 'Av. Benno Schmitzt, 215 - Bairro Jardim do Cordeiro, Lajeado - RS',
    websiteUrl: 'https://lajeado.rs.gov.br'
  },
  {
    cityName: 'Montenegro',
    region: 'Bacia do Guaíba',
    river: 'Rio Caí',
    phone: '(51) 3632-3488 / 199',
    whatsapp: '(51) 99701-4972',
    email: 'defesacivil@montenegro.rs.gov.br',
    address: 'R. João Pessoa, 1363 - Centro, Montenegro - RS',
    websiteUrl: 'https://montenegro.rs.gov.br'
  },
  {
    cityName: 'Muçum',
    region: 'Vale do Taquari',
    river: 'Rio Taquari',
    phone: '(51) 3755-1122 / 199',
    whatsapp: '(51) 99611-3012',
    email: 'defesacivil@mucum.rs.gov.br',
    address: 'Av. Borges de Medeiros, 200 - Centro, Muçum - RS',
    websiteUrl: 'https://mucum.rs.gov.br'
  },
  {
    cityName: 'Porto Alegre',
    region: 'Bacia do Guaíba',
    river: 'Lago Guaíba',
    phone: '(51) 3289-5000 / 199',
    whatsapp: '(51) 99392-3854',
    email: 'defesacivil@portoalegre.rs.gov.br',
    address: 'R. Cap. Pedro da Silva, 300 - Cristal, Porto Alegre - RS',
    websiteUrl: 'https://portoalegre.rs.gov.br/defesacivil'
  },
  {
    cityName: 'Roca Sales',
    region: 'Vale do Taquari',
    river: 'Rio Taquari',
    phone: '(51) 3753-2122 / 199',
    whatsapp: '(51) 99723-8812',
    email: 'defesacivil@rocasales.rs.gov.br',
    address: 'R. Eliseu Orlandini, 110 - Centro, Roca Sales - RS',
    websiteUrl: 'https://rocasales.rs.gov.br'
  },
  {
    cityName: 'Santa Tereza',
    region: 'Vale do Taquari',
    river: 'Rio Taquari',
    phone: '(54) 3456-1144 / 199',
    whatsapp: '(54) 99982-1402',
    email: 'defesacivil@santatereza.rs.gov.br',
    address: 'R. Jacob Ely, 25 - Centro, Santa Tereza - RS',
    websiteUrl: 'https://santatereza.rs.gov.br'
  },
  {
    cityName: 'São Leopoldo',
    region: 'Bacia do Guaíba',
    river: 'Rio dos Sinos',
    phone: '(51) 2200-0630 / 199',
    whatsapp: '(51) 98924-5082',
    email: 'defesacivil@saoleopoldo.rs.gov.br',
    address: 'R. São Joaquim, 600 - Centro, São Leopoldo - RS',
    websiteUrl: 'https://saoleopoldo.rs.gov.br'
  },
  {
    cityName: 'São Sebastião do Caí',
    region: 'Bacia do Guaíba',
    river: 'Rio Caí',
    phone: '(51) 3635-2500 / 199',
    whatsapp: '(51) 99872-3341',
    email: 'defesacivil@saosebastiaodocai.rs.gov.br',
    address: 'R. Marechal Deodoro, 400 - Centro, São Sebastião do Caí - RS',
    websiteUrl: 'https://saosebastiaodocai.rs.gov.br'
  },
  {
    cityName: 'Taquara',
    region: 'Bacia do Guaíba',
    river: 'Rio dos Sinos',
    phone: '(51) 3541-9200 / 199',
    whatsapp: '(51) 99812-7011',
    email: 'defesacivil@taquara.rs.gov.br',
    address: 'R. Tristão Monteiro, 1278 - Centro, Taquara - RS',
    websiteUrl: 'https://taquara.rs.gov.br'
  },
  {
    cityName: 'Taquari',
    region: 'Vale do Taquari',
    river: 'Rio Taquari',
    phone: '(51) 3653-6200 / 199',
    whatsapp: '(51) 99511-2090',
    email: 'defesacivil@taquari.rs.gov.br',
    address: 'R. Osvaldo Aranha, 1790 - Centro, Taquari - RS',
    websiteUrl: 'https://taquari.rs.gov.br'
  }
];

interface DefesaCivilViewProps {
  cities?: City[];
  onNavigateToContact?: () => void;
}

export const DefesaCivilView: React.FC<DefesaCivilViewProps> = ({ cities = [], onNavigateToContact }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('todos');

  // Sorted list in alphabetical order
  const contactsList = useMemo(() => {
    let list = [...DEFAULT_DEFESA_CIVIL_LIST];

    // Merge any extra cities from system props if they are not in the list
    if (cities && cities.length > 0) {
      cities.forEach(c => {
        const exists = list.some(item => item.cityName.toLowerCase() === c.name.toLowerCase());
        if (!exists && c.name) {
          const region = c.basin === 'taquari' ? 'Vale do Taquari' : 'Bacia do Guaíba';
          list.push({
            cityName: c.name,
            region: region,
            river: c.river || 'Rio Taquari',
            phone: '(51) 199',
            email: `defesacivil@${c.slug || c.name.toLowerCase().replace(/\s+/g, '')}.rs.gov.br`,
            address: `Prefeitura Municipal de ${c.name} - RS`,
            websiteUrl: c.camera_url || 'https://defesacivil.rs.gov.br'
          });
        }
      });
    }

    // Sort with priority: Lajeado -> Vale do Taquari -> Other regions (alphabetical)
    list.sort((a, b) => {
      const isLajeadoA = a.cityName.toLowerCase() === 'lajeado';
      const isLajeadoB = b.cityName.toLowerCase() === 'lajeado';
      if (isLajeadoA && !isLajeadoB) return -1;
      if (!isLajeadoA && isLajeadoB) return 1;

      const isTaquariA = a.region === 'Vale do Taquari';
      const isTaquariB = b.region === 'Vale do Taquari';
      if (isTaquariA && !isTaquariB) return -1;
      if (!isTaquariA && isTaquariB) return 1;

      return a.cityName.localeCompare(b.cityName, 'pt-BR');
    });

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(item => 
        item.cityName.toLowerCase().includes(term) ||
        item.river.toLowerCase().includes(term) ||
        item.address.toLowerCase().includes(term) ||
        item.phone.includes(term)
      );
    }

    // Apply region filter
    if (selectedRegion !== 'todos') {
      list = list.filter(item => item.region === selectedRegion);
    }

    return list;
  }, [cities, searchTerm, selectedRegion]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* HEADER */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800/80 border-slate-200 border rounded-3xl p-6 shadow-2xl transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-500 shadow-lg shadow-amber-950/40 shrink-0">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">
                Defesa Civil
              </h2>
              <p className="text-xs md:text-sm dark:text-slate-400 text-slate-600 mt-0.5">
                Consulte abaixo os canais oficiais das Defesas Civis dos municípios monitorados pelo sistema.
              </p>
            </div>
          </div>

          {onNavigateToContact && (
            <button
              onClick={onNavigateToContact}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl text-xs font-bold transition-all self-start md:self-auto cursor-pointer"
            >
              Falar com Suporte do Site
            </button>
          )}
        </div>
      </div>

      {/* EMERGENCY HOTLINES BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-amber-950/70 to-slate-900 border border-amber-700/60 rounded-2xl p-4 text-white flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">DEFESA CIVIL</p>
            <p className="text-2xl md:text-3xl font-bold font-mono mt-0.5">199</p>
          </div>
          <PhoneCall className="w-7 h-7 text-amber-400 opacity-80" />
        </div>

        <div className="bg-gradient-to-br from-red-950/70 to-slate-900 border border-red-700/60 rounded-2xl p-4 text-white flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">BOMBEIROS</p>
            <p className="text-2xl md:text-3xl font-bold font-mono mt-0.5">193</p>
          </div>
          <LifeBuoy className="w-7 h-7 text-red-400 opacity-80" />
        </div>

        <div className="bg-gradient-to-br from-sky-950/70 to-slate-900 border border-sky-700/60 rounded-2xl p-4 text-white flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">BRIGADA MILITAR</p>
            <p className="text-2xl md:text-3xl font-bold font-mono mt-0.5">190</p>
          </div>
          <Shield className="w-7 h-7 text-sky-400 opacity-80" />
        </div>

        <div className="bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-700/60 rounded-2xl p-4 text-white flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">SAMU (EMERGÊNCIA)</p>
            <p className="text-2xl md:text-3xl font-bold font-mono mt-0.5">192</p>
          </div>
          <Siren className="w-7 h-7 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* SEARCH AND REGION FILTERS */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800/80 border-slate-200 border rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* SEARCH INPUT */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar município, rio ou telefone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl dark:bg-slate-900 bg-slate-50 dark:border-slate-700/80 border-slate-300 border dark:text-white text-slate-900 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* REGION FILTER TABS */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedRegion('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedRegion === 'todos'
                ? 'dark:bg-amber-950/80 bg-amber-100 text-amber-600 dark:text-amber-400 border border-amber-500/50'
                : 'dark:text-slate-400 text-slate-600 hover:bg-slate-800/50'
            }`}
          >
            Todos ({DEFAULT_DEFESA_CIVIL_LIST.length})
          </button>
          
          <button
            onClick={() => setSelectedRegion('Vale do Taquari')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedRegion === 'Vale do Taquari'
                ? 'dark:bg-amber-950/80 bg-amber-100 text-amber-600 dark:text-amber-400 border border-amber-500/50'
                : 'dark:text-slate-400 text-slate-600 hover:bg-slate-800/50'
            }`}
          >
            Vale do Taquari
          </button>

          <button
            onClick={() => setSelectedRegion('Bacia do Guaíba')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedRegion === 'Bacia do Guaíba'
                ? 'dark:bg-amber-950/80 bg-amber-100 text-amber-600 dark:text-amber-400 border border-amber-500/50'
                : 'dark:text-slate-400 text-slate-600 hover:bg-slate-800/50'
            }`}
          >
            Bacia do Guaíba
          </button>
        </div>

      </div>

      {/* MUNICIPALITIES CARDS GRID */}
      {contactsList.length === 0 ? (
        <div className="dark:bg-[#0F172A]/90 bg-white border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          Nenhum município encontrado com o termo "{searchTerm}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contactsList.map((item) => {
            const cleanPhone = item.phone.replace(/[^0-9]/g, '');
            const cleanWhatsapp = item.whatsapp ? item.whatsapp.replace(/[^0-9]/g, '') : '';

            return (
              <div 
                key={item.cityName}
                className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800/80 border-slate-200 border rounded-3xl p-5 shadow-xl hover:border-amber-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3 mb-3 pb-3 dark:border-slate-800/80 border-slate-100 border-b">
                    <div>
                      <h3 className="text-base font-bold dark:text-white text-slate-900 tracking-tight flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{item.cityName}</span>
                      </h3>
                      <p className="text-[11px] dark:text-slate-400 text-slate-500 font-medium mt-0.5">
                        {item.river}
                      </p>
                    </div>

                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                      item.region === 'Vale do Taquari'
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800/80'
                        : 'bg-indigo-950/60 text-indigo-400 border-indigo-800/80'
                    }`}>
                      {item.region}
                    </span>
                  </div>

                  {/* CONTACT INFOS LIST */}
                  <div className="space-y-2.5 text-xs">
                    
                    {/* TELEPHONE */}
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="dark:text-slate-400 text-slate-500 text-[11px] block">Telefone de Emergência</span>
                        <a 
                          href={`tel:${cleanPhone}`} 
                          className="font-mono font-bold dark:text-slate-200 text-slate-800 hover:text-amber-500 transition-colors"
                        >
                          {item.phone}
                        </a>
                      </div>
                    </div>

                    {/* WHATSAPP (IF AVAILABLE) */}
                    {item.whatsapp && (
                      <div className="flex items-start gap-2.5">
                        <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="dark:text-slate-400 text-slate-500 text-[11px] block">WhatsApp Defesa Civil</span>
                          <a 
                            href={`https://wa.me/55${cleanWhatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {item.whatsapp}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* EMAIL */}
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <span className="dark:text-slate-400 text-slate-500 text-[11px] block">E-mail Oficial</span>
                        <a 
                          href={`mailto:${item.email}`}
                          className="font-mono text-[11px] text-blue-600 dark:text-blue-400 hover:underline truncate block"
                        >
                          {item.email}
                        </a>
                      </div>
                    </div>

                    {/* ADDRESS */}
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="dark:text-slate-300 text-slate-700 text-[11px] leading-relaxed">
                        {item.address}
                      </div>
                    </div>

                  </div>

                </div>

                {/* CARD FOOTER BUTTON */}
                <div className="pt-4 mt-4 dark:border-slate-800/80 border-slate-100 border-t">
                  <a
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full dark:bg-slate-900 bg-slate-100 dark:hover:bg-amber-950/60 hover:bg-amber-50 dark:text-slate-200 text-slate-800 dark:hover:text-amber-400 hover:text-amber-700 border dark:border-slate-700/80 border-slate-300 dark:hover:border-amber-500/50 border-amber-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Site Oficial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
