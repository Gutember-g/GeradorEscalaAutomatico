import React, { useState, useEffect } from 'react';
import { colaboradorService, eventoService, escalaService } from '../services/api';
import type { Colaborador, Evento, RelatorioGeracao } from '../types';
import { formatarDataComDiaSemana, obterDatasMesAtual } from '../utils/dateUtils';
import { exportarEscalaParaExcel } from '../utils/excelExport';
import { Sparkles, Calendar, Users, Wand2, CheckCircle2, AlertTriangle, AlertCircle, ClipboardCheck, Paintbrush, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

const GeradorEscala: React.FC = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);
  

  const [mesEscala, setMesEscala] = useState<number>(new Date().getMonth() + 1);
  const [anoEscala, setAnoEscala] = useState<number>(new Date().getFullYear());
  const [nomeEscala, setNomeEscala] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [selectedColaboradorIds, setSelectedColaboradorIds] = useState<number[]>([]);
  const [filteredEventos, setFilteredEventos] = useState<Evento[]>([]);

  // Resultado
  const [relatorio, setRelatorio] = useState<RelatorioGeracao | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  // Recalcular nome da escala e período sempre que o mês/ano selecionados mudarem
  useEffect(() => {
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = nomesMeses[mesEscala - 1];
    setNomeEscala(`Escala ${nomeMes}/${anoEscala}`);

    const mesStr = String(mesEscala).padStart(2, '0');
    const inicio = `${anoEscala}-${mesStr}-01`;

    const ultimoDia = new Date(anoEscala, mesEscala, 0).getDate();
    const fim = `${anoEscala}-${mesStr}-${String(ultimoDia).padStart(2, '0')}`;

    setDataInicio(inicio);
    setDataFim(fim);
  }, [mesEscala, anoEscala]);

  // Recalcular eventos do período sempre que as datas mudarem
  useEffect(() => {
    if (dataInicio && dataFim) {
      const filtrados = eventos.filter(e => e.data >= dataInicio && e.data <= dataFim);
      // Deduplicar eventos por ID como proteção adicional contra duplicados na listagem
      const unicos = filtrados.filter((e, idx, self) => self.findIndex(x => x.id === e.id) === idx);
      setFilteredEventos(unicos);
    } else {
      setFilteredEventos([]);
    }
  }, [dataInicio, dataFim, eventos]);

  const carregarDados = async () => {
    try {
      setLoadingData(true);
      const [cols, evts] = await Promise.all([
        colaboradorService.listar(),
        eventoService.listar()
      ]);
      setColaboradores(cols);
      setEventos(evts);
      setSelectedColaboradorIds(cols.map(c => c.id!).filter(Boolean));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleColaborador = (id: number) => {
    if (selectedColaboradorIds.includes(id)) {
      setSelectedColaboradorIds(selectedColaboradorIds.filter(cid => cid !== id));
    } else {
      setSelectedColaboradorIds([...selectedColaboradorIds, id]);
    }
  };

  const handleSelectAllColaboradores = () => {
    if (selectedColaboradorIds.length === colaboradores.length) {
      setSelectedColaboradorIds([]);
    } else {
      setSelectedColaboradorIds(colaboradores.map(c => c.id!).filter(Boolean));
    }
  };

  const handleGerarEscala = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeEscala || !dataInicio || !dataFim) {
      toast.error('Preencha os campos obrigatórios. ⚠️');
      return;
    }

    if (filteredEventos.length === 0) {
      toast.error('Não existem eventos cadastrados no período selecionado. Cadastre eventos nesse período antes de gerar a escala. ⚠️');
      return;
    }

    if (selectedColaboradorIds.length === 0) {
      toast.error('Selecione pelo menos um colaborador para participar da escala. ⚠️');
      return;
    }

    const loadingToast = toast.loading('Gerando escala automática...');
    try {
      setGenerating(true);
      setRelatorio(null);

      // Chamada da API
      const res = await escalaService.gerar({
        nomeEscala,
        dataInicio,
        dataFim,
        colaboradorIds: selectedColaboradorIds,
        eventos: filteredEventos
      });

      setRelatorio(res);
      toast.success('Escala gerada com sucesso! ✅', { id: loadingToast });
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar escala: ' + (err.response?.data?.message || err.message), { id: loadingToast });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportarExcel = async () => {
    if (!relatorio) return;
    const loadingToast = toast.loading('Exportando planilha de ministros...');
    try {
      const dataExcel = relatorio.statusEventos.map(se => ({
        data: se.data,
        horaInicio: se.horaInicio,
        corLiturgica: se.corLiturgica,
        nome: se.nome,
        ministros: se.ministros || []
      }));
      await exportarEscalaParaExcel(relatorio.nomeEscala, dataExcel);
      toast.success('Arquivo exportado com sucesso! 📊✅', { id: loadingToast });
    } catch (err) {
      console.error('Erro ao exportar escala para Excel:', err);
      toast.error('Erro ao exportar escala para Excel. ❌', { id: loadingToast });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TOTALMENTE_PREENCHIDO':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 py-1 px-2.5 rounded-full">
            <CheckCircle2 size={14} /> Totalmente Preenchido
          </span>
        );
      case 'PARCIALMENTE_PREENCHIDO':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 py-1 px-2.5 rounded-full">
            <AlertTriangle size={14} /> Parcialmente Preenchido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 py-1 px-2.5 rounded-full">
            <AlertCircle size={14} /> Não Preenchido
          </span>
        );
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wand2 className="text-indigo-500 w-6 h-6" /> Gerar Escala Inteligente
        </h1>
        <p className="text-slate-500 text-sm mt-1">Gere a escala para o mês vigente automaticamente a partir das preferências e disponibilidades.</p>
      </div>

      {loadingData ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : colaboradores.length === 0 || eventos.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-4">
          <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-indigo-500">
            <ClipboardCheck size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-700">Dados insuficientes</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Você precisa ter pelo menos **1 colaborador** e **1 evento** cadastrados no sistema para gerar escalas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Configurações */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 lg:col-span-1 h-fit">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3">Configurações da Escala</h2>
            
            <form onSubmit={handleGerarEscala} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selecione o Mês / Ano da Escala</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={mesEscala}
                    onChange={e => setMesEscala(parseInt(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium text-slate-700"
                  >
                    <option value={1}>Janeiro</option>
                    <option value={2}>Fevereiro</option>
                    <option value={3}>Março</option>
                    <option value={4}>Abril</option>
                    <option value={5}>Maio</option>
                    <option value={6}>Junho</option>
                    <option value={7}>Julho</option>
                    <option value={8}>Agosto</option>
                    <option value={9}>Setembro</option>
                    <option value={10}>Outubro</option>
                    <option value={11}>Novembro</option>
                    <option value={12}>Dezembro</option>
                  </select>

                  <select
                    value={anoEscala}
                    onChange={e => setAnoEscala(parseInt(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium text-slate-700"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome da Escala (Gerado)</label>
                <input
                  type="text"
                  value={nomeEscala}
                  readOnly
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    readOnly
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fim</label>
                  <input
                    type="date"
                    value={dataFim}
                    readOnly
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Eventos Encontrados */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">Eventos no período</span>
                <span className="text-slate-700 font-bold text-sm block">
                  {filteredEventos.length} {filteredEventos.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
                </span>
              </div>

              {/* Seleção de Colaboradores */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-500 uppercase tracking-wider">Equipe Disponível</label>
                  <button
                    type="button"
                    onClick={handleSelectAllColaboradores}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {selectedColaboradorIds.length === colaboradores.length ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2.5 space-y-2 bg-slate-50">
                  {colaboradores.map(c => (
                    <label key={c.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white hover:shadow-xs transition cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedColaboradorIds.includes(c.id!)}
                        onChange={() => handleToggleColaborador(c.id!)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-slate-700 block truncate">{c.nome}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{c.telefone || 'Sem telefone'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-xl transition duration-200 shadow-sm shadow-indigo-100 mt-6"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Gerando Escala...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} /> Gerar Escala
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Resultado / Relatório */}
          <div className="lg:col-span-2 space-y-6">
            {!relatorio ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 h-full flex flex-col justify-center items-center space-y-3">
                <Calendar size={48} className="text-slate-300" />
                <p className="text-sm">Clique em **Gerar Escala** para visualizar a distribuição dos plantões.</p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-3 gap-2">
                  <h2 className="text-lg font-bold text-slate-800">
                    Relatório da Geração: {relatorio.nomeEscala}
                  </h2>
                  <button
                    onClick={handleExportarExcel}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded-xl text-xs transition duration-200 shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet size={14} /> Exportar para Excel
                  </button>
                </div>

                {/* Grid de Resumo */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Vagas</span>
                    <span className="block text-2xl font-black text-slate-800 mt-1">{relatorio.totalVagas}</span>
                  </div>
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Preenchidas</span>
                    <span className="block text-2xl font-black text-emerald-700 mt-1">{relatorio.vagasPreenchidas}</span>
                  </div>
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Restantes</span>
                    <span className="block text-2xl font-black text-rose-700 mt-1">{relatorio.vagasRestantes}</span>
                  </div>
                </div>

                {/* Lista de Alocações por Evento */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    Detalhes dos Plantões & Alocações
                  </h3>

                  <div className="space-y-4">
                    {relatorio.statusEventos.map((se, idx) => (
                      <div key={idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        {/* Infos do Evento */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">
                              {formatarDataComDiaSemana(se.data)}
                            </span>
                            <span className="text-slate-400 text-xs">|</span>
                            <span className="text-slate-600 text-xs font-semibold">
                              Início: {se.horaInicio.slice(0, 5)}
                            </span>
                            {se.corLiturgica && (
                              <>
                                <span className="text-slate-400 text-xs">|</span>
                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCorBadgeStyle(se.corLiturgica)}`}>
                                  <Paintbrush size={10} className="mr-1" />
                                  {se.corLiturgica}
                                </span>
                              </>
                            )}
                          </div>
                          
                          {/* Alocações neste evento */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Escalados</span>
                            <div className="text-xs text-slate-600 font-medium">
                              Vagas: {se.vagasPreenchidas} / {se.vagasNecessarias} preenchidas.
                            </div>
                            {se.ministros && se.ministros.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {se.ministros.map((min, mIdx) => (
                                  <span key={mIdx} className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-indigo-100/50">
                                    {min}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status do preenchimento */}
                        <div className="text-right space-y-1 md:self-center">
                          <div>{getStatusBadge(se.status)}</div>
                          {se.motivo && se.status !== 'TOTALMENTE_PREENCHIDO' && (
                            <span className="text-[10px] text-slate-400 block max-w-xs ml-auto">
                              Motivo: {se.motivo}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 flex-shrink-0" />
                  <span>A escala **"{relatorio.nomeEscala}"** foi gerada e salva com sucesso no banco de dados. Você pode consultá-la na aba Histórico.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeradorEscala;
