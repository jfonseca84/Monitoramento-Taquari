# River Monitor Worker (`river-monitor-worker`)

Serviço backend autônomo, robusto e profissional para coleta, validação, auditoria e atualização contínua de dados hidrológicos das bacias do Rio Taquari e Rio Guaíba no Supabase.

---

## 🏗️ Arquitetura do Sistema

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
Frontend React (Interface de Monitoramento)
```

---

## 🚀 Instalação e Configuração

### 1. Requisitos Prévios
- **Node.js**: v22.0.0 ou superior
- **NPM**: v10.0.0 ou superior
- **Projeto Supabase** configurado com as tabelas `cities`, `stations`, `river_levels` e `sync_logs`.

### 2. Instalação das Dependências
Navegue até o diretório do worker e instale os pacotes:

```bash
cd river-updater
npm install
```

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do diretório `river-updater` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o `.env` preenchendo as credenciais do seu Supabase:

```env
# URL do seu projeto Supabase
SUPABASE_URL=https://seu-projeto.supabase.co

# Chave Service Role do Supabase (Acesso Administrativo)
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Intervalo do Agendador Cron Interno (padrão: a cada 5 minutos)
CRON_INTERVAL=*/5 * * * *

# Versão do Worker
WORKER_VERSION=1.0.0

# Fontes Oficiais de Telemetria
OFFICIAL_SOURCE_URL=https://niveldosrios.guerreirosdohumaita.com.br/
GUAIBASOURCE_URL=https://nivelguaiba.com.br/
```

---

## 💻 Execução Local

### 1. Iniciar o Worker Contínuo (Modo Daemon com Agendador Cron)
Executa a sincronização inicial e ativa o agendador interno `node-cron`:

```bash
npm start
```

### 2. Execução Manual de Teste (Modo Sincronização Imediata)
Executa um único ciclo completo de coleta, exibe o relatório no console e encerra:

```bash
npm run sync
```

### 3. Auditoria de Integridade e Status
Consulta as tabelas do Supabase e relata se há estagnação de dados ou atraso nas medições das cidades:

```bash
npm run monitor
```

### 4. Suíte de Testes Unitários e de Integração
Executa a suíte de testes de validação de dados, casamento de aliases e conexão ao Supabase:

```bash
npm test
```

---

## 🎛️ Estrutura do Código Modular

```
/river-updater/src
├── /collectors
│   └── river.collector.ts      # Coletor principal com tratamento de cotas e aliases
├── /logs
│   └── logger.service.ts       # Serviço unificado de logs com níveis e timestamps
├── /scheduler
│   └── cron.service.ts         # Agendador interno node-cron com trava de concorrência
├── /services
│   ├── audit.service.ts        # Registro de histórico de auditoria no Supabase (sync_logs)
│   ├── health.service.ts       # Telemetria e estatísticas de integridade do worker
│   ├── supabase.service.ts     # Cliente Supabase e queries otimizadas em lote
│   └── validation.service.ts   # Validação rigorosa de payloads e deduplicação
├── /tests
│   └── worker.test.ts          # Suíte de testes automatizados
├── index.ts                    # Entry point do serviço contínuo (npm start)
├── monitor.ts                  # Auditoria independente (npm run monitor)
└── sync.ts                     # Modo de execução CLI imediato (npm run sync)
```

---

## 🔒 Proteção Contra Concorrência (Mutex Lock)

O worker possui proteção embutida contra execução concorrente. Caso um ciclo de coleta ultrapasse o tempo limite e o agendador `node-cron` tente disparar uma nova verificação, o sistema detecta o estado `isExecuting = true`, bloqueia o disparo sobreposto e registra um alerta no log de auditoria, garantindo a integridade do banco de dados.

---

## 🌐 Implantação em Servidor 24/7 (Produção)

### Opção A: Execução via PM2 (Recomendado para VPS / EC2)

```bash
npm install -g pm2
cd river-updater
pm2 start "npm start" --name "river-monitor-worker"
pm2 save
pm2 startup
```

Para verificar logs no PM2:
```bash
pm2 logs river-monitor-worker
```

### Opção B: Docker Container

Dockerfile de referência:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

---

## 📊 Verificação de Logs e Auditoria no Supabase

Cada execução realizada pelo `river-monitor-worker` grava um registro na tabela `sync_logs` do Supabase contendo:

- `sync_time`: Data e horário UTC da execução.
- `duration_ms`: Tempo total de processamento em milissegundos.
- `updated_count`: Quantidade de medições de nível inseridas.
- `status`: `sucesso`, `warning` ou `erro`.
- `message`: Resumo descritivo da execução.
- `details`: Objeto JSON com contadores detalhados de fontes consultadas, medições ignoradas (duplicadas) e eventuais erros.
