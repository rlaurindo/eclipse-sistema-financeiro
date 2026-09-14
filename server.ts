import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initialData } from './server/initialData.ts';
import { AppDatabase, CostSheet, InvoicingCycle, CostItem, RevenueItem, FundExpenseItem, UserRole, CategoryDefinition } from './src/types.ts';
import { GoogleGenAI } from '@google/genai';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory and initial DB exists
function loadDatabase(): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: AppDatabase = JSON.parse(fileData);
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = initialData.users;
      }
      // Ensure default standard sheets exist (especially AGOSTO 2026)
      if (parsed.sheets) {
        for (const initSheet of initialData.sheets) {
          if (!parsed.sheets.some((s) => s.id === initSheet.id || s.name === initSheet.name)) {
            parsed.sheets.push(initSheet);
          }
        }
      } else {
        parsed.sheets = initialData.sheets;
      }
      // Ensure default invoicing cycles exist
      if (parsed.invoicingMatrix) {
        for (const initInv of initialData.invoicingMatrix) {
          if (!parsed.invoicingMatrix.some((i) => i.id === initInv.id)) {
            parsed.invoicingMatrix.push(initInv);
          }
        }
      } else {
        parsed.invoicingMatrix = initialData.invoicingMatrix;
      }
      saveDatabase(parsed);
      return parsed;
    }
  } catch (err) {
    console.error('Error loading database file, falling back to initial data', err);
  }
  // Save initial data
  saveDatabase(initialData);
  return JSON.parse(JSON.stringify(initialData));
}

function saveDatabase(data: AppDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

let db: AppDatabase = loadDatabase();

function addAuditLog(userRole: UserRole, userName: string, action: string, details: string, sheetId?: string) {
  const log = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    userRole,
    userName,
    action,
    sheetId,
    details
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper middleware to check Admin permission for mutation endpoints
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const roleHeader = req.headers['x-user-role'] as string;
    if (roleHeader !== 'admin') {
      res.status(403).json({
        error: 'Acesso negado. Apenas usuários com perfil de Administrador podem realizar alterações.',
        code: 'PERMISSION_DENIED'
      });
      return;
    }
    next();
  };

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- AUTHENTICATION & AUTHORIZATION ENDPOINTS ---

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas. Usuário não encontrado.' });
      return;
    }

    // Simple password check (for prototype/applet; accepts password or common default)
    if (user.password && user.password !== password && password !== 'admin123' && password !== 'user123' && password !== '1234') {
      res.status(401).json({ error: 'Senha incorreta.' });
      return;
    }

    user.lastLoginAt = new Date().toISOString();
    saveDatabase(db);

    addAuditLog(user.role, user.name, 'LOGIN_USUARIO', `Usuário realizou login com perfil ${user.role.toUpperCase()}`);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: `auth-token-${user.id}-${Date.now()}`
    });
  });

  // Register
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
      return;
    }

    const assignedRole: UserRole = role === 'admin' ? 'admin' : 'user';

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: assignedRole,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      avatarUrl: ''
    };

    db.users.push(newUser);
    saveDatabase(db);

    addAuditLog(assignedRole, newUser.name, 'REGISTRO_USUARIO', `Novo usuário registrado com perfil ${assignedRole.toUpperCase()}: ${newUser.email}`);

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: `auth-token-${newUser.id}-${Date.now()}`
    });
  });

  // Get all users (sanitized)
  app.get('/api/auth/users', (req, res) => {
    const sanitized = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt
    }));
    res.json(sanitized);
  });

  // Update user role / status (Admin only)
  app.put('/api/auth/users/:id', requireAdmin, (req, res) => {
    const { name, email, role } = req.body;
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role && (role === 'admin' || role === 'user')) user.role = role;

    addAuditLog('admin', 'Administrador', 'ATUALIZAR_USUARIO', `Atualizou dados do usuário: ${user.email} (Role: ${user.role})`);
    saveDatabase(db);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    });
  });

  // Delete user (Admin only)
  app.delete('/api/auth/users/:id', requireAdmin, (req, res) => {
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    const removed = db.users.splice(idx, 1)[0];
    addAuditLog('admin', 'Administrador', 'EXCLUIR_USUARIO', `Removeu o usuário: ${removed.email} (${removed.role})`);
    saveDatabase(db);
    res.json({ success: true, message: `Usuário ${removed.name} removido com sucesso.` });
  });

  // Get full application database
  app.get('/api/data', (req, res) => {
    res.json(db);
  });

  // Get all sheets
  app.get('/api/sheets', (req, res) => {
    res.json(db.sheets);
  });

  // Get single sheet
  app.get('/api/sheets/:id', (req, res) => {
    const sheet = db.sheets.find((s) => s.id === req.params.id);
    if (!sheet) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }
    res.json(sheet);
  });

  // Create new sheet or clone existing
  app.post('/api/sheets', requireAdmin, (req, res) => {
    const { name, periodType, year, month, cloneFromId } = req.body;
    let newSheet: CostSheet;

    if (cloneFromId) {
      const source = db.sheets.find((s) => s.id === cloneFromId);
      if (source) {
        newSheet = {
          ...JSON.parse(JSON.stringify(source)),
          id: `sheet-${Date.now()}`,
          name: name || `Cópia de ${source.name}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        res.status(404).json({ error: 'Planilha de origem não encontrada' });
        return;
      }
    } else {
      newSheet = {
        id: `sheet-${Date.now()}`,
        name: name || `MÊS ${month || 1}/${year || 2026}`,
        periodType: periodType || 'mensal',
        year: year || 2026,
        month: month || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        companyAccountFundBalance: 0,
        revenues: [
          { id: `rev-${Date.now()}-1`, client: 'CIP', amount: 0, status: 'previsto' },
          { id: `rev-${Date.now()}-2`, client: 'ESPANO PORTUGUESA', amount: 0, status: 'previsto' },
          { id: `rev-${Date.now()}-3`, client: 'CNT', amount: 0, status: 'previsto' },
          { id: `rev-${Date.now()}-4`, client: 'NOVAGENTE', amount: 0, status: 'previsto' }
        ],
        costs: [
          { id: `c-${Date.now()}-1`, category: 'carros', name: 'COMBUSTIVEL', amount: 0 },
          { id: `c-${Date.now()}-2`, category: 'carros', name: 'VIA VERDE', amount: 0 },
          { id: `c-${Date.now()}-3`, category: 'carros', name: 'MANUTENÇÃO DE CARROS', amount: 0 },
          { id: `c-${Date.now()}-4`, category: 'alojamento', name: 'ALUGUEL DE ALOJAMENTO', amount: 0 },
          { id: `c-${Date.now()}-5`, category: 'alojamento', name: 'AGUA, LUZ, GAS ALOJAMENTO', amount: 0 },
          { id: `c-${Date.now()}-6`, category: 'impostos', name: 'SEGURANÇA SOCIAL / NISS', amount: 0 },
          { id: `c-${Date.now()}-7`, category: 'impostos', name: 'IRS', amount: 0 },
          { id: `c-${Date.now()}-8`, category: 'impostos', name: 'SEGURO DE ACIDENTES NO TRABALHO', amount: 0 },
          { id: `c-${Date.now()}-9`, category: 'salarios', name: 'CARPINTEIROS', amount: 0 },
          { id: `c-${Date.now()}-10`, category: 'salarios', name: 'PEDREIROS', amount: 0 }
        ],
        fundExpenses: [],
        fundValueReserve: 0,
        reconciliation: {
          accountBalance: 0,
          advances: 0,
          housingCosts: 0,
          fuelCosts: 0,
          otherDiffs: 0,
          calculatedDifference: 0,
          notes: ''
        },
        partners: db.settings.partners.map((p) => ({
          id: p.id,
          name: p.name,
          percentage: p.percentage,
          amount: 0
        }))
      };
    }

    db.sheets.unshift(newSheet);
    addAuditLog('admin', 'Administrador', 'CRIAR_PLANILHA', `Criou a planilha: ${newSheet.name}`, newSheet.id);
    saveDatabase(db);
    res.status(201).json(newSheet);
  });

  // Update sheet metadata or full payload
  app.put('/api/sheets/:id', requireAdmin, (req, res) => {
    const idx = db.sheets.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }

    const updatedSheet: CostSheet = {
      ...db.sheets[idx],
      ...req.body,
      id: db.sheets[idx].id, // protect id
      updatedAt: new Date().toISOString()
    };

    db.sheets[idx] = updatedSheet;
    addAuditLog('admin', 'Administrador', 'ATUALIZAR_PLANILHA', `Atualizou dados da planilha: ${updatedSheet.name}`, updatedSheet.id);
    saveDatabase(db);
    res.json(updatedSheet);
  });

  // Delete sheet
  app.delete('/api/sheets/:id', requireAdmin, (req, res) => {
    const idx = db.sheets.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }
    const name = db.sheets[idx].name;
    db.sheets.splice(idx, 1);
    addAuditLog('admin', 'Administrador', 'EXCLUIR_PLANILHA', `Excluiu a planilha: ${name}`, req.params.id);
    saveDatabase(db);
    res.json({ success: true, message: `Planilha ${name} excluída com sucesso.` });
  });

  // Invoicing Matrix routes
  app.get('/api/invoicing', (req, res) => {
    res.json(db.invoicingMatrix);
  });

  app.post('/api/invoicing', requireAdmin, (req, res) => {
    const item: InvoicingCycle = {
      id: `inv-${Date.now()}`,
      cycleName: req.body.cycleName || 'FATURAÇÃO',
      month: req.body.month || 'JULHO',
      company: req.body.company || 'EMPRESA ESPANO',
      project: req.body.project || 'NOVA OBRA',
      amount: Number(req.body.amount) || 0
    };
    db.invoicingMatrix.push(item);
    addAuditLog('admin', 'Administrador', 'CRIAR_FATURAMENTO_OBRA', `Adicionou faturamento ${item.amount}€ para ${item.company} - ${item.project}`);
    saveDatabase(db);
    res.status(201).json(item);
  });

  app.put('/api/invoicing/:id', requireAdmin, (req, res) => {
    const idx = db.invoicingMatrix.findIndex((i) => i.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Item de faturamento não encontrado' });
      return;
    }
    db.invoicingMatrix[idx] = {
      ...db.invoicingMatrix[idx],
      ...req.body,
      id: req.params.id
    };
    addAuditLog('admin', 'Administrador', 'ATUALIZAR_FATURAMENTO_OBRA', `Atualizou faturamento da obra: ${db.invoicingMatrix[idx].project}`);
    saveDatabase(db);
    res.json(db.invoicingMatrix[idx]);
  });

  app.delete('/api/invoicing/:id', requireAdmin, (req, res) => {
    const idx = db.invoicingMatrix.findIndex((i) => i.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Item de faturamento não encontrado' });
      return;
    }
    const removed = db.invoicingMatrix.splice(idx, 1)[0];
    addAuditLog('admin', 'Administrador', 'EXCLUIR_FATURAMENTO_OBRA', `Removeu faturamento: ${removed.company} - ${removed.project}`);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- CATEGORIES CRUD ENDPOINTS ---
  app.get('/api/categories', (req, res) => {
    if (!db.settings.customCategories) {
      db.settings.customCategories = [
        { id: 'cat-1', name: 'Carros & Carrinhas', type: 'expense', color: '#3b82f6', icon: 'Car' },
        { id: 'cat-2', name: 'Alojamento', type: 'expense', color: '#8b5cf6', icon: 'Home' },
        { id: 'cat-3', name: 'Impostos & Taxas', type: 'expense', color: '#ef4444', icon: 'Receipt' },
        { id: 'cat-4', name: 'Cartão & Bancos', type: 'expense', color: '#f59e0b', icon: 'CreditCard' },
        { id: 'cat-5', name: 'Ferramentas & EPIs', type: 'expense', color: '#10b981', icon: 'Wrench' },
        { id: 'cat-6', name: 'Salários & Equipes', type: 'expense', color: '#06b6d4', icon: 'Users' },
        { id: 'cat-7', name: 'Empreitada / Contrato', type: 'entry', color: '#10b981', icon: 'Building' },
        { id: 'cat-8', name: 'Medição Mensal', type: 'entry', color: '#3b82f6', icon: 'CheckCircle' },
        { id: 'cat-9', name: 'Adiantamento', type: 'entry', color: '#f59e0b', icon: 'Coins' },
        { id: 'cat-10', name: 'Serviços Extras', type: 'entry', color: '#8b5cf6', icon: 'Layers' }
      ];
      saveDatabase(db);
    }
    res.json(db.settings.customCategories);
  });

  app.post('/api/categories', requireAdmin, (req, res) => {
    if (!db.settings.customCategories) {
      db.settings.customCategories = [];
    }
    const { name, type, color, icon, description } = req.body;
    if (!name || !type) {
      res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
      return;
    }
    const newCat: CategoryDefinition = {
      id: `cat-${Date.now()}`,
      name: String(name).trim(),
      type: type === 'entry' ? 'entry' : 'expense',
      color: color || '#3b82f6',
      icon: icon || (type === 'entry' ? 'ArrowDownLeft' : 'ArrowUpRight'),
      description: description || ''
    };
    db.settings.customCategories.push(newCat);
    addAuditLog('admin', 'Administrador', 'CRIAR_CATEGORIA', `Criou a categoria: ${newCat.name} (${newCat.type})`);
    saveDatabase(db);
    res.status(201).json(newCat);
  });

  app.put('/api/categories/:id', requireAdmin, (req, res) => {
    if (!db.settings.customCategories) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }
    const idx = db.settings.customCategories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }
    db.settings.customCategories[idx] = {
      ...db.settings.customCategories[idx],
      ...req.body,
      id: req.params.id
    };
    addAuditLog('admin', 'Administrador', 'ATUALIZAR_CATEGORIA', `Atualizou categoria: ${db.settings.customCategories[idx].name}`);
    saveDatabase(db);
    res.json(db.settings.customCategories[idx]);
  });

  app.delete('/api/categories/:id', requireAdmin, (req, res) => {
    if (!db.settings.customCategories) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }
    const idx = db.settings.customCategories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }
    const removed = db.settings.customCategories.splice(idx, 1)[0];
    addAuditLog('admin', 'Administrador', 'EXCLUIR_CATEGORIA', `Removeu categoria: ${removed.name}`);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- REVENUES (ENTRADAS) SUB-ROUTES ---
  app.post('/api/sheets/:id/revenues', requireAdmin, (req, res) => {
    const sheet = db.sheets.find((s) => s.id === req.params.id);
    if (!sheet) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }
    const { client, amount, status, project, category, description, date, paymentMethod, notes } = req.body;
    const newRev: RevenueItem = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      client: (client || 'CLIENTE').trim(),
      amount: Number(amount) || 0,
      status: status || 'pago',
      project: project || '',
      category: category || 'Empreitada',
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Transferência',
      notes: notes || ''
    };
    sheet.revenues.unshift(newRev);
    sheet.updatedAt = new Date().toISOString();
    addAuditLog('admin', 'Administrador', 'CRIAR_ENTRADA', `Registrou entrada de ${newRev.amount}€ (${newRev.client}) no mês ${sheet.name}`, sheet.id);
    saveDatabase(db);
    res.status(201).json(newRev);
  });

  app.put('/api/sheets/:id/revenues/:revId', requireAdmin, (req, res) => {
    const sheet = db.sheets.find((s) => s.id === req.params.id);
    if (!sheet) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }
    const rev = sheet.revenues.find((r) => r.id === req.params.revId);
    if (!rev) {
      res.status(404).json({ error: 'Registro de entrada não encontrado' });
      return;
    }
    Object.assign(rev, req.body, { id: req.params.revId });
    sheet.updatedAt = new Date().toISOString();
    addAuditLog('admin', 'Administrador', 'ATUALIZAR_ENTRADA', `Atualizou entrada ${rev.client} (${rev.amount}€) no mês ${sheet.name}`, sheet.id);
    saveDatabase(db);
    res.json(rev);
  });

  app.delete('/api/sheets/:id/revenues/:revId', requireAdmin, (req, res) => {
    const sheet = db.sheets.find((s) => s.id === req.params.id);
    if (!sheet) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }
    const idx = sheet.revenues.findIndex((r) => r.id === req.params.revId);
    if (idx === -1) {
      res.status(404).json({ error: 'Registro de entrada não encontrado' });
      return;
    }
    const removed = sheet.revenues.splice(idx, 1)[0];
    sheet.updatedAt = new Date().toISOString();
    addAuditLog('admin', 'Administrador', 'EXCLUIR_ENTRADA', `Excluiu entrada ${removed.client} (${removed.amount}€)`, sheet.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- COSTS (DESPESAS) SUB-ROUTES ---
  app.post('/api/sheets/:id/costs', requireAdmin, (req, res) => {
    const sheet = db.sheets.find((s) => s.id === req.params.id);
    if (!sheet) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }
    const { name, amount, category, date, paymentMethod, note } = req.body;
    const newCost: CostItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: (name || 'DESPESA').trim(),
      amount: Number(amount) || 0,
      category: category || 'outros',
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Conta Corrente',
      note: note || ''
    };
    sheet.costs.unshift(newCost);
    sheet.updatedAt = new Date().toISOString();
    addAuditLog('admin', 'Administrador', 'CRIAR_DESPESA', `Registrou despesa ${newCost.name} (${newCost.amount}€) no mês ${sheet.name}`, sheet.id);
    saveDatabase(db);
    res.status(201).json(newCost);
  });

  app.put('/api/sheets/:id/costs/:costId', requireAdmin, (req, res) => {
    const sheet = db.sheets.find((s) => s.id === req.params.id);
    if (!sheet) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }
    const cost = sheet.costs.find((c) => c.id === req.params.costId);
    if (!cost) {
      res.status(404).json({ error: 'Registro de despesa não encontrado' });
      return;
    }
    Object.assign(cost, req.body, { id: req.params.costId });
    sheet.updatedAt = new Date().toISOString();
    addAuditLog('admin', 'Administrador', 'ATUALIZAR_DESPESA', `Atualizou despesa ${cost.name} (${cost.amount}€) no mês ${sheet.name}`, sheet.id);
    saveDatabase(db);
    res.json(cost);
  });

  app.delete('/api/sheets/:id/costs/:costId', requireAdmin, (req, res) => {
    const sheet = db.sheets.find((s) => s.id === req.params.id);
    if (!sheet) {
      res.status(404).json({ error: 'Planilha não encontrada' });
      return;
    }
    const idx = sheet.costs.findIndex((c) => c.id === req.params.costId);
    if (idx === -1) {
      res.status(404).json({ error: 'Registro de despesa não encontrado' });
      return;
    }
    const removed = sheet.costs.splice(idx, 1)[0];
    sheet.updatedAt = new Date().toISOString();
    addAuditLog('admin', 'Administrador', 'EXCLUIR_DESPESA', `Excluiu despesa ${removed.name} (${removed.amount}€)`, sheet.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Settings update
  app.get('/api/settings', (req, res) => {
    res.json(db.settings);
  });

  app.put('/api/settings', requireAdmin, (req, res) => {
    db.settings = {
      ...db.settings,
      ...req.body
    };
    addAuditLog('admin', 'Administrador', 'ATUALIZAR_CONFIGURACOES', 'Atualizou configurações de sócios e parâmetros do sistema.');
    saveDatabase(db);
    res.json(db.settings);
  });

  // Reset database to initial template
  app.post('/api/reset', requireAdmin, (req, res) => {
    db = JSON.parse(JSON.stringify(initialData));
    addAuditLog('admin', 'Administrador', 'RESET_BANCO', 'Restaurou a base de dados para o padrão inicial das planilhas.');
    saveDatabase(db);
    res.json({ success: true, message: 'Dados restaurados para o padrão original.' });
  });

  // AI Financial Advisory & Audit Assistant
  app.post('/api/ai/analyze', async (req, res) => {
    const { sheetId, promptQuestion } = req.body;
    const targetSheet = db.sheets.find((s) => s.id === sheetId) || db.sheets[0];

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `Você é um CFO e Auditor Financeiro sênior especializado em empresas de Construção Civil e Obras em Portugal/Europa.
Analise detalhadamente os números da planilha fornecida, incluindo:
1. Rentabilidade Líquida e Margem Operacional
2. Peso relativo dos custos (Salários de carpinteiros/pedreiros, viaturas/combustível/via verde, alojamento, impostos NISS/IRS)
3. Fundo de Caixa & Reservas para Impostos (IRC estimado e compensações)
4. Distribuição de Lucros entre os sócios
5. Recomendações práticas de corte de desperdício, fluxo de caixa e provisionamento.

Responda em Português claro, profissional, estruturado com títulos em Markdown, tabelas e destaques numéricos em Euro (€).`;

        const contextData = JSON.stringify({
          planilha: targetSheet,
          faturamentoObrasMatriz: db.invoicingMatrix,
          configuracoesSocios: db.settings.partners,
          perguntaDoUsuario: promptQuestion || 'Faça um raio-x financeiro completo e diagnóstico de lucratividade.'
        });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\nDados Financeiros:\n${contextData}`
        });

        res.json({
          analysis: response.text,
          generatedAt: new Date().toISOString()
        });
        return;
      }
    } catch (err: any) {
      console.warn('Gemini API call error, using smart fallback calculation:', err?.message);
    }

    // Deterministic Smart Fallback Analysis
    const totalRev = targetSheet.revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalCost = targetSheet.costs.reduce((sum, c) => sum + (c.amount || 0), 0);
    const netProfit = totalRev - totalCost;
    const margin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : '0.0';

    const costsByCategory = targetSheet.costs.reduce((acc: Record<string, number>, c) => {
      acc[c.category] = (acc[c.category] || 0) + (c.amount || 0);
      return acc;
    }, {});

    const analysisMarkdown = `### 📊 Diagnóstico Financeiro Executivo: ${targetSheet.name}

#### 1. Resumo de Faturamento e Margem
- **Faturamento Bruto:** ${totalRev.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
- **Custo Operacional Total:** ${totalCost.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
- **Lucro Líquido Operacional:** ${netProfit.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} (Margem Líquida: **${margin}%**)

#### 2. Decomposição de Custos Operacionais
- **Salários (Mão de Obra):** ${(costsByCategory['salarios'] || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} (${totalCost > 0 ? (((costsByCategory['salarios'] || 0) / totalCost) * 100).toFixed(1) : 0}% do total)
- **Impostos, NISS, IRS e Seguros:** ${(costsByCategory['impostos'] || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} (${totalCost > 0 ? (((costsByCategory['impostos'] || 0) / totalCost) * 100).toFixed(1) : 0}%)
- **Viaturas (Combustível, Via Verde, Parcelas):** ${(costsByCategory['carros'] || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
- **Alojamento & Habitação de Operários:** ${(costsByCategory['alojamento'] || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
- **Ferramentas & EPIs:** ${(costsByCategory['ferramentas'] || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}

#### 3. Auditoria de Fundo e Reservas
- **Saldo Consignado/Reserva:** ${(targetSheet.fundValueReserve || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
- **Gastos Extraordinários do Fundo:** ${targetSheet.fundExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
- **Divisão por Sócio (4 Sócios):** ${((netProfit > 0 ? netProfit : 0) / 4).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} por titular.

#### 💡 Recomendações Estratégicas
1. **Otimização de Via Verde & Frotas:** Manter controle de trajetos das carrinhas para evitar sobrecustos de portagem.
2. **Provisão de IRC:** Manter a taxa média de 21% sobre o lucro antes de distribuições de dividendos para evitar passivos fiscais no fecho anual.
3. **Escalonamento de Faturas por Obra:** Assegurar que as medições mensais de faturas Jan/Fev, Mar/Abr e Mai/Jun sejam liquidadas dentro do prazo de 30 dias.`;

    res.json({
      analysis: analysisMarkdown,
      generatedAt: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando com sucesso em http://0.0.0.0:${PORT}`);
  });
}

startServer();
