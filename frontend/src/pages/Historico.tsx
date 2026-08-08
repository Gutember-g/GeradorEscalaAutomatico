import React, { useState, useEffect, useMemo } from 'react';
import { escalaService } from '../services/api';
import type { Escala } from '../types';
import { formatarDataComDiaSemana } from '../utils/dateUtils';
import { exportarEscalaParaExcel } from '../utils/excelExport';
import { Calendar, Trash2, ChevronRight, ChevronDown, Clock, FileText, Phone, Paintbrush, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

const Historico: React.FC = () => {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEscalaId, setExpandedEscalaId] = useState<number | null>(null);
  const [selectedEscala, setSelectedEscala] = useState<Escala | null>(null);

  useEffect(() => {
    carregarEscalas();
  }, []);

  const carregarEscalas = async () => {
    try {
      setLoading(true);
      const data = await escalaService.listar();
      setEscalas(data);
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar histórico de escalas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandEscala = async (id: number) => {
    if (expandedEscalaId === id) {
      setExpandedEscalaId(null);
      setSelectedEscala(null);
    } else {
      setExpandedEscalaId(id);
      try {
        const detail = await escalaService.buscarPorId(id);
        setSelectedEscala(detail);
      } catch (err) {
        console.error('Erro ao carregar detalhes da escala:', err);
        toast.error('Erro ao carregar detalhes da escala. ❌');
      }
    }
  };

  const handleDeletar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita expandir a linha
    if (window.confirm('Tem certeza de que deseja excluir permanentemente esta escala e todas as suas alocações?')) {
      const loadingToast = toast.loading('Excluindo escala...');
      try {
        await escalaService.deletar(id);
        if (expandedEscalaId === id) {
          setExpandedEscalaId(null);
          setSelectedEscala(null);
        }
        toast.success('Escala removida com sucesso! ✅', { id: loadingToast });
        carregarEscalas();
      } catch (err) {
        console.error(err);
        toast.error('Erro ao deletar escala. ❌', { id: loadingToast });
      }
    }
  };

  const alocacoesPorEventoMap = useMemo(() => {
    const map = new Map<number, any[]>();
    if (!selectedEscala || !selectedEscala.alocacoes) return map;
    for (const a of selectedEscala.alocacoes) {
      if (!map.has(a.eventoId)) {
        map.set(a.eventoId, []);
      }
      map.get(a.eventoId)!.push(a);
    }
    return map;
  }, [selectedEscala]);

  const getColaboradoresPorEvento = (eventoId: number) => {
    return alocacoesPorEventoMap.get(eventoId) || [];
  };

  const handleExportarExcel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedEscala) {
      toast.error('Escala não carregada para exportação. ❌');
      return;
    }
    
    const loadingToast = toast.loading('Exportando escala de ministros...');
    try {
      const dataExcel = selectedEscala.eventos.map(evt => {
        const escalados = selectedEscala.alocacoes
          .filter(a => a.eventoId === evt.id)
          .map(a => a.colaboradorNome);
        return {
          data: evt.data,
          horaInicio: evt.horaInicio,
          corLiturgica: evt.corLiturgica,
          nome: evt.nome,
          ministros: escalados
        };
      });
      await exportarEscalaParaExcel(selectedEscala.nome, dataExcel);
      toast.success('Arquivo exportado com sucesso! 📊✅', { id: loadingToast });
    } catch (err) {
      console.error('Erro ao exportar escala para Excel:', err);
      toast.error('Erro ao exportar escala para Excel. ❌', { id: loadingToast });
    }
  };

  const getCorBadgeStyle = (cor?: string) => {
    switch (cor) {
      case 'Branco': return 'bg-white text-slate-700 border-slate-200';
      case 'Vermelho': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Verde': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Roxo': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Rosa': return 'bg-pink-50 text-pink-700 border-pink-100';
      case 'Dourado': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-500 w-6 h-6" /> Histórico de Escalas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Consulte todas as escalas já geradas, seus respectivos eventos e colaboradores escalados.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : escalas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
          <Calendar size={48} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">Nenhuma escala gerada</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Vá para a aba **Gerar Escala** para criar e salvar sua primeira distribuição de plantões.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55/50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 w-10"></th>
                  <th className="py-4 px-6">Nome da Escala</th>
                  <th className="py-4 px-6">Período</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {escalas.map(escala => {
                  const isExpanded = expandedEscalaId === escala.id;
                  return (
                    <React.Fragment key={escala.id}>
                      <tr
                        onClick={() => handleExpandEscala(escala.id)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition ${
                          isExpanded ? 'bg-slate-50/30' : ''
                        }`}
                      >
                        <td className="py-4 px-6">
                          {isExpanded ? (
                            <ChevronDown size={18} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={18} className="text-slate-400" />
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {escala.nome}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                          {new Date(escala.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até {new Date(escala.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={(e) => handleDeletar(escala.id, e)}
                            className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 p-2 rounded-lg transition cursor-pointer"
                            title="Excluir escala"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="bg-slate-50/30 py-6 px-8 border-t border-slate-100">
                            {!selectedEscala ? (
                              <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                              </div>
                            ) : (
                              <div className="space-y-6 animate-fadeIn">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Detalhamento dos Eventos e Escalados</h4>
                                  <button
                                    onClick={(e) => handleExportarExcel(e)}
                                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded-xl text-xs transition duration-200 shadow-sm cursor-pointer"
                                  >
                                    <FileSpreadsheet size={14} /> Exportar para Excel
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {selectedEscala.eventos?.map((evt, idx) => {
                                    const escalados = getColaboradoresPorEvento(evt.id!);
                                    const vagasPreenchidas = escalados.length;
                                    const vagasNecessarias = evt.vagasNecessarias;
                                    const preenchidoTotalmente = vagasPreenchidas === vagasNecessarias;

                                    return (
                                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between">
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                              <span className="font-bold text-slate-800 text-sm block">
                                                {evt.nome}
                                              </span>
                                              <span className="text-slate-500 text-xs flex items-center gap-1 font-semibold">
                                                <Calendar size={13} className="text-indigo-500" /> {formatarDataComDiaSemana(evt.data)}
                                              </span>
                                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                                <Clock size={13} /> Início: {evt.horaInicio.slice(0, 5)}
                                              </span>
                                              {evt.corLiturgica && (
                                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border w-max mt-1 ${getCorBadgeStyle(evt.corLiturgica)}`}>
                                                  <Paintbrush size={10} className="mr-1" /> {evt.corLiturgica}
                                                </span>
                                              )}
                                            </div>
                                            <div>
                                              {preenchidoTotalmente ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100/50 py-0.5 px-2 rounded-md">
                                                  Completo
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100/50 py-0.5 px-2 rounded-md">
                                                  Incompleto ({vagasPreenchidas}/{vagasNecessarias})
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Lista de Alocados */}
                                        <div className="space-y-2 pt-2 border-t border-slate-55">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equipe Escalada</span>
                                          {escalados.length === 0 ? (
                                            <span className="text-rose-500 text-xs italic font-semibold block">Sem profissionais alocados para este plantão</span>
                                          ) : (
                                            <div className="space-y-2">
                                              {escalados.map(a => (
                                                <div key={a.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl">
                                                  <span className="font-semibold text-slate-800">{a.colaboradorNome}</span>
                                                  {a.colaboradorTelefone && (
                                                    <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                                                      <Phone size={10} /> {a.colaboradorTelefone}
                                                    </span>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historico;
