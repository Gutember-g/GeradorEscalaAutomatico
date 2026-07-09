import React, { useState, useEffect } from 'react';
import { colaboradorService } from '../services/api';
import type { Colaborador } from '../types';
import { Trash2, UserPlus, Phone, X, Sparkles, Calendar, Download, Upload } from 'lucide-react';
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

  // Import summary state
  const [importSummary, setImportSummary] = useState<{
    importados: number;
    duplicados: number;
    erros: number;
  } | null>(null);

  useEffect(() => {
    carregarColaboradores();
  }, []);

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

  const limparFormulario = () => {
    setNome('');
    setTelefone('');
    setEditingId(null);
  };

  const abrirCadastro = () => {
    limparFormulario();
    setShowForm(true);
  };

  const abrirEdicao = (c: Colaborador) => {
    setEditingId(c.id || null);
    setNome(c.nome);
    setTelefone(c.telefone || '');
    setShowForm(true);
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
      if (editingId) {
        await colaboradorService.atualizar(editingId, payload);
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
    }
  };

  const handleDeletar = async (id: number) => {
    if (window.confirm('Tem certeza de que deseja excluir este colaborador?')) {
      const loadingToast = toast.loading('Excluindo colaborador...');
      try {
        await colaboradorService.deletar(id);
        toast.success('Removido com sucesso! ✅', { id: loadingToast });
        carregarColaboradores();
      } catch (err) {
        console.error(err);
        toast.error('Erro ao deletar colaborador. Ele pode estar alocado em alguma escala existente. ❌', { id: loadingToast });
      }
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
            // Ignorar linha totalmente vazia
            if (Object.keys(row).length > 0) {
              erros++;
            }
            continue;
          }

          // Normalizar espaços e converter para minúsculas para checagem de duplicados
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

        // Limpar valor do input para permitir re-upload do mesmo arquivo
        e.target.value = '';
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar o arquivo de importação. ❌');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
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
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition duration-200 shadow-xs border border-slate-200 text-xs cursor-pointer"
            >
              <Download size={14} /> Baixar Modelo
            </button>
            <label
              htmlFor="import-file-input"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200 shadow-xs text-xs cursor-pointer"
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
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200 shadow-xs text-xs cursor-pointer"
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

      {/* Modal de resumo da importação */}
      {importSummary && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Importação de Colaboradores Concluída
            </h3>
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingId ? 'Editar Colaborador' : 'Cadastrar Colaborador'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
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
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-5 rounded-xl transition text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-xl transition text-sm shadow-sm"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Colaboradores */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : colaboradores.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-4">
          <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-indigo-500">
            <UserPlus size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-700">Nenhum colaborador cadastrado</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">Cadastre seus colaboradores para poder iniciar a gestão de plantões e escalas.</p>
          </div>
          <button
            onClick={abrirCadastro}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition"
          >
            Cadastrar Primeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {colaboradores.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-100 transition duration-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{c.nome}</h3>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  {c.telefone && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" /> {c.telefone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <button
                  onClick={() => onSelectColaboradorForDisponibilidade(c)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition flex items-center gap-1.5"
                >
                  <Calendar size={14} /> Disponibilidade
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirEdicao(c)}
                    className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeletar(c.id!)}
                    className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-xs font-semibold p-1.5 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Colaboradores;
