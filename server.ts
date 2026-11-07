import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const DB_FILE = path.join(__dirname, 'database.json');

// Official Hierarchy Order
const HIERARCHY_ORDER = ['ADM DA PASTA', 'AUXILIAR', 'LÍDER', 'SUB', 'AZO', 'AZO-T'];

interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: string;
  token: string;
}

// Initial Database Seeding
const defaultDb = {
  members: [
    {
      id: 'm-1',
      full_name: 'Administrador AZO',
      gta_name: 'Admin OMEGA',
      game_id: '001',
      email: 'adminpastaomega@gmail.com',
      password_hash: 'admin0456',
      discord: 'admin_azo#0001',
      role: 'ADM DA PASTA',
      status: 'TRABALHANDO',
      is_pending: false,
      recruited_by: 'Sistema',
      joined_date: '2025-01-01',
      notes: 'Administrador Principal da Pasta.',
      created_at: '2025-01-01T00:00:00.000Z'
    }
  ],
  warnings: [],
  blacklists: [],
  promotions: [],
  activities: [],
  permissions: {
    'ADM DA PASTA': {
      view_members: true,
      create_members: true,
      edit_members: true,
      approve_registrations: true,
      manage_warnings: true,
      view_warnings: true,
      manage_blacklist: true,
      remove_blacklist: true,
      promote_demote: true,
      change_status: true,
      register_activities: true,
      view_reports: true,
      export_data: true,
      view_logs: true,
      manage_permissions: true,
      system_config: true
    },
    'AUXILIAR': {
      view_members: true,
      create_members: true,
      edit_members: true,
      approve_registrations: true,
      manage_warnings: true,
      view_warnings: true,
      manage_blacklist: true,
      remove_blacklist: false,
      promote_demote: true,
      change_status: true,
      register_activities: true,
      view_reports: true,
      export_data: true,
      view_logs: true,
      manage_permissions: false,
      system_config: false
    },
    'LÍDER': {
      view_members: true,
      create_members: true,
      edit_members: true,
      approve_registrations: false,
      manage_warnings: true,
      view_warnings: true,
      manage_blacklist: false,
      remove_blacklist: false,
      promote_demote: false,
      change_status: true,
      register_activities: true,
      view_reports: true,
      export_data: true,
      view_logs: false,
      manage_permissions: false,
      system_config: false
    },
    'SUB': {
      view_members: true,
      create_members: false,
      edit_members: false,
      approve_registrations: false,
      manage_warnings: false,
      view_warnings: true,
      manage_blacklist: false,
      remove_blacklist: false,
      promote_demote: false,
      change_status: false,
      register_activities: true,
      view_reports: true,
      export_data: false,
      view_logs: false,
      manage_permissions: false,
      system_config: false
    },
    'AZO': {
      view_members: true,
      create_members: false,
      edit_members: false,
      approve_registrations: false,
      manage_warnings: false,
      view_warnings: false,
      manage_blacklist: false,
      remove_blacklist: false,
      promote_demote: false,
      change_status: false,
      register_activities: true,
      view_reports: false,
      export_data: false,
      view_logs: false,
      manage_permissions: false,
      system_config: false
    },
    'AZO-T': {
      view_members: false,
      create_members: false,
      edit_members: false,
      approve_registrations: false,
      manage_warnings: false,
      view_warnings: false,
      manage_blacklist: false,
      remove_blacklist: false,
      promote_demote: false,
      change_status: false,
      register_activities: false,
      view_reports: false,
      export_data: false,
      view_logs: false,
      manage_permissions: false,
      system_config: false
    }
  },
  audit_logs: [
    {
      id: 'log-1',
      user_id: 'm-1',
      user_name: 'Carlos Eduardo Silva',
      action: 'SISTEMA_INICIALIZADO',
      target_type: 'SYSTEM',
      target_id: 'AZO',
      details: 'Sistema ANTI ZARALHO OMEGA inicializado com sucesso.',
      created_at: '2025-01-01T00:00:00.000Z'
    }
  ]
};

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    const admin = db.members?.find((m: any) => m.id === 'm-1' || m.role === 'ADM DA PASTA');
    if (admin) {
      admin.email = 'adminpastaomega@gmail.com';
      admin.password_hash = 'admin0456';
    }
    return db;
  } catch (err) {
    return defaultDb;
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function logAudit(db: any, userId: string, userName: string, action: string, targetType: string, targetId: string, details: string) {
  const newLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    user_id: userId,
    user_name: userName,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(newLog);
}

// REST API Endpoints

// 1. Auth Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const member = db.members.find((m: any) => m.email.toLowerCase() === email.toLowerCase());

  if (!member || member.password_hash !== password) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  if (member.is_pending) {
    return res.status(403).json({ error: 'Seu cadastro está pendente de aprovação pela administração.' });
  }

  if (member.status === 'DESLIGADO') {
    return res.status(403).json({ error: 'Esta conta foi desligada da organização.' });
  }

  logAudit(db, member.id, member.full_name, 'LOGIN', 'USER', member.id, 'Login realizado com sucesso.');
  writeDb(db);

  const session = {
    id: member.id,
    email: member.email,
    full_name: member.full_name,
    role: member.role,
    token: 'token-' + member.id + '-' + Date.now()
  };

  res.json(session);
});

// 2. Auth Register (Solicitação de Cadastro)
app.post('/api/auth/register', (req, res) => {
  const { full_name, gta_name, game_id, email, password, discord, role_requested } = req.body;
  const db = readDb();

  const existing = db.members.find((m: any) => m.email.toLowerCase() === email.toLowerCase() || m.game_id === game_id);
  if (existing) {
    return res.status(400).json({ error: 'E-mail ou ID do jogo já cadastrado no sistema.' });
  }

  const isFirst = db.members.length === 0;

  const newMember = {
    id: 'm-' + Date.now(),
    full_name,
    gta_name,
    game_id,
    email,
    password_hash: password,
    discord,
    role: isFirst ? 'ADM DA PASTA' : (role_requested || 'AZO-T'),
    status: isFirst ? 'TRABALHANDO' : 'PENDENTE',
    is_pending: !isFirst,
    recruited_by: isFirst ? 'Sistema (Primeiro Admin)' : 'Auto-cadastro',
    joined_date: new Date().toISOString().split('T')[0],
    notes: isFirst ? 'Primeiro administrador cadastrado automaticamente.' : 'Solicitação de cadastro pendente.',
    created_at: new Date().toISOString()
  };

  db.members.push(newMember);
  logAudit(db, newMember.id, newMember.full_name, isFirst ? 'PRIMEIRO_ADMIN_CRIADO' : 'SOLICITACAO_CADASTRO', 'MEMBER', newMember.id, `Cadastro realizado para ${full_name}`);
  writeDb(db);

  res.json({ success: true, message: isFirst ? 'Administrador principal criado com sucesso!' : 'Cadastro realizado! Aguardando aprovação.', member: newMember });
});

// 3. Get Members
app.get('/api/members', (req, res) => {
  const db = readDb();
  res.json(db.members);
});

// 4. Update Member Status / Edit
app.put('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = readDb();
  const index = db.members.findIndex((m: any) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Membro não encontrado.' });
  }

  const oldMember = db.members[index];
  db.members[index] = { ...oldMember, ...updates };

  logAudit(db, updates.admin_id || 'system', updates.admin_name || 'Admin', 'EDITAR_MEMBRO', 'MEMBER', id, `Atualizou dados do membro ${oldMember.full_name}`);
  writeDb(db);
  res.json(db.members[index]);
});

app.post('/api/members', (req, res) => {
  const { full_name, gta_name, game_id, email, password, discord, role, status, notes, admin_id, admin_name } = req.body;
  const db = readDb();

  const existing = db.members.find((m: any) => m.email.toLowerCase() === email.toLowerCase() || m.game_id === game_id);
  if (existing) {
    return res.status(400).json({ error: 'E-mail ou ID do jogo já cadastrado.' });
  }

  const newMember = {
    id: 'm-' + Date.now(),
    full_name,
    gta_name,
    game_id,
    email,
    password_hash: password || 'senha123',
    discord,
    role: role || 'AZO-T',
    status: status || 'TRABALHANDO',
    is_pending: false,
    recruited_by: admin_name || 'Administração',
    joined_date: new Date().toISOString().split('T')[0],
    notes: notes || 'Cadastrado pela administração.',
    created_at: new Date().toISOString()
  };

  db.members.push(newMember);
  logAudit(db, admin_id || 'admin', admin_name || 'Admin', 'CADASTRAR_MEMBRO', 'MEMBER', newMember.id, `Cadastrou o membro ${full_name} (${role})`);
  writeDb(db);
  res.json(newMember);
});

// 5. Registration Requests
app.get('/api/requests', (req, res) => {
  const db = readDb();
  const pending = db.members.filter((m: any) => m.is_pending);
  res.json(pending);
});

app.post('/api/requests/:id/approve', (req, res) => {
  const { id } = req.params;
  const { assigned_role, admin_id, admin_name } = req.body;
  const db = readDb();

  const member = db.members.find((m: any) => m.id === id);
  if (!member) return res.status(404).json({ error: 'Membro não encontrado.' });

  member.is_pending = false;
  member.status = 'TRABALHANDO';
  if (assigned_role) {
    member.role = assigned_role;
  }

  logAudit(db, admin_id || 'admin', admin_name || 'Administrador', 'APROVAR_CADASTRO', 'MEMBER', id, `Aprovou cadastro de ${member.full_name} com cargo ${member.role}`);
  writeDb(db);
  res.json({ success: true, member });
});

app.post('/api/requests/:id/reject', (req, res) => {
  const { id } = req.params;
  const { admin_id, admin_name, reason } = req.body;
  const db = readDb();

  const index = db.members.findIndex((m: any) => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Membro não encontrado.' });

  const member = db.members[index];
  db.members.splice(index, 1);

  logAudit(db, admin_id || 'admin', admin_name || 'Administrador', 'RECUSAR_CADASTRO', 'MEMBER', id, `Recusou cadastro de ${member.full_name}. Motivo: ${reason || 'Não informado'}`);
  writeDb(db);
  res.json({ success: true });
});

// 6. Warnings
app.get('/api/warnings', (req, res) => {
  const db = readDb();
  res.json(db.warnings);
});

app.post('/api/warnings', (req, res) => {
  const { member_id, type, reason, description, admin_id, admin_name, evidence, notes } = req.body;
  const db = readDb();

  const member = db.members.find((m: any) => m.id === member_id);
  if (!member) return res.status(404).json({ error: 'Membro não encontrado.' });

  const newWarning = {
    id: 'w-' + Date.now(),
    member_id,
    type,
    reason,
    description,
    admin_id,
    admin_name,
    date: new Date().toISOString(),
    evidence: evidence || '',
    notes: notes || ''
  };

  db.warnings.push(newWarning);
  logAudit(db, admin_id, admin_name, 'REGISTRAR_ADVERTENCIA', 'WARNING', newWarning.id, `Registrou advertência (${type}) para ${member.full_name}. Motivo: ${reason}`);
  writeDb(db);
  res.json(newWarning);
});

// 7. Blacklist
app.get('/api/blacklist', (req, res) => {
  const db = readDb();
  res.json(db.blacklists);
});

app.post('/api/blacklist', (req, res) => {
  const { name, game_id, discord, reason, description, responsible_id, responsible_name, evidences } = req.body;
  const db = readDb();

  const newEntry = {
    id: 'bl-' + Date.now(),
    name,
    game_id,
    discord,
    reason,
    description,
    responsible_id,
    responsible_name,
    date: new Date().toISOString(),
    evidences: evidences || '',
    status: 'ATIVA',
    removal_justification: ''
  };

  db.blacklists.push(newEntry);
  logAudit(db, responsible_id, responsible_name, 'ADICIONAR_BLACKLIST', 'BLACKLIST', newEntry.id, `Adicionou ${name} (ID: ${game_id}) à Blacklist.`);
  writeDb(db);
  res.json(newEntry);
});

app.post('/api/blacklist/:id/remove', (req, res) => {
  const { id } = req.params;
  const { justification, responsible_id, responsible_name } = req.body;
  const db = readDb();

  const entry = db.blacklists.find((b: any) => b.id === id);
  if (!entry) return res.status(404).json({ error: 'Registro não encontrado na blacklist.' });

  entry.status = 'REMOVIDA';
  entry.removal_justification = justification;

  logAudit(db, responsible_id, responsible_name, 'REMOVER_BLACKLIST', 'BLACKLIST', id, `Removeu ${entry.name} da Blacklist. Justificativa: ${justification}`);
  writeDb(db);
  res.json({ success: true, entry });
});

// 8. Promotions / Demotions (Hierarquia)
app.get('/api/promotions', (req, res) => {
  const db = readDb();
  res.json(db.promotions);
});

app.post('/api/promotions', (req, res) => {
  const { member_id, new_role, justification, responsible_id, responsible_name } = req.body;
  const db = readDb();

  const member = db.members.find((m: any) => m.id === member_id);
  if (!member) return res.status(404).json({ error: 'Membro não encontrado.' });

  const old_role = member.role;
  const oldIndex = HIERARCHY_ORDER.indexOf(old_role);
  const newIndex = HIERARCHY_ORDER.indexOf(new_role);

  // In HIERARCHY_ORDER index 0 is ADM DA PASTA (highest), index 5 is AZO-T (lowest)
  // Promotion means moving towards index 0 (smaller index), Demotion means moving towards index 5 (larger index)
  let type = 'ALTERAÇÃO';
  if (newIndex < oldIndex) type = 'PROMOÇÃO';
  else if (newIndex > oldIndex) type = 'REBAIXAMENTO';

  member.role = new_role;

  const promoRecord = {
    id: 'pr-' + Date.now(),
    member_id,
    old_role,
    new_role,
    type,
    justification,
    responsible_id,
    responsible_name,
    date: new Date().toISOString()
  };

  db.promotions.push(promoRecord);
  logAudit(db, responsible_id, responsible_name, type, 'MEMBER', member_id, `Alterou cargo de ${member.full_name} de ${old_role} para ${new_role}. Motivo: ${justification}`);
  writeDb(db);
  res.json(promoRecord);
});

// 9. Activities
app.get('/api/activities', (req, res) => {
  const db = readDb();
  res.json(db.activities);
});

app.post('/api/activities', (req, res) => {
  const { member_id, category, description, responsible_id, responsible_name, notes } = req.body;
  const db = readDb();

  const newActivity = {
    id: 'act-' + Date.now(),
    member_id,
    category,
    description,
    responsible_id,
    responsible_name,
    date: new Date().toISOString(),
    notes: notes || ''
  };

  db.activities.push(newActivity);
  logAudit(db, responsible_id, responsible_name, 'REGISTRAR_ATIVIDADE', 'ACTIVITY', newActivity.id, `Registrou atividade (${category}) para o membro.`);
  writeDb(db);
  res.json(newActivity);
});

// 10. Permissions
app.get('/api/permissions', (req, res) => {
  const db = readDb();
  res.json(db.permissions);
});

app.put('/api/permissions', (req, res) => {
  const { role, permissions, admin_id, admin_name } = req.body;
  const db = readDb();

  if (!db.permissions[role]) {
    return res.status(400).json({ error: 'Cargo inválido.' });
  }

  db.permissions[role] = permissions;
  logAudit(db, admin_id, admin_name, 'ATUALIZAR_PERMISSOES', 'PERMISSIONS', role, `Atualizou matriz de permissões para o cargo ${role}`);
  writeDb(db);
  res.json(db.permissions);
});

// 11. Audit Logs
app.get('/api/logs', (req, res) => {
  const db = readDb();
  res.json(db.audit_logs);
});

// Vite middleware integration for development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AZO Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
