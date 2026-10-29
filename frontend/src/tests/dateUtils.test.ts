import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { obterMesReferenciaPadrao, formatarDataComDiaSemana } from '../utils/dateUtils';

describe('dateUtils - obterMesReferenciaPadrao', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve retornar o próximo mês no mesmo ano quando o mês atual não for Dezembro', () => {
    // Simular data atual: 15 de Outubro de 2026 (mês 10)
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15)); // Mês 9 = Outubro (0-indexed)

    const ref = obterMesReferenciaPadrao();
    expect(ref.mes).toBe(11); // Novembro (1-indexed)
    expect(ref.ano).toBe(2026);
  });

  it('deve virar o ano e retornar Janeiro quando o mês atual for Dezembro', () => {
    // Simular data atual: 31 de Dezembro de 2026 (mês 12)
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31)); // Mês 11 = Dezembro (0-indexed)

    const ref = obterMesReferenciaPadrao();
    expect(ref.mes).toBe(1); // Janeiro
    expect(ref.ano).toBe(2027); // 2027
  });

  it('deve lidar corretamente com o último dia de meses de 31 dias sem overflow de dia', () => {
    // Simular 31 de Outubro -> Próximo mês é Novembro
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 31));

    const ref = obterMesReferenciaPadrao();
    expect(ref.mes).toBe(11);
    expect(ref.ano).toBe(2026);
  });

  it('deve formatar data com dia da semana corretamente', () => {
    const formatado = formatarDataComDiaSemana('2026-11-01');
    expect(formatado).toContain('01/11/2026');
    expect(formatado).toContain('Domingo');
  });
});
