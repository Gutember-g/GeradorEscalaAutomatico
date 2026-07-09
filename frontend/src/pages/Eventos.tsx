import React, { useState, useEffect } from 'react';
import { eventoService } from '../services/api';
import type { Evento } from '../types';
import { formatarDataComDiaSemana } from '../utils/dateUtils';
import { Plus, Trash2, Calendar, Clock, Users, X, Sparkles, Paintbrush } from 'lucide-react';
import toast from 'react-hot-toast';

const Eventos: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [vagasNecessarias, setVagasNecessarias] = useState(1);
  const [corLiturgica, setCorLiturgica] = useState('');

  // Repetitions states (new)
  const [temRepeticao, setTemRepeticao] = useState(false);
  const [numRepeticoes, setNumRepeticoes] = useState(1);
  const [horariosRepetidos, setHorariosRepetidos] = useState<string[]>(['']);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const coresLiturgicas = ['Branco', 'Vermelho', 'Verde', 'Roxo', 'Rosa', 'Dourado'];

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    try {
      setLoading(true);
      const data = await eventoService.listar();
      setEventos(data);
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar eventos. Verifique se o servidor backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setData('');
    setHoraInicio('');
    setVagasNecessarias(1);
    setCorLiturgica('');
    setEditingId(null);
    setTemRepeticao(false);
    setNumRepeticoes(1);
    setHorariosRepetidos(['']);
  };

  const abrirCadastro = () => {
    limparFormulario();
    setShowForm(true);
  };

  const abrirEdicao = (e: Evento) => {
    setEditingId(e.id || null);
    setNome(e.nome);
    setData(e.data);
    setHoraInicio(e.horaInicio.slice(0, 5)); // Remove seconds if present
    setVagasNecessarias(e.vagasNecessarias);
    setCorLiturgica(e.corLiturgica || '');
    setTemRepeticao(false);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !data || !horaInicio) {
      toast.error('Preencha os campos obrigatórios (Nome, Data e Horário de Início). ⚠️');
      return;
    }

    if (!editingId && temRepeticao) {
      // Validar múltiplos horários
      const allTimes = [horaInicio, ...horariosRepetidos].map(h => h.trim());
      if (allTimes.some(h => !h)) {
        toast.error('Preencha todos os horários de início gerados. ⚠️');
        return;
      }

      const uniqTimes = [...new Set(allTimes)];
      if (uniqTimes.length !== allTimes.length) {
        toast.error('Não repita o mesmo horário para o mesmo evento. ⚠️');
        return;
      }

      const payloads = allTimes.map(time => ({
        nome,
        data,
        horaInicio: time.length === 5 ? `${time}:00` : time,
        vagasNecessarias,
        corLiturgica: corLiturgica || undefined
      }));

      // Validar duplicidade com cadastrados
      for (const p of payloads) {
        const duplicado = eventos.some(evt =>
          evt.nome.toLowerCase() === nome.toLowerCase() &&
          evt.data === data &&
          evt.horaInicio.slice(0, 5) === p.horaInicio.slice(0, 5)
        );
        if (duplicado) {
          toast.error(`Já existe um evento cadastrado com o nome "${nome}" no dia ${data} às ${p.horaInicio.slice(0, 5)}. ❌`);
          return;
        }
      }

      const loadingToast = toast.loading(`Criando ${payloads.length} eventos...`);
      try {
        setSaving(true);
        await Promise.all(payloads.map(p => eventoService.criar(p)));
        toast.success('Eventos cadastrados com sucesso! ✅', { id: loadingToast });
        setShowForm(false);
        limparFormulario();
        carregarEventos();
      } catch (err: any) {
        console.error(err);
        toast.error('Erro ao salvar eventos múltiplos. ❌', { id: loadingToast });
      } finally {
        setSaving(false);
      }
    } else {
      // Fluxo de criação individual ou edição
      const duplicado = eventos.some(evt =>
        evt.nome.toLowerCase() === nome.toLowerCase() &&
        evt.data === data &&
        evt.horaInicio.slice(0, 5) === horaInicio.slice(0, 5) &&
        evt.id !== editingId
      );
      if (duplicado) {
        toast.error('Já existe um evento cadastrado com o mesmo nome, data e horário de início. ❌');
        return;
      }

      const payload: Evento = {
        nome,
        data,
        horaInicio: horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio,
        vagasNecessarias,
        corLiturgica: corLiturgica || undefined,
      };

      const loadingToast = toast.loading('Salvando evento...');
      try {
        setSaving(true);
        if (editingId) {
          await eventoService.atualizar(editingId, payload);
          toast.success('Alterações salvas com sucesso! ✅', { id: loadingToast });
        } else {
          await eventoService.criar(payload);
          toast.success('Evento salvo com sucesso! ✅', { id: loadingToast });
        }
        setShowForm(false);
        limparFormulario();
        carregarEventos();
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Erro ao salvar evento. ❌', { id: loadingToast });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeletar = async (id: number) => {
    if (window.confirm('Tem certeza de que deseja excluir este evento?')) {
      const loadingToast = toast.loading('Excluindo evento...');
      try {
        await eventoService.deletar(id);
        toast.success('Removido com sucesso! ✅', { id: loadingToast });
        carregarEventos();
      } catch (err) {
        console.error(err);
        toast.error('Erro ao deletar evento. Ele pode estar associado a uma escala ativa. ❌', { id: loadingToast });
      }
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

  // Ordena os eventos por data (mais recente primeiro)
  const eventosOrdenados = [...eventos].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-500 w-6 h-6" /> Eventos & Plantões
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os horários de celebrações, missas e demandas de equipe.</p>
        </div>
        {!showForm && (
          <button
            onClick={abrirCadastro}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition duration-200 shadow-sm cursor-pointer"
          >
            <Plus size={18} /> Novo Evento
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Formulário Cadastro/Edição */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingId ? 'Editar Evento' : 'Cadastrar Novo Evento'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                limparFormulario();
              }}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome do Evento *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="Ex: Missa de Domingo, Adoração, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data *</label>
                <input
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Horário de Início *</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vagas Necessárias</label>
                <input
                  type="number"
                  min="1"
                  value={vagasNecessarias}
                  onChange={e => setVagasNecessarias(Number(e.target.value))}
                  onFocus={e => e.target.select()}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cor Litúrgica</label>
                <select
                  value={corLiturgica}
                  onChange={e => setCorLiturgica(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                >
                  <option value="">Nenhuma / Branco</option>
                  {coresLiturgicas.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Repetição de Eventos (Apenas ao Criar Novo Evento) */}
            {!editingId && (
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temRepeticao}
                    onChange={e => {
                      setTemRepeticao(e.target.checked);
                      if (e.target.checked && horariosRepetidos.length === 0) {
                        setHorariosRepetidos(['']);
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Este evento se repete em outros horários no mesmo dia?
                  </span>
                </label>

                {temRepeticao && (
                  <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-slate-600">
                        Quantas repetições adicionais?
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={numRepeticoes}
                        onChange={e => {
                          const val = Math.max(1, Math.min(10, Number(e.target.value)));
                          setNumRepeticoes(val);
                          setHorariosRepetidos(prev => {
                            const next = [...prev];
                            if (val > prev.length) {
                              while (next.length < val) next.push('');
                            } else {
                              next.length = val;
                            }
                            return next;
                          });
                        }}
                        onFocus={e => e.target.select()}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {horariosRepetidos.map((time, idx) => (
                        <div key={idx}>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Horário {idx + 2}
                          </label>
                          <input
                            type="time"
                            value={time}
                            onChange={e => {
                              const next = [...horariosRepetidos];
                              next[idx] = e.target.value;
                              setHorariosRepetidos(next);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  limparFormulario();
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-5 rounded-xl transition text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-6 rounded-xl transition text-sm shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Eventos */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : eventosOrdenados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-4">
          <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-indigo-500">
            <Calendar size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-700">Nenhum evento cadastrado</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">Cadastre as demandas de plantões necessárias para gerar as escalas.</p>
          </div>
          <button
            onClick={abrirCadastro}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition cursor-pointer"
          >
            Cadastrar Primeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {eventosOrdenados.map(e => (
            <div key={e.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md hover:border-indigo-100 transition duration-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{e.nome}</h3>
                    {e.corLiturgica && (
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1.5 ${getCorBadgeStyle(e.corLiturgica)}`}>
                        <Paintbrush size={10} className="mr-1" /> {e.corLiturgica}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                  <p className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-450" /> {formatarDataComDiaSemana(e.data)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-450" /> Início: {e.horaInicio.slice(0, 5)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users size={14} className="text-slate-450" /> Vagas: {e.vagasNecessarias}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                <button
                  onClick={() => abrirEdicao(e)}
                  className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-650 text-xs font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeletar(e.id!)}
                  className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-450 text-xs font-semibold p-1.5 rounded-lg transition cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Eventos;
