import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Users,
  Calendar,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Colaborador, Evento, Disponibilidade } from '../types';
import {
  parseSpreadsheetUnavailabilities,
  gerarModeloPlanilhaExcel,
  matchUnavailabilitiesWithEvents,
  type ParsedUnavailabilityEntry
} from '../utils/unavailabilityParser';
import { colaboradorService, eventoService } from '../services/api';

interface ModalImportarIndisponibilidadesMultiplosProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: Colaborador[];
  onSucesso: () => void;
}

interface ColaboradorPreviewItem {
  colaboradorId: number;
  colaboradorNome: string;
  eventosAfetadosIds: number[];
  regrasTotal: number;
}

const ModalImportarIndisponibilidadesMultiplos: React.FC<ModalImportarIndisponibilidadesMultiplosProps> = ({
  isOpen,
  onClose,
  colaboradores,
  onSucesso
}) => {
  const [passo, setPasso] = useState<'upload' | 'previa'>('upload');
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [processando, setProcessando] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [modoAplicacao, setModoAplicacao] = useState<'adicionar' | 'substituir'>('adicionar');

  const [previsoes, setPrevisoes] = useState<ColaboradorPreviewItem[]>([]);
  const [naoEncontrados, setNaoEncontrados] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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

  const handleReset = () => {
    setPasso('upload');
    setArquivo(null);
    setPrevisoes([]);
    setNaoEncontrados([]);
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
      const f = files[0];
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
        toast.error('Formato inválido. Envie um arquivo .xlsx ou .csv.');
        return;
      }
      setArquivo(f);
    }
  };

  const handleGerarPrevia = async () => {
    if (!arquivo) {
      toast.error('Selecione uma planilha antes de continuar.');
      return;
    }

    try {
      setProcessando(true);
      // 1. Carregar eventos do mês selecionado
      const eventosMes = await eventoService.listar({ mes, ano });

      // Transformar em modelo de disponibilidades base para casar eventos
      const mockDisponibilidades: Disponibilidade[] = eventosMes.map(e => ({
        eventoId: e.id!,
        nomeEvento: e.nome,
        data: e.data,
        horaInicio: e.horaInicio,
        indisponivel: false
      }));

      // 2. Parse da planilha
      const entries = await parseSpreadsheetUnavailabilities(arquivo, ano);
      if (entries.length === 0) {
        toast.error('Nenhuma data ou linha válida foi encontrada na planilha.');
        return;
      }

      // 3. Agrupar entradas por colaborador
      const mapaColabEntries = new Map<number, { colab: Colaborador; entries: ParsedUnavailabilityEntry[] }>();
      const linhasNaoReconhecidas: string[] = [];

      for (const entry of entries) {
        if (!entry.colaborador) {
          linhasNaoReconhecidas.push(`${entry.rawInput} (Sem nome de colaborador na Coluna A)`);
          continue;
        }

        const termo = entry.colaborador.toLowerCase().trim();
        // Casar colaborador por ID ou nome
        const encontrado = colaboradores.find(
          c => String(c.id) === termo || c.nome.toLowerCase().trim() === termo
        );

        if (!encontrado) {
          linhasNaoReconhecidas.push(
            `${entry.rawInput} (Colaborador "${entry.colaborador}" não encontrado no sistema)`
          );
        } else {
          if (!mapaColabEntries.has(encontrado.id!)) {
            mapaColabEntries.set(encontrado.id!, { colab: encontrado, entries: [] });
          }
          mapaColabEntries.get(encontrado.id!)!.entries.push(entry);
        }
      }

      // 4. Mapear eventos afetados por colaborador
      const listaPrevisoes: ColaboradorPreviewItem[] = [];

      for (const [colabId, info] of mapaColabEntries.entries()) {
        const match = matchUnavailabilitiesWithEvents(info.entries, mockDisponibilidades);
        listaPrevisoes.push({
          colaboradorId: colabId,
          colaboradorNome: info.colab.nome,
          eventosAfetadosIds: match.eventosAfetados.map(e => e.eventoId),
          regrasTotal: info.entries.length
        });
      }

      setPrevisoes(listaPrevisoes);
      setNaoEncontrados(linhasNaoReconhecidas);
      setPasso('previa');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao processar a planilha. Verifique a formatação do arquivo.');
    } finally {
      setProcessando(false);
    }
  };

  const handleConfirmarImportacao = async () => {
    if (previsoes.length === 0) return;

    const loadingToast = toast.loading('Salvando indisponibilidades para os colaboradores...');
    try {
      setSalvando(true);

      for (const item of previsoes) {
        // Obter disponibilidade atual do colaborador
        const atual = await colaboradorService.obterDisponibilidade(item.colaboradorId, mes, ano);

        const idsSet = new Set(item.eventosAfetadosIds);
        const atualizadas = atual.map(d => {
          if (modoAplicacao === 'substituir') {
            return { ...d, indisponivel: idsSet.has(d.eventoId) };
          } else {
            return idsSet.has(d.eventoId) ? { ...d, indisponivel: true } : d;
          }
        });

        await colaboradorService.salvarDisponibilidade(item.colaboradorId, atualizadas);
      }

      toast.success(
        `Indisponibilidades atualizadas com sucesso para ${previsoes.length} colaborador(es)! ✅`,
        { id: loadingToast }
      );
      onSucesso();
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar as indisponibilidades dos colaboradores. ❌', { id: loadingToast });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users size={18} />
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Importar Indisponibilidades em Lote (Múltiplos Colaboradores)
              </h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Importe uma única planilha contendo as restrições de múltiplos colaboradores.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {passo === 'upload' ? (
            <div className="space-y-6">
              {/* Seletor de Período Alvo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mês e Ano de Aplicação:
                </span>
                <div className="flex gap-2">
                  <select
                    value={mes}
                    onChange={e => setMes(parseInt(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {meses.map(m => (
                      <option key={m.valor} value={m.valor}>{m.nome}</option>
                    ))}
                  </select>
                  <select
                    value={ano}
                    onChange={e => setAno(parseInt(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {anos.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card modelo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/60">
                <div className="text-xs text-indigo-900 space-y-0.5">
                  <span className="font-bold block">Estrutura exigida da planilha</span>
                  <p className="text-indigo-700/80">
                    Coluna A (Nome ou ID do Colaborador), Coluna B (Data dd/mm/aaaa), Coluna C (Horário hh:mm opcional).
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

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  arquivo
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
                {arquivo ? (
                  <div className="space-y-2">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                    <span className="font-bold text-sm text-slate-800 block">
                      {arquivo.name}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      {(arquivo.size / 1024).toFixed(1)} KB • Clique para trocar de arquivo
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud size={36} className="mx-auto text-slate-400" />
                    <span className="font-bold text-sm text-slate-700 block">
                      Clique ou arraste a planilha consolidada aqui
                    </span>
                    <span className="text-xs text-slate-400 block">
                      Suporta arquivos .xlsx e .csv
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Passo: Prévia */
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                      Colaboradores Reconhecidos
                    </span>
                    <span className="text-xl font-black text-emerald-800">
                      {previsoes.length}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-600 block">
                      Linhas Não Casadas
                    </span>
                    <span className="text-xl font-black text-amber-800">
                      {naoEncontrados.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modo de Aplicação */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Modo de Aplicação para os Colaboradores:
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition cursor-pointer">
                    <input
                      type="radio"
                      name="modoMultiplo"
                      value="adicionar"
                      checked={modoAplicacao === 'adicionar'}
                      onChange={() => setModoAplicacao('adicionar')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <strong className="text-slate-800 block">Adicionar às indisponibilidades atuais</strong>
                      <span className="text-slate-500 text-[11px]">
                        Preserva eventos já marcados como indisponíveis e soma os novos.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition cursor-pointer">
                    <input
                      type="radio"
                      name="modoMultiplo"
                      value="substituir"
                      checked={modoAplicacao === 'substituir'}
                      onChange={() => setModoAplicacao('substituir')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <strong className="text-slate-800 block">Substituir todas as indisponibilidades do mês</strong>
                      <span className="text-slate-500 text-[11px]">
                        Limpa o mês selecionado dos colaboradores e marca apenas os da planilha.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Lista de Colaboradores Mapeados */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Colaboradores e eventos correspondentes no mês:
                </span>
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {previsoes.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between text-xs shadow-xs"
                    >
                      <div>
                        <strong className="text-slate-800 block text-xs">
                          {item.colaboradorNome}
                        </strong>
                        <span className="text-[11px] text-slate-400">
                          {item.regrasTotal} linha(s) processada(s)
                        </span>
                      </div>
                      <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100/60">
                        {item.eventosAfetadosIds.length} evento(s) afetado(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avisos */}
              {naoEncontrados.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                    Linhas ignoradas ou não casadas ({naoEncontrados.length}):
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {naoEncontrados.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 bg-amber-50 text-amber-900 border border-amber-100 rounded-lg text-[11px]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {passo === 'upload' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGerarPrevia}
                disabled={processando || !arquivo}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-150 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {processando ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Gerar Prévia Multi-Colaborador <ArrowRight size={14} />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPasso('upload')}
                disabled={salvando}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={salvando}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarImportacao}
                  disabled={salvando || previsoes.length === 0}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-150 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {salvando ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Salvar Indisponibilidades em Lote
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalImportarIndisponibilidadesMultiplos;
