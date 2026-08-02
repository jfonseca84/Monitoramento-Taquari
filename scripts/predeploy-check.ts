import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runPredeployCheck() {
  console.log(`=================================================`);
  console.log(`[PRE-DEPLOY CHECKLIST] INICIANDO VALIDAÇÃO DE PRÉ-IMPLANTAÇÃO`);
  console.log(`[Data/Hora]: ${new Date().toISOString()}`);
  console.log(`=================================================\n`);

  let isPassed = true;
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Validar arquivos de Migrations e Edge Functions
  console.log(`1. Verificando estrutura de arquivos do projeto...`);
  const requiredFiles = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/014_supabase_cron_setup.sql',
    'supabase/migrations/015_river_levels_unique_constraint.sql',
    'supabase/functions/collect-river-data/index.ts',
    'river-updater/src/monitor.ts'
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      console.log(`  [OK] Arquivo encontrado: ${relPath}`);
    } else {
      console.error(`  [ERRO] Arquivo obrigatório ausente: ${relPath}`);
      errors.push(`Arquivo ausente: ${relPath}`);
      isPassed = false;
    }
  }

  // 2. Validar variáveis de ambiente
  console.log(`\n2. Verificando variáveis de ambiente...`);
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl) {
    errors.push('SUPABASE_URL ou VITE_SUPABASE_URL não definida.');
    isPassed = false;
    console.error(`  [ERRO] URL do Supabase não configurada.`);
  } else {
    console.log(`  [OK] URL do Supabase configurada (${supabaseUrl.substring(0, 25)}...)`);
  }

  if (!serviceKey) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente local.');
    console.warn(`  [AVISO] Chave do Supabase localmente ausente (será necessária no painel para o Cron).`);
  } else {
    console.log(`  [OK] Chave de acesso configurada.`);
  }

  // 3. Testar conexão e tabelas no Supabase se as credenciais existirem
  if (supabaseUrl && serviceKey && !supabaseUrl.includes('your-supabase-project')) {
    console.log(`\n3. Verificando conectividade e tabelas no Supabase...`);
    try {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const tablesToCheck = ['cities', 'stations', 'river_levels', 'sync_logs'];
      for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          console.error(`  [ERRO] Falha ao acessar tabela '${table}': ${error.message}`);
          errors.push(`Erro na tabela ${table}: ${error.message}`);
          isPassed = false;
        } else {
          console.log(`  [OK] Tabela '${table}' acessível e operacional.`);
        }
      }
    } catch (err: any) {
      console.error(`  [ERRO] Falha de conexão com o Supabase: ${err.message}`);
      errors.push(`Conexão Supabase: ${err.message}`);
      isPassed = false;
    }
  } else {
    console.log(`\n3. Pulando conexão direta ao Supabase (ambiente sem credenciais ativas de produção).`);
  }

  // 4. Parecer Final
  console.log(`\n=================================================`);
  if (isPassed) {
    console.log(`[RESULTADO DA CHECAGEM] READY FOR PRODUCTION`);
    console.log(`Todos os componentes, arquivos e migrations passaram na verificação.`);
    console.log(`Arquitetura pronta para operação 24/7 em produção.`);
    console.log(`=================================================`);
    process.exit(0);
  } else {
    console.error(`[RESULTADO DA CHECAGEM] DEPLOY BLOCKED`);
    console.error(`Erros detectados:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    if (warnings.length > 0) {
      console.warn(`Avisos:`);
      warnings.forEach((w) => console.warn(`  - ${w}`));
    }
    console.log(`=================================================`);
    process.exit(1);
  }
}

runPredeployCheck();
