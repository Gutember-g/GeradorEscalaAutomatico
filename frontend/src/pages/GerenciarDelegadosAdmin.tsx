import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  Loader2,
  UserCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Delegado {
  id: number;
  nome: string;
  email: string;
  permissoes: string[];
}

const GerenciarDelegadosAdmin: React.FC = () => {
  const [delegados, setDelegados] = useState<Delegado[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Form
  const [isOpen, setIsOpen] = useState(false);
  const [editingDelegado, setEditingDelegado] = useState<Delegado | null>(null);
  
  // Fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [permissoes, setPermissoes] = useState<string[]>([]);

  const carregarDelegados = async () => {
    setLoading(true);
    try {
      const response = await api.get<Delegado[]>('/admin/delegados');
      setDelegados(response.data);
    } catch (err: any) {
      toast.error('Erro ao carregar administradores delegados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDelegados();
  }, []);

  const handleOpenCreate = () => {
    setEditingDelegado(null);
    setNome('');
    setEmail('');
    setSenha('');
    setPermissoes([]);
    setIsOpen(true);
  };

  const handleOpenEdit = (del: Delegado) => {
    setEditingDelegado(del);
    setNome(del.nome);
    setEmail(del.email);
    setSenha('');
    setPermissoes(del.permissoes);
    setIsOpen(true);
  };

  const handleTogglePermissoes = (modulo: string) => {
    setPermissoes(prev =>
      prev.includes(modulo)
        ? prev.filter(p => p !== modulo)
        : [...prev, modulo]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDelegado) {
        await api.put(`/admin/delegados/${editingDelegado.id}`, {
          nome,
          email,
          senha: senha || undefined,
          permissoes
        });
        toast.success('Administrador delegado atualizado com sucesso.');
      } else {
        await api.post('/admin/delegados', {
          nome,
          email,
          senha,
          permissoes
        });
        toast.success('Administrador delegado criado com sucesso.');
      }
      setIsOpen(false);
      carregarDelegados();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar delegado.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este administrador delegado? O acesso dele será imediatamente revogado.')) {
      return;
    }
    try {
      await api.delete(`/admin/delegados/${id}`);
      toast.success('Delegado excluído com sucesso.');
      carregarDelegados();
    } catch (err: any) {
      toast.error('Erro ao excluir delegado.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Administradores Delegados</h2>
          <p className="text-xs text-slate-400">Delegue permissões de acesso ao painel admin com granularidade por módulo.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
        >
          <Plus size={16} /> Novo Admin Delegado
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <span className="text-xs font-medium">Carregando administradores...</span>
            </div>
          ) : delegados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Shield size={48} className="text-slate-800 mb-3" />
              <p className="text-sm font-semibold">Nenhum administrador delegado cadastrado</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome Completo</th>
                  <th className="px-6 py-4">E-mail de Login</th>
                  <th className="px-6 py-4">Módulos Autorizados</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {delegados.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 font-bold text-slate-200">{del.nome}</td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{del.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {del.permissoes.length === 0 ? (
                          <span className="text-[10px] bg-slate-900 border border-slate-850 text-slate-500 px-2.5 py-0.5 rounded-full font-bold uppercase">Sem Permissões</span>
                        ) : (
                          del.permissoes.map(p => (
                            <span
                              key={p}
                              className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                p === 'USUARIOS'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : p === 'FINANCEIRO'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}
                            >
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(del)}
                          className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(del.id)}
                          className="p-1.5 rounded-lg border border-red-900/30 text-red-500 hover:bg-red-950/40 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: CRIAR / EDITAR DELEGADO */}
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield size={16} className="text-indigo-400" /> {editingDelegado ? 'Editar Admin Delegado' : 'Novo Admin Delegado'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                  placeholder="Nome do administrador"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                  placeholder="admin.delegado@escalafacil.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {editingDelegado ? 'Mudar Senha (deixe em branco para manter)' : 'Senha de Acesso'}
                </label>
                <input
                  type="password"
                  required={!editingDelegado}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                  placeholder={editingDelegado ? '••••••••' : 'Defina a senha'}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Módulos de Acesso Granulares</label>
                <div className="space-y-2">
                  <div
                    onClick={() => handleTogglePermissoes('USUARIOS')}
                    className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">Módulo Usuários & Paróquias</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Criar, suspender e gerenciar cadastros de inquilinos.</p>
                    </div>
                    {permissoes.includes('USUARIOS') ? (
                      <CheckSquare className="text-indigo-500" size={18} />
                    ) : (
                      <Square className="text-slate-700" size={18} />
                    )}
                  </div>

                  <div
                    onClick={() => handleTogglePermissoes('FINANCEIRO')}
                    className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">Módulo Financeiro</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Visualizar faturamento e alterar planos dos inquilinos.</p>
                    </div>
                    {permissoes.includes('FINANCEIRO') ? (
                      <CheckSquare className="text-indigo-500" size={18} />
                    ) : (
                      <Square className="text-slate-700" size={18} />
                    )}
                  </div>

                  <div
                    onClick={() => handleTogglePermissoes('SUPORTE')}
                    className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">Módulo Suporte & Auditoria</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Consultar histórico de logs e verificar dashboard de métricas.</p>
                    </div>
                    {permissoes.includes('SUPORTE') ? (
                      <CheckSquare className="text-indigo-500" size={18} />
                    ) : (
                      <Square className="text-slate-700" size={18} />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  {editingDelegado ? 'Salvar Alterações' : 'Criar Delegado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarDelegadosAdmin;
