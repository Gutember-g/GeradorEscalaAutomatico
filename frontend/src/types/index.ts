export interface Intervalo {
  dataInicio: string;
  dataFim: string;
}

export interface Colaborador {
  id?: number;
  nome: string;
  telefone?: string;
  naoTrabalharCom?: number[];
  preferenciaTrabalharCom?: number[];
}

export interface Evento {
  id?: number;
  nome: string;
  data: string;
  horaInicio: string;
  vagasNecessarias: number;
  corLiturgica?: string;
}

export interface Alocacao {
  id: number;
  eventoId: number;
  colaboradorId: number;
  colaboradorNome: string;
  colaboradorTelefone?: string;
}

export interface Escala {
  id: number;
  nome: string;
  dataInicio: string;
  dataFim: string;
  eventos: Evento[];
  alocacoes: Alocacao[];
}

export interface StatusEvento {
  eventoId?: number;
  nome: string;
  data: string;
  horaInicio: string;
  corLiturgica?: string;
  vagasNecessarias: number;
  vagasPreenchidas: number;
  status: 'TOTALMENTE_PREENCHIDO' | 'PARCIALMENTE_PREENCHIDO' | 'NAO_PREENCHIDO';
  motivo: string;
  ministros?: string[];
}

export interface RelatorioGeracao {
  escalaId: number;
  nomeEscala: string;
  totalVagas: number;
  vagasPreenchidas: number;
  vagasRestantes: number;
  statusEventos: StatusEvento[];
}

export interface Disponibilidade {
  eventoId: number;
  nomeEvento: string;
  data: string;
  horaInicio: string;
  indisponivel: boolean;
}
