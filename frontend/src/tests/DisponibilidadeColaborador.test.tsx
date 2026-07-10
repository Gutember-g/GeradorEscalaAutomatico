import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DisponibilidadeColaborador from '../pages/DisponibilidadeColaborador';
import { colaboradorService, escalaService } from '../services/api';
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
  }
}));

describe('DisponibilidadeColaborador Component', () => {
  const mockColaborador = { id: 1, nome: 'João Silva', telefone: '9999-9999' };
  const mockOnVoltar = vi.fn();

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
      { eventoId: 10, nomeEvento: 'Missa das 10h', data: '2026-07-10', horaInicio: '10:00:00', indisponivel: false }
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
    (escalaService.listar as any).mockResolvedValue([
      {
        id: 5,
        nome: 'Escala Mensal',
        dataInicio: '2026-07-01',
        dataFim: '2026-07-31',
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
});
