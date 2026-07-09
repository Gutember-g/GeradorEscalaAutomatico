import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { navigateTo } from '../utils/navigation';
import { Activity, Lock, Mail, Loader2, User, Church } from 'lucide-react';
import toast from 'react-hot-toast';

const Cadastro: React.FC = () => {
  const { register } = useAuth();
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeParoquia, setNomeParoquia] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeResponsavel || !email || !senha || !nomeParoquia) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(nomeResponsavel, email, senha, nomeParoquia);
      toast.success('Cadastro realizado com sucesso!');
      navigateTo('/colaboradores');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar cadastro.');
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
          Cadastre sua Paróquia ou Organização
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <button
            onClick={() => navigateTo('/login')}
            className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Faça login aqui
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-100 sm:rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="nomeParoquia" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Nome da Paróquia / Comunidade / Organização
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Church size={16} />
                </div>
                <input
                  id="nomeParoquia"
                  type="text"
                  required
                  value={nomeParoquia}
                  onChange={(e) => setNomeParoquia(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Paróquia São Francisco de Assis"
                />
              </div>
            </div>

            <div>
              <label htmlFor="nomeResponsavel" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Nome do Responsável / Gestor
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  id="nomeResponsavel"
                  type="text"
                  required
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="José da Silva"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                E-mail do Responsável
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="jose@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Senha (mínimo 6 caracteres)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="senha"
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
                Criar Minha Conta
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-xs text-slate-400 font-medium">
              Ao cadastrar, você concorda com as diretrizes e termos de uso do EscalaFácil.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
