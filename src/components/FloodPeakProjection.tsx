import React, { useEffect, useState } from 'react';
import { City } from '../types';
import {
  fetchRecentRiverLevels,
  fetchLatestWeatherReading,
  RiverLevelPoint,
  WeatherReadingRow
} from '../lib/supabase';
import { TrendingUp, TrendingDown, Minus, CloudRain, Waves, Timer, Loader2 } from 'lucide-react';

interface FloodPeakProjectionProps {
  selectedCity: City;
  cities: City[];
}

// Cidades-cabeceira da Bacia do Taquari (nascentes / trecho superior), de onde a onda de cheia
// se origina e se propaga rio abaixo até as demais estações.
export const HEADWATER_SLUGS = ['santatereza', 'linhajosejulio', 'passocarreiro', 'linhacolombo', 'passotainhas', 'barradofao'];

// Tempo de deslocamento aproximado da onda de cheia a partir das cabeceiras (Santa Tereza / Alto
// Taquari) até cada estação, em horas [mínimo, máximo]. Não é calculado ao vivo: vem dos boletins
// e das notas de propagação já usadas neste sistema (SGB/SACE) para a Bacia do Taquari — Santa
// Tereza -> Muçum ~2-3h, Muçum -> Encantado ~3-4h, Encantado -> Roca Sales ~2h, e ~8-12h no total
// até Lajeado/Estrela. Jusante de Lajeado (Bom Retiro, Porto Mariante, Taquari) é uma extrapolação
// grosseira desses mesmos intervalos, sem fonte documentada própria.
export const PROPAGATION_HOURS: Record<string, [number, number]> = {
  mucum: [2, 3],
  encantado: [5, 7],
  rocasales: [7, 9],
  lajeado: [8, 12],
  estrela: [8, 12],
  cruzeirodosul: [8, 12],
  bomretirodosul: [10, 14],
  portomariante: [12, 16],
  taquari: [14, 18]
};

interface Point { ts: number; level: number; }

function linregSlope(points: Point[]): number | null {
  if (points.length < 2) return null;
  const meanT = points.reduce((s, p) => s + p.ts, 0) / points.length;
  const meanL = points.reduce((s, p) => s + p.level, 0) / points.length;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.ts - meanT) * (p.level - meanL);
    den += (p.ts - meanT) * (p.ts - meanT);
  }
  if (den === 0) return null;
  return num / den; // ts em horas -> m/h
}

function formatHour(ms: number): string {
  return new Date(ms).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
}

function formatCm(rateMh: number): string {
  const cm = Math.round(rateMh * 100);
  return `${cm >= 0 ? '+' : ''}${cm} cm/h`;
}

export const FloodPeakProjection: React.FC<FloodPeakProjectionProps> = ({ selectedCity, cities }) => {
  const [rawPoints, setRawPoints] = useState<RiverLevelPoint[]>([]);
  const [headwaterRain, setHeadwaterRain] = useState<Record<string, WeatherReadingRow | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cityId = selectedCity?.id;
    if (!cityId) {
      setRawPoints([]);
      setHeadwaterRain({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setRawPoints([]);

    const headwaterCities = HEADWATER_SLUGS
      .map((slug) => cities.find((c) => c.slug === slug))
      .filter((c): c is City => !!c && !!c.id);

    Promise.all([
      fetchRecentRiverLevels(cityId, 3),
      Promise.all(headwaterCities.map((c) => fetchLatestWeatherReading(c.id).then((r) => [c.slug, r] as const)))
    ]).then(([levels, rainEntries]) => {
      if (cancelled) return;
      setRawPoints(levels);
      const rainMap: Record<string, WeatherReadingRow | null> = {};
      for (const [slug, r] of rainEntries) rainMap[slug] = r;
      setHeadwaterRain(rainMap);
      setLoading(false);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity?.id]);

  const river = selectedCity.river || 'rio';
  const cityName = selectedCity.name;
  const currentLevel = typeof selectedCity.current_level === 'number' ? selectedCity.current_level : null;

  const points: Point[] = rawPoints
    .map((r) => ({ ts: new Date(r.recorded_at).getTime(), level: Number(r.level) }))
    .filter((p) => !isNaN(p.ts) && !isNaN(p.level))
    .sort((a, b) => a.ts - b.ts);

  const lastMs = points.length > 0 ? points[points.length - 1].ts : Date.now();
  const recentWindow = points
    .filter((p) => p.ts >= lastMs - 60 * 60 * 1000)
    .map((p) => ({ ts: (p.ts - lastMs) / (1000 * 60 * 60), level: p.level }));
  const rateRecent = linregSlope(recentWindow);
  const effectiveRate = rateRecent !== null ? rateRecent : (typeof selectedCity.rate_of_change === 'number' ? selectedCity.rate_of_change : null);

  const headwaterCitiesLive = HEADWATER_SLUGS
    .map((slug) => cities.find((c) => c.slug === slug))
    .filter((c): c is City => !!c);

  const risingHeadwaters = headwaterCitiesLive.filter((c) => c.trend === 'subindo');
  const fallingHeadwaters = headwaterCitiesLive.filter((c) => c.trend === 'descendo');
  const headwatersKnown = headwaterCitiesLive.filter((c) => typeof c.rate_of_change === 'number' && c.trend);

  const rainEntries = HEADWATER_SLUGS
    .map((slug) => ({ slug, city: cities.find((c) => c.slug === slug), reading: headwaterRain[slug] }))
    .filter((e) => e.city && e.reading && typeof e.reading.rain_24h_mm === 'number');

  const propagation = PROPAGATION_HOURS[selectedCity.slug];

  const hasAnyData = currentLevel !== null;

  return (
    <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-5 shadow-xl transition-colors border">
      <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 tracking-wider uppercase mb-3">
        Cenário Hidrológico da Bacia
      </h3>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-xs dark:text-slate-400 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Reunindo dados da bacia...
        </div>
      ) : !hasAnyData ? (
        <p className="text-xs dark:text-slate-400 text-slate-500">
          Dados insuficientes no momento para {cityName}.
        </p>
      ) : (
        <div className="text-[13px] leading-relaxed dark:text-slate-300 text-slate-700 space-y-3">
          {/* 1. LEITURA LOCAL */}
          <p className="flex items-start gap-2">
            {effectiveRate !== null && effectiveRate > 0.02 ? (
              <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            ) : effectiveRate !== null && effectiveRate < -0.02 ? (
              <TrendingDown className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <Minus className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
            )}
            <span>
              O {river} em <strong className="notranslate" translate="no">{cityName}</strong>{' '}
              {effectiveRate !== null && Math.abs(effectiveRate) > 0.02 ? (
                <>
                  {effectiveRate > 0 ? 'subiu' : 'desceu'} <strong>{formatCm(Math.abs(effectiveRate) * Math.sign(effectiveRate))}</strong> na última hora
                </>
              ) : (
                <>está estável</>
              )}
              {currentLevel !== null && (
                <>, em <strong>{currentLevel.toFixed(2).replace('.', ',')} m</strong> às {formatHour(lastMs)}</>
              )}
              .
            </span>
          </p>

          {/* 2. CHUVA NAS CABECEIRAS */}
          <p className="flex items-start gap-2">
            <CloudRain className="w-4 h-4 shrink-0 mt-0.5 text-cyan-500" />
            <span>
              {rainEntries.length > 0 ? (
                <>
                  Chuva acumulada em 24h nas cabeceiras:{' '}
                  {rainEntries.map((e, i) => (
                    <React.Fragment key={e.slug}>
                      {i > 0 && ', '}
                      <span className="notranslate" translate="no">{e.city!.name}</span>{' '}
                      <strong>{e.reading!.rain_24h_mm!.toFixed(0)} mm</strong>
                    </React.Fragment>
                  ))}
                  .
                </>
              ) : (
                <>Sem dado de chuva das cabeceiras disponível no momento.</>
              )}
            </span>
          </p>

          {/* 3. VAZÃO DE BARRAGENS: sem fonte de dado real -> não inventamos número */}
          <p className="flex items-start gap-2 dark:text-slate-500 text-slate-400 text-[12px]">
            <Waves className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Vazão liberada por barragens a montante: sem fonte de dado integrada no momento.</span>
          </p>

          {/* 4. RIOS DE CABECEIRA */}
          {headwatersKnown.length > 0 && (
            <p className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
              <span>
                Nas cabeceiras,{' '}
                {risingHeadwaters.length > 0 ? (
                  <>
                    {risingHeadwaters.map((c, i) => (
                      <React.Fragment key={c.slug}>
                        {i > 0 && ', '}
                        <span className="notranslate" translate="no">{c.name}</span>{' '}
                        {typeof c.rate_of_change === 'number' && <>({formatCm(c.rate_of_change)})</>}
                      </React.Fragment>
                    ))}{' '}
                    {risingHeadwaters.length === 1 ? 'segue subindo' : 'seguem subindo'}
                    {fallingHeadwaters.length > 0 && (
                      <>
                        {' '}
                        — {fallingHeadwaters.map((c) => c.name).join(', ')}{' '}
                        {fallingHeadwaters.length === 1 ? 'já recua' : 'já recuam'}.
                      </>
                    )}
                    {fallingHeadwaters.length === 0 && '.'}
                  </>
                ) : (
                  <>nenhuma estação segue em elevação no momento{fallingHeadwaters.length > 0 ? ` — ${fallingHeadwaters.map((c) => c.name).join(', ')} em recuo.` : '.'}</>
                )}
              </span>
            </p>
          )}

          {/* 5. PROPAGAÇÃO E LEITURA CONJUNTA (não estatística) */}
          {propagation && (
            <p className="flex items-start gap-2 pt-1 border-t dark:border-slate-800/80 border-slate-200">
              <Timer className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                A onda de cheia das cabeceiras (Santa Tereza / Alto Taquari) leva de aproximadamente{' '}
                <strong>{propagation[0]} a {propagation[1]} horas</strong> para chegar a {cityName}.{' '}
                {risingHeadwaters.length > 0 ? (
                  <>
                    Como {risingHeadwaters.length === 1 ? 'a estação de cabeceira ainda está' : 'as cabeceiras ainda estão'} em elevação, é
                    esperado que o volume adicional se reflita em {cityName} dentro dessa janela — o que aponta para{' '}
                    {effectiveRate !== null && effectiveRate >= 0 ? 'manutenção da alta ou novo aumento' : 'possível nova elevação'} nas
                    próximas horas, além do que a taxa local isolada já sugere.
                  </>
                ) : fallingHeadwaters.length > 0 ? (
                  <>
                    Como as cabeceiras já iniciaram recuo, a tendência é de estabilização em {cityName} conforme essa frente mais fraca
                    for chegando, salvo nova chuva na bacia.
                  </>
                ) : (
                  <>Sem sinal de nova elevação nas cabeceiras no momento.</>
                )}
              </span>
            </p>
          )}

          <p className="text-[10px] dark:text-slate-500 text-slate-400 pt-1">
            Leitura qualitativa a partir de dados reais da bacia (nível, chuva e tendência das estações) e do tempo de
            deslocamento da onda de cheia já documentado para o Taquari — não é um modelo estatístico nem substitui os
            boletins oficiais da Defesa Civil e do SGB.
          </p>
        </div>
      )}
    </div>
  );
};
