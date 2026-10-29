import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Keyboard,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Disponibilidade } from '../types';
import {
  parseTextUnavailabilities,
  parseSpreadsheetUnavailabilities,
  matchUnavailabilitiesWithEvents,
  gerarModeloPlanilhaExcel,
  type MatchResult
} from '../utils/unavailabilityParser';
import { formatarDataComDiaSemana } from '../utils/dateUtils';

interface ModalIndisponibilidadeLoteProps {
  isOpen: boolean;
  onClose: () => void;
  disponibilidades: Disponibilidade[];
  ano: number;
  mes: number;
  colaboradorNome?: string;
  abaInicial?: 'planilha' | 'digitar';
  onAplicar: (eventoIdsIndisponiveis: number[], modo: 'adicionar' | 'substituir') => void;
}

const ModalIndisponibilidadeLote: React.FC<ModalIndisponibilidadeLoteProps> = ({
  isOpen,
  onClose,
  disponibilidades,
  ano,
  mes,
  colaboradorNome,
  abaInicial = 'planilha',
  onAplicar
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'planilha' | 'digitar'>(abaInicial);

  useEffect(() => {
    if (isOpen) {
      setAbaAtiva(abaInicial);
      setPasso('entrada');
      setResultadoMatch(null);
    }
  }, [isOpen, abaInicial]);

  React.useEffect(() => {
    if (isOpen && abaInicial) {
      setAbaAtiva(abaInicial);
    }
  }, [isOpen, abaInicial]);
  const [passo, setPasso] = useState<'entrada' | 'previa'>('entrada');
  const [textoDigitado, setTextoDigitado] = useState<string>('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [processando, setProcessando] = useState<boolean>(false);
  const [resultadoMatch, setResultadoMatch] = useState<MatchResult | null>(null);
  const [modoAplicacao, setModoAplicacao] = useState<'adicionar' | 'substituir'>('adicionar');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setPasso('entrada');
    setTextoDigitado('');
    setArquivoSelecionado(null);
    setResultadoMatch(null);
    setModoAplicacao('adicionar');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const extensao = file.name.split('.').pop()?.toLowerCase();
      if (extensao !== 'xlsx' && extensao !== 'xls' && extensao !== 'csv') {
        toast.error('Formato de arquivo inválido. Por favor, envie um arquivo .xlsx ou .csv.');
        return;
      }
      setArquivoSelecionado(file);
    }
  };

  const handleGerarPrevia = async () => {
    try {
      setProcessando(true);
      let entries = [];

      if (abaAtiva === 'planilha') {
        if (!arquivoSelecionado) {
          toast.error('Selecione um arquivo de planilha (.xlsx ou .csv) antes de continuar.');
          return;
        }
        entries = await parseSpreadsheetUnavailabilities(arquivoSelecionado, ano);
      } else {
        if (!textoDigitado.trim()) {
          toast.error('Digite ao menos uma data ou intervalo antes de gerar a prévia.');
          return;
        }
        entries = parseTextUnavailabilities(textoDigitado, ano);
      }

      if (entries.length === 0) {
        toast.error('Nenhuma data ou regra válida foi reconhecida.');
        return;
      }

      const match = matchUnavailabilitiesWithEvents(entries, disponibilidades);
      setResultadoMatch(match);
      setPasso('previa');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao processar as datas informadas. Verifique o formato do arquivo ou texto.');
    } finally {
      setProcessando(false);
    }
  };

  const handleConfirmar = () => {
    if (!resultadoMatch) return;

    const idsAfetados = resultadoMatch.eventosAfetados.map(e => e.eventoId);
    onAplicar(idsAfetados, modoAplicacao);

    toast.success(
      `${idsAfetados.length} evento(s) marcado(s) como indisponível(is)! Revise no calendário e salve quando terminar. ✅`
    );
    handleClose();
  };

  const handleInserirExemplo = (ex: string) => {
    setTextoDigitado(prev => (prev ? `${prev}, ${ex}` : ex));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers size={18} />
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Definir Indisponibilidades em Lote
              </h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              {colaboradorNome ? (
                <>
                  Colaborador: <strong className="text-slate-700">{colaboradorNome}</strong> | Período: {String(mes).padStart(2, '0')}/{ano}
                </>
              ) : (
                <>Período: {String(mes).padStart(2, '0')}/{ano}</>
              )}
            </p>
          </div>
          <button
            onClick={handleClose}
            data-testid="modal-lote-fechar"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {passo === 'entrada' ? (
            <>
              {/* Abas de Entrada */}
              <div className="flex border-b border-slate-100 gap-2">
                <button
                  type="button"
                  onClick={() => setAbaAtiva('planilha')}
                  className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                    abaAtiva === 'planilha'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <FileSpreadsheet size={16} /> Importar Planilha (.xlsx, .csv)
                </button>
                <button
                  type="button"
                  onClick={() => setAbaAtiva('digitar')}
                  className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                    abaAtiva === 'digitar'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Keyboard size={16} /> Digitar Datas / Intervalos
                </button>
              </div>

              {/* Aba 1: Importar Planilha */}
              {abaAtiva === 'planilha' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/60">
                    <div className="text-xs text-indigo-900 space-y-0.5">
                      <span className="font-bold block">Modelo de planilha padrão</span>
                      <p className="text-indigo-700/80">
                        Coluna A (opcional), Coluna B (Data dd/mm/aaaa) e Coluna C (Horário hh:mm opcional).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={gerarModeloPlanilhaExcel}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold px-3 py-1.5 rounded-xl text-xs border border-indigo-200 transition shadow-xs cursor-pointer w-max"
                    >
                      <Download size={14} /> Baixar modelo
                    </button>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                      arquivoSelecionado
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {arquivoSelecionado ? (
                      <div className="space-y-2">
                        <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                        <span className="font-bold text-sm text-slate-800 block">
                          {arquivoSelecionado.name}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {(arquivoSelecionado.size / 1024).toFixed(1)} KB • Clique para trocar de arquivo
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <UploadCloud size={36} className="mx-auto text-slate-400" />
                        <span className="font-bold text-sm text-slate-700 block">
                          Clique ou arraste sua planilha aqui
                        </span>
                        <span className="text-xs text-slate-400 block">
                          Suporta arquivos .xlsx e .csv
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aba 2: Digitar Datas */}
              {abaAtiva === 'digitar' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Digite as datas e horários indisponíveis:
                  </label>
                  <textarea
                    rows={5}
                    value={textoDigitado}
                    data-testid="textarea-datas-lote"
                    onChange={e => setTextoDigitado(e.target.value)}
                    placeholder="Exemplo:&#10;02/11, 06/11, 20/11&#10;02/11 09:00&#10;10/11 a 14/11"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">Inserir exemplo:</span>
                    <button
                      type="button"
                      onClick={() => handleInserirExemplo('02/11')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                    >
                      02/11 (Dia todo)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInserirExemplo('02/11 09:00')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                    >
                      02/11 09:00 (Horário)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInserirExemplo('10/11 a 14/11')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                    >
                      10/11 a 14/11 (Intervalo)
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Passo 2: Prévia */
            resultadoMatch && (
              <div className="space-y-6">
                {/* Resumo Estatístico */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                        Eventos Encontrados
                      </span>
                      <span className="text-xl font-black text-emerald-800">
                        {resultadoMatch.eventosAfetados.length}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 block">
                        Datas Não Localizadas
                      </span>
                      <span className="text-xl font-black text-amber-800">
                        {resultadoMatch.naoEncontrados.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Escolha do Modo de Aplicação */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Modo de Aplicação no Calendário:
                  </label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition cursor-pointer">
                      <input
                        type="radio"
                        name="modoAplicacao"
                        value="adicionar"
                        checked={modoAplicacao === 'adicionar'}
                        onChange={() => setModoAplicacao('adicionar')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <strong className="text-slate-800 block">Adicionar às indisponibilidades atuais (Recomendado)</strong>
                        <span className="text-slate-500 text-[11px]">
                          Mantém os eventos que já estavam vermelhos e marca os novos encontrados.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition cursor-pointer">
                      <input
                        type="radio"
                        name="modoAplicacao"
                        value="substituir"
                        checked={modoAplicacao === 'substituir'}
                        onChange={() => setModoAplicacao('substituir')}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <strong className="text-slate-800 block">Substituir todas as indisponibilidades do mês</strong>
                        <span className="text-slate-500 text-[11px]">
                          Reseta todas as marcações anteriores deste mês e aplica somente as da prévia.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Lista de Eventos que serão marcados */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Eventos que serão marcados como INDISPONÍVEIS (Vermelhos):
                  </span>
                  {resultadoMatch.eventosAfetados.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                      Nenhum evento do mês {String(mes).padStart(2, '0')}/{ano} coincide com as datas informadas.
                    </p>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {resultadoMatch.eventosAfetados.map((evt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block">
                              {evt.nomeEvento}
                            </span>
                            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} className="text-rose-500" /> {formatarDataComDiaSemana(evt.data)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {evt.horaInicio.slice(0, 5)}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                            Ficará Indisponível
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de Datas Não Localizadas */}
                {resultadoMatch.naoEncontrados.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                      Avisos: Datas não localizadas ou sem eventos ({resultadoMatch.naoEncontrados.length}):
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {resultadoMatch.naoEncontrados.map((nao, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-xs flex items-center justify-between"
                        >
                          <span className="font-mono text-slate-700 text-[11px]">
                            {nao.rawInput}
                          </span>
                          <span className="text-[11px] text-amber-700 font-medium">
                            {nao.motivo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {passo === 'entrada' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                data-testid="modal-lote-cancelar"
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGerarPrevia}
                disabled={processando}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-150 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {processando ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Verificar e Gerar Prévia <ArrowRight size={14} />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPasso('entrada')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                <ArrowLeft size={14} /> Voltar / Ajustar
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={!resultadoMatch || resultadoMatch.eventosAfetados.length === 0}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-150 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={14} /> Confirmar e Aplicar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalIndisponibilidadeLote;
