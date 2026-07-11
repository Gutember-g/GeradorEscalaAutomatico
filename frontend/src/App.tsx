import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { navigateTo } from './utils/navigation';
import Colaboradores from './pages/Colaboradores';
import Eventos from './pages/Eventos';
import GeradorEscala from './pages/GeradorEscala';
import Historico from './pages/Historico';
import DisponibilidadeColaborador from './pages/DisponibilidadeColaborador';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import AdminDashboard from './pages/AdminDashboard';
import { Calendar, Users, Wand2, FileText, Activity, LogOut, Loader2, Key } from 'lucide-react';
import type { Colaborador } from './types';
import toast, { Toaster } from 'react-hot-toast';
import api from './services/api';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      await api.post('/auth/alterar-senha', { senhaAtual, novaSenha });
      toast.success('Senha alterada com sucesso! Faça login novamente.');
      setIsChangePasswordOpen(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao alterar a senha.');
    }
  };

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider animate-pulse">
          Carregando EscalaFácil...
        </span>
      </div>
    );
  }

  // 1. Fluxo de Usuário Deslogado
  if (!user) {
    if (currentPath === '/cadastro') {
      return (
        <>
          <Toaster position="top-right" reverseOrder={false} />
          <Cadastro />
        </>
      );
    }
    // Qualquer outro caminho vai para login
    if (currentPath !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
    return (
      <>
        <Toaster position="top-right" reverseOrder={false} />
        <Login />
      </>
    );
  }

  // 2. Fluxo do Super Administrador
  if (user.role === 'SUPER_ADMIN') {
    if (currentPath !== '/admin') {
      window.history.replaceState({}, '', '/admin');
    }
    return (
      <>
        <Toaster position="top-right" reverseOrder={false} />
        <AdminDashboard />
      </>
    );
  }

  // 3. Fluxo de Usuário Comum (ROLE_USER)
  // Redireciona de /login, /cadastro ou /admin para colaboradores
  if (currentPath === '/login' || currentPath === '/cadastro' || currentPath === '/admin' || currentPath === '/') {
    window.history.replaceState({}, '', '/colaboradores');
    // Forçar atualização do estado interno
    setTimeout(() => navigateTo('/colaboradores'), 0);
  }

  const handleSelectColaborador = (c: Colaborador) => {
    setSelectedColaborador(c);
    navigateTo('/disponibilidade');
  };

  const handleVoltar = () => {
    setSelectedColaborador(null);
    navigateTo('/colaboradores');
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/colaboradores':
        return <Colaboradores onSelectColaboradorForDisponibilidade={handleSelectColaborador} />;
      case '/eventos':
        return <Eventos />;
      case '/gerar-escala':
        return <GeradorEscala />;
      case '/historico':
        return <Historico />;
      case '/disponibilidade':
        if (selectedColaborador) {
          return <DisponibilidadeColaborador colaborador={selectedColaborador} onVoltar={handleVoltar} />;
        }
        return <Colaboradores onSelectColaboradorForDisponibilidade={handleSelectColaborador} />;
      default:
        return <Colaboradores onSelectColaboradorForDisponibilidade={handleSelectColaborador} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-100">
                <Activity size={20} />
              </div>
              <span className="font-extrabold text-lg text-slate-800 tracking-tight">
                Escala<span className="text-indigo-600 font-bold">Fácil</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => { setSelectedColaborador(null); navigateTo('/colaboradores'); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 cursor-pointer ${
                  currentPath === '/colaboradores'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Users size={15} /> Colaboradores
              </button>

              {currentPath === '/disponibilidade' && selectedColaborador && (
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase bg-white text-indigo-600 shadow-sm border border-indigo-100 cursor-pointer"
                >
                  <Calendar size={15} /> Disponibilidade ({selectedColaborador.nome.split(' ')[0]})
                </button>
              )}

              <button
                onClick={() => { setSelectedColaborador(null); navigateTo('/eventos'); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 cursor-pointer ${
                  currentPath === '/eventos'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Calendar size={15} /> Eventos
              </button>
              <button
                onClick={() => { setSelectedColaborador(null); navigateTo('/gerar-escala'); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 cursor-pointer ${
                  currentPath === '/gerar-escala'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Wand2 size={15} /> Gerar Escala
              </button>
              <button
                onClick={() => { setSelectedColaborador(null); navigateTo('/historico'); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 cursor-pointer ${
                  currentPath === '/historico'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <FileText size={15} /> Histórico
              </button>
            </nav>

            {/* Profile and Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest leading-none mb-1">
                  {user.nomeOrganizacao}
                </p>
                <p className="text-xs font-bold text-slate-700 leading-none">
                  {user.nome}
                </p>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-indigo-55 hover:text-indigo-600 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer"
              >
                <Key size={13} /> Senha
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer"
              >
                <LogOut size={13} /> Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} EscalaFácil. Gerador de Escalas Automático e Inquilinagem Isolada.</p>
        </div>
      </footer>

      {/* MODAL: ALTERAR SENHA CLIENTE */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Key size={16} className="text-indigo-600" /> Alterar Sua Senha
              </h3>
              <button onClick={() => {
                setIsChangePasswordOpen(false);
                setSenhaAtual('');
                setNovaSenha('');
                setConfirmarSenha('');
              }} className="text-slate-400 hover:text-slate-650 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Senha Atual</label>
                <input
                  type="password"
                  required
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Nova Senha</label>
                <input
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  placeholder="Nova senha (mín. 6 caracteres)"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  placeholder="Confirme a nova senha"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setSenhaAtual('');
                    setNovaSenha('');
                    setConfirmarSenha('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Alterar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
