// Confere se o nível mostrado no site bate com o que a fonte de cada cidade publica agora.
// Somente leitura: não escreve em nenhum lugar.
//
// Uso:  node scripts/verify-site.mjs [URL_DO_SITE]      (padrão: https://nivelriotaquari.com.br)
// Saída: tabela por cidade; código de saída 1 se alguma cidade divergir (útil para agendar/alertar).

const SITE = (process.argv[2] || 'https://nivelriotaquari.com.br').replace(/\/$/, '');
const TOLERANCE_M = 0.02; // diferença aceita entre o site e a fonte (m)
const STALE_MIN = 60;     // acima disso a fonte está sem leitura nova

// Slug de cada cidade em cada fonte. Estrela e Cruzeiro do Sul usam a régua de Lajeado no nivelguaiba.
const GUAIBA = {
  'Santa Tereza': 'santatereza', 'Muçum': 'mucum', 'São Leopoldo': 'saoleopoldo', 'Encantado': 'encantado',
  'Roca Sales': 'rocasales', 'São Sebastião do Caí': 'saosebastiaodocai', 'Taquara': 'taquara',
  'Dona Francisca': 'donafrancisca', 'Cachoeira do Sul': 'cachoeiradosul', 'Taquari': 'taquari', 'Feliz': 'feliz',
  'Rio Pardo': 'riopardo', 'Estrela': 'lajeado', 'Bom Retiro do Sul': 'bomretirodosul', 'Gravataí': 'gravatai',
  'Lajeado': 'lajeado', 'Montenegro': 'montenegro', 'Cruzeiro do Sul': 'lajeado', 'Porto Alegre': 'portoalegre',
};
const ANA = {
  'Linha Colombo': '86560000', 'Passo Tainhas': '86160000', 'Barra do Fão': '86780000',
  'Passo Carreiro': '86500000', 'Linha José Júlio': '86472000', 'Porto Mariante': '86895000',
};
// Cidades em que a fonte precisa ser a indicada (outras fontes usam outra régua). Espelha PREFERRED_SOURCE do coletor.
const EXPECTED_SOURCE = { 'Roca Sales': 'nivelguaiba', 'Cachoeira do Sul': 'nivelguaiba', 'Porto Alegre': 'guerreiros' };

const get = async (url, as = 'json') => {
  const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return as === 'json' ? r.json() : r.text();
};
const brDate = (d) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const brMs = (s) => new Date(s.replace(' ', 'T') + '-03:00').getTime();

async function fromGuaiba(slug) {
  const j = await get(`https://nivelguaiba.com.br/${slug}.json`);
  const keys = Object.keys(j).sort();
  const last = keys[keys.length - 1];
  return { level: Number(j[last]), ageMin: Math.round((Date.now() - brMs(last)) / 60000) };
}

async function fromAna(code) {
  const xml = await get(
    `https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?CodEstacao=${code}` +
      `&DataInicio=${encodeURIComponent(brDate(new Date(Date.now() - 864e5)))}&DataFim=${encodeURIComponent(brDate(new Date()))}`,
    'text'
  );
  const rows = [...xml.matchAll(/<DadosHidrometereologicos[^>]*>([\s\S]*?)<\/DadosHidrometereologicos>/g)]
    .map((b) => ({
      dt: /<DataHora>\s*([^<]*?)\s*<\/DataHora>/.exec(b[1])?.[1],
      n: /<Nivel>\s*([^<]*?)\s*<\/Nivel>/.exec(b[1])?.[1],
    }))
    .filter((x) => x.dt && x.n && x.n.trim())
    .sort((a, b) => (a.dt < b.dt ? -1 : 1));
  const last = rows[rows.length - 1];
  return { level: Number(last.n) / 100, ageMin: Math.round((Date.now() - brMs(last.dt)) / 60000) };
}

let guerreiros = {};
async function loadGuerreiros() {
  const j = await get('https://niveldosrios.guerreirosdohumaita.com.br/api/stations');
  for (const s of Array.isArray(j) ? j : j.stations) guerreiros[s.slug] = Number(s.level);
}

const slugify = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const site = await get(`${SITE}/api/telemetry`);
await loadGuerreiros().catch((e) => console.warn(`(aviso) guerreiros indisponível: ${e.message}`));

console.log(`Site: ${SITE} | cache do site: ${site.cachedAt}\n`);
console.log('cidade'.padEnd(22), 'site'.padEnd(7), 'fonte'.padEnd(7), 'origem'.padEnd(12), 'idade fonte'.padEnd(12), 'resultado');

let failures = 0;
for (const c of site.cities) {
  const candidates = []; // { origin, level, ageMin }
  const tasks = [];
  if (GUAIBA[c.name]) tasks.push(fromGuaiba(GUAIBA[c.name]).then((r) => candidates.push({ origin: 'nivelguaiba', ...r })));
  if (ANA[c.name]) tasks.push(fromAna(ANA[c.name]).then((r) => candidates.push({ origin: 'ana', ...r })));
  await Promise.allSettled(tasks);
  const g = guerreiros[slugify(c.name)];
  if (g !== undefined && !isNaN(g)) candidates.push({ origin: 'guerreiros', level: g, ageMin: null });

  const expected = EXPECTED_SOURCE[c.name];
  const pool = expected ? candidates.filter((x) => x.origin === expected) : candidates;
  if (pool.length === 0) {
    failures++;
    console.log(c.name.padEnd(22), String(c.current_level).padEnd(7), '-'.padEnd(7), '-'.padEnd(12), '-'.padEnd(12), 'SEM FONTE consultável');
    continue;
  }
  // O site pode estar atrás da fonte em até 1 ciclo; compara com a fonte que mais se aproxima do valor exibido.
  const best = pool.reduce((a, b) => (Math.abs(b.level - c.current_level) < Math.abs(a.level - c.current_level) ? b : a));
  const diff = Math.abs(best.level - c.current_level);
  const ok = diff <= TOLERANCE_M;
  const stale = best.ageMin !== null && best.ageMin > STALE_MIN;
  if (!ok) failures++;
  const status = ok ? (stale ? `ok (fonte parada há ${best.ageMin} min)` : 'ok') : `DIVERGE (Δ ${diff.toFixed(2)} m)`;
  console.log(
    c.name.padEnd(22), String(c.current_level).padEnd(7), best.level.toFixed(2).padEnd(7), best.origin.padEnd(12),
    (best.ageMin === null ? 'n/d' : `${best.ageMin} min`).padEnd(12), status
  );
}

console.log(`\n${site.cities.length - failures}/${site.cities.length} cidades conferem com a fonte (tolerância ${TOLERANCE_M} m).`);
process.exit(failures > 0 ? 1 : 0);
