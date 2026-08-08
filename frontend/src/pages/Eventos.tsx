import React, { useState, useEffect, useRef, useMemo } from 'react';
import { eventoService } from '../services/api';
import type { Evento } from '../types';
import { formatarDataComDiaSemana } from '../utils/dateUtils';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Users, 
  X, 
  Sparkles, 
  Paintbrush, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  List, 
  Filter, 
  RotateCcw 
} from 'lucide-react';
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

  // Repetitions states
  const [temRepeticao, setTemRepeticao] = useState(false);
  const [numRepeticoes, setNumRepeticoes] = useState(1);
  const [horariosRepetidos, setHorariosRepetidos] = useState<string[]>(['']);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters states
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroVagas, setFiltroVagas] = useState('');
  const [filtroCor, setFiltroCor] = useState('');
  const [filtroHora, setFiltroHora] = useState('');

  // View modes
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('calendario');

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Duplication Modal states
  const [duplicatingEvent, setDuplicatingEvent] = useState<Evento | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<'single' | 'recurrence'>('single');
  const [dupSingleDate, setDupSingleDate] = useState('');
  const [dupStartDate, setDupStartDate] = useState('');
  const [dupEndDate, setDupEndDate] = useState('');
  const [dupDaysOfWeek, setDupDaysOfWeek] = useState<number[]>([]); // 0 = Dom, 1 = Seg ...

  // Highlight state for editing focus
  const [isEditingHighlight, setIsEditingHighlight] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const coresLiturgicas = ['Branco', 'Vermelho', 'Verde', 'Roxo', 'Rosa', 'Dourado'];
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

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
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const abrirEdicao = (e: Evento) => {
    setEditingId(e.id || null);
    setNome(e.nome);
    setData(e.data);
    setHoraInicio(e.horaInicio.slice(0, 5));
    setVagasNecessarias(e.vagasNecessarias);
    setCorLiturgica(e.corLiturgica || '');
    setTemRepeticao(false);
    setShowForm(true);

    setIsEditingHighlight(true);
    setTimeout(() => setIsEditingHighlight(false), 1500);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAbrirDuplicacao = (e: Evento) => {
    setDuplicatingEvent(e);
    setDupSingleDate('');
    setDupStartDate(e.data);
    setDupEndDate('');
    
    // Timezone-safe weekday calculation
    const parts = e.data.split('-');
    const weekday = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay();
    setDupDaysOfWeek([weekday]);
    
    setDuplicateMode('single');
  };

  const handleDuplicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicatingEvent) return;

    if (duplicateMode === 'single') {
      if (!dupSingleDate) {
        toast.error('Escolha a data da cópia. ⚠️');
        return;
      }

      // Validar duplicidade
      const duplicado = eventos.some(evt =>
        evt.nome.toLowerCase() === duplicatingEvent.nome.toLowerCase() &&
        evt.data === dupSingleDate &&
        evt.horaInicio.slice(0, 5) === duplicatingEvent.horaInicio.slice(0, 5)
      );

      if (duplicado) {
        toast.error('Já existe este mesmo evento cadastrado nesta data e horário. ❌');
        return;
      }

      const payload: Evento = {
        nome: duplicatingEvent.nome,
        data: dupSingleDate,
        horaInicio: duplicatingEvent.horaInicio,
        vagasNecessarias: duplicatingEvent.vagasNecessarias,
        corLiturgica: duplicatingEvent.corLiturgica
      };

      const loadingToast = toast.loading('Duplicando evento...');
      try {
        setSaving(true);
        await eventoService.criar(payload);
        toast.success('Evento duplicado com sucesso! 🎉✅', { id: loadingToast });
        setDuplicatingEvent(null);
        carregarEventos();
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Erro ao duplicar evento. ❌', { id: loadingToast });
      } finally {
        setSaving(false);
      }
    } else {
      // Recorrência/Lote
      if (!dupStartDate || !dupEndDate) {
        toast.error('Informe o período inicial e final. ⚠️');
        return;
      }
      if (dupDaysOfWeek.length === 0) {
        toast.error('Selecione pelo menos um dia da semana para recorrência. ⚠️');
        return;
      }

      // Obter datas (timezone-safe)
      const startParts = dupStartDate.split('-');
      const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
      const endParts = dupEndDate.split('-');
      const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
      if (end < start) {
        toast.error('A data final não pode ser anterior à data inicial. ⚠️');
        return;
      }

      const datasCopia: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (dupDaysOfWeek.includes(d.getDay())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          datasCopia.push(`${year}-${month}-${day}`);
        }
      }

      if (datasCopia.length === 0) {
        toast.error('Nenhum dia correspondente encontrado no período selecionado. ⚠️');
        return;
      }

      // Filtrar datas que já possuem esse evento
      const payloads = datasCopia.map(dStr => ({
        nome: duplicatingEvent.nome,
        data: dStr,
        horaInicio: duplicatingEvent.horaInicio,
        vagasNecessarias: duplicatingEvent.vagasNecessarias,
        corLiturgica: duplicatingEvent.corLiturgica
      })).filter(p => {
        const jaExiste = eventos.some(evt =>
          evt.nome.toLowerCase() === p.nome.toLowerCase() &&
          evt.data === p.data &&
          evt.horaInicio.slice(0, 5) === p.horaInicio.slice(0, 5)
        );
        return !jaExiste;
      });

      if (payloads.length === 0) {
        toast.error('Todos os eventos desse período já existem cadastrados. ❌');
        return;
      }

      const loadingToast = toast.loading(`Criando ${payloads.length} eventos recorrentes...`);
      try {
        setSaving(true);
        await Promise.all(payloads.map(p => eventoService.criar(p)));
        toast.success(`${payloads.length} eventos recorrentes criados com sucesso! 📊🎉✅`, { id: loadingToast });
        setDuplicatingEvent(null);
        carregarEventos();
      } catch (err) {
        console.error(err);
        toast.error('Erro ao gerar a recorrência de eventos. ❌', { id: loadingToast });
      } finally {
        setSaving(false);
      }
    }
  };

  const toggleDayOfWeekSelection = (dayIdx: number) => {
    setDupDaysOfWeek(prev => 
      prev.includes(dayIdx) ? prev.filter(idx => idx !== dayIdx) : [...prev, dayIdx]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !data || !horaInicio) {
      toast.error('Preencha os campos obrigatórios (Nome, Data e Horário de Início). ⚠️');
      return;
    }

    if (!editingId && temRepeticao) {
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

  const resetarFiltros = () => {
    setFiltroNome('');
    setFiltroVagas('');
    setFiltroCor('');
    setFiltroHora('');
  };

  const getCorBadgeStyle = (cor?: string) => {
    switch (cor) {
      case 'Branco': return 'bg-white text-slate-705 border-slate-200 border';
      case 'Vermelho': return 'bg-rose-50 text-rose-700 border-rose-100 border';
      case 'Verde': return 'bg-emerald-50 text-emerald-700 border-emerald-100 border';
      case 'Roxo': return 'bg-purple-50 text-purple-700 border-purple-100 border';
      case 'Rosa': return 'bg-pink-50 text-pink-700 border-pink-100 border';
      case 'Dourado': return 'bg-amber-50 text-amber-700 border-amber-200 border';
      default: return 'bg-slate-50 text-slate-600 border-slate-200 border';
    }
  };

  // Filtragem e Ordenação Combinada de Eventos (Memoizados)
  const eventosOrdenados = useMemo(() => {
    const nomeTermo = filtroNome.toLowerCase();
    const filtrados = eventos.filter(e => {
      if (filtroNome && !e.nome.toLowerCase().includes(nomeTermo)) return false;
      if (filtroVagas && e.vagasNecessarias !== Number(filtroVagas)) return false;
      if (filtroCor && e.corLiturgica !== filtroCor) return false;
      if (filtroHora && e.horaInicio.slice(0, 5) !== filtroHora) return false;
      return true;
    });

    return filtrados.sort((a, b) => {
      const dateDiff = a.data.localeCompare(b.data);
      if (dateDiff !== 0) return dateDiff;
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }, [eventos, filtroNome, filtroVagas, filtroCor, filtroHora]);

  // Obter horários únicos para o filtro (Memoizados)
  const horáriosUnicos = useMemo(() => {
    return [...new Set(eventos.map(e => e.horaInicio.slice(0, 5)))].sort();
  }, [eventos]);

  // Calendário Utils
  const diasNoMes = new Date(currentYear, currentMonth, 0).getDate();
  const primeiroDiaSemana = new Date(currentYear, currentMonth - 1, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 1) {
        setCurrentYear(y => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 12) {
        setCurrentYear(y => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-105 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-500 w-6 h-6" /> Eventos & Plantões
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os horários de celebrações, missas e demandas de equipe.</p>
        </div>
        
        <div className="flex gap-2">
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
              <Calendar size={14} /> Calendário
            </button>
          </div>

          {!showForm && (
            <button
              onClick={abrirCadastro}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Plus size={18} /> Novo Evento
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Painel de Filtros Combinados */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Filter size={16} className="text-indigo-500" /> Filtros Combinados
          </span>
          {(filtroNome || filtroVagas || filtroCor || filtroHora) && (
            <button
              onClick={resetarFiltros}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome do Evento</label>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={filtroNome}
              onChange={e => setFiltroNome(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vagas Necessárias</label>
            <select
              value={filtroVagas}
              onChange={e => setFiltroVagas(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Todas</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(v => (
                <option key={v} value={v}>{v} {v === 1 ? 'vaga' : 'vagas'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cor Litúrgica</label>
            <select
              value={filtroCor}
              onChange={e => setFiltroCor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Todas</option>
              {coresLiturgicas.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Horário de Início</label>
            <select
              value={filtroHora}
              onChange={e => setFiltroHora(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Todos</option>
              {horáriosUnicos.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formulário Cadastro/Edição */}
      {showForm && (
        <div 
          ref={formRef} 
          className={`bg-white p-6 rounded-2xl shadow-sm border space-y-6 transition-all duration-300 ${
            isEditingHighlight 
              ? 'ring-4 ring-indigo-500/30 border-indigo-300 bg-indigo-50/10 scale-[1.01]' 
              : 'border-slate-100'
          }`}
        >
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
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                    isEditingHighlight ? 'ring-2 ring-indigo-500/50 border-indigo-400 bg-indigo-50/50' : ''
                  }`}
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
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                    isEditingHighlight ? 'ring-2 ring-indigo-500/50 border-indigo-400 bg-indigo-50/50' : ''
                  }`}
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
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                    isEditingHighlight ? 'ring-2 ring-indigo-500/50 border-indigo-400 bg-indigo-50/50' : ''
                  }`}
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
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                    isEditingHighlight ? 'ring-2 ring-indigo-500/50 border-indigo-400 bg-indigo-50/50' : ''
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cor Litúrgica</label>
                <select
                  value={corLiturgica}
                  onChange={e => setCorLiturgica(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                    isEditingHighlight ? 'ring-2 ring-indigo-500/50 border-indigo-400 bg-indigo-50/50' : ''
                  }`}
                >
                  <option value="">Nenhuma / Branco</option>
                  {coresLiturgicas.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Repetição de Eventos */}
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
                      <label className="text-xs font-semibold text-slate-650">
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
                            className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
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
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-6 rounded-xl transition text-sm shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
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

      {/* Grid de Eventos / Modo Lista */}
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
            <h3 className="text-base font-semibold text-slate-700">Nenhum evento encontrado</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {eventos.length > 0 
                ? 'Nenhum evento corresponde aos filtros selecionados.' 
                : 'Cadastre as demandas de plantões necessárias para gerar as escalas.'}
            </p>
          </div>
          {eventos.length === 0 && (
            <button
              onClick={abrirCadastro}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition cursor-pointer"
            >
              Cadastrar Primeiro
            </button>
          )}
        </div>
      ) : viewMode === 'lista' ? (
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
                  onClick={() => handleAbrirDuplicacao(e)}
                  className="bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-slate-650 text-xs font-semibold py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                  title="Duplicar Evento"
                >
                  <Copy size={13} />
                </button>
                <button
                  onClick={() => abrirEdicao(e)}
                  className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-650 text-xs font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer active:scale-95 transition-all"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeletar(e.id!)}
                  className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-450 text-xs font-semibold p-1.5 rounded-lg transition cursor-pointer active:scale-95 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Visualização em Formato Calendário */
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          {/* Navegação do Calendário */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              {meses[currentMonth - 1]} de {currentYear}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid do Calendário */}
          <div className="grid grid-cols-7 gap-2">
            {/* Cabeçalho dias da semana */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
              <div key={dayName} className="text-center text-xs font-bold text-slate-400 py-2">
                {dayName}
              </div>
            ))}

            {/* Células vazias iniciais */}
            {Array.from({ length: primeiroDiaSemana }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-slate-50/40 border border-slate-100/50 rounded-xl h-24 p-2 opacity-30"></div>
            ))}

            {/* Dias do mês */}
            {Array.from({ length: diasNoMes }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const eventsOfDay = eventosOrdenados.filter(e => e.data === dateStr);

              return (
                <div key={dayNum} className="bg-slate-50/50 border border-slate-100 rounded-xl h-28 p-2 flex flex-col justify-between overflow-hidden hover:bg-white hover:shadow-xs transition duration-150">
                  <span className="text-xs font-bold text-slate-400">{dayNum}</span>
                  
                  <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 scrollbar-none">
                    {eventsOfDay.map(evt => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirEdicao(evt);
                        }}
                        className={`text-[9px] font-bold p-1 rounded-md border flex flex-col leading-tight cursor-pointer hover:scale-[1.03] transition ${getCorBadgeStyle(evt.corLiturgica)}`}
                        title={`${evt.nome} - Início: ${evt.horaInicio.slice(0, 5)}`}
                      >
                        <span className="truncate">{evt.nome}</span>
                        <span className="text-[8px] opacity-75">{evt.horaInicio.slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Duplicação e Recorrência */}
      {duplicatingEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-105 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Copy size={18} className="text-indigo-500" /> Duplicar Evento
                </h3>
                <p className="text-xs text-slate-405 mt-1">Origem: <strong className="text-slate-650">{duplicatingEvent.nome}</strong> ({formatarDataComDiaSemana(duplicatingEvent.data)} às {duplicatingEvent.horaInicio.slice(0, 5)})</p>
              </div>
              <button 
                onClick={() => setDuplicatingEvent(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDuplicar} className="p-6 space-y-5">
              {/* Seleção do Modo */}
              <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDuplicateMode('single')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    duplicateMode === 'single' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Data Única
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateMode('recurrence')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    duplicateMode === 'recurrence' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Recorrência Periódica
                </button>
              </div>

              {/* Data Única */}
              {duplicateMode === 'single' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nova data para o evento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dupSingleDate}
                    onChange={e => setDupSingleDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              )}

              {/* Recorrência */}
              {duplicateMode === 'recurrence' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data Inicial *</label>
                      <input
                        type="date"
                        required
                        value={dupStartDate}
                        onChange={e => setDupStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data Final *</label>
                      <input
                        type="date"
                        required
                        value={dupEndDate}
                        onChange={e => setDupEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dias da Semana *</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {diasSemana.map((dayName, idx) => {
                        const isSelected = dupDaysOfWeek.includes(idx);
                        return (
                          <button
                            type="button"
                            key={dayName}
                            onClick={() => toggleDayOfWeekSelection(idx)}
                            className={`py-2 px-3 border rounded-xl text-xs font-bold transition cursor-pointer select-none text-center ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-250 text-indigo-700'
                                : 'bg-slate-50/50 border-slate-205 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            {dayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDuplicatingEvent(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-5 rounded-xl transition text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-6 rounded-xl transition text-sm shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  {saving ? 'Criando cópias...' : 'Duplicar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Eventos;
