import { AppDatabase } from '../src/types.ts';

export const initialData: AppDatabase = {
  users: [
    {
      id: 'usr-admin-1',
      name: 'Administrador Geral',
      email: 'admin@obras.pt',
      password: 'admin',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
      avatarUrl: ''
    },
    {
      id: 'usr-user-1',
      name: 'Eng. João Silva (Leitor)',
      email: 'user@obras.pt',
      password: 'user123',
      role: 'user',
      createdAt: '2024-02-15T00:00:00.000Z',
      avatarUrl: ''
    },
    {
      id: 'usr-user-2',
      name: 'Carlos Sócio (Consulta)',
      email: 'socio@obras.pt',
      password: 'user123',
      role: 'user',
      createdAt: '2024-03-01T00:00:00.000Z',
      avatarUrl: ''
    }
  ],
  settings: {
    companyName: 'CONSTRUÇÃO & ENGENHARIA - GESTÃO DE OBRAS',
    currency: 'EUR',
    defaultIrcRate: 21, // 21% IRC Portugal
    defaultFundReservePercentage: 20,
    partners: [
      { id: 'p1', name: 'Sócio Administrador 1', percentage: 25 },
      { id: 'p2', name: 'Sócio 2', percentage: 25 },
      { id: 'p3', name: 'Sócio 3', percentage: 25 },
      { id: 'p4', name: 'Sócio 4', percentage: 25 }
    ],
    defaultCategories: [
      {
        key: 'carros',
        label: '1.1 - Carros & Carrinhas',
        defaultItems: ['COMBUSTIVEL', 'VIA VERDE', 'MANUTENÇÃO DE CARROS', 'PARCELAS DAS CARRINHAS', 'MULTAS CARROS', 'COMPRAS LEO']
      },
      {
        key: 'alojamento',
        label: '1.2 - Alojamento',
        defaultItems: ['ALUGUEL DE ALOJAMENTO', 'AGUA, LUZ, GAS ALOJAMENTO', 'FERRAMENTAS OBRA FABRICA DO COBRE', 'FERRAMENTAS E EPIS E ESCRITORIO']
      },
      {
        key: 'impostos',
        label: '1.3 - Taxas, Multas e Impostos',
        defaultItems: ['SEGURANÇA SOCIAL / NISS', 'TAXA ALVARAS', 'IRS', '3 PPC MULTA IRS', 'SEGURO DE ACIDENTES NO TRABALHO', 'SEGURO DE RESPONSABILIDADE CIVIL', 'MEDISCISFORMA / MEDICINA']
      },
      {
        key: 'cartao',
        label: '1.4 - Cartão de Crédito',
        defaultItems: ['CARTÃO DE CRÉDITO EMPRESA', 'DESPESAS BANCÁRIAS']
      },
      {
        key: 'ferramentas',
        label: '1.5 - Ferramentas & Outros Gastos',
        defaultItems: ['FERRAMENTAS COMPRA', 'OUTROS GASTOS JOSÉ - EPIS E ETC', 'MANUTENÇÃO DE MÁQUINAS']
      },
      {
        key: 'salarios',
        label: '1.6 - Salários de Equipes',
        defaultItems: ['CARPINTEIROS', 'PEDREIROS', 'SERVENTES', 'ENCARREGADOS']
      }
    ]
  },
  sheets: [
    {
      id: 'sheet-set-2024',
      name: 'SETEMBRO 2024',
      periodType: 'mensal',
      year: 2024,
      month: 9,
      createdAt: '2024-09-01T00:00:00.000Z',
      updatedAt: '2024-09-30T23:59:59.000Z',
      companyAccountFundBalance: 77557,
      revenues: [
        { id: 'rev-1', client: 'CIP', amount: 1080, status: 'pago' },
        { id: 'rev-2', client: 'ESPANO PORTUGUESA', amount: 20452, status: 'pago' },
        { id: 'rev-3', client: 'CNT', amount: 2232, status: 'pago' },
        { id: 'rev-4', client: 'NOVAGENTE', amount: 11785, status: 'pago' }
      ],
      costs: [
        // Carros
        { id: 'c-1', category: 'carros', name: 'COMPRAS LEO', amount: 0 },
        { id: 'c-2', category: 'carros', name: 'MULTAS CARROS', amount: 120 },
        { id: 'c-3', category: 'carros', name: 'MANUTENÇÃO DE CARROS (SKODA)', amount: 0 },
        { id: 'c-4', category: 'carros', name: 'COMBUSTIVEL', amount: 1121 },
        { id: 'c-5', category: 'carros', name: 'VIA VERDE', amount: 743 },

        // Alojamento
        { id: 'c-6', category: 'alojamento', name: 'ALUGUEL DE ALOJAMENTO', amount: 800 },
        { id: 'c-7', category: 'alojamento', name: 'AGUA, LUZ, GAS ALOJAMENTO', amount: 150 },
        { id: 'c-8', category: 'alojamento', name: 'FERRAMENTAS OBRA FABRICA DO COBRE', amount: 0 },
        { id: 'c-9', category: 'alojamento', name: 'FERRAMENTAS E EPIS E ESCRITORIO', amount: 112 },

        // Taxas e Impostos
        { id: 'c-10', category: 'impostos', name: 'SEGURANÇA SOCIAL E ETC', amount: 6857 },
        { id: 'c-11', category: 'impostos', name: 'TAXA ALVARAS', amount: 260 },
        { id: 'c-12', category: 'impostos', name: '3 PPC MULTA IRS', amount: 0, note: 'FUNDO 1186' },
        { id: 'c-13', category: 'impostos', name: 'SEGURO DE ACIDENTES NO TRABALHO ( MAIS TAXA DE COMPENÇAÇÃO PAGA)', amount: 1567 },
        { id: 'c-14', category: 'impostos', name: 'SEGURO DE RESPONSABILIDADE CIVIL', amount: 267 },
        { id: 'c-15', category: 'impostos', name: 'MEDISCISFORMA', amount: 915 },

        // Cartao
        { id: 'c-16', category: 'cartao', name: 'CARTAO DE CREDITO', amount: 168 },

        // Ferramentas
        { id: 'c-17', category: 'ferramentas', name: 'FERRAMENTAS (CONSERTO)', amount: 0 },

        // Salarios
        { id: 'c-18', category: 'salarios', name: 'CARPINTEIROS', amount: 22287 },
        { id: 'c-19', category: 'salarios', name: 'PEDREIROS', amount: 0 }
      ],
      fundExpenses: [
        { id: 'fe-1', name: 'GASTOS COM A FESTA', amount: 1979, notes: 'Gasto da festa tirar do fundo 1979' },
        { id: 'fe-2', name: 'GASTOS COLCHOES CAMAS E ETC ALOJAMENTO PORTO', amount: 1612, notes: 'Gastos com camas colchões e etc alojamento Porto 1612' },
        { id: 'fe-3', name: 'ALUGUEL DO ALOJAMENTO PORTO', amount: 4500, notes: 'Aluguel alojamento Porto 4500' },
        { id: 'fe-4', name: 'TAXA IRS', amount: 1186, notes: 'Fundo 1186' },
        { id: 'fe-5', name: 'MULTA ACT', amount: 4590 },
        { id: 'fe-6', name: 'COMPRA DE LAZER', amount: 1833 },
        { id: 'fe-7', name: 'TAXA SEGURO ANUAL ACIDENTE DE TRABALHO', amount: 2861 }
      ],
      fundValueReserve: 0,
      reconciliation: {
        accountBalance: 13300,
        advances: 2200,
        housingCosts: 1590,
        fuelCosts: 645,
        otherDiffs: 0,
        calculatedDifference: 5355,
        notes: 'Diferença de 5.355 € apurada em conta em Janeiro'
      },
      partners: [
        { id: 'p1', name: 'Sócio 1', percentage: 25, amount: 45.5 },
        { id: 'p2', name: 'Sócio 2', percentage: 25, amount: 45.5 },
        { id: 'p3', name: 'Sócio 3', percentage: 25, amount: 45.5 },
        { id: 'p4', name: 'Sócio 4', percentage: 25, amount: 45.5 }
      ]
    },
    {
      id: 'sheet-jan-2025',
      name: 'JANEIRO 2025 / CONSOLIDADO MÊS 06 E 07',
      periodType: 'mensal',
      year: 2025,
      month: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-31T23:59:59.000Z',
      companyAccountFundBalance: 123598,
      revenues: [
        { id: 'rev-201', client: 'EMPRESA ESPANO', amount: 86528, status: 'pago' },
        { id: 'rev-202', client: 'EMPRESA CNT', amount: 63828, status: 'pago' },
        { id: 'rev-203', client: 'NOVAGENTE', amount: 42300, status: 'pago' }
      ],
      costs: [
        { id: 'c-201', category: 'carros', name: 'COMBUSTIVEL', amount: 300 },
        { id: 'c-202', category: 'carros', name: 'MANUTENÇÃO', amount: 0 },
        { id: 'c-203', category: 'carros', name: 'VIA VERDE', amount: 135 },
        { id: 'c-204', category: 'carros', name: 'ENTRADA DAS CARRINHAS', amount: 5560 },
        { id: 'c-205', category: 'carros', name: 'PARCELAS DAS CARRINHAS', amount: 942 },
        { id: 'c-206', category: 'ferramentas', name: 'FERRAMENTAS COMPRA 29/5', amount: 610 },
        { id: 'c-207', category: 'ferramentas', name: 'OUTROS GASTOS JOSE - EPIS E ETC', amount: 1322 },
        { id: 'c-208', category: 'impostos', name: 'NISS E TAXAS', amount: 7500 },
        { id: 'c-209', category: 'impostos', name: 'IRS', amount: 31808 },
        { id: 'c-210', category: 'impostos', name: 'SEGURO TRABALHO', amount: 1606 },
        { id: 'c-211', category: 'impostos', name: 'MEDICINA', amount: 945 },
        { id: 'c-212', category: 'salarios', name: 'CARPINTEIROS E PEDREIROS', amount: 22978 }
      ],
      fundExpenses: [
        { id: 'fe-201', name: 'PAGAMENTO EXTRAORDINÁRIO IMPOSTOS', amount: 17210 },
        { id: 'fe-202', name: 'FERRAMENTAS COMPRA', amount: 200 }
      ],
      fundValueReserve: 30000,
      reconciliation: {
        accountBalance: 123598,
        advances: 49792,
        housingCosts: 34792,
        fuelCosts: 0,
        otherDiffs: 0,
        calculatedDifference: 39014,
        notes: 'Total de custos mês 06 e 07: 122.673 € | Fundo Caixa: 30.000 € | Sobra Líquida: 39.966 €'
      },
      partners: [
        { id: 'p1', name: 'Sócio 1', percentage: 25, amount: 9991.5 },
        { id: 'p2', name: 'Sócio 2', percentage: 25, amount: 9991.5 },
        { id: 'p3', name: 'Sócio 3', percentage: 25, amount: 9991.5 },
        { id: 'p4', name: 'Sócio 4', percentage: 25, amount: 9991.5 }
      ]
    },
    {
      id: 'sheet-jul-2026',
      name: 'MAIO-JUNHO-JULHO 2026 (GASTOS DE JULHO)',
      periodType: 'trimestral',
      year: 2026,
      month: 7,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-07-31T23:59:59.000Z',
      companyAccountFundBalance: 83098.5,
      revenues: [
        { id: 'rev-301', client: 'FATURAMENTO JULHO', project: 'OBRAS CONSOLIDADAS', amount: 60632, status: 'pago' }
      ],
      costs: [
        // Salários
        { id: 'c-301', category: 'salarios', name: 'SALARIOS EQUIPES OBRAS', amount: 28177 },

        // Alojamento
        { id: 'c-302', category: 'alojamento', name: 'ALOJAMENTO PRINCIPAL', amount: 3000 },
        { id: 'c-303', category: 'alojamento', name: 'AGUA / LUZ / GAS', amount: 292 },
        { id: 'c-304', category: 'alojamento', name: 'MANUTENÇÃO ALOJAMENTO', amount: 310 },
        { id: 'c-305', category: 'alojamento', name: 'DESPESAS ADICIONAIS ALOJAMENTO', amount: 300 },

        // Carros
        { id: 'c-306', category: 'carros', name: 'COMBUSTIVEL SEMANAL 1', amount: 500 },
        { id: 'c-307', category: 'carros', name: 'COMBUSTIVEL SEMANAL 2 & MANUTENÇÃO', amount: 710 },
        { id: 'c-308', category: 'carros', name: 'VIA VERDE & PORTAGENS', amount: 200 },
        { id: 'c-309', category: 'carros', name: 'PARCELAS DAS CARRINHAS', amount: 1080 },
        { id: 'c-310', category: 'carros', name: 'SEGUROS VIATURAS', amount: 574 },

        // Ferramentas
        { id: 'c-311', category: 'ferramentas', name: 'FERRAMENTAS COMPRA JULHO', amount: 500 },
        { id: 'c-312', category: 'ferramentas', name: 'EPIS & SEGURANÇA', amount: 460 },
        { id: 'c-313', category: 'ferramentas', name: 'CONSUMÍVEIS E PEÇAS', amount: 580 },

        // Impostos
        { id: 'c-314', category: 'impostos', name: 'NISS E TAXAS RETIDAS', amount: 11000 },
        { id: 'c-315', category: 'impostos', name: 'IRS & SEGUROS', amount: 2637 },
        { id: 'c-316', category: 'impostos', name: 'MEDICINA DO TRABALHO', amount: 945 }
      ],
      fundExpenses: [
        { id: 'fe-301', name: 'RESERVA CONSIGNADA IMPOSTOS', amount: 54100, notes: 'Faturação de Junho para Junho consignada no fundo' }
      ],
      fundValueReserve: 54100,
      consignationReserveNote: 'FATURAÇÃO DE JUNHO PARA JUNHO FICA CONSIGNADA NO FUNDO DA EMPRESA PARA IMPOSTOS E FUNDO TOTAL DE 54100 €',
      ircEstimatedTax: 31862.0,
      compensationDifference: 5000.0,
      reconciliation: {
        accountBalance: 83098.5,
        advances: 0,
        housingCosts: 3902,
        fuelCosts: 3064,
        otherDiffs: 0,
        calculatedDifference: 9367,
        notes: 'Total de Lucro: 114.960,50 € | IRC da Empresa 2025/2026: 31.862,00 € | Total Líquido: 83.098,50 € (5 mil diferença de compensação)'
      },
      partners: [
        { id: 'p1', name: 'Sócio 1', percentage: 25, amount: 20774.62 },
        { id: 'p2', name: 'Sócio 2', percentage: 25, amount: 20774.62 },
        { id: 'p3', name: 'Sócio 3', percentage: 25, amount: 20774.62 },
        { id: 'p4', name: 'Sócio 4', percentage: 25, amount: 20774.63 }
      ]
    },
    {
      id: 'sheet-ago-2026',
      name: 'AGOSTO 2026',
      periodType: 'mensal',
      year: 2026,
      month: 8,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
      companyAccountFundBalance: 85000,
      revenues: [
        { id: 'rev-ago-1', client: 'EMPRESA ESPANO', project: 'CUBIC II - GABRIEL COUTINHO', amount: 35000, status: 'pago' },
        { id: 'rev-ago-2', client: 'EMPRESA ESPANO', project: 'BARCELONA', amount: 28000, status: 'pago' },
        { id: 'rev-ago-3', client: 'EMPRESA CNT', project: 'QUADRA - VILA NOVA DE GAIA', amount: 32000, status: 'pago' },
        { id: 'rev-ago-4', client: 'NOVAGENTE', project: 'EMPREITADA LISBOA', amount: 15000, status: 'pendente' }
      ],
      costs: [
        // 1.1 Carros & Carrinhas
        { id: 'c-ago-1', category: 'carros', name: 'COMBUSTIVEL', amount: 1200 },
        { id: 'c-ago-2', category: 'carros', name: 'VIA VERDE', amount: 380 },
        { id: 'c-ago-3', category: 'carros', name: 'MANUTENÇÃO DE CARROS', amount: 450 },
        { id: 'c-ago-4', category: 'carros', name: 'PARCELAS DAS CARRINHAS', amount: 1080 },
        { id: 'c-ago-5', category: 'carros', name: 'MULTAS CARROS', amount: 0 },
        { id: 'c-ago-6', category: 'carros', name: 'SEGUROS VIATURAS', amount: 574 },

        // 1.2 Alojamento
        { id: 'c-ago-7', category: 'alojamento', name: 'ALUGUEL DE ALOJAMENTO', amount: 3000 },
        { id: 'c-ago-8', category: 'alojamento', name: 'AGUA, LUZ, GAS ALOJAMENTO', amount: 320 },
        { id: 'c-ago-9', category: 'alojamento', name: 'MANUTENÇÃO ALOJAMENTO', amount: 250 },
        { id: 'c-ago-10', category: 'alojamento', name: 'FERRAMENTAS E EPIS E ESCRITORIO', amount: 180 },

        // 1.3 Taxas, Multas e Impostos
        { id: 'c-ago-11', category: 'impostos', name: 'SEGURANÇA SOCIAL / NISS', amount: 8200 },
        { id: 'c-ago-12', category: 'impostos', name: 'TAXA ALVARAS', amount: 260 },
        { id: 'c-ago-13', category: 'impostos', name: 'IRS RETIDO NA FONTE', amount: 3400 },
        { id: 'c-ago-14', category: 'impostos', name: 'SEGURO DE ACIDENTES NO TRABALHO', amount: 1650 },
        { id: 'c-ago-15', category: 'impostos', name: 'SEGURO DE RESPONSABILIDADE CIVIL', amount: 267 },
        { id: 'c-ago-16', category: 'impostos', name: 'MEDICINA DO TRABALHO', amount: 945 },

        // 1.4 Cartão de Crédito
        { id: 'c-ago-17', category: 'cartao', name: 'CARTÃO DE CRÉDITO EMPRESA', amount: 350 },
        { id: 'c-ago-18', category: 'cartao', name: 'DESPESAS BANCÁRIAS', amount: 45 },

        // 1.5 Ferramentas & Outros Gastos
        { id: 'c-ago-19', category: 'ferramentas', name: 'FERRAMENTAS COMPRA', amount: 620 },
        { id: 'c-ago-20', category: 'ferramentas', name: 'EPIS E SEGURANÇA', amount: 480 },
        { id: 'c-ago-21', category: 'ferramentas', name: 'CONSUMÍVEIS E PEÇAS', amount: 310 },

        // 1.6 Salários de Equipes
        { id: 'c-ago-22', category: 'salarios', name: 'CARPINTEIROS', amount: 24500 },
        { id: 'c-ago-23', category: 'salarios', name: 'PEDREIROS', amount: 12800 },
        { id: 'c-ago-24', category: 'salarios', name: 'SERVENTES', amount: 6200 },
        { id: 'c-ago-25', category: 'salarios', name: 'ENCARREGADOS DE OBRA', amount: 4500 }
      ],
      fundExpenses: [
        { id: 'fe-ago-1', name: 'RESERVA CAIXA AGOSTO', amount: 10000, notes: 'Reserva preventiva de tesouraria para Agosto 2026' }
      ],
      fundValueReserve: 10000,
      consignationReserveNote: 'MÊS DE AGOSTO 2026 - CONTROLE OPERACIONAL EM ANDAMENTO',
      ircEstimatedTax: 8643.0,
      reconciliation: {
        accountBalance: 85000,
        advances: 0,
        housingCosts: 3750,
        fuelCosts: 2154,
        otherDiffs: 0,
        calculatedDifference: 79096,
        notes: 'Mês de Agosto 2026 iniciado'
      },
      partners: [
        { id: 'p1', name: 'Sócio 1', percentage: 25, amount: 8130 },
        { id: 'p2', name: 'Sócio 2', percentage: 25, amount: 8130 },
        { id: 'p3', name: 'Sócio 3', percentage: 25, amount: 8130 },
        { id: 'p4', name: 'Sócio 4', percentage: 25, amount: 8130 }
      ]
    }
  ],
  invoicingMatrix: [
    // ESPANO - CUBIC II GABRIEL COUTINHO
    { id: 'inv-1', cycleName: 'FATURA JANEIRO/FEVEREIRO', month: 'FEVEREIRO', company: 'EMPRESA ESPANO', project: 'CUBIC II - GABRIEL COUTINHO', amount: 16271 },
    { id: 'inv-2', cycleName: 'FATURA FEVEREIRO/MARÇO', month: 'MARÇO', company: 'EMPRESA ESPANO', project: 'CUBIC II - GABRIEL COUTINHO', amount: 30720 },
    { id: 'inv-3', cycleName: 'FATURA MARÇO/ABRIL', month: 'ABRIL', company: 'EMPRESA ESPANO', project: 'CUBIC II - GABRIEL COUTINHO', amount: 33056 },
    { id: 'inv-4', cycleName: 'FATURA ABRIL/MAIO', month: 'MAIO', company: 'EMPRESA ESPANO', project: 'CUBIC II - GABRIEL COUTINHO', amount: 27927 },
    { id: 'inv-5', cycleName: 'FATURA MAIO/JUNHO', month: 'JUNHO', company: 'EMPRESA ESPANO', project: 'CUBIC II - GABRIEL COUTINHO', amount: 36879 },
    { id: 'inv-5b', cycleName: 'FATURA JULHO/AGOSTO', month: 'AGOSTO', company: 'EMPRESA ESPANO', project: 'CUBIC II - GABRIEL COUTINHO', amount: 35000 },

    // ESPANO - BARCELONA
    { id: 'inv-6', cycleName: 'FATURA FEVEREIRO/MARÇO', month: 'MARÇO', company: 'EMPRESA ESPANO', project: 'BARCELONA', amount: 7245 },
    { id: 'inv-7', cycleName: 'FATURA MARÇO/ABRIL', month: 'ABRIL', company: 'EMPRESA ESPANO', project: 'BARCELONA', amount: 12750 },
    { id: 'inv-8', cycleName: 'FATURA ABRIL/MAIO', month: 'MAIO', company: 'EMPRESA ESPANO', project: 'BARCELONA', amount: 25747 },
    { id: 'inv-9', cycleName: 'FATURA MAIO/JUNHO', month: 'JUNHO', company: 'EMPRESA ESPANO', project: 'BARCELONA', amount: 40786 },
    { id: 'inv-9b', cycleName: 'FATURA JULHO/AGOSTO', month: 'AGOSTO', company: 'EMPRESA ESPANO', project: 'BARCELONA', amount: 28000 },

    // ESPANO - OUTEIRO
    { id: 'inv-10', cycleName: 'FATURA JANEIRO/FEVEREIRO', month: 'FEVEREIRO', company: 'EMPRESA ESPANO', project: 'OUTEIRO', amount: 585 },

    // CNT - QUADRA VILA NOVA DE GAIA
    { id: 'inv-11', cycleName: 'FATURA JANEIRO/FEVEREIRO', month: 'FEVEREIRO', company: 'EMPRESA CNT', project: 'QUADRA - VILA NOVA DE GAIA', amount: 28236 },
    { id: 'inv-12', cycleName: 'FATURA FEVEREIRO/MARÇO', month: 'MARÇO', company: 'EMPRESA CNT', project: 'QUADRA - VILA NOVA DE GAIA', amount: 27515 },
    { id: 'inv-13', cycleName: 'FATURA MARÇO/ABRIL', month: 'ABRIL', company: 'EMPRESA CNT', project: 'QUADRA - VILA NOVA DE GAIA', amount: 36516 },
    { id: 'inv-14', cycleName: 'FATURA ABRIL/MAIO', month: 'MAIO', company: 'EMPRESA CNT', project: 'QUADRA - VILA NOVA DE GAIA', amount: 36129 },
    { id: 'inv-15', cycleName: 'FATURA MAIO/JUNHO', month: 'JUNHO', company: 'EMPRESA CNT', project: 'QUADRA - VILA NOVA DE GAIA', amount: 23753 },
    { id: 'inv-15b', cycleName: 'FATURA JULHO/AGOSTO', month: 'AGOSTO', company: 'EMPRESA CNT', project: 'QUADRA - VILA NOVA DE GAIA', amount: 32000 },

    // NOVAGENTE - LISBOA
    { id: 'inv-16', cycleName: 'FATURA JULHO/AGOSTO', month: 'AGOSTO', company: 'NOVAGENTE', project: 'EMPREITADA LISBOA', amount: 15000 }
  ],
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2026-08-26T14:00:00.000Z',
      userRole: 'admin',
      userName: 'Administrador Principal',
      action: 'SISTEMA_INICIALIZADO',
      details: 'Base de dados carregada com planilhas de Setembro 2024, Janeiro 2025, Julho 2026 e Faturamento de Obras.'
    }
  ]
};
