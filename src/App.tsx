import React, { useState, useEffect } from 'react';
import {
  Shield, Users, UserCheck, AlertTriangle, FileText, Award,
  Activity, BarChart2, Lock, Settings, LogOut, Search, Plus,
  Check, X, Eye, EyeOff, Download, Printer, ArrowUpRight,
  ArrowDownRight, AlertCircle, Trash2, Edit, ShieldAlert,
  Clock, CheckCircle2, XCircle, Menu, Sliders, Database, UserPlus,
  RefreshCw, FileSpreadsheet
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

const HIERARCHY_ORDER = ['ADM DA PASTA', 'AUXILIAR', 'LÍDER', 'SUB', 'AZO', 'AZO-T'];

export default function App() {
  // Auth state
  const [session, setSession] = useState<{ id: string; email: string; full_name: string; role: string; token: string } | null>(() => {
    const saved = localStorage.getItem('azo_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'requests' | 'warnings' | 'blacklist' | 'hierarchy' | 'activities' | 'logs' | 'reports' | 'permissions' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [members, setMembers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login / Register Form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regGtaName, setRegGtaName] = useState('');
  const [regGameId, setRegGameId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDiscord, setRegDiscord] = useState('');
  const [regRoleRequested, setRegRoleRequested] = useState('AZO-T');

  // Modals & Dossier states
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [dossierTab, setDossierTab] = useState<'general' | 'warnings' | 'history' | 'promotions' | 'activities' | 'notes' | 'blacklist'>('general');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddWarningOpen, setIsAddWarningOpen] = useState(false);
  const [isAddBlacklistOpen, setIsAddBlacklistOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [targetMemberForAction, setTargetMemberForAction] = useState<any | null>(null);

  // New item form states
  const [newWarning, setNewWarning] = useState({ member_id: '', type: 'VERBAL', reason: '', description: '', evidence: '', notes: '' });
  const [newBlacklist, setNewBlacklist] = useState({ name: '', game_id: '', discord: '', reason: '', description: '', evidences: '' });
  const [newActivity, setNewActivity] = useState({ member_id: '', category: 'OPERAÇÃO', description: '', notes: '' });
  const [newPromoRole, setNewPromoRole] = useState('AZO');
  const [promoJustification, setPromoJustification] = useState('');
  const [newMemberForm, setNewMemberForm] = useState({ full_name: '', gta_name: '', game_id: '', email: '', password: '', discord: '', role: 'AZO-T', status: 'TRABALHANDO' });

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, rRes, wRes, bRes, prRes, aRes, pRes, lRes] = await Promise.all([
        fetch('/api/members').then(r => r.json()),
        fetch('/api/requests').then(r => r.json()),
        fetch('/api/warnings').then(r => r.json()),
        fetch('/api/blacklist').then(r => r.json()),
        fetch('/api/promotions').then(r => r.json()),
        fetch('/api/activities').then(r => r.json()),
        fetch('/api/permissions').then(r => r.json()),
        fetch('/api/logs').then(r => r.json())
      ]);

      setMembers(mRes);
      setRequests(rRes);
      setWarnings(wRes);
      setBlacklist(bRes);
      setPromotions(prRes);
      setActivities(aRes);
      setPermissions(pRes);
      setLogs(lRes);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
      setSession(data);
      localStorage.setItem('azo_session', JSON.stringify(data));
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regFullName,
          gta_name: regGtaName,
          game_id: regGameId,
          email: regEmail,
          password: regPassword,
          discord: regDiscord,
          role_requested: regRoleRequested
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no cadastro');
      setSuccessMsg(data.message);
      if (data.member && !data.member.is_pending) {
        // First admin auto-login
        setSession({
          id: data.member.id,
          email: data.member.email,
          full_name: data.member.full_name,
          role: data.member.role,
          token: 'token-' + data.member.id
        });
        localStorage.setItem('azo_session', JSON.stringify(data.member));
      } else {
        setAuthMode('login');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('azo_session');
  };

  // Check permission for current user
  const hasPermission = (permKey: string) => {
    if (!session) return false;
    if (session.role === 'ADM DA PASTA') return true;
    const rolePerms = permissions[session.role];
    return rolePerms ? !!rolePerms[permKey] : false;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background ambient glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-950/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-xl p-8 shadow-2xl backdrop-blur-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-red-950/80 border border-red-800 text-red-500 mb-4 shadow-lg shadow-red-950/50">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-white">ANTI ZARALHO OMEGA</h1>
            <p className="text-xs tracking-widest uppercase text-red-500 font-semibold mt-1">SISTEMA ADMINISTRATIVO GTA RP</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
                  placeholder="seu.email@azo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-red-950/50 flex items-center justify-center gap-2"
              >
                <span>Entrar no Sistema</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Não tem conta? <span className="underline font-medium">Solicitar Cadastro</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Nome e Sobrenome"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Nome no GTA RP</label>
                  <input
                    type="text"
                    required
                    value={regGtaName}
                    onChange={e => setRegGtaName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="Nome In-Game"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">ID do Jogo</label>
                  <input
                    type="text"
                    required
                    value={regGameId}
                    onChange={e => setRegGameId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="Ex: 125"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Discord</label>
                  <input
                    type="text"
                    required
                    value={regDiscord}
                    onChange={e => setRegDiscord(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="usuario#0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Cargo Solicitado</label>
                <select
                  value={regRoleRequested}
                  onChange={e => setRegRoleRequested(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                >
                  {HIERARCHY_ORDER.slice(1).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">Nota: O primeiro cadastro no sistema torna-se ADM DA PASTA automaticamente.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 mt-2"
              >
                <span>Enviar Solicitação</span>
                <UserPlus className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Já tem uma conta? <span className="underline font-medium">Fazer Login</span>
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-4 border-t border-zinc-800 text-center text-[11px] text-zinc-500">
            ANTI ZARALHO OMEGA © 2026 · Segurança Máxima
          </div>
        </div>
      </div>
    );
  }

  // Filter & Search states for modules
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('TODOS');
  const [memberRoleFilter, setMemberRoleFilter] = useState('TODOS');

  // Dashboard metrics
  const totalMembers = members.filter(m => !m.is_pending).length;
  const workingMembers = members.filter(m => !m.is_pending && m.status === 'TRABALHANDO').length;
  const inactiveMembers = members.filter(m => !m.is_pending && m.status === 'INATIVO').length;
  const afastadoMembers = members.filter(m => !m.is_pending && m.status === 'AFASTADO').length;
  const observationMembers = members.filter(m => !m.is_pending && m.status === 'EM OBSERVAÇÃO').length;
  const desligadoMembers = members.filter(m => !m.is_pending && m.status === 'DESLIGADO').length;
  const totalWarnings = warnings.length;
  const activeBlacklist = blacklist.filter(b => b.status === 'ATIVA').length;
  const pendingCount = requests.length;

  // Chart data
  const roleChartData = HIERARCHY_ORDER.map(role => ({
    name: role,
    quantidade: members.filter(m => !m.is_pending && m.role === role).length
  }));

  const statusChartData = [
    { name: 'Trabalhando', value: workingMembers, color: '#16a34a' },
    { name: 'Inativo', value: inactiveMembers, color: '#ca8a04' },
    { name: 'Afastado', value: afastadoMembers, color: '#2563eb' },
    { name: 'Observação', value: observationMembers, color: '#9333ea' },
    { name: 'Desligado', value: desligadoMembers, color: '#dc2626' }
  ].filter(d => d.value > 0);

  const COLORS = ['#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#581c87', '#3b0764'];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans antialiased">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-800 text-red-500 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm tracking-wider text-white">AZO OMEGA</h2>
            <p className="text-[10px] text-red-500 font-bold uppercase">PASTA GTA RP</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart2, perm: true },
            { id: 'members', label: 'Membros', icon: Users, perm: 'view_members' },
            { id: 'requests', label: 'Solicitações', icon: UserCheck, perm: 'approve_registrations', badge: pendingCount },
            { id: 'warnings', label: 'Advertências', icon: AlertTriangle, perm: 'view_warnings' },
            { id: 'blacklist', label: 'Blacklist', icon: ShieldAlert, perm: 'manage_blacklist' },
            { id: 'hierarchy', label: 'Hierarquia', icon: Award, perm: 'promote_demote' },
            { id: 'activities', label: 'Atividades', icon: Activity, perm: true },
            { id: 'logs', label: 'Logs do Sistema', icon: FileText, perm: 'view_logs' },
            { id: 'reports', label: 'Relatórios', icon: FileSpreadsheet, perm: 'view_reports' },
            { id: 'permissions', label: 'Permissões', icon: Sliders, perm: 'manage_permissions' },
            { id: 'settings', label: 'Configurações', icon: Settings, perm: true }
          ].map(item => {
            const isAllowed = item.perm === true || hasPermission(item.perm as string);
            if (!isAllowed) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-950/60 border border-red-800/60 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* User Info Footer in Sidebar */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center justify-between mb-3">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{session.full_name}</p>
              <p className="text-[10px] text-red-400 font-bold uppercase">{session.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === 'dashboard' && 'Visão Geral & Dashboard'}
              {activeTab === 'members' && 'Gerenciamento de Membros'}
              {activeTab === 'requests' && 'Solicitações de Cadastro'}
              {activeTab === 'warnings' && 'Sistema de Advertências'}
              {activeTab === 'blacklist' && 'Blacklist Oficial'}
              {activeTab === 'hierarchy' && 'Hierarquia & Promoções'}
              {activeTab === 'activities' && 'Registro de Atividades'}
              {activeTab === 'logs' && 'Logs Administrativos'}
              {activeTab === 'reports' && 'Relatórios e Análises'}
              {activeTab === 'permissions' && 'Controle de Permissões'}
              {activeTab === 'settings' && 'Configurações do Sistema'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 border-l border-zinc-800 pl-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Sistema Online (AZO v2.5)</span>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/80" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-10">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-red-500" />
                  <span className="font-bold text-sm text-white">AZO OMEGA</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: BarChart2, perm: true },
                  { id: 'members', label: 'Membros', icon: Users, perm: 'view_members' },
                  { id: 'requests', label: 'Solicitações', icon: UserCheck, perm: 'approve_registrations', badge: pendingCount },
                  { id: 'warnings', label: 'Advertências', icon: AlertTriangle, perm: 'view_warnings' },
                  { id: 'blacklist', label: 'Blacklist', icon: ShieldAlert, perm: 'manage_blacklist' },
                  { id: 'hierarchy', label: 'Hierarquia', icon: Award, perm: 'promote_demote' },
                  { id: 'activities', label: 'Atividades', icon: Activity, perm: true },
                  { id: 'logs', label: 'Logs do Sistema', icon: FileText, perm: 'view_logs' },
                  { id: 'reports', label: 'Relatórios', icon: FileSpreadsheet, perm: 'view_reports' },
                  { id: 'permissions', label: 'Permissões', icon: Sliders, perm: 'manage_permissions' },
                  { id: 'settings', label: 'Configurações', icon: Settings, perm: true }
                ].map(item => {
                  const isAllowed = item.perm === true || hasPermission(item.perm as string);
                  if (!isAllowed) return null;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800"
                    >
                      <Icon className="w-4 h-4 text-red-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-950">
          
          {/* ==================== 1. DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase font-semibold">Total de Membros</p>
                      <p className="text-2xl font-black text-white mt-1 tabular-nums">{totalMembers}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-red-500">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                    <span className="font-semibold">{workingMembers} trabalhando</span>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase font-semibold">Advertências</p>
                      <p className="text-2xl font-black text-amber-500 mt-1 tabular-nums">{totalWarnings}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-950/40 flex items-center justify-center text-amber-500">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-zinc-400">
                    Registradas no histórico
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase font-semibold">Blacklist Ativa</p>
                      <p className="text-2xl font-black text-red-500 mt-1 tabular-nums">{activeBlacklist}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-red-950/40 flex items-center justify-center text-red-500">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-zinc-400">
                    Indivíduos banidos da pasta
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase font-semibold">Solicitações Pendentes</p>
                      <p className="text-2xl font-black text-blue-400 mt-1 tabular-nums">{pendingCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-950/40 flex items-center justify-center text-blue-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-zinc-400">
                    Aguardando aprovação
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Membros por Cargo Oficial</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                        <Bar dataKey="quantidade" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Membros por Situação / Status</h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Atividade Administrativa Recente</h3>
                <div className="space-y-3">
                  {logs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-lg text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900 text-red-500 flex items-center justify-center font-bold">
                          {log.user_name?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{log.user_name} <span className="text-zinc-400 font-normal">({log.action})</span></p>
                          <p className="text-zinc-400 mt-0.5">{log.details}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-zinc-500 tabular-nums">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. MEMBROS ==================== */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, ID ou Discord..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <select
                    value={memberRoleFilter}
                    onChange={e => setMemberRoleFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="TODOS">Todos os Cargos</option>
                    {HIERARCHY_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select
                    value={memberStatusFilter}
                    onChange={e => setMemberStatusFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="TODOS">Todos os Status</option>
                    <option value="TRABALHANDO">Trabalhando</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="AFASTADO">Afastado</option>
                    <option value="EM OBSERVAÇÃO">Em Observação</option>
                    <option value="DESLIGADO">Desligado</option>
                  </select>
                </div>

                {hasPermission('create_members') && (
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="w-full sm:w-auto bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-950/50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Membro</span>
                  </button>
                )}
              </div>

              {/* Members Table */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <th className="p-4">Membro</th>
                        <th className="p-4">ID / GTA</th>
                        <th className="p-4">Cargo</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Discord</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {members.filter((m: any) => !m.is_pending).filter((m: any) => {
                        const matchSearch = m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                            m.game_id.includes(memberSearch) ||
                                            m.discord.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                            m.gta_name.toLowerCase().includes(memberSearch.toLowerCase());
                        const matchRole = memberRoleFilter === 'TODOS' || m.role === memberRoleFilter;
                        const matchStatus = memberStatusFilter === 'TODOS' || m.status === memberStatusFilter;
                        return matchSearch && matchRole && matchStatus;
                      }).map((m: any) => (
                        <tr key={m.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-white">{m.full_name}</div>
                            <div className="text-xs text-zinc-400">{m.email}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-mono text-xs text-white">ID: {m.game_id}</div>
                            <div className="text-xs text-zinc-400">{m.gta_name}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-950/80 border border-red-800 text-red-300">
                              {m.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              m.status === 'TRABALHANDO' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' :
                              m.status === 'INATIVO' ? 'bg-amber-950/80 border border-amber-800 text-amber-300' :
                              m.status === 'AFASTADO' ? 'bg-blue-950/80 border border-blue-800 text-blue-300' :
                              m.status === 'EM OBSERVAÇÃO' ? 'bg-purple-950/80 border border-purple-800 text-purple-300' :
                              'bg-red-950/80 border border-red-800 text-red-300'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-zinc-300 font-mono">{m.discord}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => { setSelectedMember(m); setDossierTab('general'); }}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ficha</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. SOLICITAÇÕES ==================== */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Solicitações de Cadastro Pendentes</h3>
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    Nenhuma solicitação de cadastro pendente no momento.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((req: any) => (
                      <div key={req.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-white text-base">{req.full_name}</h4>
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-950 border border-blue-800 text-blue-300">
                              Cargo Solicitado: {req.role}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs text-zinc-400">
                            <div><span className="text-zinc-500">GTA RP:</span> <span className="text-white">{req.gta_name} (ID: {req.game_id})</span></div>
                            <div><span className="text-zinc-500">Discord:</span> <span className="text-white font-mono">{req.discord}</span></div>
                            <div><span className="text-zinc-500">E-mail:</span> <span className="text-white">{req.email}</span></div>
                            <div><span className="text-zinc-500">Data:</span> <span className="text-white">{new Date(req.created_at).toLocaleDateString('pt-BR')}</span></div>
                          </div>
                        </div>

                        {hasPermission('approve_registrations') && (
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                              onClick={async () => {
                                const role = prompt('Confirme ou altere o cargo para aprovação:', req.role);
                                if (!role) return;
                                const res = await fetch(`/api/requests/${req.id}/approve`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ assigned_role: role, admin_id: session.id, admin_name: session.full_name })
                                });
                                if (res.ok) loadData();
                              }}
                              className="flex-1 md:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              <span>Aprovar</span>
                            </button>
                            <button
                              onClick={async () => {
                                const reason = prompt('Informe o motivo da recusa:');
                                if (!reason) return;
                                const res = await fetch(`/api/requests/${req.id}/reject`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ admin_id: session.id, admin_name: session.full_name, reason })
                                });
                                if (res.ok) loadData();
                              }}
                              className="flex-1 md:flex-none px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Recusar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 4. ADVERTÊNCIAS ==================== */}
          {activeTab === 'warnings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Histórico de Advertências</h3>
                {hasPermission('manage_warnings') && (
                  <button
                    onClick={() => setIsAddWarningOpen(true)}
                    className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-red-950/50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aplicar Advertência</span>
                  </button>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <th className="p-4">Membro</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Motivo</th>
                        <th className="p-4">Responsável</th>
                        <th className="p-4">Data</th>
                        <th className="p-4">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {warnings.map((w: any) => {
                        const m = members.find((mem: any) => mem.id === w.member_id);
                        return (
                          <tr key={w.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-4 font-semibold text-white">{m?.full_name || 'Membro Removido'}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                w.type === 'VERBAL' ? 'bg-amber-950 border border-amber-800 text-amber-300' :
                                w.type === 'FORMAL' ? 'bg-orange-950 border border-orange-800 text-orange-300' :
                                'bg-red-950 border border-red-800 text-red-300'
                              }`}>
                                {w.type}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-200">{w.reason}</td>
                            <td className="p-4 text-zinc-400">{w.admin_name}</td>
                            <td className="p-4 text-xs text-zinc-400 tabular-nums">{new Date(w.date).toLocaleString('pt-BR')}</td>
                            <td className="p-4 text-xs text-zinc-400">{w.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5. BLACKLIST ==================== */}
          {activeTab === 'blacklist' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Blacklist Oficial da Organização</h3>
                {hasPermission('manage_blacklist') && (
                  <button
                    onClick={() => setIsAddBlacklistOpen(true)}
                    className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-red-950/50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar à Blacklist</span>
                  </button>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <th className="p-4">Indivíduo</th>
                        <th className="p-4">ID / Discord</th>
                        <th className="p-4">Motivo</th>
                        <th className="p-4">Situação</th>
                        <th className="p-4">Responsável</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {blacklist.map((b: any) => (
                        <tr key={b.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-4 font-semibold text-white">{b.name}</td>
                          <td className="p-4">
                            <div className="font-mono text-xs text-white">ID: {b.game_id}</div>
                            <div className="text-xs text-zinc-400">{b.discord}</div>
                          </td>
                          <td className="p-4 text-zinc-200">
                            <div>{b.reason}</div>
                            <div className="text-xs text-zinc-400">{b.description}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              b.status === 'ATIVA' ? 'bg-red-950 border border-red-800 text-red-300' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-zinc-400">{b.responsible_name}</td>
                          <td className="p-4 text-right">
                            {b.status === 'ATIVA' && hasPermission('remove_blacklist') && (
                              <button
                                onClick={async () => {
                                  const justification = prompt('Justificativa obrigatória para remover da Blacklist:');
                                  if (!justification) return;
                                  const res = await fetch(`/api/blacklist/${b.id}/remove`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ justification, responsible_id: session.id, responsible_name: session.full_name })
                                  });
                                  if (res.ok) loadData();
                                }}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                Remover
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. HIERARQUIA ==================== */}
          {activeTab === 'hierarchy' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Estrutura Hierárquica Oficial</h3>
                <p className="text-xs text-zinc-400 mb-6">Ordem estrita da organização: ADM DA PASTA → AUXILIAR → LÍDER → SUB → AZO → AZO-T</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
                  {HIERARCHY_ORDER.map((role, idx) => (
                    <div key={role} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
                      <span className="text-xs font-mono text-red-500 font-bold">0{idx + 1}</span>
                      <h4 className="font-bold text-white text-sm mt-1">{role}</h4>
                      <p className="text-xs text-zinc-400 mt-2">
                        {members.filter((m: any) => !m.is_pending && m.role === role).length} membros
                      </p>
                    </div>
                  ))}
                </div>

                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Histórico de Promoções e Rebaixamentos</h3>
                <div className="space-y-3">
                  {promotions.map((pr: any) => {
                    const m = members.find((mem: any) => mem.id === pr.member_id);
                    return (
                      <div key={pr.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {m?.full_name || 'Membro'} <span className="text-red-400 font-bold">({pr.type})</span>
                          </p>
                          <p className="text-zinc-400 mt-1">
                            De <span className="text-white">{pr.old_role}</span> para <span className="text-white font-bold">{pr.new_role}</span>. Justificativa: {pr.justification}
                          </p>
                          <p className="text-zinc-500 mt-0.5">Responsável: {pr.responsible_name}</p>
                        </div>
                        <span className="text-zinc-500 tabular-nums">{new Date(pr.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 7. ATIVIDADES ==================== */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registro de Atividades</h3>
                <button
                  onClick={() => setIsAddActivityOpen(true)}
                  className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-red-950/50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Atividade</span>
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <th className="p-4">Membro</th>
                        <th className="p-4">Categoria</th>
                        <th className="p-4">Descrição</th>
                        <th className="p-4">Responsável</th>
                        <th className="p-4">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {activities.map((act: any) => {
                        const m = members.find((mem: any) => mem.id === act.member_id);
                        return (
                          <tr key={act.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-4 font-semibold text-white">{m?.full_name || 'Membro'}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-800 text-zinc-300">
                                {act.category}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-200">
                              <div>{act.description}</div>
                              {act.notes && <div className="text-xs text-zinc-400">{act.notes}</div>}
                            </td>
                            <td className="p-4 text-xs text-zinc-400">{act.responsible_name}</td>
                            <td className="p-4 text-xs text-zinc-400 tabular-nums">{new Date(act.date).toLocaleString('pt-BR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 8. LOGS ==================== */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Logs de Auditoria e Segurança</h3>
                <div className="space-y-3">
                  {logs.map((log: any) => (
                    <div key={log.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-red-500 flex items-center justify-center font-bold">
                          AZ
                        </div>
                        <div>
                          <p className="font-semibold text-white">{log.user_name} <span className="text-red-400 font-semibold">[{log.action}]</span></p>
                          <p className="text-zinc-400 mt-0.5">{log.details}</p>
                        </div>
                      </div>
                      <span className="text-zinc-500 tabular-nums">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 9. RELATÓRIOS ==================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Relatórios e Exportação</h3>
                    <p className="text-xs text-zinc-400 mt-1">Gere relatórios gerenciais consolidados da organização ANTI ZARALHO OMEGA.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir / PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        const csvContent = 'data:text/csv;charset=utf-8,' + members.map(m => Object.values(m).join(',')).join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', 'azo_membros.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-red-950/50"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar CSV</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase">Total Geral de Membros</h4>
                    <p className="text-3xl font-black text-white mt-2">{totalMembers}</p>
                    <p className="text-xs text-emerald-400 mt-1">{workingMembers} ativos em serviço</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase">Advertências Aplicadas</h4>
                    <p className="text-3xl font-black text-amber-500 mt-2">{totalWarnings}</p>
                    <p className="text-xs text-zinc-400 mt-1">Registradas no sistema</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase">Blacklist Ativa</h4>
                    <p className="text-3xl font-black text-red-500 mt-2">{activeBlacklist}</p>
                    <p className="text-xs text-zinc-400 mt-1">Indivíduos impedidos</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 10. PERMISSÕES ==================== */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Painel de Permissões por Cargo</h3>
                <p className="text-xs text-zinc-400 mb-6">O ADM DA PASTA pode configurar as permissões individuais de cada cargo da hierarquia.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <th className="p-4">Permissão / Ação</th>
                        {HIERARCHY_ORDER.map(r => (
                          <th key={r} className="p-4 text-center">{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {[
                        { key: 'view_members', label: 'Visualizar Membros' },
                        { key: 'create_members', label: 'Cadastrar Membros' },
                        { key: 'edit_members', label: 'Editar Membros' },
                        { key: 'approve_registrations', label: 'Aprovar Cadastros' },
                        { key: 'manage_warnings', label: 'Registrar Advertências' },
                        { key: 'view_warnings', label: 'Consultar Advertências' },
                        { key: 'manage_blacklist', label: 'Adicionar Blacklist' },
                        { key: 'remove_blacklist', label: 'Remover Blacklist' },
                        { key: 'promote_demote', label: 'Promover / Rebaixar' },
                        { key: 'change_status', label: 'Alterar Status' },
                        { key: 'register_activities', label: 'Registrar Atividades' },
                        { key: 'view_reports', label: 'Visualizar Relatórios' },
                        { key: 'export_data', label: 'Exportar Dados' },
                        { key: 'view_logs', label: 'Consultar Logs' },
                        { key: 'manage_permissions', label: 'Gerenciar Permissões' },
                        { key: 'system_config', label: 'Configurações do Sistema' }
                      ].map(perm => (
                        <tr key={perm.key} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-4 font-medium text-white">{perm.label}</td>
                          {HIERARCHY_ORDER.map(role => {
                            const isAllowed = permissions[role]?.[perm.key];
                            const isEditable = session.role === 'ADM DA PASTA' && role !== 'ADM DA PASTA';
                            return (
                              <td key={role} className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!isAllowed}
                                  disabled={!isEditable}
                                  onChange={async e => {
                                    const updatedRolePerms = { ...permissions[role], [perm.key]: e.target.checked };
                                    const res = await fetch('/api/permissions', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ role, permissions: updatedRolePerms, admin_id: session.id, admin_name: session.full_name })
                                    });
                                    if (res.ok) loadData();
                                  }}
                                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-0 cursor-pointer disabled:opacity-50"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 11. CONFIGURAÇÕES ==================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Configurações & Integração Supabase</h3>
                  <p className="text-xs text-zinc-400 mt-1">Informações do sistema AZO e instruções de conexão com o banco de dados PostgreSQL / Supabase.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Database className="w-4 h-4 text-red-500" />
                      <span>Status do Banco de Dados</span>
                    </h4>
                    <p className="text-xs text-zinc-400">
                      O sistema está conectado ao armazenamento persistente em tempo real. Para integrar o Supabase oficialmente, configure as variáveis no arquivo <code className="text-red-400 font-mono">.env</code>:
                    </p>
                    <pre className="bg-zinc-900 p-3 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto">
                      VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
                      VITE_SUPABASE_ANON_KEY="sua-chave-anon"
                    </pre>
                  </div>

                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      <span>Hierarquia Oficial AZO</span>
                    </h4>
                    <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                      <li>ADM DA PASTA (Acesso total e inalterável)</li>
                      <li>AUXILIAR</li>
                      <li>LÍDER</li>
                      <li>SUB</li>
                      <li>AZO</li>
                      <li>AZO-T (Recrutas em teste)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Cadastrar Novo Membro</h3>
              <button onClick={() => setIsAddMemberOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async e => {
              e.preventDefault();
              try {
                const res = await fetch('/api/members', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...newMemberForm,
                    admin_id: session.id,
                    admin_name: session.full_name
                  })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar membro');
                setIsAddMemberOpen(false);
                setNewMemberForm({ full_name: '', gta_name: '', game_id: '', email: '', password: '', discord: '', role: 'AZO-T', status: 'TRABALHANDO' });
                loadData();
              } catch (err: any) {
                alert(err.message);
              }
            }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.full_name}
                  onChange={e => setNewMemberForm({ ...newMemberForm, full_name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Nome completo"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Nome no GTA RP</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.gta_name}
                    onChange={e => setNewMemberForm({ ...newMemberForm, gta_name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="Nome In-Game"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">ID do Jogo</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.game_id}
                    onChange={e => setNewMemberForm({ ...newMemberForm, game_id: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="Ex: 142"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={newMemberForm.email}
                  onChange={e => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="email@azo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Senha Inicial</label>
                  <input
                    type="password"
                    required
                    value={newMemberForm.password}
                    onChange={e => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Discord</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.discord}
                    onChange={e => setNewMemberForm({ ...newMemberForm, discord: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="usuario#0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Cargo</label>
                  <select
                    value={newMemberForm.role}
                    onChange={e => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    {HIERARCHY_ORDER.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Status</label>
                  <select
                    value={newMemberForm.status}
                    onChange={e => setNewMemberForm({ ...newMemberForm, status: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="TRABALHANDO">TRABALHANDO</option>
                    <option value="INATIVO">INATIVO</option>
                    <option value="AFASTADO">AFASTADO</option>
                    <option value="EM OBSERVAÇÃO">EM OBSERVAÇÃO</option>
                    <option value="DESLIGADO">DESLIGADO</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-600 shadow-lg shadow-red-950/50"
                >
                  Cadastrar Membro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {isAddActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Registrar Atividade</h3>
              <button onClick={() => setIsAddActivityOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async e => {
              e.preventDefault();
              try {
                const res = await fetch('/api/activities', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...newActivity,
                    responsible_id: session.id,
                    responsible_name: session.full_name
                  })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Erro ao registrar atividade');
                setIsAddActivityOpen(false);
                setNewActivity({ member_id: '', category: 'OPERAÇÃO', description: '', notes: '' });
                loadData();
              } catch (err: any) {
                alert(err.message);
              }
            }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Membro</label>
                <select
                  required
                  value={newActivity.member_id}
                  onChange={e => setNewActivity({ ...newActivity, member_id: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                >
                  <option value="">Selecione o membro...</option>
                  {members.filter((m: any) => !m.is_pending).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.full_name} (ID: {m.game_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Categoria</label>
                <select
                  value={newActivity.category}
                  onChange={e => setNewActivity({ ...newActivity, category: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                >
                  <option value="OPERAÇÃO">OPERAÇÃO</option>
                  <option value="SERVIÇO">SERVIÇO</option>
                  <option value="AUSÊNCIA">AUSÊNCIA</option>
                  <option value="ADMINISTRATIVA">ADMINISTRATIVA</option>
                  <option value="OUTROS">OUTROS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={newActivity.description}
                  onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Descrição da atividade..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  value={newActivity.notes}
                  onChange={e => setNewActivity({ ...newActivity, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Notas adicionais..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddActivityOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-600 shadow-lg shadow-red-950/50"
                >
                  Registrar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Dossier Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-800 text-red-500 flex items-center justify-center font-bold text-lg">
                  {selectedMember.full_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedMember.full_name}</h3>
                  <p className="text-xs text-red-400 font-bold uppercase">{selectedMember.role} · ID: {selectedMember.game_id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-zinc-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/30 px-6 overflow-x-auto">
              {[
                { id: 'general', label: 'Geral' },
                { id: 'warnings', label: 'Advertências' },
                { id: 'promotions', label: 'Hierarquia' },
                { id: 'activities', label: 'Atividades' },
                { id: 'notes', label: 'Observações' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDossierTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    dossierTab === tab.id
                      ? 'border-red-600 text-white'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {dossierTab === 'general' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase">Nome no GTA RP</span>
                    <p className="font-semibold text-white mt-1">{selectedMember.gta_name}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase">E-mail</span>
                    <p className="font-semibold text-white mt-1">{selectedMember.email}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase">Discord</span>
                    <p className="font-semibold text-white mt-1 font-mono">{selectedMember.discord}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase">Status Atual</span>
                    <p className="font-semibold text-white mt-1">{selectedMember.status}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase">Recrutado por</span>
                    <p className="font-semibold text-white mt-1">{selectedMember.recruited_by}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase">Data de Entrada</span>
                    <p className="font-semibold text-white mt-1 tabular-nums">{selectedMember.joined_date}</p>
                  </div>
                </div>
              )}

              {dossierTab === 'warnings' && (
                <div className="space-y-3">
                  {warnings.filter((w: any) => w.member_id === selectedMember.id).length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-8">Nenhuma advertência registrada para este membro.</p>
                  ) : (
                    warnings.filter((w: any) => w.member_id === selectedMember.id).map((w: any) => (
                      <div key={w.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-500">{w.type} — {w.reason}</span>
                          <span className="text-zinc-500 tabular-nums">{new Date(w.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-zinc-300">{w.description}</p>
                        <p className="text-zinc-500">Responsável: {w.admin_name}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'promotions' && (
                <div className="space-y-3">
                  {promotions.filter((pr: any) => pr.member_id === selectedMember.id).length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-8">Nenhum registro de alteração hierárquica.</p>
                  ) : (
                    promotions.filter((pr: any) => pr.member_id === selectedMember.id).map((pr: any) => (
                      <div key={pr.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{pr.type}: {pr.old_role} → {pr.new_role}</span>
                          <span className="text-zinc-500 tabular-nums">{new Date(pr.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-zinc-300">Justificativa: {pr.justification}</p>
                        <p className="text-zinc-500">Responsável: {pr.responsible_name}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'activities' && (
                <div className="space-y-3">
                  {activities.filter((act: any) => act.member_id === selectedMember.id).length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-8">Nenhuma atividade registrada.</p>
                  ) : (
                    activities.filter((act: any) => act.member_id === selectedMember.id).map((act: any) => (
                      <div key={act.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">[{act.category}] {act.description}</span>
                          <span className="text-zinc-500 tabular-nums">{new Date(act.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {act.notes && <p className="text-zinc-400">{act.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'notes' && (
                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-xs">
                    <span className="text-zinc-500 uppercase block mb-1">Observações Internas</span>
                    <p className="text-white">{selectedMember.notes || 'Nenhuma observação registrada.'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
              {hasPermission('promote_demote') && (
                <button
                  onClick={() => {
                    setTargetMemberForAction(selectedMember);
                    setIsPromoModalOpen(true);
                  }}
                  className="px-4 py-2 bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 rounded-lg text-xs font-semibold transition-colors"
                >
                  Promover / Rebaixar Cargo
                </button>
              )}
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors ml-auto"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Warning Modal */}
      {isAddWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Registrar Advertência</h3>
              <button onClick={() => setIsAddWarningOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async e => {
              e.preventDefault();
              const res = await fetch('/api/warnings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...newWarning,
                  admin_id: session.id,
                  admin_name: session.full_name
                })
              });
              if (res.ok) {
                setIsAddWarningOpen(false);
                loadData();
              }
            }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Membro</label>
                <select
                  required
                  value={newWarning.member_id}
                  onChange={e => setNewWarning({ ...newWarning, member_id: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                >
                  <option value="">Selecione o membro...</option>
                  {members.filter((m: any) => !m.is_pending).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.full_name} (ID: {m.game_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Tipo de Advertência</label>
                <select
                  value={newWarning.type}
                  onChange={e => setNewWarning({ ...newWarning, type: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                >
                  <option value="VERBAL">VERBAL</option>
                  <option value="FORMAL">FORMAL</option>
                  <option value="GRAVE">GRAVE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Motivo</label>
                <input
                  type="text"
                  required
                  value={newWarning.reason}
                  onChange={e => setNewWarning({ ...newWarning, reason: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Ex: Atraso em operação"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Descrição Detalhada</label>
                <textarea
                  required
                  rows={3}
                  value={newWarning.description}
                  onChange={e => setNewWarning({ ...newWarning, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Descreva o ocorrido..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Link de Evidências (Opcional)</label>
                <input
                  type="text"
                  value={newWarning.evidence}
                  onChange={e => setNewWarning({ ...newWarning, evidence: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddWarningOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-600 shadow-lg shadow-red-950/50"
                >
                  Registrar Advertência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Blacklist Modal */}
      {isAddBlacklistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Adicionar à Blacklist</h3>
              <button onClick={() => setIsAddBlacklistOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async e => {
              e.preventDefault();
              const res = await fetch('/api/blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...newBlacklist,
                  responsible_id: session.id,
                  responsible_name: session.full_name
                })
              });
              if (res.ok) {
                setIsAddBlacklistOpen(false);
                loadData();
              }
            }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newBlacklist.name}
                  onChange={e => setNewBlacklist({ ...newBlacklist, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Nome do indivíduo"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">ID do Jogo</label>
                  <input
                    type="text"
                    required
                    value={newBlacklist.game_id}
                    onChange={e => setNewBlacklist({ ...newBlacklist, game_id: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="Ex: 999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Discord</label>
                  <input
                    type="text"
                    required
                    value={newBlacklist.discord}
                    onChange={e => setNewBlacklist({ ...newBlacklist, discord: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    placeholder="tag#0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Motivo Principal</label>
                <input
                  type="text"
                  required
                  value={newBlacklist.reason}
                  onChange={e => setNewBlacklist({ ...newBlacklist, reason: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Ex: Anti-RP grave"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Descrição</label>
                <textarea
                  required
                  rows={3}
                  value={newBlacklist.description}
                  onChange={e => setNewBlacklist({ ...newBlacklist, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Detalhes da infração..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Link de Evidências</label>
                <input
                  type="text"
                  value={newBlacklist.evidences}
                  onChange={e => setNewBlacklist({ ...newBlacklist, evidences: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddBlacklistOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-600 shadow-lg shadow-red-950/50"
                >
                  Adicionar à Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotion / Demotion Modal */}
      {isPromoModalOpen && targetMemberForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Alterar Cargo Hierárquico</h3>
              <button onClick={() => setIsPromoModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Membro: <strong className="text-white">{targetMemberForAction.full_name}</strong> (Cargo atual: <span className="text-red-400 font-bold">{targetMemberForAction.role}</span>)
            </p>

            <form onSubmit={async e => {
              e.preventDefault();
              const res = await fetch('/api/promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  member_id: targetMemberForAction.id,
                  new_role: newPromoRole,
                  justification: promoJustification,
                  responsible_id: session.id,
                  responsible_name: session.full_name
                })
              });
              if (res.ok) {
                setIsPromoModalOpen(false);
                setSelectedMember(null);
                loadData();
              }
            }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Novo Cargo</label>
                <select
                  value={newPromoRole}
                  onChange={e => setNewPromoRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                >
                  {HIERARCHY_ORDER.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Justificativa</label>
                <textarea
                  required
                  rows={3}
                  value={promoJustification}
                  onChange={e => setPromoJustification(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                  placeholder="Justifique a alteração de cargo..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-600 shadow-lg shadow-red-950/50"
                >
                  Confirmar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
