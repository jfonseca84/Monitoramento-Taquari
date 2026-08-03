import { SupabaseService } from '../services/supabase.service.js';
import { LoggerService } from '../logs/logger.service.js';
import { CacheService } from '../services/cache.service.js';

export interface NewsSourceSchedule {
  times?: string[];
  time?: string;
  day_of_week?: number;
  count_per_day?: number;
}

export interface NewsSource {
  id: string;
  nome: string;
  descricao?: string;
  url: string;
  tipo: 'rss' | 'api' | 'html';
  ativo: boolean;
  frequencia: 'hourly' | 'multiple_daily' | 'daily' | 'weekly' | 'manual';
  horarios_configurados?: NewsSourceSchedule;
  categoria_padrao?: string;
  keywords_incluir?: string;
  keywords_ignorar?: string;
  importar_todas?: boolean;
  ultima_verificacao?: string | null;
  proxima_verificacao?: string | null;
  criado_em?: string;
}

export interface ParsedNewsItem {
  title: string;
  summary: string;
  content: string;
  link_original: string;
  image: string;
  category: 'Alertas' | 'Monitoramento' | 'Comunicados' | 'Meteorologia' | string;
  date: string;
  author: string;
}

export class NewsCollector {
  private static PREFIX = 'NewsCollector';

  /**
   * Main entry point called by CronService or API route.
   * STRICT RULE: If no sources are registered or active, do NOTHING.
   */
  public static async checkAndCollectNews(manualSourceId?: string): Promise<{
    processedSources: number;
    newArticlesCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let newArticlesCount = 0;
    let processedSources = 0;

    const supabase = SupabaseService.getClient();
    if (!supabase) {
      LoggerService.warn(this.PREFIX, 'Supabase não configurado. Pula coleta de notícias.');
      return { processedSources: 0, newArticlesCount: 0, errors: ['Supabase não configurado'] };
    }

    try {
      // 1. Fetch news sources
      let query = supabase.from('news_sources').select('*').eq('ativo', true);
      if (manualSourceId) {
        query = supabase.from('news_sources').select('*').eq('id', manualSourceId);
      }

      const { data: sources, error } = await query;

      if (error) {
        LoggerService.error(this.PREFIX, `Erro ao buscar fontes de notícias: ${error.message}`);
        return { processedSources: 0, newArticlesCount: 0, errors: [error.message] };
      }

      // STRICT RULE: If no active sources are found, exit immediately! No HTTP calls made!
      if (!sources || sources.length === 0) {
        LoggerService.info(this.PREFIX, 'Nenhuma fonte de notícias ativa configurada. Coleta ignorada.');
        return { processedSources: 0, newArticlesCount: 0, errors: [] };
      }

      const now = new Date();

      for (const source of sources as NewsSource[]) {
        // If not manual trigger, check if this source is due for collection
        if (!manualSourceId && !this.isSourceDue(source, now)) {
          continue;
        }

        LoggerService.info(this.PREFIX, `Coletando notícias da fonte: ${source.nome} (${source.url})`);
        processedSources++;

        try {
          const items = await this.fetchAndParseSource(source);
          if (items && items.length > 0) {
            const inserted = await this.saveNewArticles(source, items);
            newArticlesCount += inserted;
          }

          // Update source last check time and next check time
          const nextCheck = this.calculateNextCheck(source, now);
          await supabase
            .from('news_sources')
            .update({
              ultima_verificacao: now.toISOString(),
              proxima_verificacao: nextCheck ? nextCheck.toISOString() : null,
              atualizado_em: now.toISOString(),
            })
            .eq('id', source.id);

        } catch (sourceErr: any) {
          const errMsg = `Erro ao processar fonte "${source.nome}": ${sourceErr?.message || sourceErr}`;
          LoggerService.error(this.PREFIX, errMsg);
          errors.push(errMsg);
        }
      }

      if (newArticlesCount > 0) {
        LoggerService.info(this.PREFIX, `Novas notícias adicionadas: ${newArticlesCount}`);
        await CacheService.refreshTelemetryCache();
      }

      // Executa limpeza automática de notícias expiradas (mais de 7 dias e sem manter_permanente)
      await this.cleanupExpiredNews();

    } catch (e: any) {
      LoggerService.error(this.PREFIX, `Erro geral no NewsCollector: ${e?.message || e}`);
      errors.push(e?.message || String(e));
    }

    return { processedSources, newArticlesCount, errors };
  }

  /**
   * Verifica se a fonte deve ser executada no momento atual de acordo com a frequência.
   */
  private static isSourceDue(source: NewsSource, now: Date): boolean {
    if (source.frequencia === 'manual') {
      return false; // Manual sources never run automatically
    }

    if (!source.ultima_verificacao) {
      return true; // Never checked before -> due now
    }

    const lastCheck = new Date(source.ultima_verificacao);
    const diffMinutes = (now.getTime() - lastCheck.getTime()) / (1000 * 60);

    switch (source.frequencia) {
      case 'hourly':
        return diffMinutes >= 55;

      case 'multiple_daily': {
        const times = source.horarios_configurados?.times || [];
        if (times.length === 0) return diffMinutes >= 240; // Fallback: 4h
        
        // Get current HH:MM in Brasilia time
        const currentHHMM = this.getBrasiliaHHMM(now);
        for (const t of times) {
          if (this.isTimeWindow(currentHHMM, t, 15)) {
            // Check if lastCheck was before this time window today
            const checkTodayWindow = this.isSameDay(lastCheck, now) && this.getBrasiliaHHMM(lastCheck) >= t;
            if (!checkTodayWindow) return true;
          }
        }
        return diffMinutes >= 360; // Fallback 6h if missed window
      }

      case 'daily': {
        const targetTime = source.horarios_configurados?.time || '08:00';
        const currentHHMM = this.getBrasiliaHHMM(now);
        if (currentHHMM >= targetTime && !this.isSameDay(lastCheck, now)) {
          return true;
        }
        return diffMinutes >= 1400; // Fallback ~23h
      }

      case 'weekly': {
        const targetDay = source.horarios_configurados?.day_of_week ?? 1; // 1 = Monday
        const targetTime = source.horarios_configurados?.time || '08:00';
        const currentDay = now.getUTCDay(); // 0-6
        const currentHHMM = this.getBrasiliaHHMM(now);

        if (currentDay === targetDay && currentHHMM >= targetTime && diffMinutes >= 1000) {
          return true;
        }
        return diffMinutes >= 10000; // Fallback ~7 days
      }

      default:
        return false;
    }
  }

  /**
   * Calculations for next execution time display
   */
  private static calculateNextCheck(source: NewsSource, now: Date): Date | null {
    if (source.frequencia === 'manual') return null;

    const next = new Date(now.getTime());
    switch (source.frequencia) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'multiple_daily':
        next.setHours(next.getHours() + 6);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
    }
    return next;
  }

  /**
   * Helper to fetch and parse external news source
   */
  private static async fetchAndParseSource(source: NewsSource): Promise<ParsedNewsItem[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PortalMonitoramentoTaquari/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/json, text/html'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      if (source.tipo === 'rss' || text.includes('<rss') || text.includes('<feed') || text.includes('<?xml')) {
        return this.parseRssXml(text, source.nome);
      } else if (source.tipo === 'api' || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return this.parseJsonApi(text, source.nome);
      } else {
        return this.parseHtmlPage(text, source.url, source.nome);
      }

    } catch (e: any) {
      clearTimeout(timeout);
      throw e;
    }
  }

  /**
   * Parse RSS / Atom XML content
   */
  private static parseRssXml(xmlText: string, sourceName: string): ParsedNewsItem[] {
    const items: ParsedNewsItem[] = [];

    // Match <item> or <entry> blocks
    const itemMatches = xmlText.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) || [];

    for (const itemXml of itemMatches.slice(0, 10)) {
      const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
      const title = (titleMatch ? (titleMatch[1] || titleMatch[2]) : '').trim();

      const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i) ||
                         itemXml.match(/href=["']([^"']+)["']/i);
      const link = (linkMatch ? (linkMatch[1] || linkMatch[2] || linkMatch[0]) : '').trim();

      const descMatch = itemXml.match(/<(description|summary|content:encoded)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/\1>/i);
      const rawDesc = (descMatch ? (descMatch[2] || descMatch[3]) : '').trim();
      const cleanDesc = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      const dateMatch = itemXml.match(/<(pubDate|updated|dc:date)[^>]*>([\s\S]*?)<\/\1>/i);
      const rawDate = (dateMatch ? dateMatch[2] : '').trim();
      const formattedDate = this.formatPubDate(rawDate);

      // Extract image URL from enclosure, media:content, or img src inside description
      let image = '';
      const mediaMatch = itemXml.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|gif))["']/i) ||
                         itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i) ||
                         itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (mediaMatch) {
        image = mediaMatch[1];
      }

      if (title && title.length > 3) {
        const category = this.categorizeArticle(title, cleanDesc);
        items.push({
          title,
          summary: cleanDesc.slice(0, 240) + (cleanDesc.length > 240 ? '...' : ''),
          content: cleanDesc,
          link_original: link,
          image,
          category,
          date: formattedDate,
          author: sourceName
        });
      }
    }

    return items;
  }

  /**
   * Parse JSON API
   */
  private static parseJsonApi(jsonText: string, sourceName: string): ParsedNewsItem[] {
    const items: ParsedNewsItem[] = [];
    try {
      const parsed = JSON.parse(jsonText);
      const list = Array.isArray(parsed) ? parsed : (parsed.items || parsed.news || parsed.data || []);

      for (const raw of list.slice(0, 10)) {
        const title = raw.title || raw.titulo || raw.headline || '';
        const summary = raw.summary || raw.resumo || raw.description || raw.conteudo || '';
        const link = raw.url || raw.link || raw.link_original || '';
        const image = raw.image || raw.imagem || raw.image_url || '';
        const date = this.formatPubDate(raw.date || raw.data || raw.created_at || raw.published_at);

        if (title) {
          const cleanDesc = String(summary).replace(/<[^>]+>/g, ' ').trim();
          items.push({
            title,
            summary: cleanDesc.slice(0, 240) + (cleanDesc.length > 240 ? '...' : ''),
            content: cleanDesc,
            link_original: link,
            image,
            category: this.categorizeArticle(title, cleanDesc),
            date,
            author: sourceName
          });
        }
      }
    } catch (e) {
      LoggerService.warn(this.PREFIX, 'Erro ao interpretar JSON da API');
    }
    return items;
  }

  /**
   * Parse HTML Page
   */
  private static parseHtmlPage(htmlText: string, sourceUrl: string, sourceName: string): ParsedNewsItem[] {
    const items: ParsedNewsItem[] = [];

    // Simple OpenGraph / HTML Title extraction
    const titleMatch = htmlText.match(/<meta property="og:title" content="([^"]+)"/i) || htmlText.match(/<title>([^<]+)<\/title>/i);
    const descMatch = htmlText.match(/<meta property="og:description" content="([^"]+)"/i) || htmlText.match(/<meta name="description" content="([^"]+)"/i);
    const imgMatch = htmlText.match(/<meta property="og:image" content="([^"]+)"/i);

    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].trim();
      const summary = (descMatch ? descMatch[1] : '').trim();
      const image = imgMatch ? imgMatch[1] : '';

      items.push({
        title,
        summary: summary.slice(0, 240),
        content: summary,
        link_original: sourceUrl,
        image,
        category: this.categorizeArticle(title, summary),
        date: this.formatPubDate(new Date().toISOString()),
        author: sourceName
      });
    }

    return items;
  }

  /**
   * Classifica automaticamente a notícia com base em palavras-chave (helper para parsers)
   */
  private static categorizeArticle(title: string, content: string): string {
    return this.classifyArticle(
      { id: '', nome: '', url: '', tipo: 'rss', ativo: true, frequencia: 'hourly' },
      title,
      content
    ).category;
  }

  /**
   * Avalia se um artigo é relevante para a fonte com base nas regras configuradas
   */
  private static isArticleRelevant(source: NewsSource, item: ParsedNewsItem): boolean {
    // Se a opção "importar_todas" estiver ativa na fonte, importa sem filtrar por palavras-chave
    if (source.importar_todas) {
      return true;
    }

    const fullText = `${item.title} ${item.summary} ${item.content}`.toLowerCase();

    // 1. Termos de Bloqueio / Palavras-chave a ignorar
    if (source.keywords_ignorar && source.keywords_ignorar.trim().length > 0) {
      const ignoreTerms = source.keywords_ignorar
        .split(/[,;\n]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      for (const term of ignoreTerms) {
        if (fullText.includes(term)) {
          LoggerService.info(
            this.PREFIX,
            `Notícia "${item.title}" descartada: contém o termo ignorado "${term}".`
          );
          return false;
        }
      }
    }

    // 2. Palavras-chave de Inclusão
    if (source.keywords_incluir && source.keywords_incluir.trim().length > 0) {
      const includeTerms = source.keywords_incluir
        .split(/[,;\n]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const matchesInclude = includeTerms.some((term) => fullText.includes(term));
      if (!matchesInclude) {
        LoggerService.info(
          this.PREFIX,
          `Notícia "${item.title}" descartada: não contém palavras-chave de inclusão da fonte.`
        );
        return false;
      }
      return true;
    }

    // 3. Palavras-chave padrão do Vale do Taquari / Hidrologia caso não haja lista específica de inclusão
    const defaultRelevanceTerms = [
      'taquari', 'rio', 'enchente', 'cheia', 'inundação', 'inundacao', 'chuva', 'alerta',
      'emergência', 'emergencia', 'defesa civil', 'evacuação', 'evacuacao', 'nível', 'nivel',
      'cota', 'prefeitura', 'boletim', 'decreto', 'temporal', 'meteorologia', 'barragem',
      'deslizamento', 'deslisamento', 'alagamento', 'resgate', 'desabrigo', 'desalojo',
      'vazão', 'vazao', 'cpmets', 'defesa civil rs', 'interdição', 'ponte'
    ];

    const hasDefaultRelevance = defaultRelevanceTerms.some((term) => fullText.includes(term));
    if (!hasDefaultRelevance) {
      LoggerService.info(
        this.PREFIX,
        `Notícia "${item.title}" descartada: sem relevância temática identificada.`
      );
      return false;
    }

    return true;
  }

  /**
   * Classifica automaticamente Categoria e Criticidade/Prioridade da notícia
   */
  private static classifyArticle(source: NewsSource, title: string, content: string): {
    category: string;
    prioridade: 'baixa' | 'media' | 'alta';
  } {
    const text = `${title} ${content}`.toLowerCase();

    // Detecção de Categoria (com fallback para categoria_padrao da fonte)
    let category = source.categoria_padrao || 'Comunicados';

    if (
      text.includes('alerta') ||
      text.includes('emergência') ||
      text.includes('emergencia') ||
      text.includes('evacuação') ||
      text.includes('evacuacao') ||
      text.includes('deslizamento') ||
      text.includes('risco hidrológico') ||
      text.includes('cota de alerta') ||
      text.includes('cota de inundação')
    ) {
      category = 'Alertas';
    } else if (
      text.includes('enchente') ||
      text.includes('cheia') ||
      text.includes('inundação') ||
      text.includes('inundacao') ||
      text.includes('rio') ||
      text.includes('monitoramento') ||
      text.includes('nível do rio') ||
      text.includes('nivel do rio') ||
      text.includes('cota') ||
      text.includes('vazão')
    ) {
      category = 'Monitoramento';
    } else if (
      text.includes('meteorologia') ||
      text.includes('previsão') ||
      text.includes('previsao') ||
      text.includes('frente fria') ||
      text.includes('cpmets') ||
      text.includes('temporais') ||
      text.includes('volume de chuva')
    ) {
      category = 'Meteorologia';
    } else if (
      text.includes('defesa civil') ||
      text.includes('prefeitura') ||
      text.includes('comunicado') ||
      text.includes('boletim') ||
      text.includes('decreto')
    ) {
      category = 'Comunicados';
    }

    // Detecção de Criticidade / Prioridade
    let prioridade: 'baixa' | 'media' | 'alta' = 'media';

    if (
      text.includes('alerta vermelho') ||
      text.includes('emergência') ||
      text.includes('emergencia') ||
      text.includes('evacuação') ||
      text.includes('evacuacao') ||
      text.includes('risco alto') ||
      text.includes('cota de inundação') ||
      text.includes('cota de inundacao') ||
      text.includes('transbordamento') ||
      text.includes('desastre') ||
      text.includes('perigo iminente')
    ) {
      prioridade = 'alta';
    } else if (
      text.includes('dicas') ||
      text.includes('orientação') ||
      text.includes('historico') ||
      text.includes('histórico')
    ) {
      prioridade = 'baixa';
    }

    return { category, prioridade };
  }

  /**
   * Anti-duplicação e filtragem: salva apenas notícias relevantes que não existem no banco
   */
  private static async saveNewArticles(source: NewsSource, items: ParsedNewsItem[]): Promise<number> {
    const supabase = SupabaseService.getClient();
    if (!supabase) return 0;

    let newCount = 0;

    for (const item of items) {
      // 1. Filtragem de Relevância
      if (!this.isArticleRelevant(source, item)) {
        continue;
      }

      // Check if article already exists by link_original or title
      let query = supabase.from('news').select('id');
      if (item.link_original) {
        query = query.eq('link_original', item.link_original);
      } else {
        query = query.eq('title', item.title);
      }

      const { data: existing } = await query;

      if (existing && existing.length > 0) {
        continue; // Duplicate -> ignore
      }

      // 2. Classificação Automática
      const { category, prioridade } = this.classifyArticle(
        source,
        item.title,
        `${item.summary} ${item.content}`
      );

      const defaultImage = item.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: insertErr } = await supabase.from('news').insert({
        title: item.title,
        summary: item.summary,
        content: item.content || item.summary,
        category: category,
        image: defaultImage,
        author: item.author || source.nome,
        date: item.date,
        published: true,
        link_original: item.link_original,
        fonte: source.nome,
        source_id: source.id,
        manter_permanente: false,
        exibir_no_menu: true,
        prioridade: prioridade,
        expires_at: expiresAt
      });

      if (!insertErr) {
        newCount++;
      } else {
        LoggerService.warn(this.PREFIX, `Erro ao inserir notícia "${item.title}": ${insertErr.message}`);
      }
    }

    return newCount;
  }

  /**
   * Limpeza automática: remove notícias coletadas há mais de 7 dias se manter_permanente for falso
   */
  public static async cleanupExpiredNews(): Promise<number> {
    const supabase = SupabaseService.getClient();
    if (!supabase) return 0;

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: expired, error } = await supabase
        .from('news')
        .delete()
        .eq('manter_permanente', false)
        .lt('created_at', sevenDaysAgo)
        .select('id');

      if (!error && expired && expired.length > 0) {
        LoggerService.info(this.PREFIX, `Limpeza automática: ${expired.length} notícia(s) expirada(s) (mais de 7 dias) removida(s).`);
        return expired.length;
      }
    } catch (err: any) {
      LoggerService.warn(this.PREFIX, `Aviso na limpeza de notícias expiradas: ${err?.message || err}`);
    }
    return 0;
  }

  private static formatPubDate(rawDateStr?: string): string {
    if (!rawDateStr) return new Date().toLocaleDateString('pt-BR');
    try {
      const d = new Date(rawDateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {}
    return new Date().toLocaleDateString('pt-BR');
  }

  private static getBrasiliaHHMM(d: Date): string {
    return d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  private static isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate()
    );
  }

  private static isTimeWindow(currentTime: string, targetTime: string, windowMinutes: number): boolean {
    const [cH, cM] = currentTime.split(':').map(Number);
    const [tH, tM] = targetTime.split(':').map(Number);
    const cTotal = cH * 60 + cM;
    const tTotal = tH * 60 + tM;
    return Math.abs(cTotal - tTotal) <= windowMinutes;
  }
}
