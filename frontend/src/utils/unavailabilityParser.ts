import * as XLSX from 'xlsx';
import type { Disponibilidade } from '../types';

export interface ParsedUnavailabilityEntry {
  colaborador?: string; // Nome ou ID do colaborador (opcional, para importação em lote multi-colaborador)
  data: string;        // Formato YYYY-MM-DD
  horario?: string;    // Formato HH:mm (opcional)
  rawInput: string;
}

export interface MatchedEventItem {
  eventoId: number;
  nomeEvento: string;
  data: string;
  horaInicio: string;
  regraOrigem: string;
  colaborador?: string;
}

export interface UnmatchedEntryItem {
  rawInput: string;
  data?: string;
  horario?: string;
  colaborador?: string;
  motivo: string;
}

export interface MatchResult {
  eventosAfetados: MatchedEventItem[];
  naoEncontrados: UnmatchedEntryItem[];
  totalRegras: number;
}

/**
 * Normaliza um horário para o formato HH:mm (ex: "9:00" -> "09:00", "09:00:00" -> "09:00", "9h" -> "09:00")
 */
export function normalizarHorario(horarioStr?: any): string | undefined {
  if (horarioStr === null || horarioStr === undefined) return undefined;

  // Se for número serial fracionário do Excel (ex: 0.375 para 09:00)
  if (typeof horarioStr === 'number' && horarioStr >= 0 && horarioStr < 1) {
    const totalSeconds = Math.round(horarioStr * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const str = String(horarioStr).trim();
  if (!str) return undefined;

  // Formato HH:mm ou HH:mm:ss
  const matchHhMm = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (matchHhMm) {
    const h = parseInt(matchHhMm[1], 10);
    const m = parseInt(matchHhMm[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  // Formato 9h ou 09h ou 9h30
  const matchH = str.match(/^(\d{1,2})[hH](\d{2})?$/);
  if (matchH) {
    const h = parseInt(matchH[1], 10);
    const m = matchH[2] ? parseInt(matchH[2], 10) : 0;
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  return undefined;
}

/**
 * Converte data de número de série do Excel ou objeto Date ou string para YYYY-MM-DD
 */
export function converterParaYmd(valor: any, defaultYear: number): string | null {
  if (valor === null || valor === undefined) return null;

  // 1. Objeto Date nativo
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return null;
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Número de série do Excel (ex: 46328)
  if (typeof valor === 'number') {
    if (valor <= 0) return null;
    // Excel Day 1 = 1899-12-31 com ajuste de leap year
    const utcDays = Math.floor(valor - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(valor).trim();
  if (!str) return null;

  // 3. Formato YYYY-MM-DD (ISO)
  const matchIso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (matchIso) {
    const y = parseInt(matchIso[1], 10);
    const m = String(parseInt(matchIso[2], 10)).padStart(2, '0');
    const d = String(parseInt(matchIso[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4. Formato dd/mm/aaaa ou dd-mm-aaaa
  const matchCompleto = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (matchCompleto) {
    const d = String(parseInt(matchCompleto[1], 10)).padStart(2, '0');
    const m = String(parseInt(matchCompleto[2], 10)).padStart(2, '0');
    const y = parseInt(matchCompleto[3], 10);
    return `${y}-${m}-${d}`;
  }

  // 5. Formato dd/mm/aa ou dd-mm-aa (2 dígitos de ano)
  const matchAnoCurto = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (matchAnoCurto) {
    const d = String(parseInt(matchAnoCurto[1], 10)).padStart(2, '0');
    const m = String(parseInt(matchAnoCurto[2], 10)).padStart(2, '0');
    const y = 2000 + parseInt(matchAnoCurto[3], 10);
    return `${y}-${m}-${d}`;
  }

  // 6. Formato dd/mm ou dd-mm (sem ano)
  const matchSemAno = str.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (matchSemAno) {
    const d = String(parseInt(matchSemAno[1], 10)).padStart(2, '0');
    const m = String(parseInt(matchSemAno[2], 10)).padStart(2, '0');
    return `${defaultYear}-${m}-${d}`;
  }

  return null;
}

/**
 * Expande um intervalo de datas [inicioYmd, fimYmd] em todos os dias YYYY-MM-DD inclusivos.
 */
export function expandirIntervalo(inicioYmd: string, fimYmd: string): string[] {
  const resultado: string[] = [];
  const dtInicio = new Date(`${inicioYmd}T00:00:00`);
  const dtFim = new Date(`${fimYmd}T00:00:00`);

  if (isNaN(dtInicio.getTime()) || isNaN(dtFim.getTime()) || dtInicio > dtFim) {
    return [inicioYmd];
  }

  const atual = new Date(dtInicio);
  // Limite razoável de 366 dias para evitar loops infinitos caso entrada seja atípica
  let contagem = 0;
  while (atual <= dtFim && contagem < 366) {
    const y = atual.getFullYear();
    const m = String(atual.getMonth() + 1).padStart(2, '0');
    const d = String(atual.getDate()).padStart(2, '0');
    resultado.push(`${y}-${m}-${d}`);
    atual.setDate(atual.getDate() + 1);
    contagem++;
  }

  return resultado;
}

/**
 * Faz o parsing de um único token/linha digitada (podendo ser data simples, com horário ou intervalo)
 */
export function parseTokenLinha(token: string, defaultYear: number): ParsedUnavailabilityEntry[] {
  const limpo = token.trim();
  if (!limpo) return [];

  // 1. Verificar se é intervalo (ex: "02/11 a 07/11", "02/11-07/11", "02/11 até 07/11")
  // Regex que busca " a ", " até " ou "-" separando duas partes
  const matchRangeA = limpo.match(/^(.+?)\s+(?:a|até)\s+(.+)$/i);
  const matchRangeHifen = !matchRangeA ? limpo.match(/^(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\s*-\s*(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)$/) : null;

  const matchRange = matchRangeA || matchRangeHifen;
  if (matchRange) {
    const parte1 = matchRange[1].trim();
    const parte2 = matchRange[2].trim();

    const d1Ymd = converterParaYmd(parte1, defaultYear);
    const d2Ymd = converterParaYmd(parte2, defaultYear);

    if (d1Ymd && d2Ymd) {
      const dias = expandirIntervalo(d1Ymd, d2Ymd);
      return dias.map(d => ({
        data: d,
        horario: undefined,
        rawInput: limpo
      }));
    }
  }

  // 2. Verificar se há horário especificado na data (ex: "02/11 09:00", "02/11 às 09:00", "02/11/2026 19:00")
  let dataParte = limpo;
  let horarioExtraido: string | undefined = undefined;

  const matchHorario = limpo.match(/(?:(?:\s+às\s+|\s+as\s+|\s+))?(\d{1,2}(?::\d{2}(?::\d{2})?|[hH]\d{0,2}))$/i);
  if (matchHorario) {
    const possivelHorario = normalizarHorario(matchHorario[1]);
    if (possivelHorario) {
      const indexHorario = limpo.lastIndexOf(matchHorario[0]);
      dataParte = limpo.slice(0, indexHorario).trim();
      horarioExtraido = possivelHorario;
    }
  }

  // 3. Converter a parte da data
  const ymd = converterParaYmd(dataParte, defaultYear);
  if (ymd) {
    return [{
      data: ymd,
      horario: horarioExtraido,
      rawInput: limpo
    }];
  }

  // Não foi possível reconhecer
  return [{
    data: '',
    horario: undefined,
    rawInput: limpo
  }];
}

/**
 * 2) DIGITAR AS DATAS
 * Processa texto livre onde as datas estão separadas por vírgula, ponto e vírgula ou quebra de linha.
 */
export function parseTextUnavailabilities(text: string, defaultYear: number): ParsedUnavailabilityEntry[] {
  if (!text || !text.trim()) return [];

  // Dividir por quebra de linha, ponto e vírgula ou vírgula
  // Cuidado para não quebrar vírgula se for parte de algo específico, mas vírgula é delimitador padrão
  const tokens = text.split(/[\n,;]+/);
  const resultado: ParsedUnavailabilityEntry[] = [];

  for (const t of tokens) {
    const entries = parseTokenLinha(t, defaultYear);
    resultado.push(...entries);
  }

  return resultado;
}

/**
 * 1) IMPORTAR PLANILHA
 * Processa arquivo Excel (.xlsx) ou CSV.
 * Coluna A: Colaborador (opcional)
 * Coluna B: Data
 * Coluna C: Horário (opcional)
 */
export async function parseSpreadsheetUnavailabilities(file: File, defaultYear: number): Promise<ParsedUnavailabilityEntry[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) return [];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
  if (!rawRows || rawRows.length === 0) return [];

  const resultado: ParsedUnavailabilityEntry[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    // Detectar cabeçalho na primeira linha
    if (i === 0) {
      const rowStr = row.map(c => String(c || '').toLowerCase().trim()).join(' ');
      if (rowStr.includes('colaborador') || rowStr.includes('data') || rowStr.includes('dia') || rowStr.includes('horário') || rowStr.includes('hora')) {
        continue; // Pular linha de cabeçalho
      }
    }

    // Identificar colunas:
    // Se linha tiver 3 células preenchidas: A = Colaborador, B = Data, C = Horário
    // Se linha tiver 2 células:
    //   - Se célula 0 for data e célula 1 for horário -> sem Colaborador
    //   - Se célula 0 for texto de nome e célula 1 for data -> com Colaborador, sem Horário
    // Se linha tiver 1 célula: B = Data (sem Colaborador, sem Horário)
    let colabValor: any = undefined;
    let dataValor: any = undefined;
    let horaValor: any = undefined;

    const cell0 = row[0];
    const cell1 = row[1];
    const cell2 = row[2];

    const cell0IsDate = converterParaYmd(cell0, defaultYear) !== null;
    const cell1IsDate = converterParaYmd(cell1, defaultYear) !== null;

    if (row.length >= 3 && (cell1 !== undefined || cell2 !== undefined)) {
      colabValor = cell0;
      dataValor = cell1;
      horaValor = cell2;
    } else if (row.length === 2) {
      if (cell0IsDate) {
        dataValor = cell0;
        horaValor = cell1;
      } else if (cell1IsDate) {
        colabValor = cell0;
        dataValor = cell1;
      } else {
        dataValor = cell0;
        horaValor = cell1;
      }
    } else {
      dataValor = cell0;
    }

    if (dataValor === undefined || dataValor === null || String(dataValor).trim() === '') {
      continue; // Ignorar linhas em branco
    }

    const colabNome = colabValor ? String(colabValor).trim() : undefined;
    const dataYmd = converterParaYmd(dataValor, defaultYear);
    const horaNorm = normalizarHorario(horaValor);
    const rawInput = `Linha ${i + 1}: ${[colabNome, dataValor, horaValor].filter(Boolean).join(' | ')}`;

    if (dataYmd) {
      resultado.push({
        colaborador: colabNome,
        data: dataYmd,
        horario: horaNorm,
        rawInput
      });
    } else {
      resultado.push({
        colaborador: colabNome,
        data: '',
        horario: undefined,
        rawInput: `Data inválida na linha ${i + 1}: ${String(dataValor)}`
      });
    }
  }

  return resultado;
}

/**
 * 3) COMPORTAMENTO COMUM
 * Casa as entradas parseadas com os eventos carregados na agenda (`disponibilidades`)
 */
export function matchUnavailabilitiesWithEvents(
  entries: ParsedUnavailabilityEntry[],
  disponibilidades: Disponibilidade[]
): MatchResult {
  const eventosAfetadosMap = new Map<number, MatchedEventItem>();
  const naoEncontrados: UnmatchedEntryItem[] = [];

  for (const entry of entries) {
    if (!entry.data) {
      naoEncontrados.push({
        rawInput: entry.rawInput,
        colaborador: entry.colaborador,
        motivo: 'Formato de data não reconhecido'
      });
      continue;
    }

    if (entry.horario) {
      // Regra com horário: marca somente o evento daquela data e horário
      const correspondentes = disponibilidades.filter(d => {
        if (d.data !== entry.data) return false;
        const dHora = d.horaInicio ? d.horaInicio.slice(0, 5) : '';
        return dHora === entry.horario;
      });

      if (correspondentes.length === 0) {
        naoEncontrados.push({
          rawInput: entry.rawInput,
          data: entry.data,
          horario: entry.horario,
          colaborador: entry.colaborador,
          motivo: `Nenhum evento cadastrado em ${entry.data} às ${entry.horario}`
        });
      } else {
        for (const evt of correspondentes) {
          eventosAfetadosMap.set(evt.eventoId, {
            eventoId: evt.eventoId,
            nomeEvento: evt.nomeEvento,
            data: evt.data,
            horaInicio: evt.horaInicio,
            regraOrigem: entry.rawInput,
            colaborador: entry.colaborador
          });
        }
      }
    } else {
      // Regra só data: marca como indisponível TODOS os eventos daquele dia
      const correspondentes = disponibilidades.filter(d => d.data === entry.data);

      if (correspondentes.length === 0) {
        naoEncontrados.push({
          rawInput: entry.rawInput,
          data: entry.data,
          colaborador: entry.colaborador,
          motivo: `Nenhum evento cadastrado na data ${entry.data}`
        });
      } else {
        for (const evt of correspondentes) {
          eventosAfetadosMap.set(evt.eventoId, {
            eventoId: evt.eventoId,
            nomeEvento: evt.nomeEvento,
            data: evt.data,
            horaInicio: evt.horaInicio,
            regraOrigem: entry.rawInput,
            colaborador: entry.colaborador
          });
        }
      }
    }
  }

  // Ordenar eventos afetados por data e horário
  const eventosAfetados = Array.from(eventosAfetadosMap.values()).sort(
    (a, b) => a.data.localeCompare(b.data) || a.horaInicio.localeCompare(b.horaInicio)
  );

  return {
    eventosAfetados,
    naoEncontrados,
    totalRegras: entries.length
  };
}

/**
 * Gera e dispara o download do modelo oficial de planilha de indisponibilidades (.xlsx)
 */
export function gerarModeloPlanilhaExcel(): void {
  const wsData = [
    ['Colaborador', 'Data', 'Horário'],
    ['João Silva', '02/11/2026', ''],
    ['Maria Santos', '06/11/2026', '09:00'],
    ['', '10/11/2026', ''],
    ['', '15/11/2026', '19:00']
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Definir larguras das colunas
  ws['!cols'] = [
    { wch: 25 }, // Colaborador
    { wch: 15 }, // Data
    { wch: 12 }  // Horário
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Indisponibilidades');

  XLSX.writeFile(wb, 'modelo_indisponibilidades.xlsx');
}
