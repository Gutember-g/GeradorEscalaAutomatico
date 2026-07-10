import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Historico from '../pages/Historico';
import { escalaService } from '../services/api';
import { exportarEscalaParaExcel } from '../utils/excelExport';
import toast from 'react-hot-toast';

vi.mock('../services/api', () => ({
  escalaService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    deletar: vi.fn(),
  }
}));

vi.mock('../utils/excelExport', () => ({
  exportarEscalaParaExcel: vi.fn(() => Promise.resolve())
}));

describe('Historico Component', () => {
  const mockEscalas = [
    { id: 1, nome: 'Escala Julho/2026', totalVagas: 10, vagasPreenchidas: 10, vagasRestantes: 0 }
  ];

  const mockEscalaDetalhe = {
    id: 1,
    nome: 'Escala Julho/2026',
    totalVagas: 10,
    vagasPreenchidas: 10,
    vagasRestantes: 0,
    eventos: [
      { id: 100, nome: 'Missa das Flores', data: '2026-07-12', horaInicio: '09:00:00', corLiturgica: 'Branco' }
    ],
    alocacoes: [
      { id: 50, eventoId: 100, colaboradorId: 10, colaboradorNome: 'Mateus Lima' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (escalaService.listar as any).mockResolvedValue(mockEscalas);
    (escalaService.buscarPorId as any).mockResolvedValue(mockEscalaDetalhe);
    (escalaService.deletar as any).mockResolvedValue({});
  });

  it('deve renderizar a listagem de escalas historicas', async () => {
    render(<Historico />);

    const item = await screen.findByText('Escala Julho/2026');
    expect(item).toBeInTheDocument();
  });

  it('deve expandir e mostrar os detalhes da escala ao clicar', async () => {
    render(<Historico />);

    const item = await screen.findByText('Escala Julho/2026');
    fireEvent.click(item);

    await waitFor(() => {
      expect(escalaService.buscarPorId).toHaveBeenCalledWith(1);
      expect(screen.getByText('Missa das Flores')).toBeInTheDocument();
      expect(screen.getByText('Mateus Lima')).toBeInTheDocument();
    });
  });

  it('deve deletar a escala após confirmacao do usuario', async () => {
    // Spy no confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    
    render(<Historico />);

    await screen.findByText('Escala Julho/2026');
    const btnDeletar = screen.getByRole('button', { name: /Excluir escala/i });
    fireEvent.click(btnDeletar);

    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(escalaService.deletar).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('sucesso'), expect.any(Object));
      expect(escalaService.listar).toHaveBeenCalledTimes(2); // Initial loading + reload after delete
    });
  });

  it('deve acionar a exportação para o excel ao clicar em exportar', async () => {
    render(<Historico />);

    // Expandir primeiro para carregar detalhes e mostrar o botão de exportar
    const item = await screen.findByText('Escala Julho/2026');
    fireEvent.click(item);

    // Esperar carregar detalhes
    const btnExportar = await screen.findByRole('button', { name: /Exportar para Excel/i });
    fireEvent.click(btnExportar);

    await waitFor(() => {
      expect(exportarEscalaParaExcel).toHaveBeenCalledWith('Escala Julho/2026', expect.any(Array));
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('sucesso'), expect.any(Object));
    });
  });
});
