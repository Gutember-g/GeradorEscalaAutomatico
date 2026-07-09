import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  Activity,
  Building,
  AlertTriangle,
  Loader2,
  TrendingUp,
  PieChart,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Metricas {
  totalAtivas: number;
  totalSuspensas: number;
  totalColaboradores: number;
  escalasNoMes: number;
  rankingOrganizacoes: Array<{
    id: number;
    nome: string;
    totalEscalas: number;
  }>;
  churnCandidatos: Array<{
    id: number;
    nome: string;
    plano: string;
    cadastro: string;
  }>;
  distribuicaoPlanos: Record<string, number>;
  crescimentoContas: Array<{
    mes: string;
    novasOrganizacoes: number;
  }>;
}

const DashboardMetricasAdmin: React.FC = () => {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarMetricas = async () => {
    setLoading(true);
    try {
      const response = await api.get<Metricas>('/admin/dashboard/metricas');
      setMetricas(response.data);
    } catch (err: any) {
      toast.error('Erro ao carregar estatísticas de uso.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMetricas();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-slate-400 gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
        <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">Carregando métricas da plataforma...</span>
      </div>
    );
  }

  if (!metricas) {
    return (
      <div className="text-center py-20 text-slate-500">
        <AlertTriangle size={48} className="text-slate-800 mx-auto mb-3" />
        <p className="font-semibold text-sm">Falha ao obter métricas</p>
      </div>
    );
  }

  // Achar o valor máximo de crescimento para calcular o percentual de altura do gráfico
  const maxCrescimento = Math.max(...metricas.crescimentoContas.map(c => c.novasOrganizacoes), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Monitoramento & Uso da Plataforma</h2>
        <p className="text-xs text-slate-400">Analise a saúde do ecossistema, taxa de churn, uso de recursos e crescimento.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Building size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inquilinos Ativos</p>
            <p className="text-2xl font-black text-white mt-0.5">{metricas.totalAtivas}</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Membros Cadastrados</p>
            <p className="text-2xl font-black text-white mt-0.5">{metricas.totalColaboradores}</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Escalas no Mês</p>
            <p className="text-2xl font-black text-white mt-0.5">{metricas.escalasNoMes}</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suspensos / Bloqueados</p>
            <p className="text-2xl font-black text-white mt-0.5">{metricas.totalSuspensas}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Bar Chart */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Crescimento de Paróquias</h3>
          </div>
          
          <div className="h-44 flex items-end justify-around gap-2 px-2 pt-4">
            {metricas.crescimentoContas.map((c) => {
              const heightPct = (c.novasOrganizacoes / maxCrescimento) * 100;
              return (
                <div key={c.mes} className="flex flex-col items-center flex-1 group">
                  <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition mb-1">
                    {c.novasOrganizacoes}
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPct, 6)}%` }}
                    className="w-full bg-indigo-600 group-hover:bg-indigo-500 rounded-t-lg transition-all duration-300"
                  />
                  <div className="text-[9px] font-bold text-slate-500 mt-2 font-mono whitespace-nowrap">
                    {c.mes}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Distribuição de Planos</h3>
          </div>
          
          <div className="space-y-3.5 py-2">
            {Object.entries(metricas.distribuicaoPlanos).length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-10">Nenhum plano distribuído.</p>
            ) : (
              Object.entries(metricas.distribuicaoPlanos).map(([plano, count]) => {
                const total = metricas.totalAtivas + metricas.totalSuspensas;
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                return (
                  <div key={plano} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-350">{plano}</span>
                      <span className="text-slate-400">{count} contas ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${
                          plano === 'ILIMITADO'
                            ? 'bg-purple-500'
                            : plano === 'PRO'
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ranking Organizations */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Mais Ativas (Total Escalas)</h3>
          </div>

          <div className="space-y-3">
            {metricas.rankingOrganizacoes.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-10">Nenhuma escala gerada na plataforma.</p>
            ) : (
              metricas.rankingOrganizacoes.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-900 rounded-xl hover:border-slate-800 transition">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">#{index + 1}</span>
                    <span className="text-xs font-bold text-slate-200">{item.nome}</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md font-mono">
                    {item.totalEscalas} escalas
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Potential Churn Alerts */}
      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Churn Alertas (Inativos a mais de 60 dias)</h3>
        </div>

        {metricas.churnCandidatos.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            Nenhum sinal de churn detectado! Todos os inquilinos estão ativos ou geraram escalas recentemente.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metricas.churnCandidatos.map((item) => (
              <div key={item.id} className="bg-slate-900/30 border border-red-500/10 p-3 rounded-xl flex items-start gap-2.5">
                <div className="bg-red-500/10 text-red-400 p-1.5 rounded-lg mt-0.5">
                  <AlertTriangle size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 leading-snug">{item.nome}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                      {item.plano}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Cad: {new Date(item.cadastro).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMetricasAdmin;
