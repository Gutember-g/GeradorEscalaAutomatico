import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  LogOut,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  Building,
  Key,
  Shield,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrganizacaoAdmin {
  id: number;
  nome: string;
  dataCriacao: string;
  ativo: boolean;
  emailResponsavel: string;
  nomeResponsavel: string;
  totalColaboradores: number;
  totalEventos: number;
  totalEscalas: number;
  plano: string;
  observacoes: string;
}

const GerenciarUsuariosAdmin: React.FC = () => {
  const [orgs, setOrgs] = useState<OrganizacaoAdmin[]>([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  // Modais e Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  // Form Fields
  const [selectedOrg, setSelectedOrg] = useState<OrganizacaoAdmin | null>(null);
  const [nomeOrg, setNomeOrg] = useState('');
  const [nomeResp, setNomeResp] = useState('');
  const [emailResp, setEmailResp] = useState('');
  const [senhaResp, setSenhaResp] = useState('');
  const [plano, setPlano] = useState('GRATUITO');
  const [observacoes, setObservacoes] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const carregarOrganizacoes = async (search = '') => {
    setLoading(true);
    try {
      const response = await api.get<OrganizacaoAdmin[]>('/admin/organizacoes', {
        params: search ? { filtro: search } : {}
      });
      setOrgs(response.data);
    } catch (err: any) {
      toast.error('Erro ao carregar organizações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrganizacoes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    carregarOrganizacoes(filtro);
  };

  const handleOpenCreate = () => {
    setNomeOrg('');
    setNomeResp('');
    setEmailResp('');
    setSenhaResp('');
    setPlano('GRATUITO');
    setObservacoes('');
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/organizacoes', {
        nomeOrganizacao: nomeOrg,
        nomeResponsavel: nomeResp,
        emailResponsavel: emailResp,
        senhaResponsavel: senhaResp,
        plano,
        observacoes
      });
      toast.success('Organização e responsável criados com sucesso!');
      setIsCreateOpen(false);
      carregarOrganizacoes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar organização.');
    }
  };

  const handleOpenEdit = (org: OrganizacaoAdmin) => {
    setSelectedOrg(org);
    setNomeOrg(org.nome);
    setNomeResp(org.nomeResponsavel);
    setEmailResp(org.emailResponsavel);
    setPlano(org.plano);
    setObservacoes(org.observacoes || '');
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      await api.put(`/admin/organizacoes/${selectedOrg.id}`, {
        nomeOrganizacao: nomeOrg,
        nomeResponsavel: nomeResp,
        emailResponsavel: emailResp,
        plano,
        observacoes,
        ativo: selectedOrg.ativo
      });
      toast.success('Dados atualizados com sucesso!');
      setIsEditOpen(false);
      carregarOrganizacoes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar dados.');
    }
  };

  const handleToggleAtivo = async (org: OrganizacaoAdmin) => {
    const novoStatus = !org.ativo;
    try {
      await api.put(`/admin/organizacoes/${org.id}/status`, { ativo: novoStatus });
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, ativo: novoStatus } : o));
      toast.success(`Organização "${org.nome}" ${novoStatus ? 'reativada' : 'suspensa'} com sucesso.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao alterar status.');
    }
  };

  const handleOpenDelete = (org: OrganizacaoAdmin) => {
    setSelectedOrg(org);
    setDeleteConfirmText('');
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    if (deleteConfirmText !== selectedOrg.nome) {
      toast.error('O nome digitado não confere!');
      return;
    }
    try {
      await api.delete(`/admin/organizacoes/${selectedOrg.id}`);
      toast.success(`Organização "${selectedOrg.nome}" excluída com sucesso (Soft Delete).`);
      setIsDeleteOpen(false);
      carregarOrganizacoes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir organização.');
    }
  };

  const handleResetPassword = async (org: OrganizacaoAdmin) => {
    try {
      const response = await api.post(`/admin/organizacoes/${org.id}/reset-senha`);
      setTempPassword(response.data.senhaTemporaria);
      setSelectedOrg(org);
      setIsPasswordResetOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao resetar senha.');
    }
  };

  const handleForceLogout = async (org: OrganizacaoAdmin) => {
    try {
      await api.post(`/admin/organizacoes/${org.id}/forcar-logout`);
      toast.success(`Sessões invalidadas para todos os usuários de "${org.nome}".`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao forçar logout.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Gerenciar Organizações & Usuários</h2>
          <p className="text-xs text-slate-400">Cadastre paróquias manualmente, suspenda logins e gerencie planos.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition shadow-md shadow-indigo-900/10 cursor-pointer"
        >
          <Plus size={16} /> Nova Organização
        </button>
      </div>

      {/* Filter and Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Filtrar por nome ou e-mail..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <span className="text-xs font-medium">Buscando cadastros...</span>
            </div>
          ) : orgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Building size={48} className="text-slate-800 mb-3" />
              <p className="text-sm font-semibold">Nenhuma organização ativa</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome / Plano</th>
                  <th className="px-6 py-4">Gestor Responsável</th>
                  <th className="px-6 py-4 text-center">Colaboradores</th>
                  <th className="px-6 py-4 text-center">Eventos</th>
                  <th className="px-6 py-4 text-center">Escalas</th>
                  <th className="px-6 py-4">Observações Internas</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{org.nome}</div>
                      <div className="inline-block text-[9px] font-extrabold bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-md mt-1 uppercase tracking-wider">
                        {org.plano}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-300">{org.nomeResponsavel}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{org.emailResponsavel}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-300">{org.totalColaboradores}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-300">{org.totalEventos}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-300">{org.totalEscalas}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={org.observacoes}>
                      {org.observacoes || <span className="text-slate-600 italic">Nenhuma anotação</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        org.ativo
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {org.ativo ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleAtivo(org)}
                          title={org.ativo ? 'Suspender Organização' : 'Reativar Organização'}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            org.ativo
                              ? 'border-red-900/30 text-red-400 hover:bg-red-950/20'
                              : 'border-emerald-900/30 text-emerald-400 hover:bg-emerald-950/20'
                          }`}
                        >
                          {org.ativo ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(org)}
                          title="Editar Cadastro"
                          className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(org)}
                          title="Resetar Senha"
                          className="p-1.5 rounded-lg border border-slate-700 text-amber-400 hover:bg-amber-950/20 transition cursor-pointer"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          onClick={() => handleForceLogout(org)}
                          title="Forçar Terminar Sessões"
                          className="p-1.5 rounded-lg border border-slate-700 text-purple-400 hover:bg-purple-950/20 transition cursor-pointer"
                        >
                          <LogOut size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(org)}
                          title="Excluir Definitivamente"
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

      {/* MODAL: CRIAR ORGANIZAÇÃO */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building size={16} className="text-indigo-400" /> Nova Organização
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Paróquia/Organização</label>
                <input
                  type="text"
                  required
                  value={nomeOrg}
                  onChange={(e) => setNomeOrg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  placeholder="Ex: Paróquia São José"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Gestor Responsável</label>
                  <input
                    type="text"
                    required
                    value={nomeResp}
                    onChange={(e) => setNomeResp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plano de Limites</label>
                  <select
                    value={plano}
                    onChange={(e) => setPlano(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="GRATUITO">Gratuito (10 colab / 15 ev)</option>
                    <option value="PRO">Pro (50 colab / 100 ev)</option>
                    <option value="ILIMITADO">Ilimitado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail de Login</label>
                  <input
                    type="email"
                    required
                    value={emailResp}
                    onChange={(e) => setEmailResp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Senha Inicial</label>
                  <input
                    type="password"
                    required
                    value={senhaResp}
                    onChange={(e) => setSenhaResp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    placeholder="Defina a senha"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observações Internas (Suporte/Billing)</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 h-20 resize-none"
                  placeholder="Anotações privadas para a administração..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Criar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR ORGANIZAÇÃO */}
      {isEditOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit2 size={16} className="text-indigo-400" /> Editar Cadastro
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Paróquia/Organização</label>
                <input
                  type="text"
                  required
                  value={nomeOrg}
                  onChange={(e) => setNomeOrg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Gestor Responsável</label>
                  <input
                    type="text"
                    required
                    value={nomeResp}
                    onChange={(e) => setNomeResp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plano Atual</label>
                  <select
                    value={plano}
                    onChange={(e) => setPlano(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                  >
                    <option value="GRATUITO">Gratuito (10 colab / 15 ev)</option>
                    <option value="PRO">Pro (50 colab / 100 ev)</option>
                    <option value="ILIMITADO">Ilimitado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail do Responsável</label>
                <input
                  type="email"
                  required
                  value={emailResp}
                  onChange={(e) => setEmailResp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observações Internas (Suporte/Billing)</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden h-20 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET DE SENHA CONFIRMAÇÃO */}
      {isPasswordResetOpen && selectedOrg && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Key size={16} className="text-amber-400" /> Senha Redefinida com Sucesso
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                Uma nova senha temporária foi gerada para <strong>{selectedOrg.nomeResponsavel}</strong> ({selectedOrg.emailResponsavel}).
              </p>
              
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center font-mono text-lg font-bold text-amber-400 select-all cursor-pointer">
                {tempPassword}
              </div>
              
              <p className="text-[10px] text-slate-500">
                Compartilhe esta senha com o cliente. A sessão anterior dele foi automaticamente invalidada.
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsPasswordResetOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETAR (SOFT DELETE COM DUPLA CONFIRMAÇÃO) */}
      {isDeleteOpen && selectedOrg && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-950 border border-slate-850 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-850">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                <Trash2 size={16} /> Exclusão Definitiva
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs leading-relaxed">
                <strong>Atenção:</strong> Isso desativará imediatamente o acesso de todos os colaboradores, eventos e escalas vinculados à organização <strong>{selectedOrg.nome}</strong>. Os dados não serão deletados fisicamente do banco de dados (Soft Delete), mas estarão inacessíveis.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Digite <strong className="text-white">"{selectedOrg.nome}"</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-red-500"
                  placeholder="Nome exato da organização"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== selectedOrg.nome}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarUsuariosAdmin;
