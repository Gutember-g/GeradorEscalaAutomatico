import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Colaboradores from '../pages/Colaboradores';
import { colaboradorService } from '../services/api';
import toast from 'react-hot-toast';

vi.mock('../services/api', () => ({
  colaboradorService: {
    listar: vi.fn(() => Promise.resolve([])),
    criar: vi.fn(() => Promise.resolve({ id: 1, nome: 'João Silva', telefone: '9999-9999' })),
    atualizar: vi.fn(() => Promise.resolve({})),
    deletar: vi.fn(() => Promise.resolve()),
  }
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, nome: "Paróquia São José", role: "ROLE_USER" }
  })
}));

describe('Colaboradores Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a tela de colaboradores corretamente', async () => {
    render(<Colaboradores onSelectColaboradorForDisponibilidade={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Colaboradores/i)).toBeInTheDocument();
    });
  });

  it('deve abrir o modal de cadastro e enviar formulario com sucesso', async () => {
    render(<Colaboradores onSelectColaboradorForDisponibilidade={vi.fn()} />);

    // Esperar carregar estado inicial (como mock retorna [], exibe "Cadastrar Primeiro")
    const btnNovo = await screen.findByText('Cadastrar Primeiro');
    fireEvent.click(btnNovo);

    // Preencher campos
    const inputNome = screen.getByPlaceholderText('Nome do colaborador');
    const inputTelefone = screen.getByPlaceholderText('(00) 00000-0000');
    
    fireEvent.change(inputNome, { target: { value: 'João Silva' } });
    fireEvent.change(inputTelefone, { target: { value: '9999-9999' } });

    // Enviar formulário
    const btnSalvar = screen.getByRole('button', { name: 'Salvar' });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(colaboradorService.criar).toHaveBeenCalledWith({
        nome: 'João Silva',
        telefone: '9999-9999'
      });
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('sucesso'),
        expect.any(Object)
      );
    });
  });

  it('deve pesquisar colaboradores por nome', async () => {
    (colaboradorService.listar as any).mockResolvedValue([
      { id: 1, nome: 'Alberto' },
      { id: 2, nome: 'Bernardo' }
    ]);

    render(<Colaboradores onSelectColaboradorForDisponibilidade={vi.fn()} />);

    // Ambos devem ser listados inicialmente
    await screen.findByText('Alberto');
    expect(screen.getByText('Bernardo')).toBeInTheDocument();

    // Pesquisar por "Alb"
    const inputBusca = screen.getByPlaceholderText('Buscar colaborador pelo nome...');
    fireEvent.change(inputBusca, { target: { value: 'Alb' } });

    expect(screen.getByText('Alberto')).toBeInTheDocument();
    expect(screen.queryByText('Bernardo')).not.toBeInTheDocument();
  });

  it('deve exibir a barra flutuante de acoes em lote ao selecionar multiplos colaboradores', async () => {
    (colaboradorService.listar as any).mockResolvedValue([
      { id: 1, nome: 'Alberto' },
      { id: 2, nome: 'Bernardo' }
    ]);

    render(<Colaboradores onSelectColaboradorForDisponibilidade={vi.fn()} />);

    // Encontrar checkboxes
    const checkboxes = await screen.findAllByRole('checkbox');
    
    // Selecionar Alberto e Bernardo clicando no checkbox do cabeçalho (selecionar todos)
    fireEvent.click(checkboxes[0]);

    // Deve aparecer a barra de lote: "2 selecionados"
    await screen.findByText(/selecionados/i);
    expect(screen.getByText('2', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editar em Lote/i })).toBeInTheDocument();
  });
});
