import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { apiCache, cachedGet, DEFAULT_STALE_TIME } from '../services/api';

describe('API Cache and Deduplication Layer', () => {
  beforeEach(() => {
    apiCache.clear();
    vi.restoreAllMocks();
  });

  it('deve armazenar e recuperar dados do cache dentro do staleTime', async () => {
    const mockData = [{ id: 1, nome: 'Missa Matutina' }];
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockData } as any);

    // Primeira chamada: deve ir à API
    const res1 = await cachedGet('/eventos', { params: { mes: 11, ano: 2026 } });
    expect(res1).toEqual(mockData);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Segunda chamada idêntica: deve retornar do cache sem chamar a API
    const res2 = await cachedGet('/eventos', { params: { mes: 11, ano: 2026 } });
    expect(res2).toEqual(mockData);
    expect(getSpy).toHaveBeenCalledTimes(1); // Continua 1, não chamou novamente!
  });

  it('deve deduplicar requisições concorrentes em voo (in-flight)', async () => {
    const mockData = [{ id: 10, nome: 'João' }, { id: 11, nome: 'Maria' }];
    let resolvePromise: (val: any) => void;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const getSpy = vi.spyOn(api, 'get').mockImplementation(() => delayedPromise as any);

    // Disparar duas requisições simultâneas
    const p1 = cachedGet('/colaboradores');
    const p2 = cachedGet('/colaboradores');

    // Resolver a requisição
    resolvePromise!({ data: mockData });

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(res1).toEqual(mockData);
    expect(res2).toEqual(mockData);
    // Deve ter chamado a API apenas 1 vez para as duas requisições simultâneas!
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('deve invalidar cache quando solicitado', async () => {
    const mockData1 = [{ id: 1, nome: 'Evento 1' }];
    const mockData2 = [{ id: 1, nome: 'Evento 1' }, { id: 2, nome: 'Evento 2' }];

    const getSpy = vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: mockData1 } as any)
      .mockResolvedValueOnce({ data: mockData2 } as any);

    await cachedGet('/eventos', { params: { mes: 11, ano: 2026 } });
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Invalidar cache de eventos
    apiCache.invalidate('/eventos');

    // Próxima chamada deve buscar da API
    const res = await cachedGet('/eventos', { params: { mes: 11, ano: 2026 } });
    expect(res).toEqual(mockData2);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('deve respeitar a opção forceRefresh', async () => {
    const mockData1 = [{ id: 1 }];
    const mockData2 = [{ id: 2 }];

    const getSpy = vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: mockData1 } as any)
      .mockResolvedValueOnce({ data: mockData2 } as any);

    await cachedGet('/escalas');
    expect(getSpy).toHaveBeenCalledTimes(1);

    // forceRefresh: true deve contornar o cache
    const res = await cachedGet('/escalas', { forceRefresh: true });
    expect(res).toEqual(mockData2);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });
});
