import React, { useState, useEffect, useRef } from 'react';
import { colaboradorService, eventoService } from '../services/api';
import type { Colaborador, Evento } from '../types';
import { 
  Trash2, 
  UserPlus, 
  Phone, 
  X, 
  Sparkles, 
  Calendar, 
  Download, 
  Upload,
  Search,
  Grid,
  List,
  ShieldAlert,
  Heart,
  Edit2,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ColaboradoresProps {
  onSelectColaboradorForDisponibilidade: (c: Colaborador) => void;
}

const Colaboradores: React.FC<ColaboradoresProps> = ({ onSelectColaboradorForDisponibilidade }) => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search & view states
  const [buscaNome, setBuscaNome] = useState('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'lista'>('lista');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Bulk Edit Modal states
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<'relacionamentos' | 'disponibilidade'>('relacionamentos');

  // Bulk relationships state
  const [bulkNaoTrabalharCom, setBulkNaoTrabalharCom] = useState<number[]>([]);
  const [bulkPreferenciaTrabalharCom, setBulkPreferenciaTrabalharCom] = useState<number[]>([]);

  // Bulk availability state
  const [bulkMes, setBulkMes] = useState<number>(new Date().getMonth() + 1);
  const [bulkAno, setBulkAno] = useState<number>(new Date().getFullYear());
  const [bulkEventos, setBulkEventos] = useState<Evento[]>([]);
  const [bulkEventosLoading, setBulkEventosLoading] = useState(false);
  const [bulkIndisponibilidades, setBulkIndisponibilidades] = useState<{[key: number]: 'indisponivel' | 'disponivel' | 'manter'}>({});

  // Highlight state for editing focus
  const [isEditingHighlight, setIsEditingHighlight] = useState(false);

  // Import summary state
  const [importSummary, setImportSummary] = useState<{
    importados: number;
    duplicados: number;
    erros: number;
  } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
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
    carregarColaboradores();
  }, []);

  useEffect(() => {
    if (isBulkEditOpen && bulkTab === 'disponibilidade') {
      carregarEventosLote();
    }
  }, [isBulkEditOpen, bulkTab, bulkMes, bulkAno]);

  const carregarColaboradores = async () => {
    try {
      setLoading(true);
      const data = await colaboradorService.listar();
      setColaboradores(data);
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar colaboradores. Verifique se o servidor backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const carregarEventosLote = async () => {
    try {
      setBulkEventosLoading(true);
      const data = await eventoService.listar();
      // Filtrar pelo mês e ano e ordenar por data e hora de início (do mais antigo para o mais recente)
      const evts = data
        .filter(e => {
          const parts = e.data.split('-');
          return Number(parts[1]) === bulkMes && Number(parts[0]) === bulkAno;
        })
        .sort((a, b) => {
          const dateComp = a.data.localeCompare(b.data);
          if (dateComp !== 0) return dateComp;
          return a.horaInicio.localeCompare(b.horaInicio);
        });
      setBulkEventos(evts);
    } catch (err) {
      console.error('Erro ao buscar eventos para lote:', err);
    } finally {
      setBulkEventosLoading(false);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setTelefone('');
    setEditingId(null);
  };

  const abrirCadastro = () => {
    limparFormulario();
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const abrirEdicao = (c: Colaborador) => {
    setEditingId(c.id || null);
    setNome(c.nome);
    setTelefone(c.telefone || '');
    setShowForm(true);

    setIsEditingHighlight(true);
    setTimeout(() => setIsEditingHighlight(false), 1500);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      toast.error('O nome do colaborador é obrigatório.');
      return;
    }

    const payload: Colaborador = {
      nome,
      telefone: telefone || undefined,
    };

    const loadingToast = toast.loading('Salvando colaborador...');
    try {
      setSaving(true);
      if (editingId) {
        // Obter relacionamentos atuais para preservar
        const existing = colaboradores.find(c => c.id === editingId);
        await colaboradorService.atualizar(editingId, {
          ...payload,
          naoTrabalharCom: existing?.naoTrabalharCom,
          preferenciaTrabalharCom: existing?.preferenciaTrabalharCom
        });
        toast.success('Alterações salvas com sucesso! ✅', { id: loadingToast });
      } else {
        await colaboradorService.criar(payload);
        toast.success('Colaborador cadastrado com sucesso! ✅', { id: loadingToast });
      }
      setShowForm(false);
      limparFormulario();
      carregarColaboradores();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar colaborador. ❌', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletar = async (id: number) => {
    if (window.confirm('Tem certeza de que deseja excluir este colaborador?')) {
      const loadingToast = toast.loading('Excluindo colaborador...');
      try {
        await colaboradorService.deletar(id);
        toast.success('Removido com sucesso! ✅', { id: loadingToast });
        setSelectedIds(prev => prev.filter(x => x !== id));
        carregarColaboradores();
      } catch (err) {
        console.error(err);
        toast.error('Erro ao deletar colaborador. Ele pode estar alocado em alguma escala existente. ❌', { id: loadingToast });
      }
    }
  };

  const handleSalvarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    if (bulkTab === 'relacionamentos') {
      // Validar listas cruzadas
      for (const targetId of bulkNaoTrabalharCom) {
        if (bulkPreferenciaTrabalharCom.includes(targetId)) {
          toast.error('O mesmo colaborador não pode estar em restrições e parcerias simultaneamente. ❌');
          return;
        }
      }
    }

    const loadingToast = toast.loading('Salvando alterações em lote...');
    try {
      setSaving(true);

      for (const colabId of selectedIds) {
        const colabObj = colaboradores.find(c => c.id === colabId)!;

        // 1. Relacionamentos
        if (bulkTab === 'relacionamentos') {
          // Filtrar o próprio ID para evitar autoreferência
          const cleanNtc = bulkNaoTrabalharCom.filter(id => id !== colabId);
          const cleanPtc = bulkPreferenciaTrabalharCom.filter(id => id !== colabId);

          await colaboradorService.atualizar(colabId, {
            ...colabObj,
            naoTrabalharCom: cleanNtc,
            preferenciaTrabalharCom: cleanPtc
          });
        }

        // 2. Disponibilidade
        if (bulkTab === 'disponibilidade') {
          const currentDisps = await colaboradorService.obterDisponibilidade(colabId, bulkMes, bulkAno);
          
          const updatedDisps = currentDisps.map(disp => {
            const status = bulkIndisponibilidades[disp.eventoId];
            if (status === 'indisponivel') {
              return { ...disp, indisponivel: true };
            } else if (status === 'disponivel') {
              return { ...disp, indisponivel: false };
            }
            return disp;
          });

          await colaboradorService.salvarDisponibilidade(colabId, updatedDisps);
        }
      }

      toast.success('Colaboradores atualizados em lote com sucesso! 🎉✅', { id: loadingToast });
      setIsBulkEditOpen(false);
      setSelectedIds([]);
      carregarColaboradores();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar edições em lote. ❌', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  // Baixar modelo de planilha
  const handleBaixarModelo = async () => {
    const loadingToast = toast.loading('Gerando modelo de planilha...');
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('Modelo Importacao');

      worksheet.getRow(1).values = ['Nome', 'Telefone'];
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(2).values = ['José da Silva', '(11) 99999-9999'];

      worksheet.getColumn(1).width = 25;
      worksheet.getColumn(2).width = 20;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'modelo_importacao_colaboradores.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success('Modelo baixado com sucesso! 📊✅', { id: loadingToast });
    } catch (err) {
      console.error('Erro ao baixar modelo de planilha:', err);
      toast.error('Erro ao gerar modelo de planilha. ❌', { id: loadingToast });
    }
  };

  // Importação de arquivo Excel/CSV
  const handleImportPlanilha = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        let importados = 0;
        let duplicados = 0;
        let erros = 0;

        for (const row of json) {
          const nameKey = Object.keys(row).find(k => k.toLowerCase().trim() === 'nome');
          const phoneKey = Object.keys(row).find(k => k.toLowerCase().trim() === 'telefone');

          const nomeRaw = nameKey ? String(row[nameKey]).trim() : '';
          const phoneRaw = phoneKey ? String(row[phoneKey]).trim() : '';

          if (!nomeRaw) {
            if (Object.keys(row).length > 0) {
              erros++;
            }
            continue;
          }

          const nomeClean = nomeRaw.replace(/\s+/g, ' ').toLowerCase();
          const existe = colaboradores.some(c =>
            c.nome.replace(/\s+/g, ' ').toLowerCase() === nomeClean
          );

          if (existe) {
            duplicados++;
            continue;
          }

          try {
            await colaboradorService.criar({
              nome: nomeRaw,
              telefone: phoneRaw || undefined
            });
            importados++;
          } catch (err) {
            console.error('Erro ao importar colaborador:', nomeRaw, err);
            erros++;
          }
        }

        await carregarColaboradores();
        setImportSummary({
          importados,
          duplicados,
          erros
        });
        
        toast.success(`Importação concluída! ${importados} importados, ${duplicados} duplicados. 🎉`);
        e.target.value = '';
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar o arquivo de importação. ❌');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Filtragem e Ordenação Alfabética dos Colaboradores
  const colaboradoresFiltrados = colaboradores.filter(c =>
    c.nome.toLowerCase().includes(buscaNome.toLowerCase())
  );
  
  const colaboradoresOrdenados = [...colaboradoresFiltrados].sort((a, b) =>
    a.nome.localeCompare(b.nome)
  );

  const toggleSelectColaborador = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(colaboradoresOrdenados.map(c => c.id!));
    } else {
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-105 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-500 w-6 h-6" /> Colaboradores
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie a equipe e acesse suas respectivas agendas de disponibilidade mensal por evento.</p>
        </div>
        {!showForm && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBaixarModelo}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition duration-200 shadow-xs border border-slate-200 text-xs cursor-pointer active:scale-95"
            >
              <Download size={14} /> Baixar Modelo
            </button>
            <label
              htmlFor="import-file-input"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200 shadow-xs text-xs cursor-pointer active:scale-95"
            >
              <Upload size={14} /> Importar Planilha
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportPlanilha}
              className="hidden"
              id="import-file-input"
            />
            <button
              onClick={abrirCadastro}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200 shadow-xs text-xs cursor-pointer active:scale-95"
            >
              <UserPlus size={15} /> Novo Colaborador
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs gap-3">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar colaborador pelo nome..."
            value={buscaNome}
            onChange={e => setBuscaNome(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex gap-2 select-none">
          {/* Alternador de Layout */}
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                layoutMode === 'grid' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid size={14} /> Cards
            </button>
            <button
              onClick={() => setLayoutMode('lista')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                layoutMode === 'lista' ? 'bg-white text-indigo-655 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List size={14} /> Lista
            </button>
          </div>
        </div>
      </div>

      {/* Modal de resumo da importação */}
      {importSummary && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Importação de Colaboradores Concluída</h3>
            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-emerald-600">Importados com sucesso:</span>
                <span className="font-bold">{importSummary.importados}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-amber-600">Duplicados ignorados:</span>
                <span className="font-bold">{importSummary.duplicados}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-rose-600">Com erro / Inválidos:</span>
                <span className="font-bold">{importSummary.erros}</span>
              </div>
            </div>
            <button
              onClick={() => setImportSummary(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition text-sm cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

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
              {editingId ? 'Editar Colaborador' : 'Cadastrar Colaborador'}
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                    isEditingHighlight ? 'ring-2 ring-indigo-500/50 border-indigo-400 bg-indigo-50/50' : ''
                  }`}
                  placeholder="Nome do colaborador"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                    isEditingHighlight ? 'ring-2 ring-indigo-500/50 border-indigo-400 bg-indigo-50/50' : ''
                  }`}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

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
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-6 rounded-xl transition text-sm shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Colaboradores */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : colaboradoresOrdenados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-4">
          <div className="bg-indigo-55 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-indigo-550">
            <UserPlus size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-700">Nenhum colaborador encontrado</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {colaboradores.length > 0 
                ? 'Nenhum resultado corresponde à busca.' 
                : 'Cadastre seus colaboradores para poder iniciar a gestão de plantões e escalas.'}
            </p>
          </div>
          {colaboradores.length === 0 && (
            <button
              onClick={abrirCadastro}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition cursor-pointer"
            >
              Cadastrar Primeiro
            </button>
          )}
        </div>
      ) : layoutMode === 'grid' ? (
        /* Visualização Grid de Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
          {colaboradoresOrdenados.map(c => {
            const isChecked = selectedIds.includes(c.id!);
            return (
              <div 
                key={c.id} 
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md hover:border-indigo-100 transition duration-205 flex flex-col justify-between space-y-4 ${
                  isChecked ? 'border-indigo-300 ring-2 ring-indigo-500/10 bg-indigo-50/5' : 'border-slate-100'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox para lote */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectColaborador(c.id!)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                      />
                      <h3 className="font-bold text-slate-800 text-base">{c.nome}</h3>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 pl-7">
                    {c.telefone ? (
                      <p className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" /> {c.telefone}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">Sem telefone cadastrado</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-50 pl-7">
                  <button
                    onClick={() => onSelectColaboradorForDisponibilidade(c)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Calendar size={14} /> Disponibilidade
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEdicao(c)}
                      className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-semibold py-1.5 px-3 rounded-lg transition active:scale-95"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(c.id!)}
                      className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-450 text-xs font-semibold p-1.5 rounded-lg transition active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visualização em Lista Tabela */
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs pb-20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={colaboradoresOrdenados.length > 0 && selectedIds.length === colaboradoresOrdenados.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Nome do Colaborador</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-650">
              {colaboradoresOrdenados.map(c => {
                const isChecked = selectedIds.includes(c.id!);
                return (
                  <tr 
                    key={c.id} 
                    className={`hover:bg-slate-50/50 transition ${
                      isChecked ? 'bg-indigo-50/15' : ''
                    }`}
                  >
                    <td className="px-6 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectColaborador(c.id!)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {c.nome}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {c.telefone || <span className="text-slate-400 italic">Nenhum</span>}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onSelectColaboradorForDisponibilidade(c)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition active:scale-95"
                        >
                          Disponibilidade
                        </button>
                        <button
                          onClick={() => abrirEdicao(c)}
                          className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-semibold py-1.5 px-3 rounded-lg transition active:scale-95"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletar(c.id!)}
                          className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-450 p-1.5 rounded-lg transition active:scale-95"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Bottom Bar para ações em lote */}
      {selectedIds.length > 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-slideUp select-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            <strong className="text-white text-sm font-extrabold">{selectedIds.length}</strong> selecionados
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setBulkNaoTrabalharCom([]);
                setBulkPreferenciaTrabalharCom([]);
                setBulkIndisponibilidades({});
                setBulkTab('relacionamentos');
                setIsBulkEditOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase py-2 px-4 rounded-xl transition cursor-pointer active:scale-95"
            >
              Editar em Lote
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase py-2 px-4 rounded-xl transition cursor-pointer active:scale-95"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edição em Lote */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-105 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Edit2 size={18} className="text-indigo-500" /> Edição em Lote
                </h3>
                <p className="text-xs text-slate-405 mt-1">Alterando <strong className="text-indigo-600 font-bold">{selectedIds.length} colaboradores</strong> em simultâneo.</p>
              </div>
              <button 
                onClick={() => setIsBulkEditOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarLote} className="p-6 space-y-5">
              {/* Seleção do Módulo */}
              <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl select-none">
                <button
                  type="button"
                  onClick={() => setBulkTab('relacionamentos')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    bulkTab === 'relacionamentos' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Relacionamentos
                </button>
                <button
                  type="button"
                  onClick={() => setBulkTab('disponibilidade')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    bulkTab === 'disponibilidade' ? 'bg-white text-indigo-655 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Disponibilidade Mensal
                </button>
              </div>

              {/* Aba de Relacionamentos */}
              {bulkTab === 'relacionamentos' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Restrição de Conflitos */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider">
                      <ShieldAlert size={14} /> Não trabalhar com (Restrição de Conflito)
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-rose-100/50 rounded-xl p-3 bg-rose-50/10 space-y-1.5 pr-1">
                      {colaboradores
                        .filter(colab => !selectedIds.includes(colab.id!))
                        .map(colab => {
                          const isChecked = bulkNaoTrabalharCom.includes(colab.id!);
                          return (
                            <label key={colab.id} className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setBulkNaoTrabalharCom(prev => prev.filter(id => id !== colab.id!));
                                  } else {
                                    setBulkNaoTrabalharCom(prev => [...prev, colab.id!]);
                                    setBulkPreferenciaTrabalharCom(prev => prev.filter(id => id !== colab.id!));
                                  }
                                }}
                                className="rounded border-slate-350 text-rose-605 focus:ring-rose-500 h-4 w-4"
                              />
                              <span className="font-semibold text-slate-700">{colab.nome}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Parcerias */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                      <Heart size={14} /> Preferência para trabalhar com (Parcerias)
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-emerald-100/50 rounded-xl p-3 bg-emerald-50/10 space-y-1.5 pr-1">
                      {colaboradores
                        .filter(colab => !selectedIds.includes(colab.id!))
                        .map(colab => {
                          const isChecked = bulkPreferenciaTrabalharCom.includes(colab.id!);
                          return (
                            <label key={colab.id} className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setBulkPreferenciaTrabalharCom(prev => prev.filter(id => id !== colab.id!));
                                  } else {
                                    setBulkPreferenciaTrabalharCom(prev => [...prev, colab.id!]);
                                    setBulkNaoTrabalharCom(prev => prev.filter(id => id !== colab.id!));
                                  }
                                }}
                                className="rounded border-slate-350 text-emerald-605 focus:ring-emerald-500 h-4 w-4"
                              />
                              <span className="font-semibold text-slate-700">{colab.nome}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Aba de Disponibilidades */}
              {bulkTab === 'disponibilidade' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Seleção do Mês/Ano */}
                  <div className="flex gap-2">
                    <select
                      value={bulkMes}
                      onChange={e => setBulkMes(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium text-slate-705 flex-1"
                    >
                      {meses.map(m => (
                        <option key={m.valor} value={m.valor}>{m.nome}</option>
                      ))}
                    </select>

                    <select
                      value={bulkAno}
                      onChange={e => setBulkAno(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-medium text-slate-705 flex-1"
                    >
                      {anos.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {/* Listagem de Eventos do Período */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">
                      Eventos Cadastrados
                    </label>

                    {bulkEventosLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-650"></div>
                      </div>
                    ) : bulkEventos.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-xl">
                        Nenhum evento cadastrado neste período.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border border-slate-200/80 rounded-xl p-3 bg-slate-50/20 space-y-2.5 pr-1">
                        {bulkEventos.map(evt => {
                          const status = bulkIndisponibilidades[evt.id!] || 'manter';
                          return (
                            <div key={evt.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs text-xs">
                              <div>
                                <span className="font-bold text-slate-800">{evt.nome}</span>
                                <span className="text-[10px] text-slate-500 block">{evt.data.split('-').reverse().join('/')} às {evt.horaInicio.slice(0, 5)}</span>
                              </div>

                              {/* Toggle de Ação */}
                              <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-lg border border-slate-200 select-none">
                                <button
                                  type="button"
                                  onClick={() => setBulkIndisponibilidades(prev => ({ ...prev, [evt.id!]: 'disponivel' }))}
                                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition cursor-pointer ${
                                    status === 'disponivel' ? 'bg-emerald-50 text-emerald-700 shadow-xs font-extrabold border border-emerald-250' : 'text-slate-400 hover:text-slate-700'
                                  }`}
                                  title="Disponível"
                                >
                                  Disponível
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBulkIndisponibilidades(prev => ({ ...prev, [evt.id!]: 'manter' }))}
                                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition cursor-pointer ${
                                    status === 'manter' ? 'bg-white text-slate-700 shadow-xs font-extrabold border border-slate-250' : 'text-slate-400 hover:text-slate-700'
                                  }`}
                                  title="Manter Inalterado"
                                >
                                  Manter
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBulkIndisponibilidades(prev => ({ ...prev, [evt.id!]: 'indisponivel' }))}
                                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition cursor-pointer ${
                                    status === 'indisponivel' ? 'bg-rose-50 text-rose-700 shadow-xs font-extrabold border border-rose-250' : 'text-slate-400 hover:text-slate-700'
                                  }`}
                                  title="Indisponível"
                                >
                                  Indisponível
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkEditOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-5 rounded-xl transition text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-6 rounded-xl transition text-sm shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {saving ? 'Salvando lote...' : 'Aplicar em Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Colaboradores;
