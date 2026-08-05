# Relatório de Migração e Auditoria Técnica: Supabase Cron -> River Monitor Worker

## 1. Visão Geral da Arquitetura

### Antes (Dependente do Agendador Supabase):
```
Fonte dos Dados (Guerreiros do Humaitá / Nível Guaíba)
       ↓
Supabase Cron (pg_cron)
       ↓
Edge Function (collect-river-data)
       ↓
Banco Supabase (cities / river_levels / sync_logs)
       ↓
Frontend React
```

### Depois (Backend Worker com Agendador Interno):
```
Fonte dos Dados (Guerreiros do Humaitá / Nível Guaíba)
       ↓
river-monitor-worker (Node.js + node-cron)
       ├── ValidationService (Validação de Schemas e Faixas Reais)
       ├── Concurrency Lock (Proteção contra Sobreposição de Ciclos)
       ├── RiverCollector (Mapeamento de Aliases e Thresholds)
       └── AuditService & HealthService (Auditoria e Telemetria)
       ↓
Banco Supabase (cities / river_levels / sync_logs)
       ↓
Frontend React
```

---

## 2. Mapeamento de Arquivos e Estrutura

### Arquivos Mantidos no Projeto
- `supabase/functions/collect-river-data/index.ts` (Mantido para retrocompatibilidade ou execução de fallback via webhook)
- `src/lib/supabase.ts` (Mantido intacto para o Frontend continuar consumindo os dados diretamente do Supabase)
- `src/App.tsx` e componentes visuais (`LevelChart.tsx`, `CitySidebar.tsx`, etc.)

### Arquivos Novos Criados
- `river-updater/src/logs/logger.service.ts` - Serviço centralizado de logs com níveis (INFO, WARN, ERROR, DEBUG) e timestamps
- `river-updater/src/services/supabase.service.ts` - Interface unificada de comunicação administrativa com o Supabase
- `river-updater/src/services/validation.service.ts` - Validação de payloads, timestamps, níveis plausíveis (-5m a 40m) e deduplicação
- `river-updater/src/services/audit.service.ts` - Gravação de logs de auditoria detalhados na tabela `sync_logs`
- `river-updater/src/services/health.service.ts` - Telemetria de integridade do worker (versão, status de trava, última execução e próxima prevista)
- `river-updater/src/collectors/river.collector.ts` - Coletor principal com preservação de todas as 17 cidades oficiais, aliases, cotas de referência e retentativas com timeout
- `river-updater/src/scheduler/cron.service.ts` - Agendador interno (`node-cron`) com trava contra concorrência (`isExecuting`)
- `river-updater/src/sync.ts` - Script CLI de acionamento manual imediato (`npm run sync`)
- `river-updater/src/tests/worker.test.ts` - Suíte de testes unitários e de integração do worker
- `river-updater/README.md` - Documentação operacional completa para desenvolvimento e produção
- `migration_check.md` - Este documento de auditoria e controle de riscos

---

## 3. Matriz de Paridade Técnica e Regras de Negócio

| Critério | Edge Function Antiga (`collect-river-data`) | Novo Worker (`river-monitor-worker`) | Status |
| :--- | :--- | :--- | :---: |
| **Estações Consultadas** | 17 Cidades do Vale do Taquari e Bacia do Guaíba | 17 Cidades do Vale do Taquari e Bacia do Guaíba | ✅ 100% Idêntico |
| **Fontes Externas** | `niveldosrios.guerreirosdohumaita.com.br` e `nivelguaiba.com.br` | `niveldosrios.guerreirosdohumaita.com.br` e `nivelguaiba.com.br` | ✅ 100% Idêntico |
| **Aliasing de Nomes** | Tabela `CITY_ALIASES` (ex: `guaiba` -> `portoalegre`) | Tabela `CITY_ALIASES` (ex: `guaiba` -> `portoalegre`) | ✅ 100% Idêntico |
| **Cotas de Referência** | Normal, Atenção, Alerta, Inundação por município | Normal, Atenção, Alerta, Inundação por município | ✅ 100% Idêntico |
| **Campos Gravados** | `current_level`, `trend`, `rate_of_change`, `status_level`, `recorded_at` | `current_level`, `trend`, `rate_of_change`, `status_level`, `recorded_at` | ✅ 100% Idêntico |
| **Deduplicação** | Conjunto em memória `${station_id}_${recorded_at}` | Conjunto em memória `${station_id}_${recorded_at}` | ✅ 100% Idêntico |
| **Proteção de Concorrência** | Não possuía | **Ativa (`isExecuting` Mutex Lock)** | 🚀 Melhoria |
| **Execução Manual** | Apenas via requisição HTTP externa | `npm run sync` | 🚀 Melhoria |

---

## 4. Análise de Riscos e Mitigações

1. **Risco**: Instabilidade na rede durante consulta às APIs oficiais de telemetria.
   - **Mitigação**: O worker implementa `fetchWithRetry` com `AbortController` (timeout de 10 segundos) e até 3 tentativas exponenciais por fonte.
2. **Risco**: Execuções simultâneas em ambientes containerizados ou durante picos de lentidão.
   - **Mitigação**: O agendador `CronService` possui trava atômica em memória (`isExecuting`). Se um ciclo estiver em andamento, o novo disparo do cron é bloqueado imediatamente, registrando o evento no log de auditoria.
3. **Risco**: Falha nas variáveis de ambiente em produção.
   - **Mitigação**: `SupabaseService.testConnection()` valida o acesso ao banco na inicialização e o script `predeploy-check.ts` bloqueia implantações sem credenciais adequadas.

---

## 5. Plano de Rollback

Caso ocorra qualquer imprevisto com o worker backend em ambiente de produção:

1. **Ativação Emergencial do Supabase Cron**:
   Ressubmeter a migration `014_supabase_cron_setup.sql` no painel do Supabase SQL Editor para reativar a chamada de 5 em 5 minutos à Edge Function original.
2. **Parada do Worker**:
   Interromper o processo `river-monitor-worker` no servidor (ex: `pm2 stop river-monitor-worker` ou desacelerar o container no Cloud Run).
3. **Impacto no Frontend**: Zero. Como o banco de dados Supabase é a fonte única da verdade (Single Source of Truth) para o frontend, a interface continuará funcionando normalmente sem qualquer alteração de código ou redesplegue no React.
