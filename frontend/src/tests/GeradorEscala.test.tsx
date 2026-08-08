import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GeradorEscala from '../pages/GeradorEscala';
import { colaboradorService, eventoService, escalaService } from '../services/api';
import toast from 'react-hot-toast';

vi.mock('../services/api', () => ({
  colaboradorService: {
    listar: vi.fn(),
  },
  eventoService: {
    listar: vi.fn(),
  },
  escalaService: {
    listar: vi.fn(),
    gerar: vi.fn(),
  }
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, nome: "Paróquia São José", role: "ROLE_USER" }
  })
}));

const now = new Date();
const currentYear = now.getFullYear();
const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
const mockDate = `${currentYear}-${currentMonthStr}-10`;

describe('GeradorEscala Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (colaboradorService.listar as any).mockResolvedValue([{ id: 1, nome: "João" }]);
    (eventoService.listar as any).mockResolvedValue([{ id: 1, nome: "Missa", data: mockDate, horaInicio: "10:00:00" }]);
    (escalaService.listar as any).mockResolvedValue([]);
    (escalaService.gerar as any).mockResolvedValue({
      id: 10,
      nome: `Escala Mês/${currentYear}`,
      vagasPreenchidas: 1,
      vagasRestantes: 0,
      totalVagas: 1,
      statusEventos: [
        {
          id: 1,
          eventoNome: "Missa 1",
          status: "TOTALMENTE_PREENCHIDO",
          motivo: "",
          data: mockDate,
          horaInicio: "10:00:00",
          corLiturgica: "Verde",
          nome: "Missa 1",
          ministros: ["João"]
        }
      ]
    });
  });

  it('deve renderizar o gerador de escala e responder à mudanca de mes', async () => {
    render(<GeradorEscala />);

    // Procurar os comboboxes (o primeiro é o mês, o segundo é o ano)
    const selects = await screen.findAllByRole('combobox');
    const selectMes = selects[0] as HTMLSelectElement;
    expect(selectMes).toBeInTheDocument();

    // Mudar mês para Agosto (mês 8)
    fireEvent.change(selectMes, { target: { value: '8' } });

    // Nome da escala deve atualizar dinamicamente
    const inputNome = screen.getByDisplayValue(/Escala Agosto/i) as HTMLInputElement;
    expect(inputNome).toBeInTheDocument();
  });

  it('deve chamar o backend para gerar escala e exibir relatorio', async () => {
    render(<GeradorEscala />);

    // Esperar os dados carregarem de fato (indicado pelo contador de eventos encontrados - singular)
    const counter = await screen.findByText('1 evento encontrado');
    expect(counter).toBeInTheDocument();

    // Encontrar especificamente o botão de submissão do formulário
    const btnGerar = screen.getByRole('button', { name: /^Gerar Escala$/i });
    const form = btnGerar.closest('form')!;

    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalled();
      expect(escalaService.gerar).toHaveBeenCalled();
      expect(screen.getByText(/Relatório da Geração/i)).toBeInTheDocument();
      expect(screen.getByText(/Totalmente Preenchido/i)).toBeInTheDocument();
    });
  });
});
