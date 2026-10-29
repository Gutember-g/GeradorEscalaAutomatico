import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DisponibilidadeColaborador from '../pages/DisponibilidadeColaborador';
import { colaboradorService, escalaService, alocacaoService } from '../services/api';
import toast from 'react-hot-toast';

vi.mock('../services/api', () => ({
  colaboradorService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    obterDisponibilidade: vi.fn(),
    salvarDisponibilidade: vi.fn(),
    atualizar: vi.fn(),
  },
  escalaService: {
    listar: vi.fn(() => Promise.resolve([])),
    buscarPorId: vi.fn(() => Promise.resolve({})),
  },
  alocacaoService: {
    listarPorPeriodo: vi.fn(() => Promise.resolve([])),
  }
}));

describe('DisponibilidadeColaborador Component', () => {
  const mockColaborador = { id: 1, nome: 'João Silva', telefone: '9999-9999' };
  const mockOnVoltar = vi.fn();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthStr = String(currentMonth).padStart(2, '0');

  beforeEach(() => {
    vi.clearAllMocks();
    (colaboradorService.listar as any).mockResolvedValue([
      { id: 1, nome: 'João Silva' },
      { id: 2, nome: 'Maria Souza' }
    ]);
    (colaboradorService.buscarPorId as any).mockResolvedValue({
      id: 1,
      nome: 'João Silva',
      telefone: '9999-9999',
      naoTrabalharCom: [],
      preferenciaTrabalharCom: []
    });
    (colaboradorService.obterDisponibilidade as any).mockResolvedValue([
      { eventoId: 10, nomeEvento: 'Missa das 10h', data: `${currentYear}-${monthStr}-10`, horaInicio: '10:00:00', indisponivel: false }
    ]);
    (colaboradorService.salvarDisponibilidade as any).mockResolvedValue({});
    (colaboradorService.atualizar as any).mockResolvedValue({});
    (escalaService.listar as any).mockResolvedValue([]);
  });

  it('deve renderizar a agenda de disponibilidades e preferências do colaborador', async () => {
    render(<DisponibilidadeColaborador colaborador={mockColaborador} onVoltar={mockOnVoltar} />);

    // Verificar se renderizou o nome do colaborador
    const nameHeader = await screen.findByText('João Silva');
    expect(nameHeader).toBeInTheDocument();

    // Verificar se o evento da lista de disponibilidades carregou
    const eventElement = await screen.findByText('Missa das 10h');
    expect(eventElement).toBeInTheDocument();
  });

  it('deve alternar a indisponibilidade ao clicar no card do evento', async () => {
    render(<DisponibilidadeColaborador colaborador={mockColaborador} onVoltar={mockOnVoltar} />);

    // Mudar para o modo lista
    const btnLista = await screen.findByRole('button', { name: /Lista/i });
    fireEvent.click(btnLista);

    // Esperar o card carregar e verificar o status inicial (Disponível)
    const card = await screen.findByText('Missa das 10h');
    expect(screen.getByText('Disponível')).toBeInTheDocument();

    // Clicar no card do evento para torná-lo indisponível
    fireEvent.click(card);

    // Deve alternar para Indisponível (usando o seletor da badge para evitar ambiguidades com o título)
    expect(screen.getByText('Indisponível', { selector: 'span.tracking-wider' })).toBeInTheDocument();
  });

  it('deve salvar as indisponibilidades/preferencias e acionar o onVoltar no sucesso', async () => {
    render(<DisponibilidadeColaborador colaborador={mockColaborador} onVoltar={mockOnVoltar} />);

    // Mudar para o modo lista
    const btnLista = await screen.findByRole('button', { name: /Lista/i });
    fireEvent.click(btnLista);

    // Esperar carregar dados
    await screen.findByText('Missa das 10h');

    // Encontrar o botão Salvar
    const btnSalvar = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(colaboradorService.salvarDisponibilidade).toHaveBeenCalledWith(1, expect.any(Array));
      expect(colaboradorService.atualizar).toHaveBeenCalledWith(1, expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('sucesso'), expect.any(Object));
      expect(mockOnVoltar).toHaveBeenCalled();
    });
  });

  it('deve alternar para visualizacao de calendario e selecionar um dia com eventos', async () => {
    (alocacaoService.listarPorPeriodo as any).mockResolvedValue([
      { id: 99, eventoId: 10, colaboradorId: 2, colaboradorNome: 'Maria Souza' }
    ]);
    (escalaService.listar as any).mockResolvedValue([
      {
        id: 5,
        nome: 'Escala Mensal',
        dataInicio: `${currentYear}-${monthStr}-01`,
        dataFim: `${currentYear}-${monthStr}-28`,
        eventos: [],
        alocacoes: [
          { id: 99, eventoId: 10, colaboradorId: 2, colaboradorNome: 'Maria Souza' }
        ]
      }
    ]);

    render(<DisponibilidadeColaborador colaborador={mockColaborador} onVoltar={mockOnVoltar} />);

    // Alternar para o modo Calendário
    const btnCalendario = await screen.findByRole('button', { name: /Calendário/i });
    fireEvent.click(btnCalendario);

    // Verificar se o dia 10 e o evento são exibidos no calendário
    const eventCalendarItem = await screen.findByTitle(/Missa das 10h/);
    expect(eventCalendarItem).toBeInTheDocument();

    // Clicar no dia 10 (conterá o texto do dia "10")
    const dayCell = screen.getByText('10');
    fireEvent.click(dayCell);

    // Deve exibir o painel de detalhes inferior mostrando a alocação de Maria Souza
    const mariaElements = await screen.findAllByText('Maria Souza');
    expect(mariaElements.length).toBe(3);
  });

  it('deve abrir o modal de lote, digitar data com horario, exibir previa e aplicar alteracoes', async () => {
    (colaboradorService.obterDisponibilidade as any).mockResolvedValue([
      { eventoId: 10, nomeEvento: 'Missa das 10h', data: `${currentYear}-${monthStr}-10`, horaInicio: '10:00:00', indisponivel: false },
      { eventoId: 20, nomeEvento: 'Missa das 18h', data: `${currentYear}-${monthStr}-10`, horaInicio: '18:00:00', indisponivel: false }
    ]);

    render(<DisponibilidadeColaborador colaborador={mockColaborador} onVoltar={mockOnVoltar} />);

    // Mudar para o modo lista
    const btnLista = await screen.findByRole('button', { name: /Lista/i });
    fireEvent.click(btnLista);

    // Clicar no botão de digitar em lote
    const btnDigitarLote = await screen.findByRole('button', { name: /Digitar Datas em Lote/i });
    fireEvent.click(btnDigitarLote);

    // Modal deve estar aberto
    expect(screen.getByText('Definir Indisponibilidades em Lote')).toBeInTheDocument();

    // Digitar apenas o horário das 10h para o dia 10
    const textarea = screen.getByTestId('textarea-datas-lote');
    fireEvent.change(textarea, { target: { value: `10/${monthStr} 10:00` } });

    // Clicar em Verificar e Gerar Prévia
    const btnPrevia = screen.getByRole('button', { name: /Verificar e Gerar Prévia/i });
    fireEvent.click(btnPrevia);

    // Na prévia, deve listar Eventos Encontrados e a Missa das 10h
    expect(await screen.findByText('Eventos Encontrados')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // total eventos encontrados

    // Clicar em Confirmar e Aplicar
    const btnAplicar = screen.getByRole('button', { name: /Confirmar e Aplicar/i });
    fireEvent.click(btnAplicar);

    // O modal fecha e o evento 10 agora deve estar Indisponível
    await waitFor(() => {
      expect(screen.queryByText('Definir Indisponibilidades em Lote')).not.toBeInTheDocument();
    });

    // Salvar deve enviar o evento 10 como indisponivel = true e o 20 como indisponivel = false
    const btnSalvar = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(colaboradorService.salvarDisponibilidade).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({ eventoId: 10, indisponivel: true }),
          expect.objectContaining({ eventoId: 20, indisponivel: false })
        ])
      );
    });
  });

  it('deve permitir cancelar o modal de lote sem alterar as indisponibilidades', async () => {
    render(<DisponibilidadeColaborador colaborador={mockColaborador} onVoltar={mockOnVoltar} />);

    const btnDigitarLote = await screen.findByRole('button', { name: /Digitar Datas em Lote/i });
    fireEvent.click(btnDigitarLote);

    const btnCancelar = screen.getByTestId('modal-lote-cancelar');
    fireEvent.click(btnCancelar);

    await waitFor(() => {
      expect(screen.queryByText('Definir Indisponibilidades em Lote')).not.toBeInTheDocument();
    });
  });
});
