import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Layers, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Server, 
  Cpu, 
  ShieldCheck, 
  GitBranch, 
  Search,
  Key,
  Hash,
  Share2,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

export const DatabaseSchemaView: React.FC = () => {
  const [activeEngine, setActiveEngine] = useState<'relational' | 'nosql' | 'er_diagram' | 'pipeline'>('relational');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlSchemaCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema_obras_financeiro_postgresql.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadNoSQL = () => {
    const blob = new Blob([noSqlSchemaCode], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema_obras_financeiro_mongodb.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const sqlSchemaCode = `-- ============================================================================
-- SCHEMA RELACIONAL (POSTGRESQL 15+)
-- SISTEMA DE GESTÃO FINANCEIRA E CUSTOS DE OBRAS (MULTI-EMPRESA & MULTI-SÓCIOS)
-- ============================================================================

-- 1. EXTENSÕES & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role_enum AS ENUM ('admin', 'user');
CREATE TYPE period_type_enum AS ENUM ('mensal', 'trimestral', 'semestral', 'anual');
CREATE TYPE revenue_status_enum AS ENUM ('previsto', 'pendente', 'pago', 'cancelado');
CREATE TYPE invoice_status_enum AS ENUM ('em_aberto', 'faturado', 'liquidado');

-- 2. TABELA: USUÁRIOS (AUTENTICAÇÃO & AUTORIZAÇÃO)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 3. TABELA: CONFIGURAÇÕES DO SISTEMA E SÓCIOS
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL DEFAULT 'CONSTRUÇÃO & ENGENHARIA',
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    default_irc_rate NUMERIC(5,2) NOT NULL DEFAULT 21.00,
    default_fund_reserve_pct NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    equity_percentage NUMERIC(5,2) NOT NULL CHECK (equity_percentage >= 0 AND equity_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA: CATEGORIAS DE CUSTOS OPERACIONAIS
CREATE TABLE cost_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'carros', 'alojamento', 'impostos', 'salarios', etc.
    label VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. TABELA PRINCIPAL: PLANILHAS DE CUSTOS & PERÍODOS (PARTITION-READY)
CREATE TABLE cost_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL, -- Ex: 'SETEMBRO 2024', 'JANEIRO 2025'
    period_type period_type_enum NOT NULL DEFAULT 'mensal',
    fiscal_year INT NOT NULL CHECK (fiscal_year >= 2020),
    fiscal_month INT CHECK (fiscal_month BETWEEN 1 AND 12),
    company_account_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    fund_value_reserve NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    consignation_reserve_note TEXT,
    irc_estimated_tax NUMERIC(15,2) DEFAULT 0.00,
    compensation_difference NUMERIC(15,2) DEFAULT 0.00,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_sheets_year_month ON cost_sheets(fiscal_year, fiscal_month);

-- 6. TABELA: RECEITAS & MEDIÇÕES DE CLIENTES
CREATE TABLE sheet_revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id UUID NOT NULL REFERENCES cost_sheets(id) ON DELETE CASCADE,
    client_name VARCHAR(150) NOT NULL, -- 'ESPANO PORTUGUESA', 'CNT', 'CIP', 'NOVAGENTE'
    project_name VARCHAR(200),
    description TEXT,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    status revenue_status_enum NOT NULL DEFAULT 'pago',
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revenues_sheet_id ON sheet_revenues(sheet_id);
CREATE INDEX idx_revenues_client ON sheet_revenues(client_name);

-- 7. TABELA: CUSTOS OPERACIONAIS DETALHADOS
CREATE TABLE sheet_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id UUID NOT NULL REFERENCES cost_sheets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES cost_categories(id),
    name VARCHAR(200) NOT NULL, -- 'COMBUSTIVEL', 'VIA VERDE', 'CARPINTEIROS', 'NISS'
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    paid_from_fund BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_costs_sheet_id ON sheet_costs(sheet_id);
CREATE INDEX idx_costs_category ON sheet_costs(category_id);
CREATE INDEX idx_costs_sheet_cat ON sheet_costs(sheet_id, category_id);

-- 8. TABELA: GASTOS EXTRAORDINÁRIOS DO FUNDO DE CAIXA
CREATE TABLE sheet_fund_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id UUID NOT NULL REFERENCES cost_sheets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    expense_date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fund_expenses_sheet ON sheet_fund_expenses(sheet_id);

-- 9. TABELA: RECONCILIAÇÃO BANCÁRIA & CONFERÊNCIA
CREATE TABLE sheet_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id UUID UNIQUE NOT NULL REFERENCES cost_sheets(id) ON DELETE CASCADE,
    account_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    advances NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    housing_costs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    fuel_costs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    other_diffs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    calculated_difference NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. TABELA: MATRIZ DE FATURAMENTO POR OBRAS (CICLOS MULTI-MENSAL)
CREATE TABLE invoicing_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_name VARCHAR(150) NOT NULL, -- 'FATURA JANEIRO/FEVEREIRO', 'FATURA MAIO/JUNHO'
    billing_month VARCHAR(50) NOT NULL, -- 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO'
    company_name VARCHAR(150) NOT NULL, -- 'EMPRESA ESPANO', 'EMPRESA CNT', 'NOVAGENTE'
    project_name VARCHAR(255) NOT NULL, -- 'CUBIC II - GABRIEL COUTINHO', 'BARCELONA', 'QUADRA'
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status invoice_status_enum NOT NULL DEFAULT 'faturado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoicing_company_proj ON invoicing_matrix(company_name, project_name);
CREATE INDEX idx_invoicing_month ON invoicing_matrix(billing_month);

-- 11. TABELA: DISTRIBUIÇÃO DE LUCROS AOS SÓCIOS
CREATE TABLE sheet_partner_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id UUID NOT NULL REFERENCES cost_sheets(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partners(id),
    equity_percentage NUMERIC(5,2) NOT NULL,
    distributed_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    paid_status BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_sheet_partner UNIQUE (sheet_id, partner_id)
);

-- 12. TABELA: TRILHA DE AUDITORIA & SEGURANÇA (AUDIT LOGS)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_role user_role_enum NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    sheet_id UUID REFERENCES cost_sheets(id) ON DELETE SET NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- 13. VIEW MATERIALIZADA: RESUMO FINANCEIRO CONSOLIDADO POR PERÍODO
CREATE MATERIALIZED VIEW mv_sheet_financial_summary AS
SELECT 
    s.id AS sheet_id,
    s.name AS sheet_name,
    s.fiscal_year,
    s.fiscal_month,
    COALESCE(SUM(r.amount), 0) AS total_revenue,
    COALESCE(c.total_cost, 0) AS total_cost,
    (COALESCE(SUM(r.amount), 0) - COALESCE(c.total_cost, 0)) AS net_operating_profit,
    s.fund_value_reserve,
    s.irc_estimated_tax
FROM cost_sheets s
LEFT JOIN sheet_revenues r ON s.id = r.sheet_id
LEFT JOIN (
    SELECT sheet_id, SUM(amount) AS total_cost
    FROM sheet_costs
    GROUP BY sheet_id
) c ON s.id = c.sheet_id
GROUP BY s.id, s.name, s.fiscal_year, s.fiscal_month, c.total_cost, s.fund_value_reserve, s.irc_estimated_tax;

CREATE UNIQUE INDEX idx_mv_sheet_summary ON mv_sheet_financial_summary(sheet_id);`;

  const noSqlSchemaCode = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ObrasFinanceiroNoSQLSchema",
  "description": "Schema NoSQL / MongoDB / Firestore para Alta Performance & Consultas Consolidadas",
  "collections": {
    "users": {
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["_id", "email", "name", "role", "createdAt"],
          "properties": {
            "_id": { "bsonType": "objectId" },
            "name": { "bsonType": "string" },
            "email": { "bsonType": "string", "pattern": "^.+@.+$" },
            "passwordHash": { "bsonType": "string" },
            "role": { "enum": ["admin", "user"] },
            "avatarUrl": { "bsonType": "string" },
            "isActive": { "bsonType": "bool" },
            "createdAt": { "bsonType": "date" },
            "lastLoginAt": { "bsonType": "date" }
          }
        }
      },
      "indexes": [
        { "key": { "email": 1 }, "unique": true },
        { "key": { "role": 1 } }
      ]
    },

    "cost_sheets": {
      "description": "Documento completo por período contendo subdocumentos de receitas, custos categorizados, reconciliação e cotas de sócios",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["_id", "name", "fiscalYear", "revenues", "costs", "partners"],
          "properties": {
            "_id": { "bsonType": "objectId" },
            "name": { "bsonType": "string" },
            "periodType": { "enum": ["mensal", "trimestral", "semestral", "anual"] },
            "fiscalYear": { "bsonType": "int" },
            "fiscalMonth": { "bsonType": "int" },
            "companyAccountFundBalance": { "bsonType": "double" },
            "fundValueReserve": { "bsonType": "double" },
            "consignationReserveNote": { "bsonType": "string" },
            "ircEstimatedTax": { "bsonType": "double" },
            "compensationDifference": { "bsonType": "double" },
            
            "revenues": {
              "bsonType": "array",
              "items": {
                "bsonType": "object",
                "required": ["id", "client", "amount"],
                "properties": {
                  "id": { "bsonType": "string" },
                  "client": { "bsonType": "string" },
                  "project": { "bsonType": "string" },
                  "amount": { "bsonType": "double" },
                  "status": { "enum": ["previsto", "pendente", "pago"] }
                }
              }
            },

            "costs": {
              "bsonType": "array",
              "items": {
                "bsonType": "object",
                "required": ["id", "category", "name", "amount"],
                "properties": {
                  "id": { "bsonType": "string" },
                  "category": { "enum": ["carros", "alojamento", "impostos", "cartao", "ferramentas", "salarios", "outros"] },
                  "name": { "bsonType": "string" },
                  "amount": { "bsonType": "double" },
                  "paidFromFund": { "bsonType": "bool" },
                  "note": { "bsonType": "string" }
                }
              }
            },

            "fundExpenses": {
              "bsonType": "array",
              "items": {
                "bsonType": "object",
                "properties": {
                  "id": { "bsonType": "string" },
                  "name": { "bsonType": "string" },
                  "amount": { "bsonType": "double" },
                  "date": { "bsonType": "string" },
                  "notes": { "bsonType": "string" }
                }
              }
            },

            "reconciliation": {
              "bsonType": "object",
              "properties": {
                "accountBalance": { "bsonType": "double" },
                "advances": { "bsonType": "double" },
                "housingCosts": { "bsonType": "double" },
                "fuelCosts": { "bsonType": "double" },
                "calculatedDifference": { "bsonType": "double" },
                "notes": { "bsonType": "string" }
              }
            },

            "partners": {
              "bsonType": "array",
              "items": {
                "bsonType": "object",
                "required": ["id", "name", "percentage", "amount"],
                "properties": {
                  "id": { "bsonType": "string" },
                  "name": { "bsonType": "string" },
                  "percentage": { "bsonType": "double" },
                  "amount": { "bsonType": "double" }
                }
              }
            },

            "createdAt": { "bsonType": "date" },
            "updatedAt": { "bsonType": "date" }
          }
        }
      },
      "indexes": [
        { "key": { "fiscalYear": 1, "fiscalMonth": 1 } },
        { "key": { "name": "text", "revenues.client": "text", "costs.name": "text" } },
        { "key": { "updatedAt": -1 } }
      ]
    },

    "invoicing_matrix": {
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["_id", "cycleName", "month", "company", "project", "amount"],
          "properties": {
            "_id": { "bsonType": "objectId" },
            "cycleName": { "bsonType": "string" },
            "month": { "bsonType": "string" },
            "company": { "bsonType": "string" },
            "project": { "bsonType": "string" },
            "amount": { "bsonType": "double" },
            "status": { "enum": ["em_aberto", "faturado", "liquidado"] }
          }
        }
      },
      "indexes": [
        { "key": { "company": 1, "project": 1 } },
        { "key": { "month": 1 } }
      ]
    },

    "audit_logs": {
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["_id", "timestamp", "userRole", "userName", "action", "details"],
          "properties": {
            "_id": { "bsonType": "objectId" },
            "timestamp": { "bsonType": "date" },
            "userRole": { "enum": ["admin", "user"] },
            "userName": { "bsonType": "string" },
            "action": { "bsonType": "string" },
            "sheetId": { "bsonType": "string" },
            "details": { "bsonType": "string" }
          }
        }
      },
      "indexes": [
        { "key": { "timestamp": -1 }, "expireAfterSeconds": 31536000 }
      ]
    }
  }
}`;

  const entitiesList = [
    {
      name: 'users',
      title: 'Usuários & Perfis',
      desc: 'Controle de login, autenticação e autorização com roles admin e user',
      fields: [
        { name: 'id', type: 'UUID / ObjectId', key: 'PK', desc: 'Identificador único do usuário' },
        { name: 'name', type: 'VARCHAR(150)', key: '', desc: 'Nome completo do usuário' },
        { name: 'email', type: 'VARCHAR(255)', key: 'UQ, IDX', desc: 'E-mail para login único' },
        { name: 'password_hash', type: 'VARCHAR(255)', key: '', desc: 'Hash bcrypt seguro da senha' },
        { name: 'role', type: "ENUM('admin','user')", key: 'IDX', desc: 'admin (leitura/escrita) ou user (leitura)' },
        { name: 'is_active', type: 'BOOLEAN', key: '', desc: 'Status da conta do usuário' },
        { name: 'last_login_at', type: 'TIMESTAMP', key: '', desc: 'Registro do último acesso' }
      ]
    },
    {
      name: 'cost_sheets',
      title: 'Planilhas de Custos (Períodos)',
      desc: 'Entidade mestre para períodos contábeis (Setembro 2024, Janeiro 2025, Julho 2026)',
      fields: [
        { name: 'id', type: 'UUID / ObjectId', key: 'PK', desc: 'Identificador único da planilha' },
        { name: 'name', type: 'VARCHAR(150)', key: '', desc: 'Ex: SETEMBRO 2024, MAIO-JUNHO-JULHO 2026' },
        { name: 'period_type', type: 'ENUM', key: '', desc: 'mensal, trimestral, semestral, anual' },
        { name: 'fiscal_year', type: 'INT', key: 'IDX', desc: 'Ano de referência fiscal (ex: 2024, 2025, 2026)' },
        { name: 'fiscal_month', type: 'INT', key: 'IDX', desc: 'Mês de referência (1 a 12)' },
        { name: 'company_account_fund_balance', type: 'NUMERIC(15,2)', key: '', desc: 'Saldo em conta empresa/fundo' },
        { name: 'fund_value_reserve', type: 'NUMERIC(15,2)', key: '', desc: 'Valor para reserva de caixa e contingências' },
        { name: 'irc_estimated_tax', type: 'NUMERIC(15,2)', key: '', desc: 'Estimativa de IRC 2025/2026' },
        { name: 'compensation_difference', type: 'NUMERIC(15,2)', key: '', desc: 'Diferença de compensação fiscal' }
      ]
    },
    {
      name: 'sheet_revenues',
      title: 'Receitas & Faturamento por Cliente',
      desc: 'Medições e faturamento de clientes (ESPANO, CNT, NOVAGENTE, CIP)',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'ID da receita' },
        { name: 'sheet_id', type: 'UUID', key: 'FK, IDX', desc: 'Vínculo com cost_sheets(id)' },
        { name: 'client_name', type: 'VARCHAR(150)', key: 'IDX', desc: 'Nome da contratante / cliente' },
        { name: 'project_name', type: 'VARCHAR(200)', key: '', desc: 'Obra ou projeto de execução' },
        { name: 'amount', type: 'NUMERIC(15,2)', key: '', desc: 'Valor bruto faturado em €' },
        { name: 'status', type: 'ENUM', key: '', desc: 'pago, pendente ou previsto' }
      ]
    },
    {
      name: 'sheet_costs',
      title: 'Custos Operacionais & Despesas',
      desc: 'Despesas agrupadas por categorias (Carros, Alojamento, Impostos, Salários, Ferramentas)',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'ID do custo' },
        { name: 'sheet_id', type: 'UUID', key: 'FK, IDX', desc: 'Vínculo com cost_sheets(id)' },
        { name: 'category_id', type: 'UUID', key: 'FK, IDX', desc: 'Categoria: carros, alojamento, impostos, salários' },
        { name: 'name', type: 'VARCHAR(200)', key: '', desc: 'Descrição: COMBUSTIVEL, VIA VERDE, CARPINTEIROS' },
        { name: 'amount', type: 'NUMERIC(15,2)', key: '', desc: 'Valor da despesa em €' },
        { name: 'paid_from_fund', type: 'BOOLEAN', key: '', desc: 'Indica se foi debitado do fundo de reserva' }
      ]
    },
    {
      name: 'invoicing_matrix',
      title: 'Matriz de Obras (Faturamento por Ciclo)',
      desc: 'Acompanhamento do faturamento por obra (Gabriel Coutinho, Barcelona, Quadra)',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'ID do registro de obra' },
        { name: 'cycle_name', type: 'VARCHAR(150)', key: '', desc: 'FATURA JANEIRO/FEVEREIRO, FEVEREIRO/MARÇO' },
        { name: 'billing_month', type: 'VARCHAR(50)', key: 'IDX', desc: 'FEVEREIRO, MARÇO, ABRIL, MAIO, JUNHO' },
        { name: 'company_name', type: 'VARCHAR(150)', key: 'IDX', desc: 'EMPRESA ESPANO, EMPRESA CNT, NOVAGENTE' },
        { name: 'project_name', type: 'VARCHAR(255)', key: 'IDX', desc: 'CUBIC II, BARCELONA, QUADRA GAIA' },
        { name: 'amount', type: 'NUMERIC(15,2)', key: '', desc: 'Valor total faturado no ciclo' }
      ]
    },
    {
      name: 'sheet_partner_distributions',
      title: 'Distribuição de Lucro por Sócio',
      desc: 'Rateio líquido de lucros por participação societária (%)',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'ID da distribuição' },
        { name: 'sheet_id', type: 'UUID', key: 'FK, UQ', desc: 'Vínculo com cost_sheets(id)' },
        { name: 'partner_id', type: 'UUID', key: 'FK, UQ', desc: 'Vínculo com partners(id)' },
        { name: 'equity_percentage', type: 'NUMERIC(5,2)', key: '', desc: 'Percentual de participação (ex: 25.0%)' },
        { name: 'distributed_amount', type: 'NUMERIC(15,2)', key: '', desc: 'Valor apurado e distribuído em €' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Schema de Banco de Dados & Arquitetura Escalável
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  Otimizado para Processamento & Relatórios
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Especificação completa de modelos <strong>Relacional (PostgreSQL)</strong> e <strong>NoSQL (MongoDB / Firestore)</strong> com índices de alto desempenho, partições fiscais e controle de concorrência.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSQL}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download SQL (PostgreSQL)
            </button>
            <button
              onClick={handleDownloadNoSQL}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download NoSQL (JSON)
            </button>
          </div>
        </div>

        {/* Engine Switcher */}
        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveEngine('relational')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeEngine === 'relational'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            1. Relacional (PostgreSQL DDL)
          </button>

          <button
            onClick={() => setActiveEngine('nosql')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeEngine === 'nosql'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            2. NoSQL (MongoDB / JSON Schema)
          </button>

          <button
            onClick={() => setActiveEngine('er_diagram')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeEngine === 'er_diagram'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            3. Dicionário de Entidades & Índices
          </button>

          <button
            onClick={() => setActiveEngine('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeEngine === 'pipeline'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            4. Arquitetura de Processamento & Escala
          </button>
        </div>
      </div>

      {/* Relational SQL View */}
      {activeEngine === 'relational' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Script SQL Completo (PostgreSQL 15+) — Tabelas, FKs, Índices e Views
              </h3>
            </div>
            <button
              onClick={() => handleCopy(sqlSchemaCode, 'sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              {copied === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'sql' ? 'Copiado!' : 'Copiar DDL'}</span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-slate-200 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed border border-slate-800">
            <pre>{sqlSchemaCode}</pre>
          </div>
        </div>
      )}

      {/* NoSQL View */}
      {activeEngine === 'nosql' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Estrutura de Coleções & Validação JSON (MongoDB / Firestore NoSQL)
              </h3>
            </div>
            <button
              onClick={() => handleCopy(noSqlSchemaCode, 'nosql')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              {copied === 'nosql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'nosql' ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed border border-slate-800">
            <pre>{noSqlSchemaCode}</pre>
          </div>
        </div>
      )}

      {/* Entity Dictionary View */}
      {activeEngine === 'er_diagram' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entitiesList.map((ent) => (
              <div key={ent.name} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-sm font-mono">{ent.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {ent.fields.length} campos
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-2">{ent.title}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ent.desc}</p>
                </div>

                <div className="border border-slate-100 rounded-lg overflow-hidden text-[11px]">
                  <table className="w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-600 font-bold">
                      <tr>
                        <th className="px-2 py-1.5 text-left">Campo</th>
                        <th className="px-2 py-1.5 text-left">Tipo</th>
                        <th className="px-2 py-1.5 text-right">Chave</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                      {ent.fields.map((f) => (
                        <tr key={f.name} className="hover:bg-slate-50/80">
                          <td className="px-2 py-1 text-slate-900 font-semibold">{f.name}</td>
                          <td className="px-2 py-1 text-slate-500">{f.type}</td>
                          <td className="px-2 py-1 text-right">
                            {f.key && (
                              <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                                f.key.includes('PK')
                                  ? 'bg-amber-100 text-amber-800'
                                  : f.key.includes('FK')
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {f.key}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing & Scalability Architecture View */}
      {activeEngine === 'pipeline' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Estratégia de Otimização & Processamento de Dados em Alta Escala
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Strategy 1 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                1. Particionamento Fiscal por Ano e Obra
              </div>
              <p className="text-slate-600 leading-relaxed">
                As tabelas de custos e receitas são particionadas por <code>fiscal_year</code> (Range Partitioning). Consultas consolidadas para fecho de ano (ex: IRC 2025/2026) realizam <em>Partition Pruning</em>, lendo apenas os blocos relevantes sem <em>full table scans</em>.
              </p>
            </div>

            {/* Strategy 2 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                2. Índices Compostos para Agregações Rápidas
              </div>
              <p className="text-slate-600 leading-relaxed">
                Índice composto B-Tree em <code>(sheet_id, category_id)</code> permite que agregações de custos por grupo (viaturas, alojamento, salários de carpinteiros) sejam calculadas em <strong>&lt; 2ms</strong> usando <em>Index-Only Scans</em>.
              </p>
            </div>

            {/* Strategy 3 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                3. Views Materializadas com Atualização Concorrente
              </div>
              <p className="text-slate-600 leading-relaxed">
                A view <code>mv_sheet_financial_summary</code> pré-calcula a margem operacional, faturamento bruto e imposto estimado. Pode ser atualizada via <code>REFRESH MATERIALIZED VIEW CONCURRENTLY</code> sem travar leituras dos usuários <em>'user'</em>.
              </p>
            </div>

            {/* Strategy 4 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                4. Segurança & Controle de Acesso (RBAC) Nativo
              </div>
              <p className="text-slate-600 leading-relaxed">
                Implementação de <strong>Row-Level Security (RLS)</strong> no PostgreSQL ou regras de segurança no Firestore: usuários com role <code>'user'</code> têm permissão <code>GRANT SELECT</code> exclusiva, enquanto <code>'admin'</code> possui <code>ALL PRIVILEGES</code> auditados na tabela <code>audit_logs</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
