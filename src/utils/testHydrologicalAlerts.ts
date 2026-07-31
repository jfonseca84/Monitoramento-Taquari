import { AlertSubscriber } from '../types';
import { processHydrologicalMeasurement, approveAlertHistory, sendHydrologicalAlert } from '../lib/supabase';

// Mock subscribers list representing Lajeado residents across various cotas
export const MOCK_TEST_SUBSCRIBERS: AlertSubscriber[] = [
  {
    id: 'sub-lajeado-15m',
    nome_completo: 'Morador Cota 15m (Área Muito Baixa)',
    email: 'cota15@exemplo.com',
    whatsapp: '51999990015',
    cidade: 'lajeado',
    bairro: 'Centro Baixo',
    cota_residencia: 15.0,
    receber_alertas: true
  },
  {
    id: 'sub-lajeado-18m',
    nome_completo: 'Morador Cota 18m (Bairro Praia)',
    email: 'cota18@exemplo.com',
    whatsapp: '51999990018',
    cidade: 'lajeado',
    bairro: 'Praia',
    cota_residencia: 18.0,
    receber_alertas: true
  },
  {
    id: 'sub-lajeado-19m',
    nome_completo: 'Morador Cota 19m (Bairro Conservas)',
    email: 'cota19@exemplo.com',
    whatsapp: '51999990019',
    cidade: 'lajeado',
    bairro: 'Conservas',
    cota_residencia: 19.0,
    receber_alertas: true
  },
  {
    id: 'sub-lajeado-22m',
    nome_completo: 'Morador Cota 22m (Bairro Santo Antônio)',
    email: 'cota22@exemplo.com',
    whatsapp: '51999990022',
    cidade: 'lajeado',
    bairro: 'Santo Antônio',
    cota_residencia: 22.0,
    receber_alertas: true
  },
  {
    id: 'sub-lajeado-24m',
    nome_completo: 'Morador Cota 24m (Bairro Americano)',
    email: 'cota24@exemplo.com',
    whatsapp: '51999990024',
    cidade: 'lajeado',
    bairro: 'Americano',
    cota_residencia: 24.0,
    receber_alertas: true
  },
  {
    id: 'sub-lajeado-28m',
    nome_completo: 'Morador Cota 28m (Área Alta - Florestal)',
    email: 'cota28@exemplo.com',
    whatsapp: '51999990028',
    cidade: 'lajeado',
    bairro: 'Florestal',
    cota_residencia: 28.0,
    receber_alertas: true
  }
];

export function filterImpactedSubscribers(
  subscribers: AlertSubscriber[],
  citySlug: string,
  simulatedLevel: number
) {
  return subscribers.filter(s => {
    const isCity = (s.cidade || s.city_slug) === citySlug;
    const isActive = s.receber_alertas ?? s.active ?? true;
    const cota = Number(s.cota_residencia || 0);
    return isCity && isActive && cota > 0 && cota <= simulatedLevel;
  });
}

export async function runHydrologicalAlertsTestSuite() {
  console.log('====================================================');
  console.log('🧪 SUÍTE DE TESTES: MONITORAMENTO AUTOMÁTICO & ALERTAS');
  console.log('====================================================\n');

  // TESTE 1: Lajeado passando de 13,00m para 15,50m (Normal -> Atenção)
  console.log('▶️ TESTE 1: Lajeado subindo de 13,00m (Normal) para 15,50m (Atenção)...');
  
  // 1a. Com 13,00m (Normal - Abaixo da cota de atenção de 15m)
  const alert1300 = await processHydrologicalMeasurement('lajeado', 13.00, MOCK_TEST_SUBSCRIBERS);
  console.log('- Com 13,00m (Normal): Alerta gerado?', alert1300 !== null ? 'Sim' : 'Não (Correto)');

  // 1b. Com 15,50m (Atingiu cota de Atenção de 15m)
  const alert1550 = await processHydrologicalMeasurement('lajeado', 15.50, MOCK_TEST_SUBSCRIBERS);
  console.log('- Com 15,50m (Atenção): Alerta gerado com status pendente?', {
    id: alert1550?.id,
    cidade: alert1550?.cidade,
    nivel_rio: alert1550?.nivel_rio,
    tipo_alerta: alert1550?.tipo_alerta,
    atingidos: alert1550?.quantidade_usuarios_atingidos,
    enviado: alert1550?.enviado
  });

  const test1Passed = alert1300 === null && alert1550 !== null && alert1550.tipo_alerta === 'atenção' && alert1550.enviado === false;
  console.log(test1Passed ? '✅ PASSOU: Criou alerta pendente para a mudança de faixa (Normal -> Atenção).\n' : '❌ FALHOU no teste 1.\n');

  // TESTE 2: Anti-duplicação - Nova medição de 15,60m na mesma categoria Atenção
  console.log('▶️ TESTE 2: Nova medição em 15,60m (Mesma faixa de Atenção)...');
  const alert1560 = await processHydrologicalMeasurement('lajeado', 15.60, MOCK_TEST_SUBSCRIBERS);
  console.log('- Alerta duplicado gerado com 15,60m?', alert1560 !== null ? 'SIM (Incorreto)' : 'NÃO (Correto - Bloqueado pelo controle de duplicidade)');

  const test2Passed = alert1560 === null;
  console.log(test2Passed ? '✅ PASSOU: Não gerou alerta duplicado na mesma faixa.\n' : '❌ FALHOU no teste 2 de anti-duplicação.\n');

  // TESTE 3: Lajeado passando de 23,90m para 24,10m (Alerta -> Inundação / Cota 24m)
  console.log('▶️ TESTE 3: Lajeado subindo de 23,90m para 24,10m (Inundação)...');
  const alert2410 = await processHydrologicalMeasurement('lajeado', 24.10, MOCK_TEST_SUBSCRIBERS);
  console.log('- Com 24,10m (Inundação): Novo alerta pendente gerado?', {
    id: alert2410?.id,
    cidade: alert2410?.cidade,
    nivel_rio: alert2410?.nivel_rio,
    tipo_alerta: alert2410?.tipo_alerta,
    atingidos: alert2410?.quantidade_usuarios_atingidos,
    enviado: alert2410?.enviado
  });

  const test3Passed = alert2410 !== null && alert2410.tipo_alerta === 'inundação' && alert2410.enviado === false;
  console.log(test3Passed ? '✅ PASSOU: Novo alerta gerado ao atingir cota de Inundação (24,10m).\n' : '❌ FALHOU no teste 3.\n');

  // TESTE 4: Aprovação de alerta pendente pelo administrador
  console.log('▶️ TESTE 4: Aprovação do alerta no Painel Administrativo...');
  if (alert2410) {
    const approved = await approveAlertHistory(alert2410.id);
    console.log('- Alerta aprovado no banco/store?', approved ? 'SIM' : 'NÃO');
  }

  console.log('====================================================');
  const allPassed = test1Passed && test2Passed && test3Passed;
  console.log('🎉 RESULTADO FINAL:', allPassed ? 'TODOS OS TESTES PASSARAM COM SUCESSO!' : 'ALGUNS TESTES FALHARAM.');
  console.log('====================================================');

  return { test1Passed, test2Passed, test3Passed, allPassed };
}
