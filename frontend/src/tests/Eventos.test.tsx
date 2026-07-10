import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Eventos from '../pages/Eventos';
import { eventoService } from '../services/api';

vi.mock('../services/api', () => ({
  eventoService: {
    listar: vi.fn(() => Promise.resolve([])),
    criar: vi.fn(() => Promise.resolve({ id: 1 })),
    atualizar: vi.fn(() => Promise.resolve({})),
    deletar: vi.fn(() => Promise.resolve()),
  }
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, nome: "Paróquia São José", role: "ROLE_USER" }
  })
}));

describe('Eventos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a tela de eventos e criar campos extras para multiplos horarios', async () => {
    (eventoService.listar as any).mockResolvedValue([]);
    render(<Eventos />);
    
    await waitFor(() => {
      expect(screen.getByText(/Eventos & Plantões/i)).toBeInTheDocument();
    });

    // Clicar em Novo Evento
    const btnNovo = screen.getByText('Cadastrar Primeiro');
    fireEvent.click(btnNovo);

    // Verificar que o checkbox de múltiplos horários existe
    const checkboxRepetir = screen.getByRole('checkbox');
    expect(checkboxRepetir).toBeInTheDocument();

    // Marcar checkbox
    fireEvent.click(checkboxRepetir);

    // Deve aparecer os inputs de repetições (segundo spinbutton)
    const inputs = screen.getAllByRole('spinbutton');
    const inputRepeticoes = inputs[1] as HTMLInputElement;
    expect(inputRepeticoes).toBeInTheDocument();
    expect(inputRepeticoes.value).toBe('1');

    // Alterar repetições para 2 e verificar inputs de horário gerados
    fireEvent.change(inputRepeticoes, { target: { value: '2' } });

    // Devem aparecer os labels "Horário 2"
    expect(screen.getByText(/Horário 2/i)).toBeInTheDocument();
  });

  it('deve selecionar todo o conteudo ao focar em campos numericos', async () => {
    (eventoService.listar as any).mockResolvedValue([]);
    render(<Eventos />);

    const btnNovo = await screen.findByText('Cadastrar Primeiro');
    fireEvent.click(btnNovo);

    // Obter o input de vagas (que tem o valor inicial '1')
    const inputs = screen.getAllByRole('spinbutton');
    const inputVagas = inputs[0] as HTMLInputElement;
    expect(inputVagas.value).toBe('1');

    // Focar no campo e simular seleção automática
    const selectSpy = vi.spyOn(inputVagas, 'select');
    fireEvent.focus(inputVagas);

    expect(selectSpy).toHaveBeenCalled();
  });

  it('deve ordenar eventos cronologicamente e filtrar por nome', async () => {
    (eventoService.listar as any).mockResolvedValue([
      { id: 2, nome: 'Missa Tarde', data: '2026-07-20', horaInicio: '18:00:00', vagasNecessarias: 3 },
      { id: 1, nome: 'Missa Manhã', data: '2026-07-15', horaInicio: '09:00:00', vagasNecessarias: 2 }
    ]);

    render(<Eventos />);

    // Mudar para o modo lista para verificar ordenação cronológica
    const btnLista = await screen.findByRole('button', { name: /Lista/i });
    fireEvent.click(btnLista);

    // Deve renderizar em ordem cronológica crescente (Missa Manhã em primeiro)
    const cards = await screen.findAllByText(/Missa/);
    expect(cards[0].textContent).toBe('Missa Manhã');
    expect(cards[1].textContent).toBe('Missa Tarde');

    // Filtrar por 'Manhã'
    const inputBusca = screen.getByPlaceholderText('Buscar por nome...');
    fireEvent.change(inputBusca, { target: { value: 'Manhã' } });

    expect(screen.getByText('Missa Manhã')).toBeInTheDocument();
    expect(screen.queryByText('Missa Tarde')).not.toBeInTheDocument();
  });

  it('deve abrir o modal de duplicacao ao clicar no botao copiar', async () => {
    (eventoService.listar as any).mockResolvedValue([
      { id: 1, nome: 'Missa de Domingo', data: '2026-07-12', horaInicio: '10:00:00', vagasNecessarias: 2 }
    ]);

    render(<Eventos />);

    // Mudar para o modo lista para encontrar o botão de duplicação
    const btnLista = await screen.findByRole('button', { name: /Lista/i });
    fireEvent.click(btnLista);

    const btnCopiar = await screen.findByTitle('Duplicar Evento');
    fireEvent.click(btnCopiar.closest('button') || btnCopiar);

    await screen.findByText('Duplicar Evento', { selector: 'h3' });
    expect(await screen.findByText('Missa de Domingo', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/Origem:/i)).toBeInTheDocument();
  });
});
