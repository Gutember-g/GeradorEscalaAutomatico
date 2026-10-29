import axios, { type AxiosRequestConfig } from 'axios';
import type { Colaborador, Evento, Escala, RelatorioGeracao, Disponibilidade } from '../types';

const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  if (url && !url.endsWith('/api') && !url.endsWith('/api/')) {
    url = url.endsWith('/') ? `${url}api` : `${url}/api`;
  }
  return url;
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
  },
});

// ─── Cache & Request Deduplication ──────────────────────────────────────────

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

export interface CacheOptions {
  cache?: boolean;
  staleTime?: number; // ms (default 30_000)
  forceRefresh?: boolean;
}

export const DEFAULT_STALE_TIME = 30_000; // 30s cache por padrão

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

export const apiCache = {
  get: <T = any>(key: string, staleTime = DEFAULT_STALE_TIME): T | null => {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > staleTime) {
      memoryCache.delete(key);
      return null;
    }
    return entry.data as T;
  },
  set: <T = any>(key: string, data: T) => {
    memoryCache.set(key, { data, timestamp: Date.now() });
  },
  invalidate: (pattern?: string | RegExp) => {
    if (!pattern) {
      memoryCache.clear();
      return;
    }
    for (const key of memoryCache.keys()) {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          memoryCache.delete(key);
        }
      } else if (pattern.test(key)) {
        memoryCache.delete(key);
      }
    }
  },
  clear: () => {
    memoryCache.clear();
    inFlightRequests.clear();
  },
  size: () => memoryCache.size
};

/**
 * Função utilitária para requisições GET com cache e deduplicação de chamadas em voo (in-flight).
 */
export async function cachedGet<T = any>(
  url: string,
  config?: AxiosRequestConfig & CacheOptions
): Promise<T> {
  const cacheEnabled = config?.cache !== false;
  const staleTime = config?.staleTime ?? DEFAULT_STALE_TIME;
  const forceRefresh = config?.forceRefresh === true;

  const paramsKey = config?.params
    ? new URLSearchParams(
        Object.entries(config.params)
          .filter(([_, v]) => v !== undefined && v !== null)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';

  const cacheKey = `GET:${url}?${paramsKey}`;

  // 1. Retornar do cache se ainda estiver dentro do staleTime
  if (cacheEnabled && !forceRefresh) {
    const cached = apiCache.get<T>(cacheKey, staleTime);
    if (cached !== null) {
      return cached;
    }
  }

  // 2. Se houver uma requisição idêntica já em andamento, reaproveitar a mesma Promise (deduplicação)
  if (inFlightRequests.has(cacheKey) && !forceRefresh) {
    return inFlightRequests.get(cacheKey)!;
  }

  // 3. Disparar a requisição e armazenar no mapa de in-flight
  const requestPromise = api.get<T>(url, config)
    .then((res) => {
      if (cacheEnabled) {
        apiCache.set(cacheKey, res.data);
      }
      return res.data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

// ─── Interceptors ───────────────────────────────────────────────────────────

// Interceptor de requisição: JWT + timestamp de início (PERF)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    (config as any)._t0 = performance.now();
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta: Logger melhorado [API] com Status HTTP e Contagem de Registros
api.interceptors.response.use(
  (response) => {
    const t0 = (response.config as any)._t0;
    const status = response.status;
    const method = response.config.method?.toUpperCase() ?? 'GET';
    const url = response.config.url ?? '';
    const data = response.data;

    // Calcular contagem de registros
    let countInfo = '';
    let countNum = 0;
    if (Array.isArray(data)) {
      countNum = data.length;
      countInfo = `${countNum} ${countNum === 1 ? 'registro' : 'registros'}`;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.eventos)) {
        countNum = data.eventos.length;
        countInfo = `${countNum} ${countNum === 1 ? 'evento' : 'eventos'}`;
      } else if (Array.isArray(data.alocacoes)) {
        countNum = data.alocacoes.length;
        countInfo = `${countNum} ${countNum === 1 ? 'alocação' : 'alocações'}`;
      } else {
        countInfo = '1 objeto';
      }
    } else if (data === '' || data == null) {
      countInfo = '0 registros';
    }

    if (t0 != null) {
      const ms = (performance.now() - t0).toFixed(0);
      const bytes = data != null ? JSON.stringify(data).length : 0;
      const kb = (bytes / 1024).toFixed(1);

      console.log(
        `%c[API] ${method} ${url}`,
        'color: #6366f1; font-weight: bold',
        `→ Status: ${status} | ${ms}ms | ${countInfo ? countInfo + ' | ' : ''}${kb}KB`
      );
    }

    // Alerta de resposta vazia no console
    if (Array.isArray(data) && data.length === 0) {
      console.warn(
        `%c[API VAZIO] ${method} ${url} retornou 0 registros. Status HTTP: ${status}`,
        'color: #f59e0b; font-weight: bold',
        data
      );
    }

    // Invalidação automática do cache em mutações (POST, PUT, DELETE)
    if (method !== 'GET') {
      if (url.includes('/colaboradores')) {
        apiCache.invalidate('/colaboradores');
        apiCache.invalidate('/alocacoes');
      } else if (url.includes('/eventos')) {
        apiCache.invalidate('/eventos');
        apiCache.invalidate('/alocacoes');
      } else if (url.includes('/escalas')) {
        apiCache.invalidate('/escalas');
        apiCache.invalidate('/alocacoes');
      } else if (url.includes('/disponibilidade')) {
        apiCache.invalidate('/disponibilidade');
        apiCache.invalidate('/alocacoes');
      } else {
        apiCache.clear();
      }
    }

    return response;
  },
  (error) => {
    const status = error.response?.status ?? 'SEM_RESPOSTA';
    const method = error.config?.method?.toUpperCase() ?? 'REQ';
    const url = error.config?.url ?? '';
    const body = error.response?.data;

    // Log detalhado de erro de API com status HTTP e corpo
    console.error(
      `%c[API ERRO] ${method} ${url} → Status: ${status}`,
      'color: #ef4444; font-weight: bold',
      { status, body: body || error.message }
    );

    // SÓ deslogar e redirecionar para o login em 401 (Sessão realmente expirada / inválida)
    if (status === 401) {
      console.error(`Logout automático: ${method} ${url} retornou 401 (Sessão expirada ou token inválido)`);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      apiCache.clear();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/cadastro') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      console.error(`Acesso negado sem deslogar: ${method} ${url} retornou 403 (Sem permissão para este recurso)`);
    }

    return Promise.reject(error);
  }
);

// ─── Cold Start & Keep-Alive Ping ───────────────────────────────────────────

let keepAliveInterval: any = null;

export const startKeepAlive = () => {
  if (keepAliveInterval) return;
  // Ping de keep-alive a cada 4 minutos para evitar cold start de instâncias em nuvem
  keepAliveInterval = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      api.get('/health', { headers: { 'X-Keep-Alive': 'true' } }).catch(() => {});
    }
  }, 4 * 60 * 1000);
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AlocacaoLight {
  eventoId: number;
  eventoNome: string;
  eventoData: string;
  eventoHoraInicio: string;
  colaboradorId: number;
  colaboradorNome: string;
}

// ─── Services ───────────────────────────────────────────────────────────────

export const colaboradorService = {
  listar: (options?: CacheOptions) =>
    cachedGet<Colaborador[]>('/colaboradores', options),

  buscarPorId: (id: number, options?: CacheOptions) =>
    cachedGet<Colaborador>(`/colaboradores/${id}`, options),

  criar: (data: Colaborador) =>
    api.post<Colaborador>('/colaboradores', data).then(res => res.data),

  atualizar: (id: number, data: Colaborador) =>
    api.put<Colaborador>(`/colaboradores/${id}`, data).then(res => res.data),

  deletar: (id: number) =>
    api.delete<void>(`/colaboradores/${id}`).then(res => res.data),

  obterDisponibilidade: (id: number, mes: number, ano: number, options?: CacheOptions) =>
    cachedGet<Disponibilidade[]>(`/colaboradores/${id}/disponibilidade`, {
      params: { mes, ano },
      ...options,
    }),

  salvarDisponibilidade: (id: number, data: Disponibilidade[]) =>
    api.post<void>(`/colaboradores/${id}/disponibilidade`, data).then(res => res.data),
};

export const eventoService = {
  listar: (params?: { mes?: number; ano?: number; inicio?: string; fim?: string }, options?: CacheOptions) =>
    cachedGet<Evento[]>('/eventos', { params, ...options }),

  buscarPorId: (id: number, options?: CacheOptions) =>
    cachedGet<Evento>(`/eventos/${id}`, options),

  criar: (data: Evento) =>
    api.post<Evento>('/eventos', data).then(res => res.data),

  atualizar: (id: number, data: Evento) =>
    api.put<Evento>(`/eventos/${id}`, data).then(res => res.data),

  deletar: (id: number) =>
    api.delete<void>(`/eventos/${id}`).then(res => res.data),
};

export const escalaService = {
  listar: (options?: CacheOptions) =>
    cachedGet<Escala[]>('/escalas', options),

  buscarPorId: (id: number, options?: CacheOptions) =>
    cachedGet<Escala>(`/escalas/${id}`, options),

  deletar: (id: number) =>
    api.delete<void>(`/escalas/${id}`).then(res => res.data),

  gerar: (payload: {
    nomeEscala: string;
    dataInicio: string;
    dataFim: string;
    colaboradorIds?: number[];
    eventos: Evento[];
  }) => api.post<RelatorioGeracao>('/escalas/gerar', payload).then(res => res.data),
};

/**
 * G4: Serviço leve de alocações — substitui escalaService.listar() em
 * DisponibilidadeColaborador.tsx. Payload: ~1-5KB vs 80-200KB.
 */
export const alocacaoService = {
  listarPorPeriodo: (mes: number, ano: number, options?: CacheOptions) =>
    cachedGet<AlocacaoLight[]>('/alocacoes', { params: { mes, ano }, ...options }),
};

export default api;
