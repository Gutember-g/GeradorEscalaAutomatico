import React, { useState, useEffect } from 'react';
import { colaboradorService, escalaService } from '../services/api';
import type { Colaborador, Disponibilidade, Escala } from '../types';
import { formatarDataComDiaSemana } from '../utils/dateUtils';
import { 
  Calendar as CalendarIcon, 
  Save, 
  ArrowLeft, 
  Clock, 
  ShieldAlert, 
  Heart,
  ChevronLeft,
  ChevronRight,
  List,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DisponibilidadeColaboradorProps {
  colaborador: Colaborador;
  onVoltar: () => void;
}

const DisponibilidadeColaborador: React.FC<DisponibilidadeColaboradorProps> = ({ colaborador, onVoltar }) => {
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cross availability states
  const [todosColaboradores, setTodosColaboradores] = useState<Colaborador[]>([]);
  const [colaboradorInfo, setColaboradorInfo] = useState<Colaborador>(colaborador);
  const [naoTrabalharCom, setNaoTrabalharCom] = useState<number[]>([]);
  const [preferenciaTrabalharCom, setPreferenciaTrabalharCom] = useState<number[]>([]);

  // View Mode & selected calendar day
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('calendario');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  useEffect(() => {
    // Carregar todos os colaboradores para as opções de convivência
    colaboradorService.listar().then(setTodosColaboradores).catch(console.error);
    
    // Carregar escalas salvas para exibir alocações cruzadas
    escalaService.listar().then(setEscalas).catch(console.error);
  }, []);

  useEffect(() => {
    if (colaborador.id) {
      carregarDados();
      setSelectedDay(null); // Reset day selection on period change
    }
  }, [colaborador.id, mes, ano]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      const [colabData, dispData] = await Promise.all([
        colaboradorService.buscarPorId(colaborador.id!),
        colaboradorService.obterDisponibilidade(colaborador.id!, mes, ano)
      ]);
      setColaboradorInfo(colabData);
      setNaoTrabalharCom(colabData.naoTrabalharCom || []);
      setPreferenciaTrabalharCom(colabData.preferenciaTrabalharCom || []);
      setDisponibilidades(dispData);
    } catch (err: any) {
      setError('Erro ao carregar os eventos e disponibilidades para o mês selecionado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIndisponivel = (eventoId: number) => {
    setDisponibilidades(prev =>
      prev.map(d => (d.eventoId === eventoId ? { ...d, indisponivel: !d.indisponivel } : d))
    );
  };

  const handleSalvar = async () => {
    const loadingToast = toast.loading('Salvando indisponibilidades e preferências...');
    try {
      setSaving(true);
      setError(null);
      
      // Salvar indisponibilidades mensais
      await colaboradorService.salvarDisponibilidade(colaborador.id!, disponibilidades);
      
      // Salvar preferências de cooperação
      await colaboradorService.atualizar(colaborador.id!, {
        ...colaboradorInfo,
        naoTrabalharCom,
        preferenciaTrabalharCom
      });

      toast.success('Alterações salvas com sucesso! ✅', { id: loadingToast });
      onVoltar();
    } catch (err: any) {
      setError('Erro ao salvar as disponibilidades do colaborador.');
      console.error(err);
      toast.error('Erro ao salvar disponibilidade. ❌', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const outrosColaboradores = todosColaboradores.filter(c => c.id !== colaborador.id);

  // Calendário Utils
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();

  // Mapear alocações por evento
  const obterOutrosEscalados = (eventoId: number) => {
    return escalas
      .flatMap(escala => escala.alocacoes || [])
      .filter(a => a.eventoId === eventoId && a.colaboradorId !== colaborador.id)
      .map(a => a.colaboradorNome);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onVoltar}
            className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer active:scale-95"
            title="Voltar para colaboradores"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Agenda & Preferências
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Colaborador: <strong className="text-indigo-600 font-semibold">{colaborador.nome}</strong> 
              {colaborador.telefone && ` | Telefone: ${colaborador.telefone}`}
            </p>
          </div>
        </div>

        {/* Alternadores e Seletores */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Alternador de visualização */}
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 select-none">
            <button
              onClick={() => setViewMode('lista')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                viewMode === 'lista' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List size={14} /> Lista
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                viewMode === 'calendario' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon size={14} /> Calendário
            </button>
          </div>

          {/* Seletores de Mês e Ano */}
          <div className="flex gap-2">
            <select
              value={mes}
              onChange={e => setMes(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium text-slate-700"
            >
              {meses.map(m => (
                <option key={m.valor} value={m.valor}>{m.nome}</option>
              ))}
            </select>

            <select
              value={ano}
              onChange={e => setAno(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium text-slate-700"
            >
              {anos.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm flex items-center gap-2">
          {error}
        </div>
      )}

      {/* Seção de Preferências Cruzadas (naoTrabalharCom e preferenciaTrabalharCom) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800">
            Preferências de Cooperação / Conflitos
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Defina restrições de escala mútua e preferências de escalação conjunta no mesmo evento.</p>
        </div>

        {todosColaboradores.length <= 1 ? (
          <p className="text-slate-400 text-xs italic">É necessário ter outros colaboradores cadastrados para definir preferências de cooperação.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Não Trabalhar Com */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider">
                <ShieldAlert size={14} /> Não trabalhar com (Restrição de Conflito)
              </label>
              <div className="max-h-48 overflow-y-auto border border-rose-100/50 rounded-xl p-3 bg-rose-50/10 space-y-1.5">
                {outrosColaboradores.map(c => {
                  const isChecked = naoTrabalharCom.includes(c.id!);
                  return (
                    <label key={c.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setNaoTrabalharCom(naoTrabalharCom.filter(id => id !== c.id));
                          } else {
                            setNaoTrabalharCom([...naoTrabalharCom, c.id!]);
                            setPreferenciaTrabalharCom(preferenciaTrabalharCom.filter(id => id !== c.id));
                          }
                        }}
                        className="rounded border-slate-350 text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-700">{c.nome}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Preferência de parceria */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                <Heart size={14} /> Preferência para trabalhar com (Parcerias)
              </label>
              <div className="max-h-48 overflow-y-auto border border-emerald-100/50 rounded-xl p-3 bg-emerald-50/10 space-y-1.5">
                {outrosColaboradores.map(c => {
                  const isChecked = preferenciaTrabalharCom.includes(c.id!);
                  return (
                    <label key={c.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setPreferenciaTrabalharCom(preferenciaTrabalharCom.filter(id => id !== c.id));
                          } else {
                            setPreferenciaTrabalharCom([...preferenciaTrabalharCom, c.id!]);
                            setNaoTrabalharCom(naoTrabalharCom.filter(id => id !== c.id));
                          }
                        }}
                        className="rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-700">{c.nome}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Eventos / Painel de Marcação */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : disponibilidades.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-4">
          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <CalendarIcon size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-700">Nenhum evento cadastrado neste mês</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Não existem eventos ou plantões cadastrados para o período de <strong>{meses.find(m => m.valor === mes)?.nome} de {ano}</strong>.
            </p>
          </div>
        </div>
      ) : viewMode === 'lista' ? (
        /* Visualização em Formato Lista */
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">
              Marque os plantões em que o colaborador está <span className="text-rose-500 font-extrabold uppercase">Indisponível</span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Selecione/marque os cartões correspondentes. Cartões verdes indicam que o colaborador está disponível para escala.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disponibilidades.map(d => (
              <div
                key={d.eventoId}
                onClick={() => handleToggleIndisponivel(d.eventoId)}
                className={`p-4 rounded-2xl border transition duration-200 flex justify-between items-center cursor-pointer select-none ${
                  d.indisponivel
                    ? 'bg-rose-50/50 border-rose-250 shadow-xs'
                    : 'bg-slate-50/50 border-slate-100 hover:border-indigo-100 hover:bg-slate-50/85'
                }`}
              >
                <div className="space-y-2 flex-1 pr-4">
                  <h3 className="font-bold text-sm text-slate-800">{d.nomeEvento}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 py-0.5 px-2 rounded-lg">
                      <CalendarIcon size={13} className="text-indigo-500" />
                      <span>{formatarDataComDiaSemana(d.data)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" />
                      <span>Início: {d.horaInicio.slice(0, 5)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {d.indisponivel ? (
                    <div className="text-rose-600 bg-rose-100/40 p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition">
                      <span className="uppercase tracking-wider text-[10px]">Indisponível</span>
                    </div>
                  ) : (
                    <div className="text-emerald-600 bg-emerald-100/40 p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition">
                      <span className="uppercase tracking-wider text-[10px]">Disponível</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onVoltar}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-5 rounded-xl transition text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-xl transition text-sm shadow-sm cursor-pointer active:scale-95"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      ) : (
        /* Visualização em Formato Calendário de Disponibilidade */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-800">
                Calendário de Disponibilidade
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Selecione eventos no calendário para alternar disponibilidade. Dias com eventos selecionados exibem cores indicadoras.</p>
            </div>

            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 gap-2 select-none">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
                <div key={dayName} className="text-center text-xs font-bold text-slate-400 py-2">
                  {dayName}
                </div>
              ))}

              {Array.from({ length: primeiroDiaSemana }).map((_, idx) => (
                <div key={`empty-${idx}`} className="bg-slate-50/40 border border-slate-100/50 rounded-xl h-24 p-2 opacity-30"></div>
              ))}

              {Array.from({ length: diasNoMes }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const eventsOfDay = disponibilidades.filter(d => d.data === dateStr);
                const isSelected = selectedDay === dayNum;

                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`border rounded-xl h-26 p-2 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-xs transition duration-150 ${
                      isSelected 
                        ? 'border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-500/10' 
                        : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-450">{dayNum}</span>

                    <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 scrollbar-none">
                      {eventsOfDay.map(evt => (
                        <div
                          key={evt.eventoId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleIndisponivel(evt.eventoId);
                          }}
                          className={`text-[9px] font-bold p-1 rounded-md border flex flex-col leading-tight cursor-pointer hover:scale-[1.03] transition ${
                            evt.indisponivel
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                          title={`${evt.nomeEvento} - ${evt.indisponivel ? 'Indisponível' : 'Disponível'}`}
                        >
                          <span className="truncate">{evt.nomeEvento}</span>
                          <span className="text-[8px] opacity-75">{evt.horaInicio.slice(0, 5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção inferior: Detalhes do Dia Selecionado */}
          {selectedDay && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Eventos do dia {selectedDay} de {meses.find(m => m.valor === mes)?.nome}
              </h3>

              {disponibilidades.filter(d => {
                const parts = d.data.split('-');
                return Number(parts[2]) === selectedDay;
              }).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhum evento cadastrado para esta data.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {disponibilidades
                    .filter(d => {
                      const parts = d.data.split('-');
                      return Number(parts[2]) === selectedDay;
                    })
                    .map(d => {
                      const outrosEscalados = obterOutrosEscalados(d.eventoId);
                      return (
                        <div key={d.eventoId} className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-850 text-xs">{d.nomeEvento}</h4>
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <Clock size={11} /> {d.horaInicio.slice(0, 5)}
                              </span>
                            </div>

                            {/* Lista de Outros Escalados */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Users size={11} /> Escalados neste evento:
                              </span>
                              {outrosEscalados.length === 0 ? (
                                <p className="text-[10px] text-slate-450 italic pl-1">Nenhum ministro escalado ainda.</p>
                              ) : (
                                <div className="flex flex-wrap gap-1 pl-1">
                                  {outrosEscalados.map((nome, idx) => (
                                    <span key={idx} className="bg-indigo-50/80 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                                      {nome}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Toggle de Status */}
                          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500">Status do Colaborador:</span>
                            <button
                              type="button"
                              onClick={() => handleToggleIndisponivel(d.eventoId)}
                              className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                                d.indisponivel
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/50'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50'
                              }`}
                            >
                              {d.indisponivel ? (
                                <>
                                  <XCircle size={12} /> Indisponível
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={12} /> Disponível
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Botões de Ação do Calendário */}
          <div className="flex justify-end gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <button
              type="button"
              onClick={onVoltar}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-5 rounded-xl transition text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-xl transition text-sm shadow-sm cursor-pointer active:scale-95"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisponibilidadeColaborador;
