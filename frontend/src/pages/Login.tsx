import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { navigateTo } from '../utils/navigation';
import { Activity, Lock, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await login(email, senha);
      toast.success('Login realizado com sucesso!');
      // Redireciona com base no papel do usuário
      const savedUser = sessionStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'SUPER_ADMIN') {
          navigateTo('/admin');
        } else {
          navigateTo('/colaboradores');
        }
      } else {
        navigateTo('/colaboradores');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Activity size={24} />
          </div>
          <span className="font-extrabold text-2xl text-slate-800 tracking-tight">
            Escala<span className="text-indigo-600 font-bold">Fácil</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-800">
          Entre na sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Ou{' '}
          <button
            onClick={() => navigateTo('/cadastro')}
            className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            cadastre uma nova paróquia/organização
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-100 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Endereço de E-mail
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="exemplo@paroquia.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Senha
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : null}
                Entrar
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-xs text-slate-400">
              Ambiente seguro. Acesso restrito a usuários autorizados.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
