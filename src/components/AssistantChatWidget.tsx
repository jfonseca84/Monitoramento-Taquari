import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, X, Send, User, Bot, Plus, Mic, ArrowUp, HelpCircle } from 'lucide-react';
import { City } from '../types';
import { fetchCitiesDirect } from '../lib/supabase';

interface AssistantChatWidgetProps {
  currentCityName?: string;
}

export const AssistantChatWidget: React.FC<AssistantChatWidgetProps> = ({ currentCityName = 'Lajeado' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [activeCityName, setActiveCityName] = useState<string>(currentCityName);
  
  // Real or Fallback Telemetry Data for Active City
  const [cityStats, setCityStats] = useState({
    name: 'Lajeado',
    current_level: 12.99,
    flood_threshold: 19.00,
    status_level: 'NORMAL',
    bairrosImpactados: ['Conservas', 'Santo Antônio', 'Campestre', 'Centro Baixo'],
    ondaCheiaTempo: '~3h a 4h após passagem por Cruzeiro do Sul'
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync active city name if prop changes
  useEffect(() => {
    if (currentCityName) {
      setActiveCityName(currentCityName);
    }
  }, [currentCityName]);

  // Fetch telemetry to keep metrics realistic
  useEffect(() => {
    let isMounted = true;
    async function loadTelemetry() {
      try {
        const cities = await fetchCitiesDirect();
        if (isMounted && cities && cities.length > 0) {
          const match = cities.find(c => c.name.toLowerCase().includes(activeCityName.toLowerCase()));
          if (match) {
            setCityStats({
              name: match.name,
              current_level: match.current_level || 12.99,
              flood_threshold: match.flood_level || 19.00,
              status_level: (match.status_level || 'NORMAL').toUpperCase(),
              bairrosImpactados: match.name.toLowerCase().includes('lajeado')
                ? ['Conservas', 'Santo Antônio', 'Campestre', 'Centro Baixo']
                : ['Bairros Ribeirinhos', 'Áreas Baixas'],
              ondaCheiaTempo: '~3h a 4h após passagem pelas estações de montante'
            });
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar telemetria no assistente:', e);
      }
    }
    loadTelemetry();
    return () => { isMounted = false; };
  }, [activeCityName]);

  // Chat Messages State
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string; time: string; badge?: string }>>([]);

  // Initialize or update Welcome message
  useEffect(() => {
    const safetyMargin = (cityStats.flood_threshold - cityStats.current_level).toFixed(2);
    setChatMessages([
      {
        id: `welcome-${cityStats.name}`,
        sender: 'assistant',
        text: `Olá! Sou o Assistente Hidrológico IA em treinamento.

A cidade selecionada para análise no momento é **${cityStats.name}**.

• **Nível Atual do Rio:** ${cityStats.current_level.toFixed(2)}m (${cityStats.status_level})
• **Cota de Inundação Inicial:** ${cityStats.flood_threshold.toFixed(2)}m
• **Margem de Segurança:** ${safetyMargin} metros

⚠️ **Este assistente está em fase de testes e desenvolvimento.** As respostas são geradas por inteligência artificial com base nos dados disponíveis no sistema e podem conter imprecisões ou limitações. As informações apresentadas não substituem comunicados, alertas ou orientações dos órgãos oficiais de monitoramento e defesa civil.

Como posso auxiliar você com dados sobre bairros vulneráveis, previsões ou histórico hidrológico em ${cityStats.name}?`,
        time: 'Agora',
        badge: `Contexto Ativo: ${cityStats.name}`
      }
    ]);
  }, [cityStats]);

  // AI Response Handler using server-side Gemini API
  const handleSendQuestion = async (questionPrompt?: string) => {
    const textToSend = questionPrompt || chatInput;
    if (!textToSend || !textToSend.trim()) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      sender: 'user' as const,
      text: textToSend.trim(),
      time: 'Agora'
    };

    setChatMessages(prev => [...prev, userMessage]);
    if (!questionPrompt) setChatInput('');
    setIsThinking(true);

    const safetyMargin = Number((cityStats.flood_threshold - cityStats.current_level).toFixed(2));
    const contextData = {
      cityName: cityStats.name,
      currentLevel: cityStats.current_level,
      statusLevel: cityStats.status_level,
      floodThreshold: cityStats.flood_threshold,
      safetyMargin: safetyMargin,
      rateOfChange: 'Estável',
      vulnerableAreas: cityStats.bairrosImpactados,
      historicalData: {
        'Maio/2024': '28.19m',
        'Novembro/2023': '24.73m',
        'Setembro/2023': '26.58m'
      }
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: textToSend.trim(),
          context: contextData
        })
      });

      const data = await res.json();
      const responseText = data.text || data.error || 'Não foi possível obter resposta da IA no momento.';

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant' as const,
        text: responseText,
        time: 'Agora',
        badge: `Assistente IA — ${cityStats.name}`
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Erro na requisição para o assistente Gemini:', err);
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant' as const,
        text: `Ocorreu um erro ao consultar a inteligência artificial. Por favor, tente novamente em instantes ou consulte a Defesa Civil do município de ${cityStats.name}.`,
        time: 'Agora',
        badge: `Erro de Conexão`
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsThinking(false);
      setTimeout(() => {
        if (chatBottomRef.current) {
          chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };


  return (
    <>
      {/* BOTÃO FLUTUANTE NO CANTO INFERIOR DIREITO (EXIBIDO EM TODAS AS PÁGINAS DO SITE) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative cursor-pointer transition-all transform hover:scale-110 active:scale-95 filter drop-shadow-2xl focus:outline-none"
          title="Pergunte ao Assistente Hidrológico IA"
        >
          <div className="relative w-12 h-14 sm:w-14 sm:h-16">
            {/* Ícone de Pin / Balão de Mensagem nas cores do site */}
            <svg viewBox="0 0 100 115" className="w-full h-full text-[#0284c7] group-hover:text-[#0369a1] transition-colors filter drop-shadow-md">
              <path
                d="M 18,0 L 82,0 A 18,18 0 0,1 100,18 L 100,68 A 18,18 0 0,1 82,86 L 62,86 L 50,110 L 38,86 L 18,86 A 18,18 0 0,1 0,68 L 0,18 A 18,18 0 0,1 18,0 Z"
                fill="currentColor"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
            </svg>
            {/* Aviãozinho de papel (Ícone de envio interno) */}
            <div className="absolute inset-0 pb-3.5 flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-none stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round transform -rotate-12">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
            {/* Ponto indicador de status ativo */}
            <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
        </button>
      </div>

      {/* MODAL DO CHAT DO ASSISTENTE HIDROLÓGICO IA */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 max-w-3xl w-full h-[85vh] max-h-[750px] flex flex-col justify-between shadow-2xl relative text-slate-800 space-y-4">
            
            {/* BOTÃO FECHAR */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer z-10"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ÁREA DE CONVERSA COM MENSAGENS */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-sm sm:text-base leading-relaxed text-slate-800 font-sans">
              {chatMessages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`space-y-3 ${msg.sender === 'user' ? 'bg-sky-50 p-4 rounded-2xl border border-sky-100 text-sky-950 ml-auto max-w-2xl' : ''}`}
                >
                  {msg.sender === 'user' && (
                    <div className="font-extrabold text-xs uppercase tracking-wider text-sky-700 mb-1">
                      Você
                    </div>
                  )}

                  <div className="space-y-1.5 text-slate-800">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => {
                      const lines = paragraph.split('\n');
                      return (
                        <div key={pIdx} className="space-y-1">
                          {lines.map((line, lIdx) => {
                            const parts = line.split(/(\*\*[^*]+\*\*)/g);
                            return (
                              <p key={lIdx} className={line.startsWith('•') ? 'pl-1 font-medium' : ''}>
                                {parts.map((part, partIdx) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                      <strong key={partIdx} className="font-bold text-slate-900">
                                        {part.slice(2, -2)}
                                      </strong>
                                    );
                                  }
                                  return part;
                                })}
                              </p>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Exibe as 4 opções de perguntas na primeira mensagem do assistente */}
                  {msg.sender === 'assistant' && index === 0 && (
                    <div className="pt-3 space-y-2">
                      {[
                        `"Minha casa em ${cityStats.name} corre risco de ser atingida?"`,
                        `"Se o rio chegar a 24 metros em ${cityStats.name}, quais bairros são afetados?"`,
                        `"Qual a previsão para as próximas horas em ${cityStats.name}?"`,
                        `"Compare a situação atual em ${cityStats.name} com a enchente de Maio/2024."`
                      ].map((promptText, pIdx) => {
                        const cleanPrompt = promptText.replace(/^"|"$/g, '');
                        return (
                          <button
                            key={pIdx}
                            onClick={() => handleSendQuestion(cleanPrompt)}
                            className="block w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-900 border border-slate-200/90 hover:border-sky-300 text-sm font-medium transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                          >
                            {promptText}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-mono animate-pulse py-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>Assistente em treinamento consultando medições de {cityStats.name}...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* BARRA DE ENTRADA / PROMPT INFERIOR DA IMAGEM COM O BOTÃO DE ENVIAR NA COR AZUL MAIS FORTE */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 bg-white">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Opções"
              >
                <Plus className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendQuestion(); }}
                placeholder={`Pergunte algo ao Assistente Hidrológico sobre ${cityStats.name}...`}
                className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm py-2 px-2 focus:outline-none font-sans"
              />

              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Ativar Microfone"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleSendQuestion()}
                disabled={!chatInput.trim() || isThinking}
                className="p-2.5 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white rounded-full transition-all cursor-pointer shrink-0 shadow-md flex items-center justify-center active:scale-95"
                title="Enviar"
              >
                <ArrowUp className="w-5 h-5 text-white" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
