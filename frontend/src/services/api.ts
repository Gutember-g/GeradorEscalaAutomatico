import axios from 'axios';
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
  },
});

// Interceptor de requisição para adicionar o token JWT + timestamp de início (PERF)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Instrumentação de performance — removível após coleta dos números
    (config as any)._t0 = performance.now();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta para interceptar expiração de sessão (401/403) + log de performance
api.interceptors.response.use(
  (response) => {
    // Log de performance (remover após coleta dos números)
    const t0 = (response.config as any)._t0;
    if (t0 != null) {
      const ms = (performance.now() - t0).toFixed(0);
      const bytes = JSON.stringify(response.data).length;
      const kb = (bytes / 1024).toFixed(1);
      const method = response.config.method?.toUpperCase() ?? 'GET';
      const url = response.config.url ?? '';
      console.log(
        `%c[API] ${method} ${url}`,
        'color: #6366f1; font-weight: bold',
        `→ ${ms}ms | ${kb}KB`
      );
    }
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/cadastro') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Types ──────────────────────────────────────────────────────────────────────────────────

export interface AlocacaoLight {
  eventoId: number;
  eventoNome: string;
  eventoData: string;
  eventoHoraInicio: string;
  colaboradorId: number;
  colaboradorNome: string;
}

// ─── Services ───────────────────────────────────────────────────────────────────────────────

export const colaboradorService = {
  listar: () => api.get<Colaborador[]>('/colaboradores').then(res => res.data),
  buscarPorId: (id: number) => api.get<Colaborador>(`/colaboradores/${id}`).then(res => res.data),
  criar: (data: Colaborador) => api.post<Colaborador>('/colaboradores', data).then(res => res.data),
  atualizar: (id: number, data: Colaborador) => api.put<Colaborador>(`/colaboradores/${id}`, data).then(res => res.data),
  deletar: (id: number) => api.delete<void>(`/colaboradores/${id}`).then(res => res.data),
  obterDisponibilidade: (id: number, mes: number, ano: number) =>
    api.get<Disponibilidade[]>(`/colaboradores/${id}/disponibilidade`, { params: { mes, ano } }).then(res => res.data),
  salvarDisponibilidade: (id: number, data: Disponibilidade[]) =>
    api.post<void>(`/colaboradores/${id}/disponibilidade`, data).then(res => res.data),
};

export const eventoService = {
  listar: (params?: { mes?: number; ano?: number; inicio?: string; fim?: string }) =>
    api.get<Evento[]>('/eventos', { params }).then(res => res.data),
  buscarPorId: (id: number) => api.get<Evento>(`/eventos/${id}`).then(res => res.data),
  criar: (data: Evento) => api.post<Evento>('/eventos', data).then(res => res.data),
  atualizar: (id: number, data: Evento) => api.put<Evento>(`/eventos/${id}`, data).then(res => res.data),
  deletar: (id: number) => api.delete<void>(`/eventos/${id}`).then(res => res.data),
};

export const escalaService = {
  listar: () => api.get<Escala[]>('/escalas').then(res => res.data),
  buscarPorId: (id: number) => api.get<Escala>(`/escalas/${id}`).then(res => res.data),
  deletar: (id: number) => api.delete<void>(`/escalas/${id}`).then(res => res.data),
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
  listarPorPeriodo: (mes: number, ano: number) =>
    api.get<AlocacaoLight[]>('/alocacoes', { params: { mes, ano } }).then(res => res.data),
};

export default api;
