# River Updater - Serviço Autônomo de Telemetria Hidrológica

Serviço em Node.js e TypeScript **totalmente independente do Frontend**, responsável por coletar dados em tempo real das estações hidrológicas do Rio Taquari e persistir as medições e históricos diretamente no Supabase.

---

## 📋 Estrutura do Projeto

```
river-updater/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── src/
    └── index.ts
```

---

## ⚙️ Principais Recursos e Requisitos

1. **Execução Independente**: Funciona isoladamente via linha de comando (CLI) ou agendador Cron, sem qualquer dependência do pacote do frontend.
2. **Uso Exclusivo de `SUPABASE_SERVICE_ROLE_KEY`**: Exige obrigatoriamente a chave administrativa com bypass de RLS para gravação nas tabelas `cities`, `river_levels` e `sync_logs`.
3. **Mecanismo de Retry com Backoff Exponencial**: Repete automaticamente requisições HTTP em caso de instabilidades temporárias da fonte oficial ou do servidor.
4. **Prevenção de Duplicatas**: Valida o timestamp e nível da última medição cadastrada para a cidade antes de inserir novos registros em `river_levels`.
5. **Auditoria em `sync_logs`**: Registra duração da execução, contagem de atualizações, duplicatas desconsideradas, erros e status (`sucesso`, `warning` ou `erro`).

---

## 🛠️ Configuração de Variáveis de Ambiente

Crie o arquivo `.env` na raiz da pasta `river-updater` baseado no `.env.example`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-do-supabase
OFFICIAL_SOURCE_URL=https://niveldosrios.guerreirosdohumaita.com.br/
```

> ⚠️ **Importante**: Nunca compartilhe ou faça commit da `SUPABASE_SERVICE_ROLE_KEY` publicamente.

---

## 🚀 Como Executar Localmente

```bash
# 1. Entre no diretório do serviço
cd river-updater

# 2. Instale as dependências
npm install

# 3. Execute a sincronização manual
npm start
```

---

## ⏰ Agendamento e Deploy (Cron Job)

### Opção A: Linux Crontab (Servidor / VPS / Hostinger)

```cron
# Executar a cada 15 minutos e salvar logs em arquivo
*/15 * * * * cd /caminho/para/river-updater && /usr/bin/npm start >> /var/log/river-updater.log 2>&1
```

### Opção B: GitHub Actions Workflow (`.github/workflows/river-updater.yml`)

```yaml
name: River Updater Sync Cron

on:
  schedule:
    - cron: '*/15 * * * *' # A cada 15 minutos
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - name: Install Dependencies
        run: cd river-updater && npm install
      - name: Run Telemetry Sync
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          OFFICIAL_SOURCE_URL: ${{ secrets.OFFICIAL_SOURCE_URL }}
        run: cd river-updater && npm start
```
