import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  Calendar,
  Activity,
  User,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditLog {
  id: number;
  adminId: number;
  adminNome: string;
  acao: string;
  entidadeAfetada: string;
  entidadeId: number;
  timestamp: string;
  detalhes: string;
}

const ConsultarAuditoriaAdmin: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [admin, setAdmin] = useState('');
  const [acao, setAcao] = useState('');
  const [inicio, setInicio] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [fim, setFim] = useState(new Date().toISOString().split('T')[0]);

  const carregarAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get<AuditLog[]>('/admin/logs-auditoria', {
        params: {
          admin: admin || undefined,
          acao: acao || undefined,
          inicio: inicio || undefined,
          fim: fim || undefined
        }
      });
      setLogs(response.data);
    } catch (err: any) {
      toast.error('Erro ao carregar logs de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAuditLogs();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    carregarAuditLogs();
  };

  const handleLimpar = () => {
    setAdmin('');
    setAcao('');
    setInicio(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFim(new Date().toISOString().split('T')[0]);
    // Timeout pequeno para dar tempo do estado resetar
    setTimeout(carregarAuditLogs, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Logs de Auditoria Administrativa</h2>
        <p className="text-xs text-slate-400">Rastreabilidade completa de ações sensíveis executadas no painel Super Admin.</p>
      </div>

      {/* Filter Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <User size={12} /> Admin
            </label>
            <input
              type="text"
              placeholder="Nome do admin..."
              value={admin}
              onChange={(e) => setAdmin(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Activity size={12} /> Ação
            </label>
            <input
              type="text"
              placeholder="Ex: Excluir Organização"
              value={acao}
              onChange={(e) => setAcao(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Calendar size={12} /> Data Início
            </label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Calendar size={12} /> Data Fim
            </label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLimpar}
              className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
            >
              Limpar
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <span className="text-xs font-medium">Buscando logs no servidor...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <AlertCircle size={48} className="text-slate-800" />
              <p className="text-sm font-semibold">Nenhum registro de auditoria no período selecionado</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Data / Hora</th>
                  <th className="px-6 py-4">Administrador</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Entidade / ID</th>
                  <th className="px-6 py-4">Metadados e Parâmetros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/20 transition align-top">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{log.adminNome}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">#{log.adminId || 'System'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-300">{log.entidadeAfetada}</div>
                      {log.entidadeId && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: #{log.entidadeId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-lg">
                      <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg font-mono text-[10px] text-slate-400 break-all leading-relaxed whitespace-pre-wrap">
                        {log.detalhes}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultarAuditoriaAdmin;
