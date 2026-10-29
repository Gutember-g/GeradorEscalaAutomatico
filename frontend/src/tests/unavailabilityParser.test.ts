import { describe, it, expect } from 'vitest';
import {
  converterParaYmd,
  normalizarHorario,
  expandirIntervalo,
  parseTextUnavailabilities,
  matchUnavailabilitiesWithEvents,
  type ParsedUnavailabilityEntry
} from '../utils/unavailabilityParser';
import type { Disponibilidade } from '../types';

describe('unavailabilityParser Utility', () => {
  const DEFAULT_YEAR = 2026;

  describe('converterParaYmd', () => {
    it('deve converter formatos dd/mm/aaaa e dd-mm-aaaa', () => {
      expect(converterParaYmd('02/11/2026', DEFAULT_YEAR)).toBe('2026-11-02');
      expect(converterParaYmd('2/11/2026', DEFAULT_YEAR)).toBe('2026-11-02');
      expect(converterParaYmd('15-08-2026', DEFAULT_YEAR)).toBe('2026-08-15');
    });

    it('deve converter formato dd/mm usando o ano padrão', () => {
      expect(converterParaYmd('02/11', DEFAULT_YEAR)).toBe('2026-11-02');
      expect(converterParaYmd('6/11', DEFAULT_YEAR)).toBe('2026-11-06');
    });

    it('deve converter formato com ano de 2 dígitos (dd/mm/aa)', () => {
      expect(converterParaYmd('02/11/26', DEFAULT_YEAR)).toBe('2026-11-02');
    });

    it('deve converter objetos Date nativos', () => {
      const d = new Date(2026, 10, 2); // 02 de novembro de 2026
      expect(converterParaYmd(d, DEFAULT_YEAR)).toBe('2026-11-02');
    });

    it('deve converter números de série de data do Excel', () => {
      // 46328 é aproximadamente 2026-11-02 em Excel date serial
      const dateSerial = 46328;
      const ymd = converterParaYmd(dateSerial, DEFAULT_YEAR);
      expect(ymd).toBe('2026-11-02');
    });

    it('deve retornar null para strings inválidas ou vazias', () => {
      expect(converterParaYmd('', DEFAULT_YEAR)).toBeNull();
      expect(converterParaYmd('data-invalida', DEFAULT_YEAR)).toBeNull();
      expect(converterParaYmd(null, DEFAULT_YEAR)).toBeNull();
    });
  });

  describe('normalizarHorario', () => {
    it('deve normalizar horários HH:mm e HH:mm:ss', () => {
      expect(normalizarHorario('09:00')).toBe('09:00');
      expect(normalizarHorario('9:00')).toBe('09:00');
      expect(normalizarHorario('19:30:00')).toBe('19:30');
    });

    it('deve normalizar horários no formato 9h, 09h, 9h30', () => {
      expect(normalizarHorario('9h')).toBe('09:00');
      expect(normalizarHorario('10h30')).toBe('10:30');
      expect(normalizarHorario('19H')).toBe('19:00');
    });

    it('deve retornar undefined para valores inválidos', () => {
      expect(normalizarHorario('')).toBeUndefined();
      expect(normalizarHorario('invalido')).toBeUndefined();
      expect(normalizarHorario(null)).toBeUndefined();
    });
  });

  describe('expandirIntervalo', () => {
    it('deve gerar todos os dias entre início e fim inclusivos', () => {
      const dias = expandirIntervalo('2026-11-10', '2026-11-14');
      expect(dias).toEqual([
        '2026-11-10',
        '2026-11-11',
        '2026-11-12',
        '2026-11-13',
        '2026-11-14'
      ]);
    });

    it('deve retornar apenas 1 dia se início for igual a fim', () => {
      const dias = expandirIntervalo('2026-11-10', '2026-11-10');
      expect(dias).toEqual(['2026-11-10']);
    });
  });

  describe('parseTextUnavailabilities', () => {
    it('deve processar datas separadas por vírgula, ponto e vírgula e quebra de linha', () => {
      const texto = `
        02/11, 06/11; 20/11
        25/11/2026
      `;
      const entries = parseTextUnavailabilities(texto, DEFAULT_YEAR);
      const datas = entries.map(e => e.data);

      expect(datas).toContain('2026-11-02');
      expect(datas).toContain('2026-11-06');
      expect(datas).toContain('2026-11-20');
      expect(datas).toContain('2026-11-25');
    });

    it('deve processar data com horário específico (ex: "02/11 09:00")', () => {
      const texto = '02/11 09:00, 15/11 às 19:30';
      const entries = parseTextUnavailabilities(texto, DEFAULT_YEAR);

      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        data: '2026-11-02',
        horario: '09:00',
        rawInput: '02/11 09:00'
      });
      expect(entries[1]).toEqual({
        data: '2026-11-15',
        horario: '19:30',
        rawInput: '15/11 às 19:30'
      });
    });

    it('deve expandir intervalos com "a", "até" ou "-"', () => {
      const texto = '10/11 a 14/11, 20/11-22/11';
      const entries = parseTextUnavailabilities(texto, DEFAULT_YEAR);

      const datas = entries.map(e => e.data);
      expect(datas).toEqual([
        '2026-11-10',
        '2026-11-11',
        '2026-11-12',
        '2026-11-13',
        '2026-11-14',
        '2026-11-20',
        '2026-11-21',
        '2026-11-22'
      ]);
    });
  });

  describe('matchUnavailabilitiesWithEvents', () => {
    const mockDisponibilidades: Disponibilidade[] = [
      // Dia 02/11: dois eventos em horários diferentes
      { eventoId: 1, nomeEvento: 'Missa Matutina', data: '2026-11-02', horaInicio: '08:00:00', indisponivel: false },
      { eventoId: 2, nomeEvento: 'Missa Noturna', data: '2026-11-02', horaInicio: '19:00:00', indisponivel: false },
      // Dia 06/11: um evento
      { eventoId: 3, nomeEvento: 'Adoração', data: '2026-11-06', horaInicio: '15:00:00', indisponivel: false },
      // Dia 20/11: um evento
      { eventoId: 4, nomeEvento: 'Missa Solene', data: '2026-11-20', horaInicio: '10:00:00', indisponivel: false }
    ];

    it('regra só data: deve marcar TODOS os eventos daquele dia', () => {
      const entries: ParsedUnavailabilityEntry[] = [
        { data: '2026-11-02', horario: undefined, rawInput: '02/11' }
      ];

      const resultado = matchUnavailabilitiesWithEvents(entries, mockDisponibilidades);

      // Deve casar com ambos os eventos do dia 02/11 (ids 1 e 2)
      expect(resultado.eventosAfetados).toHaveLength(2);
      expect(resultado.eventosAfetados.map(e => e.eventoId)).toEqual([1, 2]);
      expect(resultado.naoEncontrados).toHaveLength(0);
    });

    it('regra data + horário: deve marcar SOMENTE o evento daquela data e horário', () => {
      const entries: ParsedUnavailabilityEntry[] = [
        { data: '2026-11-02', horario: '08:00', rawInput: '02/11 08:00' }
      ];

      const resultado = matchUnavailabilitiesWithEvents(entries, mockDisponibilidades);

      // Apenas o evento 1 das 08:00 deve ser marcado; o evento 2 das 19:00 continua fora
      expect(resultado.eventosAfetados).toHaveLength(1);
      expect(resultado.eventosAfetados[0].eventoId).toBe(1);
      expect(resultado.naoEncontrados).toHaveLength(0);
    });

    it('deve listar datas não encontradas ou sem eventos', () => {
      const entries: ParsedUnavailabilityEntry[] = [
        { data: '2026-11-15', horario: undefined, rawInput: '15/11' }, // Não existe na lista
        { data: '2026-11-06', horario: '20:00', rawInput: '06/11 20:00' } // Dia 06 só tem evento às 15:00
      ];

      const resultado = matchUnavailabilitiesWithEvents(entries, mockDisponibilidades);

      expect(resultado.eventosAfetados).toHaveLength(0);
      expect(resultado.naoEncontrados).toHaveLength(2);
      expect(resultado.naoEncontrados[0].motivo).toContain('Nenhum evento cadastrado');
      expect(resultado.naoEncontrados[1].motivo).toContain('Nenhum evento cadastrado em 2026-11-06 às 20:00');
    });
  });
});
